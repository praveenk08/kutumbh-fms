/**
 * @file familyService.js
 * @description Kutumbh FMS - MySQL Service Layer for Family Unit Management
 * Handles relational database queries and transactions for families and their members.
 */

const { pool } = require('../config/mysql');
const { generateFamilyToken } = require('../utils/tokenGenerator');

class FamilyService {
  /**
   * Register a new Family Unit (Family record + Initial Members) inside an ACID Transaction.
   * If any step fails, the entire transaction rolls back to prevent orphan records.
   * 
   * @param {Object} param0
   * @param {Object} param0.familyData - Habitation, contact, and economic details of the family.
   * @param {Array} param0.membersData - List of individual member profiles belonging to this family.
   * @returns {Promise<Object>} Created family summary and token.
   */
  static async registerFamilyUnit({ familyData, membersData }) {
    // Connection pool se dedicated connection lein transaction ke liye
    const connection = await pool.getConnection();
    try {
      // 1. Transaction shuru karein
      await connection.beginTransaction();

      // District prefix ke saath unique Family Token banayein (e.g. BAL-2026-A1B2C3)
      const districtPrefix = process.env.DISTRICT_PREFIX || 'BAL';
      const familyToken = generateFamilyToken(districtPrefix);

      const headName = familyData.headName;
      const guardianName = familyData.guardianName;
      const contactNumber = familyData.contactNumber || null;
      const state = familyData.habitation?.state || 'Uttar Pradesh';
      const district = familyData.habitation?.district || 'Ballia';
      const block = familyData.habitation?.block || 'Dubahar';
      const village = familyData.habitation?.village;
      const habitationName = familyData.habitation?.habitationName || null;
      const rationCardCategory = familyData.economicProfile?.rationCardCategory || 'NONE';
      const annualIncome = familyData.economicProfile?.annualIncome || 0.00;
      const totalMembers = Array.isArray(membersData) && membersData.length > 0 ? membersData.length : 1;

      // 2. 'families' table mein record insert karein
      const [familyResult] = await connection.execute(
        `INSERT INTO families 
        (family_token, head_name, guardian_name, contact_number, state, district, block, village, habitation_name, ration_card_category, annual_income, total_members, verification_status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING')`,
        [
          familyToken,
          headName,
          guardianName,
          contactNumber,
          state,
          district,
          block,
          village,
          habitationName,
          rationCardCategory,
          annualIncome,
          totalMembers,
        ]
      );

      const familyId = familyResult.insertId;

      // 3. 'members' table mein sabhi parivar sadasyon ko loop karke insert karein
      if (Array.isArray(membersData) && membersData.length > 0) {
        for (let i = 0; i < membersData.length; i++) {
          const m = membersData[i];
          const seq = String(i + 1).padStart(2, '0');
          const memberRefId = `${familyToken}-M${seq}`; // e.g. BAL-2026-XXXXXX-M01

          await connection.execute(
            `INSERT INTO members
            (family_id, family_token, member_ref_id, full_name, gender, dob, relationship_with_head, marital_status, education, occupation, is_active)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE)`,
            [
              familyId,
              familyToken,
              memberRefId,
              m.fullName || m.full_name,
              m.gender,
              m.dob || null,
              m.relationshipWithHead || m.relationship_with_head || 'MEMBER',
              m.maritalStatus || m.marital_status || null,
              m.education || null,
              m.occupation || null,
            ]
          );
        }
      }

      // 4. Sabhi queries successful hone par commit karein
      await connection.commit();

      return {
        familyToken,
        headName,
        village,
        totalMembers,
        verificationStatus: 'PENDING',
      };
    } catch (error) {
      // Kisi bhi query me error aane par rollback karein
      await connection.rollback();
      throw error;
    } finally {
      // Connection ko wapas pool mein release karein
      connection.release();
    }
  }

  /**
   * Search and filter families with pagination.
   * 
   * @param {Object} filters - Query params like village, rationCardCategory, search string, etc.
   * @returns {Promise<Object>} Paginated records and metadata.
   */
  static async searchFamilies({ village, rationCardCategory, verificationStatus, search, page = 1, limit = 10 }) {
    const conditions = [];
    const params = [];

    // Village filter
    if (village) {
      conditions.push('village LIKE ?');
      params.push(`%${village}%`);
    }

    // Ration Card category filter (AAY, BPL, APL, NONE)
    if (rationCardCategory) {
      conditions.push('ration_card_category = ?');
      params.push(rationCardCategory);
    }

    // Verification Status (PENDING, VERIFIED, REJECTED)
    if (verificationStatus) {
      conditions.push('verification_status = ?');
      params.push(verificationStatus);
    }

    // Fulltext search on Head Name or Family Token
    if (search) {
      conditions.push('(head_name LIKE ? OR family_token LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));
    const offset = (pageNum - 1) * limitNum;

    // Filter ke hisaab se total count nikalein
    const [countRows] = await pool.query(`SELECT COUNT(*) as total FROM families ${whereClause}`, params);
    const total = countRows[0].total;

    // Paginated rows fetch karein
    const [families] = await pool.query(
      `SELECT * FROM families ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, limitNum, offset]
    );

    return {
      families,
      pagination: {
        totalRecords: total,
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        limit: limitNum,
      },
    };
  }

  /**
   * Retrieve full family details including all active members by Family Token.
   * 
   * @param {string} familyToken - The unique family identifier.
   * @returns {Promise<Object|null>}
   */
  static async getFamilyByToken(familyToken) {
    const [familyRows] = await pool.query('SELECT * FROM families WHERE family_token = ? LIMIT 1', [familyToken]);
    if (familyRows.length === 0) return null;

    // Active members ko fetch karein
    const [memberRows] = await pool.query(
      'SELECT * FROM members WHERE family_token = ? AND is_active = TRUE ORDER BY id ASC',
      [familyToken]
    );

    return {
      ...familyRows[0],
      members: memberRows,
    };
  }

  /**
   * Update the administrative verification status of a family.
   * 
   * @param {string} familyToken
   * @param {Object} statusData - { status, verifiedBy }
   * @returns {Promise<Object|null>}
   */
  static async updateVerificationStatus(familyToken, { status, verifiedBy }) {
    await pool.query(
      'UPDATE families SET verification_status = ?, verified_by = ?, verified_at = NOW() WHERE family_token = ?',
      [status, verifiedBy || 'ADMIN', familyToken]
    );

    const [updated] = await pool.query('SELECT * FROM families WHERE family_token = ?', [familyToken]);
    return updated[0] || null;
  }
}

module.exports = FamilyService;