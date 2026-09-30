const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes - Verify JWT token
const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization) {
    let decoded;
    try {
      const match = /^Bearer\s+(\S+)$/i.exec(req.headers.authorization);
      if (!match) throw new Error('Malformed authorization header');
      token = match[1];
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      return res.status(401).json({ success: false, message: 'Not authorized, token invalid or expired' });
    }

    try {
      req.user = await User.findById(decoded.id).select('+tokenVersion').populate('memberProfile');
      if (!req.user) return res.status(401).json({ success: false, message: 'User account not found' });
      if ((decoded.tokenVersion || 0) !== (req.user.tokenVersion || 0)) {
        return res.status(401).json({ success: false, message: 'Session expired after a credential change. Please sign in again.' });
      }
      if (req.user.status === 'inactive') return res.status(403).json({ success: false, message: 'User account has been deactivated' });
      return next();
    } catch (error) {
      console.error('[Auth Lookup Error]', error.name || 'Error');
      return res.status(500).json({ success: false, message: 'Unable to verify authenticated user' });
    }
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token provided' });
  }
};

// Restrict access by user role (e.g. authorize('admin'))
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role '${req.user ? req.user.role : 'guest'}' is not authorized to access this route`,
      });
    }
    next();
  };
};

module.exports = { protect, authorize };
