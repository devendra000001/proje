const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const User = require('../models/User');
const Member = require('../models/Member');
const Event = require('../models/Event');
const Attendance = require('../models/Attendance');
const EventRemark = require('../models/EventRemark');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const portalModels = [User, Member, Event, Attendance, EventRemark];

async function run() {
  if (!process.argv.includes('--confirm')) throw new Error('Refusing to reset database without --confirm');
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is required');
  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10000, autoIndex: false });

  // Remove the legacy unique email index, which otherwise blocks multiple accounts without email.
  try {
    const indexes = await User.collection.indexes();
    for (const index of indexes) {
      if (index.key?.email) await User.collection.dropIndex(index.name);
    }
  } catch (error) {
    if (error.code !== 26 && error.codeName !== 'NamespaceNotFound') throw error;
  }

  for (const Model of portalModels) {
    const result = await Model.deleteMany({});
    console.log(`${Model.collection.collectionName}: ${result.deletedCount} documents removed`);
  }
}

run().catch((error) => {
  console.error(`[Database Reset Error] ${error.message || error.name || 'Reset failed'}`);
  process.exitCode = 1;
}).finally(async () => {
  if (mongoose.connection.readyState !== 0) await mongoose.disconnect().catch(() => {});
});
