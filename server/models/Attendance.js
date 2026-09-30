const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema(
  {
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: [true, 'Event ID is required'],
    },
    member: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Member',
      required: [true, 'Member ID is required'],
    },
    status: {
      type: String,
      enum: ['present', 'absent'],
      required: [true, 'Attendance status is required'],
    },
    markedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    markedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Prevent duplicate attendance records for a member in the same event
attendanceSchema.index({ event: 1, member: 1 }, { unique: true });
attendanceSchema.index({ event: 1, status: 1 });
attendanceSchema.index({ member: 1, createdAt: -1 });

module.exports = mongoose.model('Attendance', attendanceSchema);
