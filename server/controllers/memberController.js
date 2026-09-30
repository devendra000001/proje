const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const Member = require('../models/Member');
const User = require('../models/User');
const Attendance = require('../models/Attendance');
const sendControllerError = require('../utils/sendControllerError');
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const normalizeUsername = (value) => typeof value === 'string' ? value.trim().toLowerCase() : '';
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const normalizeStringList = (value, field) => {
  if (value === undefined || value === null || value === '') return [];
  const list = Array.isArray(value) ? value : typeof value === 'string' ? value.split(',') : null;
  if (!list || list.some((item) => typeof item !== 'string' || item.length > 100)) {
    throw Object.assign(new Error(`Invalid ${field}`), { name: 'ValidationError' });
  }
  return list.map((item) => item.trim()).filter(Boolean).slice(0, 50);
};

// Helper: Sanitize member profile for non-admin viewers (Privacy Guard)
const sanitizeMemberPrivacy = (memberObj, isViewerAdmin, isViewerSelf) => {
  if (isViewerAdmin || isViewerSelf) {
    return memberObj;
  }
  
  // Strip private contact info and admin notes for standard member viewers
  const sanitized = memberObj.toObject ? memberObj.toObject() : { ...memberObj };
  delete sanitized.contactNumber;
  delete sanitized.emergencyContact;
  delete sanitized.additionalRemarks;
  if (sanitized.user && sanitized.user.email) {
    delete sanitized.user.email;
  }
  return sanitized;
};

// @desc    Get all members with search & filters
// @route   GET /api/members
// @access  Private (Admin & Members)
const getMembers = async (req, res) => {
  try {
    const { search, branch, academicYear, status } = req.query;
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit, 10) || 100));

    if (status && !['active', 'inactive'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid member status filter' });
    }
    if (status === 'inactive' && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only administrators can view inactive members' });
    }
    if (branch && !Member.schema.path('branch').enumValues.includes(branch)) {
      return res.status(400).json({ success: false, message: 'Invalid branch filter' });
    }
    if (academicYear && !Member.schema.path('academicYear').enumValues.includes(academicYear)) {
      return res.status(400).json({ success: false, message: 'Invalid academic year filter' });
    }

    const query = {};

    if (status) {
      query.status = status;
    } else {
      query.status = 'active'; // Default show active members
    }

    if (branch) {
      query.branch = branch;
    }

    if (academicYear) {
      query.academicYear = academicYear;
    }

    if (search) {
      const safeSearch = escapeRegex(String(search).slice(0, 100));
      query.$or = [
        { fullName: { $regex: safeSearch, $options: 'i' } },
        { branch: { $regex: safeSearch, $options: 'i' } },
        { interests: { $elemMatch: { $regex: safeSearch, $options: 'i' } } },
        { skills: { $elemMatch: { $regex: safeSearch, $options: 'i' } } },
        { hobbies: { $elemMatch: { $regex: safeSearch, $options: 'i' } } },
      ];
    }

    const [members, total] = await Promise.all([Member.find(query)
      .populate('user', 'username email role status')
      .sort({ fullName: 1 }).skip((page - 1) * limit).limit(limit), Member.countDocuments(query)]);

    const isViewerAdmin = req.user.role === 'admin';
    const currentMemberId = req.user.memberProfile ? req.user.memberProfile._id.toString() : null;

    const sanitizedMembers = members.map((m) => {
      const isSelf = currentMemberId && m._id.toString() === currentMemberId;
      return sanitizeMemberPrivacy(m, isViewerAdmin, isSelf);
    });

    res.json({
      success: true,
      count: sanitizedMembers.length,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      members: sanitizedMembers,
    });
  } catch (error) {
    sendControllerError(res, error, 'Server error fetching members directory');
  }
};

// @desc    Get single member profile by ID
// @route   GET /api/members/:id
// @access  Private
const getMemberById = async (req, res) => {
  try {
    const member = await Member.findById(req.params.id).populate('user', 'username email role status');

    if (!member) {
      return res.status(404).json({ success: false, message: 'Member profile not found' });
    }

    const isViewerAdmin = req.user.role === 'admin';
    const currentMemberId = req.user.memberProfile ? req.user.memberProfile._id.toString() : null;
    const isSelf = currentMemberId && member._id.toString() === currentMemberId;
    if (member.status === 'inactive' && !isViewerAdmin && !isSelf) {
      return res.status(404).json({ success: false, message: 'Member profile not found' });
    }

    const sanitized = sanitizeMemberPrivacy(member, isViewerAdmin, isSelf);

    res.json({
      success: true,
      member: sanitized,
    });
  } catch (error) {
    sendControllerError(res, error, 'Server error fetching member profile');
  }
};

