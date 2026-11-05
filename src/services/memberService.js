const Member = require('../models/Member');
const Family = require('../models/Family');
const mongoose = require('mongoose');

class MemberService {
  static async addMemberToFamily(familyToken, memberData) {
    const family = await Family.findOne({ familyToken });
    if (!family) {
      const error = new Error(`Family with token ${familyToken} not found.`);
      error.statusCode = 404;
      throw error;
    }

    const memberCount = await Member.countDocuments({ familyId: family._id });
    const nextSequence = String(memberCount + 1).padStart(2, '0');
    const memberReferenceId = `${family.familyToken}-M${nextSequence}`;

    const newMember = new Member({
      ...memberData,
      familyId: family._id,
      memberReferenceId,
    });

    const savedMember = await newMember.save();
    await Family.findByIdAndUpdate(family._id, { $inc: { totalMembers: 1 } });

    return savedMember;
  }

  static async updateMember(memberId, updatePayload) {
    if (!mongoose.Types.ObjectId.isValid(memberId)) {
      const error = new Error('Invalid Member ID format.');
      error.statusCode = 400;
      throw error;
    }

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