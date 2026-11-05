const mongoose = require('mongoose');
const dns = require('dns');

// Force Node.js runtime to use Google Public DNS for SRV queries
dns.setServers(['8.8.8.8', '8.8.4.4']);

class DatabaseConnection {
  /**
   * Initializes and maintains a persistent MongoDB connection pool.
   */
  static async connect() {
    const mongoUri = process.env.MONGO_URI;

    if (!mongoUri) {
      throw new Error('Database connection failed: MONGO_URI environment variable is not defined.');
    }

    const options = {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };

    try {
      const conn = await mongoose.connect(mongoUri, options);
      console.log(`[Database] MongoDB Connected: ${conn.connection.host}`);

      mongoose.connection.on('error', (err) => {
        console.error(`[Database Error] Runtime connection error: ${err.message}`);
      });

      mongoose.connection.on('disconnected', () => {
        console.warn('[Database Warning] MongoDB connection disconnected.');
      });

      return conn;
    } catch (error) {
      console.error(`[Database Error] Initial connection failure: ${error.message}`);
      process.exit(1);
    }
  }

  /**
   * Gracefully closes the database connection pool during process termination.
   * @param {string} signal - The process termination signal
   */
  static async disconnect(signal = 'SIGINT') {
    try {
      await mongoose.connection.close();
      console.log(`[Database] Connection safely closed due to ${signal}.`);
    } catch (error) {
      console.error(`[Database Error] Error during connection shutdown: ${error.message}`);
    }
  }
}

module.exports = DatabaseConnection;