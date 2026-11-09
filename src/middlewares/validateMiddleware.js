/**
 * @file validateMiddleware.js
 * @description Request schema validation middleware using Zod.
 */

const ApiResponse = require('../utils/apiResponse');

const validate = (schema) => (req, res, next) => {
  try {
    req.body = schema.parse(req.body);
    next();
  } catch (error) {
    const formattedErrors = error.errors.map(err => ({
      field: err.path.join('.'),
      message: err.message,
    }));
    return ApiResponse.error(res, 400, 'Payload Validation Failed', formattedErrors);
  }
};

module.exports = validate;