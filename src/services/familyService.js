const mongoose = require('mongoose');
const Family = require('../models/Family');
const Member = require('../models/Member');
const { generateFamilyToken } = require('../utils/tokenGenerator');

class FamilyService {
  /**
   * Registers a new family unit and its initial members atomically using MongoDB transactions
   */
  static async registerFamilyUnit({ familyData, membersData }) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // 1. Unique family token generate karna
      const familyToken = await generateFamilyToken();

      // 2. Family unit create karna
      const newFamily = new Family({
        ...familyData,
        familyToken,
        totalMembers: membersData.length
      });

      const savedFamily = await newFamily.save({ session });

      // 3. Sabhi initial members ko familyId aur token sequence ke sath map karna
      const preparedMembers = membersData.map((member, index) => {
        const sequence = String(index + 1).padStart(2, '0');
        return {
          ...member,
          familyId: savedFamily._id,
          memberReferenceId: `${familyToken}-M${sequence}`
        };
      });

      const savedMembers = await Member.insertMany(preparedMembers, { session });

      // 4. Transaction commit karna
      await session.commitTransaction();
      session.endSession();

      return {
        familyToken: savedFamily.familyToken,
        familyId: savedFamily._id,
        headName: savedFamily.headName,
        totalMembersRegistered: savedMembers.length,
        members: savedMembers
      };
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }

  /**
   * Fetches full family details along with all active members
   */
static async getFamilyByToken(familyToken) {
    const family = await Family.findOne({ familyToken });
    if (!family) {
      const error = new Error(`Family with token ${familyToken} not found.`);
      error.statusCode = 404;
      throw error;
    }

    const members = await Member.find({ 
      familyId: family._id, 
      isActive: { $ne: false } 
    });

    return {
      family,
      members
    };
  }

  /**
   * Updates verification status of a family unit
   */
  static async updateVerificationStatus(familyToken, { status, verifiedBy = null }) {
    const validStatuses = ['PENDING', 'VERIFIED', 'FLAGGED_FOR_REVIEW', 'REJECTED'];
    if (!validStatuses.includes(status)) {
      const error = new Error(`Invalid status. Allowed values: ${validStatuses.join(', ')}`);
      error.statusCode = 400;
      throw error;
    }

    const family = await Family.findOne({ familyToken });
    if (!family) {
      const error = new Error(`Family with token ${familyToken} not found.`);
      error.statusCode = 404;
      throw error;
    }

    family.verificationStatus = status;
    family.verifiedBy = verifiedBy;
    family.verifiedAt = status === 'VERIFIED' ? new Date() : null;

    await family.save();

    return {
      familyToken: family.familyToken,
      verificationStatus: family.verificationStatus,
      verifiedAt: family.verifiedAt,
      verifiedBy: family.verifiedBy,
    };
  }

  /**
   * Search and filter families with pagination
   */
  static async searchFamilies({
    village,
    rationCardCategory,
    verificationStatus,
    search,
    page = 1,
    limit = 10,
  }) {
    const query = {};

    if (village) {
      query['habitation.village'] = new RegExp(village, 'i');
    }

    if (rationCardCategory) {
      query['economicProfile.rationCardCategory'] = rationCardCategory;
    }

    if (verificationStatus) {
      query.verificationStatus = verificationStatus;
    }

    if (search) {
      query.$or = [
        { headName: new RegExp(search, 'i') },
        { familyToken: new RegExp(search, 'i') },
      ];
    }

    const pageNumber = Math.max(1, parseInt(page, 10) || 1);
    const limitNumber = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));
    const skip = (pageNumber - 1) * limitNumber;

    const [families, total] = await Promise.all([
      Family.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNumber)
        .lean(),
      Family.countDocuments(query),
    ]);

    return {
      families,
      pagination: {
        totalRecords: total,
        currentPage: pageNumber,
        totalPages: Math.ceil(total / limitNumber),
        limit: limitNumber,
      },
    };
  }
}

module.exports = FamilyService;