// @desc    Create new member & user account (Admin only)
// @route   POST /api/members
// @access  Private (Admin only)
const createMember = async (req, res) => {
  try {
    const {
      fullName,
      username,
      email,
      password,
      branch,
      academicYear,
      joiningYear,
      interests,
      hobbies,
      skills,
      contactNumber,
      emergencyContact,
      additionalRemarks,
      role = 'member',
    } = req.body;

    if (![fullName, username, branch, academicYear, joiningYear, password].every((value) => value !== undefined && value !== null && String(value).trim() !== '')) {
      return res.status(400).json({ success: false, message: 'Please fill in all required fields' });
    }
    if (typeof fullName !== 'string' || fullName.trim().length > 100) return res.status(400).json({ success: false, message: 'Name must be under 100 characters' });
    if (typeof username !== 'string' || normalizeUsername(username).length < 3 || normalizeUsername(username).length > 50 || !/^[a-z0-9._-]+$/.test(normalizeUsername(username))) return res.status(400).json({ success: false, message: 'Please provide a valid username' });
    if (email !== undefined && email !== '' && (typeof email !== 'string' || email.length > 254 || !EMAIL_PATTERN.test(email.trim()))) return res.status(400).json({ success: false, message: 'Please provide a valid email address' });
    if (typeof password !== 'string' || password.length < 12) return res.status(400).json({ success: false, message: 'Initial password must be at least 12 characters long' });
    if (Buffer.byteLength(password, 'utf8') > 72) return res.status(400).json({ success: false, message: 'Initial password must be no more than 72 bytes' });
    if (!Number.isInteger(Number(joiningYear)) || Number(joiningYear) < 1900 || Number(joiningYear) > new Date().getFullYear() + 1) {
      return res.status(400).json({ success: false, message: 'Please provide a valid joining year' });
    }
    if (!Member.schema.path('branch').enumValues.includes(branch) || !Member.schema.path('academicYear').enumValues.includes(academicYear)) {
      return res.status(400).json({ success: false, message: 'Invalid branch or academic year' });
    }
    if (!['admin', 'member'].includes(role)) return res.status(400).json({ success: false, message: 'Invalid account role' });
    let memberLists;
    try {
      memberLists = {
        interests: normalizeStringList(interests, 'interests'),
        hobbies: normalizeStringList(hobbies, 'hobbies'),
        skills: normalizeStringList(skills, 'skills'),
      };
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }

    const normalizedUsername = normalizeUsername(username);
    const existingUser = await User.findOne({ username: normalizedUsername });
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'A user account with this username already exists' });
    }

    let newMember;
    let newUser;
    try {
    newMember = await Member.create({
      fullName,
      branch,
      academicYear,
      joiningYear: Number(joiningYear),
      ...memberLists,
      contactNumber,
      emergencyContact,
      additionalRemarks,
      status: 'active',
    });

    const initialPassword = password;
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(initialPassword, salt);

    // Create User account
    newUser = await User.create({
      username: normalizedUsername,
      ...(email?.trim() ? { email: email.trim().toLowerCase() } : {}),
      name: fullName.trim(),
      passwordHash,
      role,
      memberProfile: newMember._id,
      status: 'active',
    });

    newMember.user = newUser._id;
    await newMember.save();
    } catch (error) {
      if (newUser?._id) await User.deleteOne({ _id: newUser._id }).catch(() => {});
      if (newMember?._id) await Member.deleteOne({ _id: newMember._id }).catch(() => {});
      if (error.code === 11000) return res.status(409).json({ success: false, message: 'A user account with this username already exists' });
      throw error;
    }

    res.status(201).json({
      success: true,
      message: 'Swayamsevak member profile created successfully',
      member: newMember,
    });
  } catch (error) {
    sendControllerError(res, error, 'Server error creating member profile');
  }
};

