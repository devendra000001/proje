const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Member = require('../models/Member');
const sendControllerError = require('../utils/sendControllerError');

// Helper: Generate JWT Token
const generateToken = (id, role, tokenVersion = 0) => {
  return jwt.sign(
    { id, role, tokenVersion },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '12h' }
  );
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (typeof username !== 'string' || typeof password !== 'string' || !username.trim() || !password) {
      return res.status(400).json({ success: false, message: 'Please provide username and password' });
    }
    const normalizedUsername = username.trim().toLowerCase();
    if (normalizedUsername.length < 3 || normalizedUsername.length > 50 || !/^[a-z0-9._-]+$/.test(normalizedUsername)) return res.status(401).json({ success: false, message: 'Invalid username or password.' });

    // Find user & explicitly select passwordHash
    const user = await User.findOne({ username: normalizedUsername })
      .select('+passwordHash +tokenVersion')
      .populate('memberProfile');

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid username or password.' });
    }

    if (user.status === 'inactive') {
      return res.status(401).json({ success: false, message: 'Invalid username or password.' });
    }

    // Check password match
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid username or password.' });
    }

    // Update last login timestamp
    user.lastLogin = new Date();
    await user.save();

    const token = generateToken(user._id, user.role, user.tokenVersion || 0);

    res.json({
      success: true,
      token,
      user: {
        _id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role,
        status: user.status,
        memberProfile: user.memberProfile,
      },
    });
  } catch (error) {
    sendControllerError(res, error, 'Server error during login');
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('memberProfile');
    res.json({
      success: true,
      user: user ? {
        _id: user._id, name: user.name, username: user.username, email: user.email, role: user.role, status: user.status,
        memberProfile: user.memberProfile,
      } : null,
    });
  } catch (error) {
    sendControllerError(res, error, 'Server error fetching user profile');
  }
};

// @desc    Change user password
// @route   POST /api/auth/change-password
// @access  Private
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (typeof currentPassword !== 'string' || typeof newPassword !== 'string' || !currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Please provide current and new password' });
    }
    if (typeof newPassword !== 'string' || newPassword.length < 12 || Buffer.byteLength(newPassword, 'utf8') > 72) {
      return res.status(400).json({ success: false, message: 'New password must be at least 12 characters and no more than 72 bytes' });
    }

    const user = await User.findById(req.user._id).select('+passwordHash +tokenVersion');
    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);

    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password does not match' });
    }

    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(newPassword, salt);
    user.tokenVersion = (user.tokenVersion || 0) + 1;
    await user.save();

    res.json({ success: true, message: 'Password updated successfully', token: generateToken(user._id, user.role, user.tokenVersion) });
  } catch (error) {
    sendControllerError(res, error, 'Server error changing password');
  }
};

module.exports = {
  login,
  getMe,
  changePassword,
};
