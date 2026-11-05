const MemberService = require('../services/memberService');
const ApiResponse = require('../utils/apiResponse');

class MemberController {
  static async addMember(req, res, next) {
    try {
      const { familyToken } = req.params;
      const memberData = req.body;

      const member = await MemberService.addMemberToFamily(familyToken, memberData);
      return ApiResponse.success(res, 201, 'Member added to family successfully.', member);
    } catch (error) {
      next(error);
    }
  }

  static async updateMember(req, res, next) {
    try {
      const { memberId } = req.params;
      const updateData = req.body;

      const member = await MemberService.updateMember(memberId, updateData);
      return ApiResponse.success(res, 200, 'Member updated successfully.', member);
    } catch (error) {
      next(error);
    }
  }

  static async removeMember(req, res, next) {
    try {
      const { memberId } = req.params;
      const { reason } = req.body;

      const result = await MemberService.removeMember(memberId, reason);
      return ApiResponse.success(res, 200, result.message, result);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = MemberController;