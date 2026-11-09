/**
 * @file memberService.js
 * @module Services/MemberService
 * @description Kutumbh FMS - Member operations powered by withTransaction helper.
 */

const { pool } = require('../config/mysql');
const { withTransaction } = require('../lib/transactionRunner');

class MemberService {
  /**
   * Add a new member to an existing family using managed transaction helper.
   */
  static async addMember(familyToken, memberData) {
    return withTransaction(async (connection) => {
      // 1. Parent family existence check
      const [families] = await connection.execute(
        'SELECT id, total_members FROM families WHERE family_token = ? LIMIT 1',
        [familyToken]
      );

      if (families.length === 0) {
        throw new Error(`Family with token ${familyToken} not found`);
      }

      const familyId = families[0].id;
      const currentCount = families[0].total_members;

      // 2. Next member sequence generate karein
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
          memberData.education || memberData.educationalQualification || null,
          memberData.occupation || memberData.primaryOccupation || null,
        ]
      );

      // 4. Parent table me count increment
      await connection.execute(
        'UPDATE families SET total_members = total_members + 1 WHERE id = ?',
        [familyId]
      );

      return {
        memberRefId,
        familyToken,
        fullName: memberData.fullName || memberData.full_name,
        relationshipWithHead: memberData.relationshipWithHead || 'MEMBER',
      };
    });
  }

  /**
   * Soft-delete / deactivate member using managed transaction helper.
   */
  static async softDeleteMember(identifier, remarks = 'Removed') {
    return withTransaction(async (connection) => {
      const isNumeric = /^\d+$/.test(identifier);
      const whereCondition = isNumeric ? 'id = ?' : 'member_ref_id = ?';

      const [members] = await connection.execute(
        `SELECT id, family_id, member_ref_id, is_active FROM members WHERE ${whereCondition} LIMIT 1`,
        [identifier]
      );

      if (members.length === 0) {
        throw new Error(`Member with identifier ${identifier} not found`);
      }

      const member = members[0];

      await connection.execute(
        `UPDATE members SET is_active = FALSE, remarks = ? WHERE id = ?`,
        [remarks, member.id]
      );

      if (member.is_active) {
        await connection.execute(
          `UPDATE families SET total_members = GREATEST(total_members - 1, 0) WHERE id = ?`,
          [member.family_id]
        );
      }

      return {
        memberRefId: member.member_ref_id,
        status: 'DEACTIVATED',
        remarks,
      };
    });
  }

  /**
   * Update member details (Non-transactional simple query).
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

    if (result.affectedRows === 0) return null;

    const [rows] = await pool.execute(
      `SELECT * FROM members WHERE ${whereCondition} LIMIT 1`,
      [identifier]
    );

    return rows[0];
  }
}

module.exports = MemberService;