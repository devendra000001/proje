const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const normalizeUsername = (value) => value.trim().toLowerCase();

async function run() {
  const { MONGODB_URI, BOOTSTRAP_ADMIN_NAME: name, BOOTSTRAP_ADMIN_USERNAME: usernameValue, BOOTSTRAP_ADMIN_PASSWORD: password } = process.env;
  const username = typeof usernameValue === 'string' ? normalizeUsername(usernameValue) : '';
  if (!MONGODB_URI) throw new Error('MONGODB_URI is required');
  if (typeof name !== 'string' || !name.trim() || name.trim().length > 100) throw new Error('BOOTSTRAP_ADMIN_NAME must be between 1 and 100 characters');
  if (username.length < 3 || username.length > 50 || !/^[a-z0-9._-]+$/.test(username)) throw new Error('BOOTSTRAP_ADMIN_USERNAME must be a valid username');
  if (typeof password !== 'string' || password.length < 12 || Buffer.byteLength(password, 'utf8') > 72) throw new Error('BOOTSTRAP_ADMIN_PASSWORD must be at least 12 characters and no more than 72 bytes');

  await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
  await User.collection.createIndex({ username: 1 }, { unique: true, collation: { locale: 'en', strength: 2 } });
  const existing = await User.findOne({ username }).collation({ locale: 'en', strength: 2 }).select('_id');
  if (existing) throw new Error('An account with this username already exists; no account was changed');
  const passwordHash = await bcrypt.hash(password, 12);
  await User.create({ name: name.trim(), username, passwordHash, role: 'admin', status: 'active' });
  console.log(`[Bootstrap] Administrator account created for ${username}.`);
}

run().catch((error) => {
  console.error(`[Bootstrap Error] ${error.message || error.name || 'Admin creation failed'}`);
  process.exitCode = 1;
}).finally(async () => {
  if (mongoose.connection.readyState !== 0) await mongoose.disconnect().catch(() => {});
});
