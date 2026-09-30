const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/rss-vnit-shakha-portal';
    const conn = await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    console.log(`[Database] MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`[Database Error] MongoDB connection failed (${error.name || 'connection error'}); check MONGODB_URI and database availability.`);
    throw new Error('MongoDB connection failed; API startup aborted');
  }
};

module.exports = connectDB;
