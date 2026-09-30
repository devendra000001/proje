const test = require('node:test');
const assert = require('node:assert/strict');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Member = require('../models/Member');
const User = require('../models/User');
const Event = require('../models/Event');
const Attendance = require('../models/Attendance');
const EventRemark = require('../models/EventRemark');
const { getMembers, getMemberAttendance, createMember, deleteMember } = require('../controllers/memberController');
const { getEventAttendance, setEventAttendance, clearEventAttendance, saveEventRemark } = require('../controllers/eventController');
const { getDashboardStats } = require('../controllers/dashboardController');
const { login, changePassword } = require('../controllers/authController');
const { protect, authorize } = require('../middleware/authMiddleware');

process.env.JWT_SECRET ||= 'unit-test-only-secret-with-more-than-32-characters';

const ids = {
  member: '0123456789abcdef01234567',
  otherMember: '1123456789abcdef01234567',
  event: '2123456789abcdef01234567',
  user: '3123456789abcdef01234567',
};

const response = () => {
  const result = {};
  return {
    result,
    status(code) { result.status = code; return this; },
    json(body) { result.body = body; return this; },
  };
};

const selectQuery = (value) => ({ select: async () => value });

test('member attendance is visible only to its owner or an administrator', async (t) => {
  t.mock.method(Member, 'findById', (id) => selectQuery({ _id: id }));
  t.mock.method(Attendance, 'aggregate', async () => [{ _id: 'present', count: 3 }, { _id: 'absent', count: 1 }]);
  t.mock.method(Attendance, 'find', () => ({
    populate() { return this; }, sort() { return this; }, skip() { return this; }, limit: async () => [],
  }));
  const own = response();
  await getMemberAttendance({ params: { id: ids.member }, query: {}, user: { role: 'member', memberProfile: { _id: ids.member } } }, own);
  assert.equal(own.result.status || 200, 200);
  assert.equal(own.result.body.summary.attendancePercentage, 75);

  const denied = response();
  await getMemberAttendance({ params: { id: ids.otherMember }, query: {}, user: { role: 'member', memberProfile: { _id: ids.member } } }, denied);
  assert.equal(denied.result.status, 403);

  const admin = response();
  await getMemberAttendance({ params: { id: ids.otherMember }, query: {}, user: { role: 'admin' } }, admin);
  assert.equal(admin.result.status || 200, 200);
});

test('missing member attendance returns 404; inactive member directory is admin-only', async (t) => {
  t.mock.method(Member, 'findById', () => selectQuery(null));
  const missing = response();
  await getMemberAttendance({ params: { id: ids.member }, query: {}, user: { role: 'admin' } }, missing);
  assert.equal(missing.result.status, 404);

  const directory = response();
  await getMembers({ query: { status: 'inactive' }, user: { role: 'member' } }, directory);
  assert.equal(directory.result.status, 403);
});

test('member deletion protects the current profile and the last active administrator', async (t) => {
  const selfMember = { _id: ids.member, user: ids.user };
  t.mock.method(Member, 'findById', async () => selfMember);
  const self = response();
  await deleteMember({ params: { id: ids.member }, user: { role: 'admin', memberProfile: { _id: ids.member } } }, self);
  assert.equal(self.result.status, 409);

  t.mock.method(User, 'findById', () => ({ select: async () => ({ _id: ids.user, role: 'admin' }) }));
  t.mock.method(User, 'countDocuments', async () => 1);
  const lastAdmin = response();
  await deleteMember({ params: { id: ids.member }, user: { role: 'admin', memberProfile: { _id: ids.otherMember } } }, lastAdmin);
  assert.equal(lastAdmin.result.status, 409);
});

test('member creation rolls back its profile when a duplicate account wins the race', async (t) => {
  const profile = { _id: ids.member, async save() { return this; } };
  let profileRemoved = false;
  let lookup;
  t.mock.method(User, 'findOne', async (query) => { lookup = query; return null; });
  t.mock.method(Member, 'create', async () => profile);
  t.mock.method(User, 'create', async () => { throw Object.assign(new Error('duplicate'), { code: 11000 }); });
  t.mock.method(Member, 'deleteOne', async (filter) => { profileRemoved = filter._id === ids.member; });
  const result = response();
  await createMember({
    body: {
      fullName: 'New Member', username: 'NewMember', password: 'long-initial-password',
      branch: 'CSE', academicYear: '1st Year', joiningYear: new Date().getFullYear(),
    },
  }, result);
  assert.equal(result.result.status, 409);
  assert.deepEqual(lookup, { username: 'newmember' });
  assert.equal(profileRemoved, true);
});

test('attendance writes upsert marks and clear without removing a member or event', async (t) => {
  t.mock.method(Event, 'findById', () => selectQuery({ _id: ids.event }));
  t.mock.method(Member, 'findById', () => selectQuery({ _id: ids.member }));
  let update;
  t.mock.method(Attendance, 'findOneAndUpdate', async (...args) => { update = args; return { status: 'present' }; });
  const marked = response();
  await setEventAttendance({ params: { id: ids.event, memberId: ids.member }, body: { status: 'present' }, user: { _id: ids.user } }, marked);
  assert.equal(marked.result.status || 200, 200);
  assert.equal(update[0].event, ids.event);
  assert.equal(update[1].$set.status, 'present');
  assert.equal(update[1].$set.markedBy, ids.user);

  t.mock.method(Attendance, 'findOneAndDelete', async () => ({ _id: 'attendance-id' }));
  const cleared = response();
  await clearEventAttendance({ params: { id: ids.event, memberId: ids.member } }, cleared);
  assert.equal(cleared.result.status || 200, 200);
});

