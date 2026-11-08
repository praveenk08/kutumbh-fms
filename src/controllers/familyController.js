/**
 * @file familyController.js
 * @description Kutumbh FMS - HTTP Controller for Family endpoints
 * Manages request validation, response formatting, and error forwarding.
 */

const familyService = require('../services/familyService');
const ApiResponse = require('../utils/apiResponse');

class FamilyController {
  /**
   * Handle POST /api/v1/families
   * Registers a complete family unit with head & member records.
   */
  async registerFamily(req, res, next) {
    try {
      const { familyData, membersData } = req.body;

      if (!familyData || !membersData) {
        return ApiResponse.error(
          res,
          400,
          'Payload must include both familyData and membersData.'
        );
      }

      const result = await familyService.registerFamilyUnit({ familyData, membersData });
      return ApiResponse.success(res, 201, 'Family registered successfully in MySQL.', result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Handle GET /api/v1/families/:familyToken
   * Fetches family details and associated active members.
   */
  async getFamilyByToken(req, res, next) {
    try {
      const { familyToken } = req.params;
      const family = await familyService.getFamilyByToken(familyToken);

      if (!family) {
        return ApiResponse.error(res, 404, 'Family not found.');
      }

      return ApiResponse.success(res, 200, 'Family details retrieved successfully.', family);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Handle PATCH /api/v1/families/:familyToken/status
   * Updates verification status (VERIFIED/REJECTED/PENDING).
   */
  async updateVerificationStatus(req, res, next) {
    try {
      const { familyToken } = req.params;
      const { status, verifiedBy } = req.body;

      if (!status) {
        return ApiResponse.error(res, 400, 'Status is required.');
      }

      const updatedFamily = await familyService.updateVerificationStatus(familyToken, {
        status,
        verifiedBy,
      });

      if (!updatedFamily) {
        return ApiResponse.error(res, 404, 'Family not found.');
      }

      return ApiResponse.success(res, 200, 'Family verification status updated successfully.', updatedFamily);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Handle GET /api/v1/families
   * Searches and filters families with pagination.
   */
  async searchFamilies(req, res, next) {
    try {
      const {
        village,
        rationCardCategory,
        verificationStatus,
        search,
        page,
        limit,
      } = req.query;

      const result = await familyService.searchFamilies({
        village,
        rationCardCategory,
        verificationStatus,
        search,
        page,
        limit,
      });

      return ApiResponse.success(res, 200, 'Families retrieved successfully.', result);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new FamilyController();