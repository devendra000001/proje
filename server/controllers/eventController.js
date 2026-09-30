const Event = require('../models/Event');
const Attendance = require('../models/Attendance');
const EventRemark = require('../models/EventRemark');
const Member = require('../models/Member');
const sendControllerError = require('../utils/sendControllerError');

// @desc    Get all events with optional status filter & chronological sorting
// @route   GET /api/events
// @access  Private
const getEvents = async (req, res) => {
  try {
    const { status, search } = req.query;

    if (status && !['upcoming', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid event status filter' });
    }

    const query = {};

    if (status && ['upcoming', 'completed', 'cancelled'].includes(status)) {
      query.status = status;
    }

    if (search) {
      const safeSearch = String(search).slice(0, 100).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.$or = [
        { name: { $regex: safeSearch, $options: 'i' } },
        { venue: { $regex: safeSearch, $options: 'i' } },
        { description: { $regex: safeSearch, $options: 'i' } },
      ];
    }

    // Sort upcoming events ascending (soonest first), completed descending (latest first)
    const sortDirection = status === 'completed' ? -1 : 1;

    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit, 10) || 100));
    const [events, total] = await Promise.all([Event.find(query).sort({ date: sortDirection, startTime: 1 }).skip((page - 1) * limit).limit(limit), Event.countDocuments(query)]);

    res.json({
      success: true,
      count: events.length,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      events,
    });
  } catch (error) {
    sendControllerError(res, error, 'Server error fetching events');
  }
};

// @desc    Get single event by ID with attached remark report & attendance stats
// @route   GET /api/events/:id
// @access  Private
const getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    // Fetch attached post-event remark report if available
    const remark = await EventRemark.findOne({ event: event._id }).populate({
      path: 'recordedBy', select: 'role memberProfile',
      populate: { path: 'memberProfile', select: 'fullName' },
    });

    // Fetch attendance stats summary for this event
    const attendanceSummary = await Attendance.aggregate([
      { $match: { event: event._id } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
    const attendanceCounts = Object.fromEntries(attendanceSummary.map((entry) => [entry._id, entry.count]));
    const totalPresent = attendanceCounts.present || 0;
    const totalAbsent = attendanceCounts.absent || 0;

    res.json({
      success: true,
      event,
      remark: remark || null,
      attendanceStats: {
      totalMarked: totalPresent + totalAbsent,
        totalPresent,
        totalAbsent,
      },
    });
  } catch (error) {
    sendControllerError(res, error, 'Server error fetching event details');
  }
};

// @desc    Create new event (Admin only)
// @route   POST /api/events
// @access  Private (Admin only)
const createEvent = async (req, res) => {
  try {
    const { name, date, startTime, endTime, venue, description } = req.body;

    if (!name || !date || !startTime || !endTime || !venue) {
      return res.status(400).json({ success: false, message: 'Please provide all required event details' });
    }
    if (typeof name !== 'string' || name.trim().length > 150 || typeof venue !== 'string' || venue.trim().length > 200 ||
        !validEventDate(date) || !validEventTime(startTime) || !validEventTime(endTime) || !validEventTimes(startTime, endTime)) {
      return res.status(400).json({ success: false, message: 'Provide a valid event date and start/end times (for example, 07:30 AM)' });
    }
    if (description !== undefined && (typeof description !== 'string' || description.length > 5000)) {
      return res.status(400).json({ success: false, message: 'Event description must be under 5000 characters' });
    }

    const newEvent = await Event.create({
      name: name.trim(),
      date: new Date(date),
      startTime,
      endTime,
      venue: venue.trim(),
      description: description || '',
      status: 'upcoming',
      createdBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: 'Shakha event scheduled successfully',
      event: newEvent,
    });
  } catch (error) {
    sendControllerError(res, error, 'Server error creating event');
  }
};

// @desc    Update event details (Admin only)
// @route   PUT /api/events/:id
// @access  Private (Admin only)
const updateEvent = async (req, res) => {
  try {
    const { name, date, startTime, endTime, venue, description, status } = req.body;

    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    if (name !== undefined) {
      if (typeof name !== 'string' || !name.trim() || name.length > 150) return res.status(400).json({ success: false, message: 'Event name must be 1 to 150 characters' });
      event.name = name.trim();
    }
    if (date !== undefined) {
      if (!validEventDate(date)) return res.status(400).json({ success: false, message: 'Invalid event date' });
      event.date = new Date(date);
    }
    if (startTime !== undefined) {
      if (!validEventTime(startTime)) return res.status(400).json({ success: false, message: 'Invalid event start time' });
      event.startTime = startTime;
    }
    if (endTime !== undefined) {
      if (!validEventTime(endTime) || !validEventTimes(startTime ?? event.startTime, endTime)) return res.status(400).json({ success: false, message: 'Invalid event end time' });
      event.endTime = endTime;
    }
    if (venue !== undefined) {
      if (typeof venue !== 'string' || !venue.trim() || venue.length > 200) return res.status(400).json({ success: false, message: 'Venue must be 1 to 200 characters' });
      event.venue = venue.trim();
    }
    if (description !== undefined) {
      if (typeof description !== 'string' || description.length > 5000) return res.status(400).json({ success: false, message: 'Event description must be under 5000 characters' });
      event.description = description;
    }
    if (status !== undefined && !['upcoming', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid event status' });
    }
    if (status !== undefined) {
      event.status = status;
    }
    if (!validEventTimes(event.startTime, event.endTime)) {
      return res.status(400).json({ success: false, message: 'Event end time must be later than its start time' });
    }

    await event.save();

    res.json({
      success: true,
      message: 'Event details updated successfully',
      event,
    });
  } catch (error) {
    sendControllerError(res, error, 'Server error updating event');
  }
};

// @desc    Update event status (Admin only)
// @route   PATCH /api/events/:id/status
// @access  Private (Admin only)
const updateEventStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!['upcoming', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value' });
    }

    const event = await Event.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    res.json({
      success: true,
      message: `Event status changed to ${status}`,
      event,
    });
  } catch (error) {
    sendControllerError(res, error, 'Server error updating event status');
  }
};

