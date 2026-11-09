/**
 * @file familyService.js
 * @module Services/FamilyService
 * @description Kutumbh FMS - Family business logic powered by withTransaction and queryHelper.
 */

const { pool } = require('../config/mysql');
const { withTransaction } = require('../lib/transactionRunner');
const { getPagination, formatPaginationResult } = require('../utils/queryHelper');
const { generateFamilyToken, generateMemberRefId } = require('../utils/tokenGenerator');

class FamilyService {
  /**
   * Register a new family unit along with members inside an atomic transaction.
   *
   * @async
   * @param {Object} payload - Validated registration payload.
   * @returns {Promise<Object>} Created family record with token.
   */
  static async registerFamily(payload) {
    const { familyData, membersData } = payload;

    return withTransaction(async (connection) => {
      // 1. Unique Family Token generate karein
      const familyToken = await generateFamilyToken();

      // 2. Family parent record insert karein
      const [familyResult] = await connection.execute(
        `INSERT INTO families 
        (family_token, head_name, guardian_name, contact_number, state, district, block, village, habitation_name, tola_mohalla, ration_card_category, annual_income, total_members, verification_status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING')`,
        [
          familyToken,
          familyData.headName,
          familyData.guardianName,
          familyData.contactNumber || null,
          familyData.habitation?.state || 'Uttar Pradesh',
          familyData.habitation?.district || 'Ballia',
          familyData.habitation?.block || 'Dubahar',
          familyData.habitation?.village,
          familyData.habitation?.habitationName || null,
          familyData.habitation?.tolaMohalla || null,
          familyData.economicProfile?.rationCardCategory || 'NONE',
          familyData.economicProfile?.annualIncome || 0,
          membersData.length,
        ]
      );

      const familyId = familyResult.insertId;

      // 3. Sabhi family members insert karein
      for (let index = 0; index < membersData.length; index++) {
        const member = membersData[index];
        const memberRefId = generateMemberRefId(familyToken, index + 1);

        await connection.execute(
          `INSERT INTO members 
          (family_id, family_token, member_ref_id, full_name, gender, dob, relationship_with_head, marital_status, education, occupation, is_active)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE)`,
          [
            familyId,
            familyToken,
            memberRefId,
            member.fullName,
            member.gender,
            member.dob || null,
            member.relationshipWithHead || 'MEMBER',
            member.maritalStatus || null,
            member.education || member.educationalQualification || null,
            member.occupation || member.primaryOccupation || null,
          ]
        );
      }

      return {
        id: familyId,
        familyToken,
        headName: familyData.headName,
        totalMembers: membersData.length,
        verificationStatus: 'PENDING',
      };
    });
  }

  /**
   * Search and filter families with pagination.
   *
   * @async
   * @param {Object} filters - Query parameters (search, village, status, page, limit).
   * @returns {Promise<Object>} Paginated records and meta information.
   */
  static async searchFamilies(filters) {
    const { pageNum, limitNum, offset } = getPagination(filters.page, filters.limit);

    const conditions = [];
    const params = [];

    if (filters.search) {
      conditions.push('(family_token LIKE ? OR head_name LIKE ?)');
      params.push(`%${filters.search}%`, `%${filters.search}%`);
    }

    if (filters.village) {
      conditions.push('village = ?');
      params.push(filters.village);
    }

    if (filters.rationCardCategory) {
      conditions.push('ration_card_category = ?');
      params.push(filters.rationCardCategory);
    }

    if (filters.verificationStatus) {
      conditions.push('verification_status = ?');
      params.push(filters.verificationStatus);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Total count fetch karein
    const [countRows] = await pool.query(
      `SELECT COUNT(*) AS total FROM families ${whereClause}`,
      params
    );
    const totalRecords = countRows[0].total;

    // Paginated records fetch karein
    const [rows] = await pool.query(
      `SELECT * FROM families ${whereClause} ORDER BY id DESC LIMIT ? OFFSET ?`,
      [...params, limitNum, offset]
    );

    return formatPaginationResult(rows, totalRecords, pageNum, limitNum);
  }

  /**
   * Retrieve a family and all associated active members by Family Token.
   *
   * @async
   * @param {string} familyToken - Unique family registration token.
   * @returns {Promise<Object|null>} Family entity with nested members.
   */
  static async getFamilyByToken(familyToken) {
    const [families] = await pool.execute(
      'SELECT * FROM families WHERE family_token = ? LIMIT 1',
      [familyToken]
    );

    if (families.length === 0) return null;

    const family = families[0];

    const [members] = await pool.execute(
      'SELECT * FROM members WHERE family_token = ? AND is_active = TRUE ORDER BY id ASC',
      [familyToken]
    );

    return {
      ...family,
      members,
    };
  }

  /**
   * Update administrative verification status.
   *
   * @async
   * @param {string} familyToken
   * @param {string} status - PENDING | VERIFIED | REJECTED
   * @param {string} verifiedBy
   * @returns {Promise<Object>} Updated status result.
   */
  static async updateVerificationStatus(familyToken, status, verifiedBy = 'ADMIN') {
    const [result] = await pool.execute(
      `UPDATE families 
       SET verification_status = ?, verified_by = ?, verified_at = CURRENT_TIMESTAMP 
       WHERE family_token = ?`,
      [status, verifiedBy, familyToken]
    );

    if (result.affectedRows === 0) {
      throw new Error(`Family with token ${familyToken} not found`);
    }

    return {
      familyToken,
      verificationStatus: status,
      verifiedBy,
    };
  }
}

module.exports = FamilyService;