// @desc    Update member profile
// @route   PUT /api/members/:id
// @access  Private (Admin or Self)
const updateMember = async (req, res) => {
  try {
    const member = await Member.findById(req.params.id);
    if (!member) {
      return res.status(404).json({ success: false, message: 'Member profile not found' });
    }

    const isViewerAdmin = req.user.role === 'admin';
    const currentMemberId = req.user.memberProfile ? req.user.memberProfile._id.toString() : null;
    const isSelf = currentMemberId && member._id.toString() === currentMemberId;

    if (!isViewerAdmin && !isSelf) {
      return res.status(403).json({ success: false, message: 'Not authorized to edit this member profile' });
    }

    const {
      fullName,
      branch,
      academicYear,
      joiningYear,
      interests,
      hobbies,
      skills,
      contactNumber,
      emergencyContact,
      additionalRemarks,
      status,
    } = req.body;

    let memberLists;
    try {
      memberLists = {
        ...(interests !== undefined && { interests: normalizeStringList(interests, 'interests') }),
        ...(hobbies !== undefined && { hobbies: normalizeStringList(hobbies, 'hobbies') }),
        ...(skills !== undefined && { skills: normalizeStringList(skills, 'skills') }),
      };
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }

    if (fullName) member.fullName = fullName;
    if (branch) member.branch = branch;
    if (academicYear) member.academicYear = academicYear;
    if (joiningYear) member.joiningYear = Number(joiningYear);
    Object.assign(member, memberLists);

    if (contactNumber !== undefined) member.contactNumber = contactNumber;
    if (emergencyContact !== undefined) member.emergencyContact = emergencyContact;

    const previousStatus = member.status;
    // Restricted Admin-only fields
    if (isViewerAdmin) {
      if (additionalRemarks !== undefined) member.additionalRemarks = additionalRemarks;
      if (status !== undefined && !['active', 'inactive'].includes(status)) {
        return res.status(400).json({ success: false, message: 'Invalid member status' });
      }
      if (status !== undefined) {
        member.status = status;
      }
    }

    await member.save();
    if (isViewerAdmin && status !== undefined && status !== previousStatus && member.user) {
      try {
        const linkedUser = await User.findByIdAndUpdate(member.user, { status }, { new: true });
        if (!linkedUser) {
          member.status = previousStatus;
          await member.save();
          return res.status(409).json({ success: false, message: 'Member login account is missing; status was not changed' });
        }
      } catch (error) {
        member.status = previousStatus;
        await member.save().catch((rollbackError) => console.error('[Member Status Rollback Error]', rollbackError.name || 'Error'));
        throw error;
      }
    }

    res.json({
      success: true,
      message: 'Member profile updated successfully',
      member,
    });
  } catch (error) {
    sendControllerError(res, error, 'Server error updating member profile');
  }
};

// @desc    Toggle member status (Active / Inactive)
// @route   PATCH /api/members/:id/status
// @access  Private (Admin only)
const updateMemberStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!['active', 'inactive'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value' });
    }

    const member = await Member.findById(req.params.id);
    if (!member) {
      return res.status(404).json({ success: false, message: 'Member profile not found' });
    }

    const previousStatus = member.status;
    let linkedUserUpdated = false;
    if (member.user) {
      const linkedUser = await User.findByIdAndUpdate(member.user, { status }, { new: true });
      if (!linkedUser) return res.status(409).json({ success: false, message: 'Member login account is missing; status was not changed' });
      linkedUserUpdated = true;
    }
    member.status = status;
    try {
      await member.save();
    } catch (error) {
      if (linkedUserUpdated) await User.findByIdAndUpdate(member.user, { status: previousStatus }).catch((rollbackError) => console.error('[User Status Rollback Error]', rollbackError.name || 'Error'));
      throw error;
    }

    res.json({
      success: true,
      message: `Member status set to ${status}`,
      member,
    });
  } catch (error) {
    sendControllerError(res, error, 'Server error updating member status');
  }
};

