const express = require('express');
const router = express.Router();
const { login, getMe, changePassword } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const loginAttempts = new Map();
const loginRateLimit = (req, res, next) => {
  const key = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const entry = loginAttempts.get(key);
  if (!entry || now >= entry.resetAt) {
    if (loginAttempts.size > 10000) {
      for (const [address, attempt] of loginAttempts) {
        if (now >= attempt.resetAt) loginAttempts.delete(address);
      }
    }
    loginAttempts.set(key, { count: 1, resetAt: now + 15 * 60 * 1000 });
    return next();
  }
  if (entry.count >= 10) {
    res.set('Retry-After', String(Math.ceil((entry.resetAt - now) / 1000)));
    return res.status(429).json({ success: false, message: 'Too many sign-in attempts. Please try again later.' });
  }
  entry.count += 1;
  return next();
};

router.post('/login', loginRateLimit, login);
router.get('/me', protect, getMe);
router.post('/change-password', protect, changePassword);

module.exports = router;
