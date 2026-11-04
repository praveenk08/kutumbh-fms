const ApiResponse = require('../utils/apiResponse');

const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  if (err.name === 'ValidationError') {
    const validationErrors = Object.values(err.errors).map((item) => item.message);
    return ApiResponse.error(res, 400, 'Validation Error', validationErrors);
  }

  if (err.code === 11000) {
    const duplicateField = Object.keys(err.keyValue)[0];
    return ApiResponse.error(res, 409, `Duplicate entry detected for field: ${duplicateField}`);
  }

  return ApiResponse.error(
    res,
    statusCode,
    message,
    process.env.NODE_ENV === 'development' ? err.stack : null
  );
};

module.exports = errorHandler;