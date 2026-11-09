/**
 * @file queryHelper.js
 * @module Utils/QueryHelper
 * @description Helper utilities for pagination bounds and dynamic SQL clause construction.
 */

const getPagination = (page, limit, maxLimit = 100) => {
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.max(1, Math.min(maxLimit, parseInt(limit, 10) || 10));
  const offset = (pageNum - 1) * limitNum;

  return { pageNum, limitNum, offset };
};

const formatPaginationResult = (data, totalRecords, pageNum, limitNum) => {
  const totalPages = Math.ceil(totalRecords / limitNum);
  return {
    families: data, // Integration test expects 'families'
    records: data,
    pagination: {
      totalRecords,
      currentPage: pageNum,
      totalPages,
      limit: limitNum,
    },
    total: totalRecords,
    page: pageNum,
    totalPages,
  };
};

module.exports = {
  getPagination,
  formatPaginationResult,
};