// @desc    Delete event (Admin only)
// @route   DELETE /api/events/:id
// @access  Private (Admin only)
const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    // Clean up related attendance records & remarks
    await Attendance.deleteMany({ event: req.params.id });
    await EventRemark.deleteMany({ event: req.params.id });

    res.json({
      success: true,
      message: 'Event deleted successfully',
    });
  } catch (error) {
    sendControllerError(res, error, 'Server error deleting event');
  }
};

const getEventAttendance = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).select('_id');
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit, 10) || 50));
    const filter = { status: 'active' };
    const [members, total] = await Promise.all([
      Member.find(filter).select('fullName branch academicYear').sort({ fullName: 1 }).skip((page - 1) * limit).limit(limit),
      Member.countDocuments(filter),
    ]);
    const memberIds = members.map((member) => member._id);
    const records = memberIds.length ? await Attendance.find({ event: event._id, member: { $in: memberIds } }) : [];
    const byMember = new Map(records.map((record) => [record.member.toString(), record]));
    res.json({
      success: true,
      members: members.map((member) => ({ member, attendance: byMember.get(member._id.toString()) || null })),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    sendControllerError(res, error, 'Unable to load event attendance');
  }
};

const setEventAttendance = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).select('_id');
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    const member = await Member.findById(req.params.memberId).select('_id');
    if (!member) return res.status(404).json({ success: false, message: 'Member profile not found' });
    const { status } = req.body;
    if (!['present', 'absent'].includes(status)) return res.status(400).json({ success: false, message: 'Attendance status must be present or absent' });
    const attendance = await Attendance.findOneAndUpdate(
      { event: event._id, member: member._id },
      { $set: { status, markedBy: req.user._id, markedAt: new Date() } },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true },
    );
    res.json({ success: true, attendance });
  } catch (error) {
    sendControllerError(res, error, 'Unable to update attendance');
  }
};

const clearEventAttendance = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).select('_id');
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    const member = await Member.findById(req.params.memberId).select('_id');
    if (!member) return res.status(404).json({ success: false, message: 'Member profile not found' });
    const record = await Attendance.findOneAndDelete({ event: event._id, member: member._id });
    if (!record) return res.status(404).json({ success: false, message: 'No attendance record exists for this member and event' });
    res.json({ success: true, message: 'Attendance record removed' });
  } catch (error) {
    sendControllerError(res, error, 'Unable to remove attendance');
  }
};

const saveEventRemark = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).select('_id status');
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    if (event.status !== 'completed') return res.status(409).json({ success: false, message: 'Post-event reports are available only after an event is completed' });
    const { overallRemark, whatWentWell = '', whatCouldBeImproved = '', suggestionsNextTime = '' } = req.body;
    const textFields = [overallRemark, whatWentWell, whatCouldBeImproved, suggestionsNextTime];
    if (typeof overallRemark !== 'string' || !overallRemark.trim() || textFields.some((value) => typeof value !== 'string' || value.length > 5000)) {
      return res.status(400).json({ success: false, message: 'Provide an overall remark and keep each report field under 5000 characters' });
    }
    const [totalPresentCount, totalAbsentCount] = await Promise.all([
      Attendance.countDocuments({ event: event._id, status: 'present' }),
      Attendance.countDocuments({ event: event._id, status: 'absent' }),
    ]);
    const remark = await EventRemark.findOneAndUpdate(
      { event: event._id },
      { $set: { overallRemark: overallRemark.trim(), whatWentWell: whatWentWell.trim(), whatCouldBeImproved: whatCouldBeImproved.trim(), suggestionsNextTime: suggestionsNextTime.trim(), totalPresentCount, totalAbsentCount, recordedBy: req.user._id } },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true },
    ).populate({ path: 'recordedBy', select: 'role memberProfile', populate: { path: 'memberProfile', select: 'fullName' } });
    res.json({ success: true, remark });
  } catch (error) {
    sendControllerError(res, error, 'Unable to save event report');
  }
};

module.exports = {
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  updateEventStatus,
  deleteEvent,
  getEventAttendance,
  setEventAttendance,
  clearEventAttendance,
  saveEventRemark,
};

function validEventDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
}

function validEventTime(value) {
  return typeof value === 'string' && /^(0?[1-9]|1[0-2]):[0-5]\d\s?(AM|PM)$/i.test(value.trim());
}

function validEventTimes(start, end) {
  if (!validEventTime(start) || !validEventTime(end)) return false;
  const toMinutes = (value) => {
    const [, hourText, minuteText, meridiem] = value.trim().match(/^(0?[1-9]|1[0-2]):([0-5]\d)\s?(AM|PM)$/i);
    const hour = Number(hourText) % 12 + (meridiem.toUpperCase() === 'PM' ? 12 : 0);
    return hour * 60 + Number(minuteText);
  };
  return toMinutes(end) > toMinutes(start);
}
