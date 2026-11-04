const mongoose = require('mongoose');
const Family = require('../models/Family');
const Member = require('../models/Member');
const { generateFamilyToken, generateMemberId } = require('../utils/tokenGenerator');

class FamilyService {
  async registerFamilyUnit(payload) {
    const { familyData, membersData } = payload;

    if (!membersData || !Array.isArray(membersData) || membersData.length === 0) {
      const error = new Error('A family unit must contain at least one registered member.');
      error.statusCode = 400;
      throw error;
    }

    const session = await mongoose.startSession();

    try {
      let createdFamily = null;
      let createdMembers = [];

      await session.withTransaction(async () => {
        const familyToken = generateFamilyToken('BAL', 6);

        const newFamily = new Family({
          ...familyData,
          familyToken,
        });

        const savedFamilyArray = await Family.create([newFamily], { session });
        createdFamily = savedFamilyArray[0];

        const membersToInsert = membersData.map((member, index) => ({
          ...member,
          familyId: createdFamily._id,
          memberReferenceId: generateMemberId(familyToken, index + 1),
        }));

        createdMembers = await Member.insertMany(membersToInsert, { session });
      });

      return {
        success: true,
        familyToken: createdFamily.familyToken,
        familyId: createdFamily._id,
        headName: createdFamily.headName,
        totalMembersRegistered: createdMembers.length,
        members: createdMembers,
      };
    } finally {
      await session.endSession();
    }
  }

  async getFamilyByToken(familyToken) {
    const family = await Family.findOne({ familyToken: familyToken.toUpperCase() })
      .populate({
        path: 'members',
        select: '-__v',
        options: { sort: { createdAt: 1 } },
      })
      .lean();

    if (!family) {
      const error = new Error(`Family record with token ${familyToken} was not found.`);
      error.statusCode = 404;
      throw error;
    }

    return family;
  }
}

module.exports = new FamilyService();