const deleteMember = async (req, res) => {
  try {
    const member = await Member.findById(req.params.id);
    if (!member) return res.status(404).json({ success: false, message: 'Member profile not found' });
    if (req.user.memberProfile?._id?.toString() === member._id.toString()) {
      return res.status(409).json({ success: false, message: 'You cannot delete your own member profile' });
    }

    const linkedUser = member.user ? await User.findById(member.user).select('+passwordHash +tokenVersion') : null;
    if (linkedUser?.role === 'admin' && await User.countDocuments({ role: 'admin', status: 'active' }) <= 1) {
      return res.status(409).json({ success: false, message: 'The last active administrator cannot be deleted' });
    }

    const filter = { member: member._id };
    const memberSnapshot = member.toObject({ depopulate: true });
    const userSnapshot = linkedUser?.toObject({ depopulate: true });
    const attendanceSnapshots = await Attendance.find(filter).lean();

    try {
      const session = await mongoose.startSession();
      try {
        await session.withTransaction(async () => {
          await Attendance.deleteMany(filter, { session });
          if (linkedUser) await User.deleteOne({ _id: linkedUser._id }, { session });
          await Member.deleteOne({ _id: member._id }, { session });
        });
        return res.json({ success: true, message: 'Member profile and related account and attendance records deleted' });
      } catch (error) {
        if (!isUnsupportedTransaction(error)) throw error;
      } finally {
        await session.endSession();
      }
    } catch (error) {
      if (!isUnsupportedTransaction(error)) throw error;
    }

    try {
      await Attendance.deleteMany(filter);
      if (linkedUser) await User.deleteOne({ _id: linkedUser._id });
      await Member.deleteOne({ _id: member._id });
    } catch (error) {
      const rollbackErrors = [];
      try { await Member.collection.replaceOne({ _id: memberSnapshot._id }, memberSnapshot, { upsert: true }); } catch (rollbackError) { rollbackErrors.push(rollbackError.name); }
      if (userSnapshot) {
        try { await User.collection.replaceOne({ _id: userSnapshot._id }, userSnapshot, { upsert: true }); } catch (rollbackError) { rollbackErrors.push(rollbackError.name); }
      }
      for (const record of attendanceSnapshots) {
        try { await Attendance.collection.replaceOne({ _id: record._id }, record, { upsert: true }); } catch (rollbackError) { rollbackErrors.push(rollbackError.name); }
      }
      if (rollbackErrors.length) console.error('[Member Delete Rollback Error]', rollbackErrors.join(','));
      throw error;
    }

    return res.json({ success: true, message: 'Member profile and related account and attendance records deleted' });
  } catch (error) {
    sendControllerError(res, error, 'Server error deleting member profile');
  }
};

const resetMemberPassword = async (req, res) => {
  try {
    const { password } = req.body;
    if (typeof password !== 'string' || password.length < 12 || Buffer.byteLength(password, 'utf8') > 72) {
      return res.status(400).json({ success: false, message: 'Password must be at least 12 characters and no more than 72 bytes' });
    }
    const member = await Member.findById(req.params.id).select('user');
    if (!member) return res.status(404).json({ success: false, message: 'Member profile not found' });
    if (!member.user) return res.status(409).json({ success: false, message: 'Member login account is not configured' });
    const user = await User.findById(member.user).select('+passwordHash +tokenVersion');
    if (!user) return res.status(409).json({ success: false, message: 'Member login account is not configured' });
    user.passwordHash = await bcrypt.hash(password, 10);
    user.tokenVersion = (user.tokenVersion || 0) + 1;
    await user.save();
    return res.json({ success: true, message: 'Member password reset successfully' });
  } catch (error) {
    return sendControllerError(res, error, 'Server error resetting member password');
  }
};

// @desc    Get member attendance history & statistics
// @route   GET /api/members/:id/attendance
// @access  Private (Admin or Self)
const getMemberAttendance = async (req, res) => {
  try {
    const memberId = req.params.id;
    const member = await Member.findById(memberId).select('_id');
    if (!member) return res.status(404).json({ success: false, message: 'Member profile not found' });
    const ownMemberId = req.user.memberProfile?._id?.toString();
    if (req.user.role !== 'admin' && ownMemberId !== memberId) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this member attendance' });
    }

    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit, 10) || 50));
    const [attendanceRecords, counts] = await Promise.all([
      Attendance.find({ member: memberId }).populate('event', 'name date startTime endTime venue status').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
      Attendance.aggregate([{ $match: { member: member._id } }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
    ]);
    const countByStatus = Object.fromEntries(counts.map((item) => [item._id, item.count]));
    const presentCount = countByStatus.present || 0;
    const absentCount = countByStatus.absent || 0;
    const totalMarked = presentCount + absentCount;
    const attendancePercentage = totalMarked > 0 ? ((presentCount / totalMarked) * 100).toFixed(1) : 0;

    res.json({
      success: true,
      summary: {
        totalMarked,
        presentCount,
        absentCount,
        attendancePercentage: Number(attendancePercentage),
        totalRecords: totalMarked,
      },
      pagination: { page, limit, total: totalMarked, pages: Math.ceil(totalMarked / limit) },
      records: attendanceRecords,
    });
  } catch (error) {
    sendControllerError(res, error, 'Server error fetching member attendance history');
  }
};

module.exports = {
  getMembers,
  getMemberById,
  createMember,
  updateMember,
  updateMemberStatus,
  resetMemberPassword,
  deleteMember,
  getMemberAttendance,
};

function isUnsupportedTransaction(error) {
  return [20, 303].includes(error?.code) || /transaction numbers are only allowed|does not support transactions/i.test(error?.message || '');
}
