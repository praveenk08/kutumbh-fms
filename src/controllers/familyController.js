/**
 * @file familyController.js
 * @description Kutumbh FMS - HTTP Controller for Family endpoints
 * Leverages asyncHandler to eliminate repetitive try-catch blocks.
 */

const familyService = require('../services/familyService');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

class FamilyController {
  /**
   * Handle POST /api/v1/families
   * Registers a complete family unit with head & member records.
   */
  registerFamily = asyncHandler(async (req, res) => {
    // Note: Zod middleware already verifies payload structure
    const payload = req.body;
    // familyService method compatibility: registerFamily or registerFamilyUnit
    const registerMethod = familyService.registerFamilyUnit || familyService.registerFamily;
    const result = await registerMethod.call(familyService, payload);

    return ApiResponse.success(res, 201, 'Family registered successfully in MySQL.', result);
  });

  /**
   * Handle GET /api/v1/families/:familyToken
   * Fetches family details and associated active members.
   */
  getFamilyByToken = asyncHandler(async (req, res) => {
    const { familyToken } = req.params;
    const family = await familyService.getFamilyByToken(familyToken);

    if (!family) {
      return ApiResponse.error(res, 404, 'Family not found.');
    }

    return ApiResponse.success(res, 200, 'Family details retrieved successfully.', family);
  });

  /**
   * Handle PATCH /api/v1/families/:familyToken/status or /verify
   * Updates verification status (VERIFIED/REJECTED/PENDING).
   */
  updateVerificationStatus = asyncHandler(async (req, res) => {
    const { familyToken } = req.params;
    const { status, verifiedBy } = req.body;

    const updatedFamily = await familyService.updateVerificationStatus(
      familyToken,
      status,
      verifiedBy
    );

    if (!updatedFamily) {
      return ApiResponse.error(res, 404, 'Family not found.');
    }

    return ApiResponse.success(res, 200, 'Family verification status updated successfully.', updatedFamily);
  });

  /**
   * Handle GET /api/v1/families
   * Searches and filters families with pagination.
   */
  searchFamilies = asyncHandler(async (req, res) => {
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
  });
}

module.exports = new FamilyController();