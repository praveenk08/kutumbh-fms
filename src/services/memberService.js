/**
 * @file memberService.js
 * @description Kutumbh FMS - MySQL Service Layer for Member Operations
 * Handles adding members to existing families and soft deletion.
 */

const { pool } = require('../config/mysql');

class MemberService {
  /**
   * Add a new member to an existing family and update the family's total member count.
   * 
   * @param {string} familyToken - Target family's token
   * @param {Object} memberData - Member information
   * @returns {Promise<Object>} Added member confirmation
   */
  static async addMember(familyToken, memberData) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // 1. Check karein ki target family exist karti hai ya nahi
      const [families] = await connection.execute(
        'SELECT id, total_members FROM families WHERE family_token = ? LIMIT 1',
        [familyToken]
      );

      if (families.length === 0) {
        throw new Error(`Family with token ${familyToken} not found`);
      }

      const familyId = families[0].id;
      const currentCount = families[0].total_members;

      // 2. Next sequence identifier generate karein (e.g. M03)
      const nextSeq = String(currentCount + 1).padStart(2, '0');
      const memberRefId = `${familyToken}-M${nextSeq}`;

      // 3. Member insert karein
      await connection.execute(
        `INSERT INTO members 
        (family_id, family_token, member_ref_id, full_name, gender, dob, relationship_with_head, marital_status, education, occupation, is_active)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE)`,
        [
          familyId,
          familyToken,
          memberRefId,
          memberData.fullName || memberData.full_name,
          memberData.gender,
          memberData.dob || null,
          memberData.relationshipWithHead || memberData.relationship_with_head || 'MEMBER',
          memberData.maritalStatus || memberData.marital_status || null,
          memberData.education || null,
          memberData.occupation || null,
        ]
      );

      // 4. Family table mein total_members count increment karein
      await connection.execute(
        'UPDATE families SET total_members = total_members + 1 WHERE id = ?',
        [familyId]
      );

      await connection.commit();

      return {
        memberRefId,
        familyToken,
        fullName: memberData.fullName || memberData.full_name,
        relationshipWithHead: memberData.relationshipWithHead || 'MEMBER',
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Soft delete a member (is_active = FALSE) instead of hard deleting to preserve audit history.
   * 
   * @param {string} memberRefId - The member's reference ID (e.g. BAL-2026-XXXXXX-M02)
   * @param {string} remarks - Reason for deactivation (e.g. Married, Migrated, Deceased)
   * @returns {Promise<Object>} Deactivation receipt
   */
/**
   * Soft delete / deactivate member by numeric ID or member_ref_id
   */
  static async softDeleteMember(identifier, remarks = null) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const isNumeric = /^\d+$/.test(identifier);
      const whereCondition = isNumeric ? 'id = ?' : 'member_ref_id = ?';

      // 1. Fetch member details first
      const [members] = await connection.execute(
        `SELECT id, family_id, member_ref_id, is_active FROM members WHERE ${whereCondition} LIMIT 1`,
        [identifier]
      );

      if (members.length === 0) {
        throw new Error(`Member with identifier ${identifier} not found`);
      }

      const member = members[0];

      // 2. Mark as inactive (Soft Delete)
      await connection.execute(
        `UPDATE members SET is_active = FALSE, remarks = ? WHERE id = ?`,
        [remarks, member.id]
      );

      // 3. Decrement active member count in families table if member was active
      if (member.is_active) {
        await connection.execute(
          `UPDATE families SET total_members = GREATEST(total_members - 1, 0) WHERE id = ?`,
          [member.family_id]
        );
      }

      await connection.commit();

      return {
        memberRefId: member.member_ref_id,
        status: 'DEACTIVATED',
        remarks,
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
  /**
   * Update member details (handles both numeric ID and memberRefId)
   */
  static async updateMember(identifier, updateData) {
    const fields = [];
    const values = [];

    if (updateData.fullName || updateData.full_name) {
      fields.push('full_name = ?');
      values.push(updateData.fullName || updateData.full_name);
    }
    if (updateData.gender) {
      fields.push('gender = ?');
      values.push(updateData.gender);
    }
    if (updateData.dob) {
      fields.push('dob = ?');
      values.push(updateData.dob);
    }
    if (updateData.relationshipWithHead || updateData.relationship_with_head) {
      fields.push('relationship_with_head = ?');
      values.push(updateData.relationshipWithHead || updateData.relationship_with_head);
    }
    if (updateData.maritalStatus || updateData.marital_status) {
      fields.push('marital_status = ?');
      values.push(updateData.maritalStatus || updateData.marital_status);
    }
    if (updateData.educationalQualification || updateData.education) {
      fields.push('education = ?');
      values.push(updateData.educationalQualification || updateData.education);
    }
    if (updateData.primaryOccupation || updateData.occupation) {
      fields.push('occupation = ?');
      values.push(updateData.primaryOccupation || updateData.occupation);
    }

    if (fields.length === 0) {
      throw new Error('No valid update fields provided');
    }

    const isNumeric = /^\d+$/.test(identifier);
    const whereCondition = isNumeric ? 'id = ?' : 'member_ref_id = ?';
    values.push(identifier);

    const [result] = await pool.execute(
      `UPDATE members SET ${fields.join(', ')} WHERE ${whereCondition}`,
      values
    );

    if (result.affectedRows === 0) {
      return null;
    }

    const [rows] = await pool.execute(
      `SELECT * FROM members WHERE ${whereCondition} LIMIT 1`,
      [identifier]
    );

    return rows[0];
  }
}

module.exports = MemberService;