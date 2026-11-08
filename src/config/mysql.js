const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 3306,
  user: process.env.DB_USER || 'fms_user',
  password: process.env.DB_PASSWORD || 'fmspassword123',
  database: process.env.DB_NAME || 'kutumbh_fms',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

const testMySQLConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('[Database] MySQL 8 Connected successfully.');
    connection.release();
  } catch (error) {
    console.error('[Database Error] MySQL connection failed:', error.message);
  }
};

module.exports = { pool, testMySQLConnection };