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
   * Unified Member Removal & Head Succession Engine
   * Handles soft deletion, audit flags, and atomic head succession.
   */
  static async softDeleteMember(memberIdentifier, options = {}) {
    const reason = typeof options === 'string' ? options : (options.reason || 'Removed');
    const lifeEventFlag = options.lifeEventFlag || 'निष्क्रिय';
    const newHeadMemberRefId = options.newHeadMemberRefId || null;
    const deactivateEntireFamily = Boolean(options.deactivateEntireFamily);

    return withTransaction(async (connection) => {
      // 1. Target member aur uski family fetch karein
      const isNumeric = /^\d+$/.test(memberIdentifier);
      const whereCond = isNumeric ? 'm.id = ?' : 'm.member_ref_id = ?';

      const [memberRows] = await connection.execute(
        `SELECT m.id, m.family_id, m.family_token, m.full_name, m.relationship_with_head, m.is_active, f.head_name
         FROM members m
         JOIN families f ON f.id = m.family_id
         WHERE ${whereCond} LIMIT 1`,
        [memberIdentifier]
      );

      if (memberRows.length === 0) {
        throw new Error(`Member ${memberIdentifier} not found`);
      }

      const member = memberRows[0];
      const familyId = member.family_id;
      const familyToken = member.family_token;

      // 2. Check: Kya yeh member Mukhiya (Head) hai?
      const isHead = member.relationship_with_head === 'स्वयं' || member.full_name === member.head_name;

      // CASE A: Normal Member (Mukhiya nahi hai)
      if (!isHead) {
        await connection.execute(
          `UPDATE members 
           SET is_active = FALSE, life_event_flag = ?, remarks = ? 
           WHERE id = ?`,
          [lifeEventFlag, reason, member.id]
        );

        if (member.is_active) {
          await connection.execute(
            `UPDATE families SET total_members = GREATEST(total_members - 1, 0) WHERE id = ?`,
            [familyId]
          );
        }

        return {
          action: 'MEMBER_DEACTIVATED',
          memberRefId: member.member_ref_id || memberIdentifier,
          fullName: member.full_name,
          lifeEventFlag,
          reason,
        };
      }

      // CASE B: Mukhiya hai aur Poora Parivar Deactivate karna hai
      if (deactivateEntireFamily) {
        await connection.execute(
          `UPDATE families 
           SET verification_status = 'REJECTED', 
               updated_by = CONCAT('Deactivated Family: ', ?) 
           WHERE id = ?`,
          [reason, familyId]
        );

        await connection.execute(
          `UPDATE members 
           SET is_active = FALSE, life_event_flag = ?, remarks = ? 
           WHERE family_id = ?`,
          [lifeEventFlag, reason, familyId]
        );

        return {
          action: 'ENTIRE_FAMILY_DEACTIVATED',
          familyToken,
          previousHead: member.full_name,
          reason,
        };
      }

      // CASE C: Mukhiya hai lekin Naya Head provide nahi kiya
      if (!newHeadMemberRefId) {
        const error = new Error('CANNOT_DELETE_HEAD_WITHOUT_SUCCESSOR');
        error.statusCode = 400;
        error.details = 'मुखिया को हटाने के लिए newHeadMemberRefId प्रदान करें या deactivateEntireFamily को true सेट करें।';
        throw error;
      }

      // CASE D: Mukhiya Succession (Naye sadasya ko Mukhiya banana)
      const isNewHeadNumeric = /^\d+$/.test(newHeadMemberRefId);
      const newHeadWhere = isNewHeadNumeric ? 'id = ?' : 'member_ref_id = ?';

      const [successorRows] = await connection.execute(
        `SELECT id, member_ref_id, full_name, is_active 
         FROM members 
         WHERE family_id = ? AND ${newHeadWhere} AND is_active = TRUE AND id != ? LIMIT 1`,
        [familyId, newHeadMemberRefId, member.id]
      );

      if (successorRows.length === 0) {
        const error = new Error(`New proposed head (${newHeadMemberRefId}) is not an active member of this family.`);
        error.statusCode = 400;
        throw error;
      }

      const successor = successorRows[0];

      // Purane mukhiya ko deactivate karein
      await connection.execute(
        `UPDATE members 
         SET is_active = FALSE, life_event_flag = ?, remarks = ? 
         WHERE id = ?`,
        [lifeEventFlag, reason, member.id]
      );

      // Naye sadasya ko 'स्वयं' assign karein
      await connection.execute(
        `UPDATE members SET relationship_with_head = 'स्वयं' WHERE id = ?`,
        [successor.id]
      );

      // Families table me head_name aur total_members update karein
      await connection.execute(
        `UPDATE families 
         SET head_name = ?, 
             total_members = GREATEST(total_members - 1, 1),
             updated_by = CONCAT('Head transferred to ', ?)
         WHERE id = ?`,
        [successor.full_name, successor.full_name, familyId]
      );

      return {
        action: 'HEAD_SUCCESSION_COMPLETED',
        familyToken,
        previousHead: member.full_name,
        newHead: successor.full_name,
        newHeadRefId: successor.member_ref_id,
        reason,
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