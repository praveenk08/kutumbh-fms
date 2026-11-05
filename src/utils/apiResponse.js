class ApiResponse {
  /**
   * Success response wrapper
   */
  static success(res, statusCode = 200, message = 'Success', data = null) {
    return res.status(statusCode).json({
      success: true,
      statusCode,
      message,
      data,
    });
  }

  /**
   * Error response wrapper
   */
  static error(res, statusCode = 500, message = 'Internal Server Error', errors = null) {
    return res.status(statusCode).json({
      success: false,
      statusCode,
      message,
      errors,
    });
  }
}

module.exports = ApiResponse;