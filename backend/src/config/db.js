const mongoose = require('mongoose');
const env = require('./env');
const fs = require('fs');

const path = require('path');

// Use local Homebrew mongod if available to avoid downloading
if (fs.existsSync('/opt/homebrew/bin/mongod')) {
  process.env.MONGOMS_SYSTEM_BINARY = '/opt/homebrew/bin/mongod';
}

let mongoMemoryServer = null;

const connectDB = async () => {
  try {
    // Set strictQuery
    mongoose.set('strictQuery', false);

    const isProduction = process.env.NODE_ENV === 'production';
    const timeoutMS = isProduction ? 15000 : 5000;

    // Mask credentials in connection log for security
    const maskedUri = (env.MONGODB_URI || '').replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@');
    console.log(`Connecting to MongoDB at: ${maskedUri}...`);

    await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: timeoutMS,
    });
    console.log('MongoDB connected successfully via MONGODB_URI.');
  } catch (err) {
    if (process.env.NODE_ENV === 'production') {
      console.error(`Fatal: Failed to connect to production MongoDB (${err.message})`);
      console.error('Please verify that MONGODB_URI is set to a valid, reachable MongoDB Atlas cluster.');
      process.exit(1);
    }

    console.warn(`Could not connect to external MongoDB: ${err.message}`);
    console.log('Using persistent local database storage fallback...');
    try {
      const dbDir = path.resolve(__dirname, '../../data/db');
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
      }

      const { MongoMemoryServer } = require('mongodb-memory-server');
      mongoMemoryServer = await MongoMemoryServer.create({
        instance: {
          dbPath: dbDir,
          storageEngine: 'wiredTiger',
        },
      });
      const memoryUri = mongoMemoryServer.getUri();
      await mongoose.connect(memoryUri);
      console.log(`Persistent MongoDB database ready (saving data to: ${dbDir})`);
    } catch (memErr) {
      console.error('Fatal: Failed to connect to both external MongoDB and MongoMemoryServer:', memErr);
      process.exit(1);
    }
  }
};

const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    if (mongoMemoryServer) {
      await mongoMemoryServer.stop();
    }
    console.log('MongoDB disconnected.');
  } catch (error) {
    console.error('Error during DB disconnection:', error);
  }
};

module.exports = { connectDB, disconnectDB };
