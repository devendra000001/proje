const mongoose = require('mongoose');

const eventRemarkSchema = new mongoose.Schema(
  {
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: [true, 'Event ID is required'],
      unique: true,
    },
    overallRemark: {
      type: String,
      required: [true, 'Overall remark is required'],
      trim: true,
    },
    whatWentWell: {
      type: String,
      trim: true,
    },
    whatCouldBeImproved: {
      type: String,
      trim: true,
    },
    suggestionsNextTime: {
      type: String,
      trim: true,
    },
    totalPresentCount: {
      type: Number,
      default: 0,
    },
    totalAbsentCount: {
      type: Number,
      default: 0,
    },
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('EventRemark', eventRemarkSchema);
