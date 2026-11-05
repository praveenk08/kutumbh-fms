const Member = require('../models/Member');
const Family = require('../models/Family');
const mongoose = require('mongoose');

class MemberService {
  /**
   * add a member to an existing family unit
   * @param {Object} payload - The member data to be added
   * @param {String} payload.familyToken - The token of the family to which the member belongs
   * @param {Object} payload.memberData - The data of the member to be added
   * @returns {Promise<Object>} - The newly created member document
   * @throws {Error} - Throws an error if the family is not found or if there is a database error
   */
 static async addMemberToFamily(familyToken, memberData) {
    const family = await Family.findOne({ familyToken });
    if (!family) {
      const error = new Error(`Family with token ${familyToken} not found.`);
      error.statusCode = 404;
      throw error;
    }

    const newMember = new Member({
      ...memberData,
      familyId: family._id,
    });

    const savedMember = await newMember.save();
    return savedMember;
  }

  /**
   * Updates an existing member profile
   */
  static async updateMember(memberId, updatePayload) {
    if (!mongoose.Types.ObjectId.isValid(memberId)) {
      const error = new Error('Invalid Member ID format.');
      error.statusCode = 400;
      throw error;
    }

    // Prohibit changing family association directly via update
    delete updatePayload.familyId;

    const updatedMember = await Member.findByIdAndUpdate(
      memberId,
      { $set: updatePayload },
      { new: true, runValidators: true }
    );

    if (!updatedMember) {
      const error = new Error(`Member with ID ${memberId} not found.`);
      error.statusCode = 404;
      throw error;
    }

    return updatedMember;
  }

  /**
   * Deactivates a member (Soft delete for census audits)
   */
  static async removeMember(memberId, reason = 'Migrated') {
    if (!mongoose.Types.ObjectId.isValid(memberId)) {
      const error = new Error('Invalid Member ID format.');
      error.statusCode = 400;
      throw error;
    }

    const member = await Member.findById(memberId);
    if (!member) {
      const error = new Error(`Member with ID ${memberId} not found.`);
      error.statusCode = 404;
      throw error;
    }

    member.isActive = false;
    member.remarks = reason;
    await member.save();

    return { message: 'Member successfully deactivated.', memberId };
  }
}

module.exports = MemberService;