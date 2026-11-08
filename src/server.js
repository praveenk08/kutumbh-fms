require('dotenv').config();
const http = require('http');
const app = require('./app');
const { testMySQLConnection, pool } = require('./config/mysql');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // 1. Connect to MySQL Database
    await testMySQLConnection();

    // 2. Initialize HTTP Server
    const server = http.createServer(app);

    server.listen(PORT, () => {
      console.log(`[Server] Kutumbh FMS Core running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode.`);
    });

    // Graceful Shutdown
    const handleShutdown = async (signal) => {
      console.log(`[Server] Signal ${signal} received. Closing HTTP server and MySQL pool...`);
      server.close(async () => {
        if (pool) {
          await pool.end();
          console.log('[Database] MySQL connection pool closed.');
        }
        process.exit(0);
      });
    };

    process.on('SIGINT', () => handleShutdown('SIGINT'));
    process.on('SIGTERM', () => handleShutdown('SIGTERM'));
  } catch (error) {
    console.error(`[Server Error] Startup failure: ${error.message}`);
    process.exit(1);
  }
};

startServer();