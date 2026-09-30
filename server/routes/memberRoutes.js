const express = require('express');
const router = express.Router();
const {
  getMembers,
  getMemberById,
  createMember,
  updateMember,
  updateMemberStatus,
  resetMemberPassword,
  deleteMember,
  getMemberAttendance,
} = require('../controllers/memberController');
const { protect, authorize } = require('../middleware/authMiddleware');
const mongoose = require('mongoose');

// All member routes require authenticated session
router.use(protect);
router.param('id', (req, res, next, id) => mongoose.isValidObjectId(id)
  ? next()
  : res.status(400).json({ success: false, message: 'Invalid member ID' }));

router
  .route('/')
  .get(getMembers)
  .post(authorize('admin'), createMember);

router
  .route('/:id')
  .get(getMemberById)
  .put(updateMember);

router.patch('/:id/status', authorize('admin'), updateMemberStatus);
router.patch('/:id/password', authorize('admin'), resetMemberPassword);
router.delete('/:id', authorize('admin'), deleteMember);
router.get('/:id/attendance', getMemberAttendance);

module.exports = router;
