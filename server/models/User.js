const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, maxlength: 100 },
    username: {
      type: String,
      required: [true, 'Username is required'],
      trim: true,
      lowercase: true,
      minlength: 3,
      maxlength: 50,
      match: [/^[a-z0-9._-]+$/, 'Username may contain letters, numbers, dots, underscores, and hyphens'],
    },
    email: {
      type: String,
      default: undefined,
      lowercase: true,
      trim: true,
      maxlength: 254,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please provide a valid email address'],
    },
    passwordHash: {
      type: String,
      required: [true, 'Password is required'],
      select: false,
    },
    role: {
      type: String,
      enum: ['admin', 'member'],
      default: 'member',
    },
    memberProfile: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Member',
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
    lastLogin: {
      type: Date,
    },
    tokenVersion: {
      type: Number,
      default: 0,
      select: false,
    },
  },
  { timestamps: true }
);

userSchema.index({ username: 1 }, { unique: true, collation: { locale: 'en', strength: 2 } });

userSchema.pre('validate', function normalizeUsername(next) {
  if (typeof this.username === 'string') this.username = this.username.trim().toLowerCase();
  next();
});

module.exports = mongoose.model('User', userSchema);
