const mongoose = require('mongoose');
const env = require('./env');
const fs = require('fs');

// Use local Homebrew mongod if available to avoid downloading
if (fs.existsSync('/opt/homebrew/bin/mongod')) {
  process.env.MONGOMS_SYSTEM_BINARY = '/opt/homebrew/bin/mongod';
}

let mongoMemoryServer = null;

const connectDB = async () => {
  try {
    // Set strictQuery
    mongoose.set('strictQuery', false);

    // Try connecting to provided MONGODB_URI with a 2-second timeout
    console.log(`Connecting to MongoDB at: ${env.MONGODB_URI}...`);
    await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 2500,
    });
    console.log('MongoDB connected successfully via MONGODB_URI.');
  } catch (err) {
    console.warn(`Could not connect to external MongoDB: ${err.message}`);
    console.log('Spinning up embedded MongoDB Memory Server for seamless local execution...');
    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      mongoMemoryServer = await MongoMemoryServer.create();
      const memoryUri = mongoMemoryServer.getUri();
      await mongoose.connect(memoryUri);
      console.log(`Embedded MongoDB Memory Server connected successfully at: ${memoryUri}`);
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