test('event attendance and reports return 404/400/409 for missing or invalid state', async (t) => {
  t.mock.method(Event, 'findById', () => selectQuery(null));
  const missingAttendance = response();
  await getEventAttendance({ params: { id: ids.event }, query: {} }, missingAttendance);
  assert.equal(missingAttendance.result.status, 404);

  const missingReport = response();
  await saveEventRemark({ params: { id: ids.event }, body: {} }, missingReport);
  assert.equal(missingReport.result.status, 404);

  t.mock.method(Event, 'findById', () => selectQuery({ _id: ids.event, status: 'upcoming' }));
  const wrongLifecycle = response();
  await saveEventRemark({ params: { id: ids.event }, body: { overallRemark: 'Not completed' } }, wrongLifecycle);
  assert.equal(wrongLifecycle.result.status, 409);
});

test('completed event report derives attendance totals from stored marks', async (t) => {
  t.mock.method(Event, 'findById', () => selectQuery({ _id: ids.event, status: 'completed' }));
  t.mock.method(Attendance, 'countDocuments', async (query) => query.status === 'present' ? 4 : 2);
  let update;
  t.mock.method(EventRemark, 'findOneAndUpdate', (...args) => {
    update = args;
    return { populate: async () => ({ overallRemark: args[1].$set.overallRemark }) };
  });
  const result = response();
  await saveEventRemark({ params: { id: ids.event }, body: { overallRemark: 'Good', whatWentWell: '', whatCouldBeImproved: '', suggestionsNextTime: '' }, user: { _id: ids.user } }, result);
  assert.equal(result.result.status || 200, 200);
  assert.equal(update[1].$set.totalPresentCount, 4);
  assert.equal(update[1].$set.totalAbsentCount, 2);
  assert.equal(update[1].$set.recordedBy, ids.user);
});

test('dashboard returns database counts and zero-safe attendance aggregates', async (t) => {
  t.mock.method(Member, 'countDocuments', async (query) => query?.status === 'active' ? 2 : query?.status === 'inactive' ? 1 : 3);
  t.mock.method(Event, 'countDocuments', async (query) => query.status === 'upcoming' ? 5 : 2);
  t.mock.method(Event, 'find', () => ({ sort() { return this; }, limit: async () => [] }));
  t.mock.method(EventRemark, 'find', () => ({ sort() { return this; }, limit() { return this; }, populate: async () => [] }));
  t.mock.method(Attendance, 'aggregate', async () => []);
  const result = response();
  await getDashboardStats({}, result);
  assert.deepEqual(result.result.body.stats, {
    totalMembers: 3, activeMembers: 2, inactiveMembers: 1,
    upcomingEvents: 5, completedEvents: 2, attendancePresent: 0, attendanceAbsent: 0,
  });
});

test('login validates empty credentials and returns 401 for unknown accounts', async (t) => {
  const empty = response();
  await login({ body: {} }, empty);
  assert.equal(empty.result.status, 400);

  const legacyPayload = response();
  await login({ body: { email: 'unknown@example.test', password: 'long-enough-password' } }, legacyPayload);
  assert.equal(legacyPayload.result.status, 400);

  let lookup;
  t.mock.method(User, 'findOne', (query) => { lookup = query; return { select() { return this; }, populate: async () => null }; });
  const invalid = response();
  await login({ body: { username: '  UnknownUser  ', password: 'long-enough-password' } }, invalid);
  assert.equal(invalid.result.status, 401);
  assert.equal(invalid.result.body.message, 'Invalid username or password.');
  assert.deepEqual(lookup, { username: 'unknownuser' });
});

test('reset script refuses to run without the explicit confirmation flag', () => {
  const { spawnSync } = require('node:child_process');
  const path = require('node:path');
  const result = spawnSync(process.execPath, [path.join(__dirname, '..', 'scripts', 'resetDatabase.js')], { encoding: 'utf8' });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /--confirm/);
});

test('password changes enforce length, rotate token version, and issue a replacement session', async (t) => {
  const tooShort = response();
  await changePassword({ body: { currentPassword: 'old-password', newPassword: 'short' }, user: { _id: ids.user } }, tooShort);
  assert.equal(tooShort.result.status, 400);

  const passwordHash = await bcrypt.hash('old-password', 4);
  const user = {
    _id: ids.user, role: 'member', tokenVersion: 2, passwordHash,
    async save() { return this; },
  };
  t.mock.method(User, 'findById', () => ({ select: async () => user }));
  const changed = response();
  await changePassword({ body: { currentPassword: 'old-password', newPassword: 'a-new-password-long-enough' }, user: { _id: ids.user } }, changed);
  assert.equal(changed.result.status || 200, 200);
  assert.equal(user.tokenVersion, 3);
  assert.equal(jwt.verify(changed.result.body.token, process.env.JWT_SECRET).tokenVersion, 3);
});

test('protection rejects missing and stale tokens; role guard denies member writes', async (t) => {
  const missing = response();
  await protect({ headers: {} }, missing, () => assert.fail('missing token must not continue'));
  assert.equal(missing.result.status, 401);

  const memberUser = { _id: ids.user, role: 'member', status: 'active', tokenVersion: 4 };
  t.mock.method(User, 'findById', () => ({ select() { return this; }, populate: async () => memberUser }));
  const staleToken = jwt.sign({ id: ids.user, role: 'member', tokenVersion: 3 }, process.env.JWT_SECRET);
  const stale = response();
  await protect({ headers: { authorization: `Bearer ${staleToken}` } }, stale, () => assert.fail('stale token must not continue'));
  assert.equal(stale.result.status, 401);

  const denied = response();
  authorize('admin')({ user: memberUser }, denied, () => assert.fail('member must not pass admin guard'));
  assert.equal(denied.result.status, 403);
});
