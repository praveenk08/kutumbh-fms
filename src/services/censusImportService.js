/**
 * @file censusImportService.js
 * @module Services/CensusImportService
 * @description High-performance bulk importer for census data spreadsheets.
 */

const xlsx = require('xlsx');
const { pool } = require('../config/mysql');
const { withTransaction } = require('../lib/transactionRunner');
const { mapCensusRow } = require('../utils/censusColumnMapper');

class CensusImportService {
  /**
   * Parses Excel or CSV file buffer and imports into MySQL with ACID integrity.
   *
   * @param {Buffer} fileBuffer - File buffer from upload.
   * @returns {Promise<Object>} Import summary stats.
   */
  static async importSpreadsheet(fileBuffer) {
    // 1. Workbook aur Sheets parse karein
    const workbook = xlsx.read(fileBuffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames.find((s) => s.includes('जनगणना') || s.includes('Census')) || workbook.SheetNames[0];
    const rawRows = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: '' });

    if (!rawRows || rawRows.length === 0) {
      throw new Error('Spreadsheet is empty or sheet format is invalid.');
    }

    return withTransaction(async (connection) => {
      let familiesInserted = 0;
      let membersInserted = 0;
      const familyCache = new Map(); // familyToken -> familyId

      for (let i = 0; i < rawRows.length; i++) {
        const { familyData, memberData } = mapCensusRow(rawRows[i]);

        if (!familyData.familyToken || !memberData.fullName) {
          continue; // Empty rows skip karein
        }

        let familyId;

        // Check if family already exists in cache or DB
        if (familyCache.has(familyData.familyToken)) {
          familyId = familyCache.get(familyData.familyToken);
        } else {
          const [existingFamilies] = await connection.execute(
            'SELECT id FROM families WHERE family_token = ? LIMIT 1',
            [familyData.familyToken]
          );

          if (existingFamilies.length > 0) {
            familyId = existingFamilies[0].id;
          } else {
            // New family insert
            const [famInsert] = await connection.execute(
              `INSERT INTO families 
              (family_token, register_page_no, head_name, guardian_name, contact_number, state, district, block, village, tola_mohalla, social_category, sub_caste, ration_card_category, survey_date, updated_by, total_members, verification_status)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 'VERIFIED')`,
              [
                familyData.familyToken,
                familyData.registerPageNo,
                familyData.headName || memberData.fullName,
                familyData.guardianName,
                familyData.contactNumber,
                familyData.habitation.state,
                familyData.habitation.district,
                familyData.habitation.block,
                familyData.habitation.village,
                familyData.habitation.tolaMohalla,
                familyData.socialCategory,
                familyData.subCaste,
                familyData.rationCardCategory,
                familyData.surveyDate,
                familyData.updatedBy,
              ]
            );
            familyId = famInsert.insertId;
            familiesInserted++;
          }
          familyCache.set(familyData.familyToken, familyId);
        }

        // Generate member reference ID: FAM-001-M01
        const [memberCountRows] = await connection.execute(
          'SELECT COUNT(*) as count FROM members WHERE family_id = ?',
          [familyId]
        );
        const memberSeq = String(memberCountRows[0].count + 1).padStart(2, '0');
        const memberRefId = `${familyData.familyToken}-M${memberSeq}`;

        // Insert Member
        await connection.execute(
          `INSERT INTO members 
          (family_id, family_token, member_ref_id, full_name, relationship_with_head, guardian_or_father_name, gender, dob, age, age_group, literacy_status, education_level, education, occupation, service_sector, mobile_masked, mobile_original, aadhar_last_four, current_residence_status, life_event_flag, special_welfare_category, documents_status, benefits_availed, surname_symmetry_id, unique_display_tag, remarks, is_active)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE)`,
          [
            familyId,
            familyData.familyToken,
            memberRefId,
            memberData.fullName,
            memberData.relationshipWithHead,
            memberData.guardianOrFatherName,
            memberData.gender,
            memberData.dob,
            memberData.age,
            memberData.ageGroup,
            memberData.literacyStatus,
            memberData.educationLevel,
            memberData.educationLevel, // alias
            memberData.occupation,
            memberData.serviceSector,
            memberData.mobileMasked,
            memberData.mobileOriginal,
            memberData.aadharLastFour,
            memberData.currentResidenceStatus,
            memberData.lifeEventFlag,
            memberData.specialWelfareCategory,
            memberData.documentsStatus,
            memberData.benefitsAvailed,
            memberData.surnameSymmetryId,
            memberData.uniqueDisplayTag,
            memberData.remarks,
          ]
        );

        // Update family member count
        await connection.execute(
          'UPDATE families SET total_members = total_members + 1 WHERE id = ?',
          [familyId]
        );
        membersInserted++;
      }

      return {
        totalRowsParsed: rawRows.length,
        familiesInserted,
        membersInserted,
      };
    });
  }
}

module.exports = CensusImportService;