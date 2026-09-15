const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.log('MongoDB URI not configured. Continuing with in-memory storage for local development.');
    return false;
  }

  try {
    await mongoose.connect(uri);
    console.log('MongoDB connected successfully.');
    return true;
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    return false;
  }
};

module.exports = { connectDB };
