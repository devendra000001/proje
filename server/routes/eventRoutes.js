const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/eventController');
const { protect, authorize } = require('../middleware/authMiddleware');
const mongoose = require('mongoose');

router.use(protect);
router.param('id', (req, res, next, id) => mongoose.isValidObjectId(id)
  ? next()
  : res.status(400).json({ success: false, message: 'Invalid event ID' }));
router.param('memberId', (req, res, next, id) => mongoose.isValidObjectId(id)
  ? next()
  : res.status(400).json({ success: false, message: 'Invalid member ID' }));

router
  .route('/')
  .get(getEvents)
  .post(authorize('admin'), createEvent);

router
  .route('/:id')
  .get(getEventById)
  .put(authorize('admin'), updateEvent)
  .delete(authorize('admin'), deleteEvent);

router.patch('/:id/status', authorize('admin'), updateEventStatus);
router.get('/:id/attendance', authorize('admin'), getEventAttendance);
router.put('/:id/attendance/:memberId', authorize('admin'), setEventAttendance);
router.delete('/:id/attendance/:memberId', authorize('admin'), clearEventAttendance);
router.put('/:id/remark', authorize('admin'), saveEventRemark);

module.exports = router;
