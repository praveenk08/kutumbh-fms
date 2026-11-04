const familyService = require('../services/familyService');
const ApiResponse = require('../utils/apiResponse');

class FamilyController {
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
      return ApiResponse.success(res, 201, 'Family registered successfully.', result);
    } catch (error) {
      next(error);
    }
  }

  async getFamilyByToken(req, res, next) {
    try {
      const { familyToken } = req.params;
      const family = await familyService.getFamilyByToken(familyToken);
      return ApiResponse.success(res, 200, 'Family details retrieved successfully.', family);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new FamilyController();