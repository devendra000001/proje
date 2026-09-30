const Member = require('../models/Member');
const Event = require('../models/Event');
const EventRemark = require('../models/EventRemark');
const Attendance = require('../models/Attendance');

const getDashboardStats = async (req, res) => {
  try {
    const [totalMembers, activeMembers, inactiveMembers, upcomingEvents, completedEvents, upcomingEventItems, completedEventItems, recentRemarks, attendanceRows] = await Promise.all([
      Member.countDocuments(),
      Member.countDocuments({ status: 'active' }),
      Member.countDocuments({ status: 'inactive' }),
      Event.countDocuments({ status: 'upcoming' }),
      Event.countDocuments({ status: 'completed' }),
      Event.find({ status: 'upcoming' }).sort({ date: 1, startTime: 1 }).limit(5),
      Event.find({ status: 'completed' }).sort({ date: -1, startTime: 1 }).limit(5),
      EventRemark.find().sort({ createdAt: -1 }).limit(3).populate('event', 'name date status'),
      Attendance.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    ]);
    const attendanceCounts = Object.fromEntries(attendanceRows.map((row) => [row._id, row.count]));

    res.json({
      success: true,
      stats: { totalMembers, activeMembers, inactiveMembers, upcomingEvents, completedEvents, attendancePresent: attendanceCounts.present || 0, attendanceAbsent: attendanceCounts.absent || 0 },
      upcomingEventItems,
      completedEventItems,
      recentRemarks,
    });
  } catch (error) {
    console.error('[Dashboard Stats Error]', error.name || 'Error');
    res.status(500).json({ success: false, message: 'Unable to load dashboard statistics' });
  }
};

module.exports = { getDashboardStats };
