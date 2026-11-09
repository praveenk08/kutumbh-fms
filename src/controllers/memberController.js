/**
 * @file memberController.js
 * @description Kutumbh FMS - HTTP Controller for Member endpoints
 * Leverages asyncHandler to eliminate repetitive try-catch blocks.
 */

const memberService = require('../services/memberService');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

class MemberController {
  /**
   * Handle POST /api/v1/members/:familyToken or /families/:familyToken/members
   * Adds an individual member to a target family.
   */
  addMember = asyncHandler(async (req, res) => {
    const { familyToken } = req.params;
    const memberData = req.body;

    const result = await memberService.addMember(familyToken, memberData);
    return ApiResponse.success(res, 201, 'Member added successfully.', result);
  });

  /**
   * Handle PATCH /api/v1/members/:memberRefId/deactivate
   */
  softDeleteMember = asyncHandler(async (req, res) => {
    const { memberRefId } = req.params;
    const { remarks } = req.body;

    const result = await memberService.softDeleteMember(memberRefId, remarks);
    return ApiResponse.success(res, 200, 'Member deactivated successfully.', result);
  });

  /**
   * Handle PUT /api/v1/members/:memberId
   */
  updateMember = asyncHandler(async (req, res) => {
    const { memberId } = req.params;
    const updateData = req.body;

    const updated = await memberService.updateMember(memberId, updateData);
    if (!updated) {
      return ApiResponse.error(res, 404, 'Member not found');
    }

    return ApiResponse.success(res, 200, 'Member updated successfully', updated);
  });

/**
   * Handle DELETE /api/v1/members/:memberId
   * Also handles PATCH /api/v1/members/:memberRefId/deactivate
   */
  removeMember = asyncHandler(async (req, res) => {
    const memberId = req.params.memberId || req.params.memberRefId;
    const { reason, lifeEventFlag, newHeadMemberRefId, deactivateEntireFamily, remarks } = req.body || {};

    try {
      const result = await memberService.softDeleteMember(memberId, {
        reason: reason || remarks || 'Administrative removal',
        lifeEventFlag,
        newHeadMemberRefId,
        deactivateEntireFamily,
      });

      return ApiResponse.success(res, 200, 'Member action processed successfully.', result);
    } catch (err) {
      if (err.statusCode === 400 || err.message === 'CANNOT_DELETE_HEAD_WITHOUT_SUCCESSOR') {
        return ApiResponse.error(res, 400, err.details || err.message);
      }
      throw err;
    }
  });

  softDeleteMember = this.removeMember;
}

module.exports = new MemberController();