/**
 * @file memberController.js
 * @description Kutumbh FMS - HTTP Controller for Member endpoints
 */

const memberService = require('../services/memberService');
const ApiResponse = require('../utils/apiResponse');

class MemberController {
  /**
   * Handle POST /api/v1/members/:familyToken
   * Adds an individual member to a target family.
   */
  async addMember(req, res, next) {
    try {
      const { familyToken } = req.params;
      const memberData = req.body;

      if (!memberData || !memberData.fullName || !memberData.gender) {
        return ApiResponse.error(res, 400, 'fullName and gender are required fields.');
      }

      const result = await memberService.addMember(familyToken, memberData);
      return ApiResponse.success(res, 201, 'Member added successfully.', result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Handle PATCH /api/v1/members/:memberRefId/deactivate
   * Soft-deletes a member with administrative remarks.
   */
  async softDeleteMember(req, res, next) {
    try {
      const { memberRefId } = req.params;
      const { remarks } = req.body;

      const result = await memberService.softDeleteMember(memberRefId, remarks);
      return ApiResponse.success(res, 200, 'Member deactivated successfully.', result);
    } catch (error) {
      next(error);
    }
  }

  async updateMember(req, res, next) {
    try {
      const { memberId } = req.params;
      const updateData = req.body;

      const updated = await memberService.updateMember(memberId, updateData);
      if (!updated) {
        return ApiResponse.error(res, 404, 'Member not found');
      }

      return ApiResponse.success(res, 200, 'Member updated successfully', updated);
    } catch (error) {
      next(error);
    }
  }
  async removeMember(req, res, next) {
    try {
      const { memberId } = req.params;
      const { reason, remarks } = req.body;

      const result = await memberService.softDeleteMember(memberId, reason || remarks || 'Removed');
      return ApiResponse.success(res, 200, 'Member deactivated successfully.', result);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new MemberController();