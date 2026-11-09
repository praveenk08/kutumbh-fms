/**
 * @file asyncHandler.js
 * @module Utils/AsyncHandler
 * @description Wraps async controller methods to eliminate repetitive try-catch blocks.
 */

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;