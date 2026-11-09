/**
 * @file transactionRunner.js
 * @module Lib/TransactionRunner
 * @description Higher-Order Helper for executing ACID MySQL transactions safely.
 * Automatically acquires connection, begins transaction, commits on success,
 * performs rollback on failure, and guarantees resource release.
 */

const { pool } = require('../config/mysql');

/**
 * Executes a callback within a managed database transaction.
 *
 * @async
 * @param {Function} callback - Async function that receives the database `connection`.
 * @returns {Promise<any>} The result returned by the callback function.
 * @throws {Error} Propagates any error after rolling back.
 */
const withTransaction = async (callback) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

module.exports = {
  withTransaction,
};