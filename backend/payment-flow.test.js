const test = require('node:test');
const assert = require('node:assert/strict');
const {
  getSuccessfulEnrollmentStatus,
  getApprovedEnrollmentStatus,
  normalizeCurrency,
  getCourseAmountMinor,
  hasApprovedCourseAccess,
} = require('./server.js');

test('successful payment lands in pending approval status instead of immediate approval', () => {
  assert.equal(getSuccessfulEnrollmentStatus(), 'paid_pending_approval');
  assert.notEqual(getSuccessfulEnrollmentStatus(), 'approved');
});

test('admin approval marks the enrollment as approved', () => {
  assert.equal(getApprovedEnrollmentStatus(), 'approved');
  assert.notEqual(getApprovedEnrollmentStatus(), 'paid_pending_approval');
});

test('course amount and currency normalization remain stable', () => {
  assert.equal(normalizeCurrency('usd'), 'USD');
  assert.equal(getCourseAmountMinor({ price: 2500 }), 250000);
});

test('only approved enrollments grant course access', () => {
  assert.equal(hasApprovedCourseAccess({
    courseId: 'course-1',
    courseSlug: 'course-one',
    enrollmentStatus: 'approved',
    paid: true,
    userEnrolledCourses: [],
  }), true);

  assert.equal(hasApprovedCourseAccess({
    courseId: 'course-1',
    courseSlug: 'course-one',
    enrollmentStatus: 'paid_pending_approval',
    paid: true,
    userEnrolledCourses: [],
  }), false);

  assert.equal(hasApprovedCourseAccess({
    courseId: 'course-1',
    courseSlug: 'course-one',
    enrollmentStatus: 'pending_payment',
    paid: false,
    userEnrolledCourses: ['course-1'],
  }), true);
});
