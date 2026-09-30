const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
    },
    branch: {
      type: String,
      required: [true, 'Branch is required'],
      enum: ['CSE', 'ECE', 'EEE', 'MECH', 'CIVIL', 'METALLURGY', 'CHEMICAL', 'ARCHITECTURE', 'MINING', 'OTHER'],
    },
    academicYear: {
      type: String,
      required: [true, 'Academic year is required'],
      enum: ['1st Year', '2nd Year', '3rd Year', '4th Year', 'M.Tech', 'PhD', 'Alumni'],
    },
    joiningYear: {
      type: Number,
      required: [true, 'Joining year is required'],
    },
    interests: [
      {
        type: String,
        trim: true,
      },
    ],
    hobbies: [
      {
        type: String,
        trim: true,
      },
    ],
    skills: [
      {
        type: String,
        trim: true,
      },
    ],
    profilePhotoUrl: {
      type: String,
      default: 'https://avatar.iran.liara.run/public',
    },
    contactNumber: {
      type: String,
      trim: true,
    },
    emergencyContact: {
      type: String,
      trim: true,
    },
    additionalRemarks: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
  },
  { timestamps: true }
);

memberSchema.index({ fullName: 'text', branch: 'text', interests: 'text', hobbies: 'text', skills: 'text' });
memberSchema.index({ status: 1, fullName: 1 });
memberSchema.index({ status: 1, branch: 1, academicYear: 1, fullName: 1 });

module.exports = mongoose.model('Member', memberSchema);
