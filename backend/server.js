const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const dotenv = require('dotenv');
const cloudinary = require('cloudinary').v2;
const { connectDB } = require('./config/db');
const User = require('./models/User');
const Lead = require('./models/Lead');
const Course = require('./models/Course');
const Enrollment = require('./models/Enrollment');

dotenv.config();

if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

const app = express();
const port = process.env.PORT || 5000;
let databaseReady = false;

app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
);
app.use(express.json({
  verify: (req, res, buffer) => {
    req.rawBody = buffer;
  },
}));

const leads = [];
const enrollments = [];
const users = [];

const defaultCourses = [
  {
    id: 'sabre-core',
    slug: 'sabre-core',
    title: 'Sabre Core Ticketing',
    duration: '4 weeks',
    price: 45000,
    currency: 'NGN',
    level: 'Beginner',
    status: 'published',
    featured: false,
    description: 'Learn the fundamentals of GDS ticketing, PNR creation, and fare handling.',
    lessons: [
      { id: 'lesson-1', title: 'Intro to GDS and Sabre workflow', type: 'video' },
      { id: 'lesson-2', title: 'PNR creation and passenger data', type: 'guide' },
      { id: 'lesson-3', title: 'Ticketing essentials and issuance', type: 'quiz' },
    ],
  },
  {
    id: 'agency-ready',
    slug: 'agency-ready',
    title: 'Agency Ready Bootcamp',
    duration: '6 weeks',
    price: 75000,
    currency: 'NGN',
    level: 'Advanced',
    status: 'published',
    featured: true,
    description: 'A practical career pathway for students who want real booking and support workflows.',
    lessons: [
      { id: 'lesson-4', title: 'Advanced itinerary building', type: 'video' },
      { id: 'lesson-5', title: 'Fare rules and amendments', type: 'guide' },
      { id: 'lesson-6', title: 'Real-world agency simulation', type: 'quiz' },
    ],
  },
];

const courses = defaultCourses;

const issueToken = (user) =>
  jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

const sanitizeUser = (user) => {
  const plainUser = user && user.toObject ? user.toObject() : user;

  return {
    id: plainUser.id || plainUser._id?.toString(),
    fullName: plainUser.fullName,
    email: plainUser.email,
    phone: plainUser.phone,
    institution: plainUser.institution,
    role: plainUser.role,
    enrolledCourses: plainUser.enrolledCourses || [],
    paymentStatus: plainUser.paymentStatus || false,
  };
};

const findUserByEmail = (email) =>
  users.find((user) => user.email.toLowerCase() === String(email || '').toLowerCase());

const findUserById = (id) => users.find((user) => user.id === id);

const normalizeCurrency = (currency) => String(currency || '').trim().toUpperCase();

const getCourseAmountMinor = (course) => Math.round(Number(course.price) * 100);

const buildUserPayload = async (userDocument) => {
  if (!userDocument) return null;

  if (databaseReady && userDocument.toObject) {
    return sanitizeUser(userDocument);
  }

  return sanitizeUser(userDocument);
};

const requireAuth = (req, res, next) => {
  if (!process.env.JWT_SECRET) {
    return res.status(503).json({ message: 'JWT authentication is not configured on the server.' });
  }

  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authentication required.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }
};

const requireAdmin = (req, res, next) => {
  if (!['admin', 'super_admin'].includes(req.user.role)) {
    return res.status(403).json({ message: 'Admin access required.' });
  }

  next();
};

const requireSuperAdmin = (req, res, next) => {
  if (req.user.role !== 'super_admin') {
    return res.status(403).json({ message: 'Super admin access required.' });
  }

  next();
};

app.get('/health', (req, res) => {
  res.json({ ok: true, message: 'GDS Ticketing API is running.' });
});

app.post('/api/v1/auth/register', async (req, res) => {
  const { fullName, email, password, phone, institution } = req.body;

  if (!fullName || !email || !password) {
    return res.status(400).json({ message: 'fullName, email, and password are required.' });
  }

  if (databaseReady) {
    const existingUser = await User.findOne({ email: String(email).toLowerCase() });

    if (existingUser) {
      return res.status(409).json({ message: 'A user with this email already exists.' });
    }

    const user = await User.create({
      fullName,
      email: String(email).toLowerCase(),
      phone: phone || '',
      institution: institution || '',
      role: 'student',
      passwordHash: await bcrypt.hash(password, 10),
      enrolledCourses: [],
      paymentStatus: false,
    });

    const token = issueToken({ id: user._id.toString(), email: user.email, role: user.role });

    return res.status(201).json({
      token,
      user: sanitizeUser(user),
    });
  }

  if (findUserByEmail(email)) {
    return res.status(409).json({ message: 'A user with this email already exists.' });
  }

  const user = {
    id: `user-${Date.now()}`,
    fullName,
    email,
    phone: phone || '',
    institution: institution || '',
    role: 'student',
    passwordHash: await bcrypt.hash(password, 10),
    enrolledCourses: [],
    paymentStatus: false,
    createdAt: new Date().toISOString(),
  };

  users.push(user);

  const token = issueToken(user);

  return res.status(201).json({
    token,
    user: sanitizeUser(user),
  });
});

app.post('/api/v1/auth/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  if (databaseReady) {
    const user = await User.findOne({ email: String(email).toLowerCase() });

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);

    if (!passwordMatches) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    const token = issueToken({ id: user._id.toString(), email: user.email, role: user.role });

    return res.json({
      token,
      user: sanitizeUser(user),
    });
  }

  const user = findUserByEmail(email);

  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials.' });
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);

  if (!passwordMatches) {
    return res.status(401).json({ message: 'Invalid credentials.' });
  }

  const token = issueToken(user);

  return res.json({
    token,
    user: sanitizeUser(user),
  });
});

app.get('/api/v1/admin/users', requireAuth, requireSuperAdmin, async (req, res) => {
  if (databaseReady) {
    const records = await User.find({}).sort({ createdAt: -1 });
    return res.json({ users: records.map((user) => sanitizeUser(user)) });
  }

  return res.json({ users: users.map((user) => sanitizeUser(user)) });
});

app.patch('/api/v1/admin/users/:userId/role', requireAuth, requireSuperAdmin, async (req, res) => {
  const { role } = req.body || {};

  if (!['student', 'admin'].includes(role)) {
    return res.status(400).json({ message: 'Role must be student or admin.' });
  }

  if (databaseReady) {
    const user = await User.findById(req.params.userId);

    if (!user) {
      return res.status(404).json({ message: 'User could not be found.' });
    }

    user.role = role;
    await user.save();
    return res.json({ user: sanitizeUser(user) });
  }

  const user = findUserById(req.params.userId);

  if (!user) {
    return res.status(404).json({ message: 'User could not be found.' });
  }

  user.role = role;
  return res.json({ user: sanitizeUser(user) });
});

app.delete('/api/v1/admin/users/:userId', requireAuth, requireSuperAdmin, async (req, res) => {
  if (req.params.userId === req.user.id) {
    return res.status(400).json({ message: 'The active super admin account cannot be deleted.' });
  }

  if (databaseReady) {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ message: 'User could not be found.' });
    if (user.role === 'super_admin') return res.status(403).json({ message: 'A super admin account cannot be deleted.' });

    await Enrollment.deleteMany({ userId: req.params.userId });
    await User.deleteOne({ _id: req.params.userId });
    return res.json({ message: 'User and enrollment records deleted.' });
  }

  const userIndex = users.findIndex((user) => user.id === req.params.userId);
  if (userIndex === -1) return res.status(404).json({ message: 'User could not be found.' });
  if (users[userIndex].role === 'super_admin') return res.status(403).json({ message: 'A super admin account cannot be deleted.' });

  enrollments.splice(
    0,
    enrollments.length,
    ...enrollments.filter((enrollment) => enrollment.userId !== req.params.userId)
  );
  users.splice(userIndex, 1);
  return res.json({ message: 'User and enrollment records deleted.' });
});

app.post('/api/v1/admin/uploads/signature', requireAuth, requireAdmin, (req, res) => {
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    return res.status(503).json({ message: 'Cloudinary is not configured on the server.' });
  }

  const folder = String(req.body?.folder || 'gds-ticketing/courses').replace(/[^a-zA-Z0-9/_-]/g, '');
  const timestamp = Math.round(Date.now() / 1000);
  const signature = cloudinary.utils.api_sign_request({ folder, timestamp }, process.env.CLOUDINARY_API_SECRET);

  return res.json({
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    folder,
    timestamp,
    signature,
  });
});

app.get('/api/v1/auth/me', requireAuth, async (req, res) => {
  if (databaseReady) {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'User could not be found.' });
    }

    return res.json({ user: sanitizeUser(user) });
  }

  const user = findUserById(req.user.id);

  if (!user) {
    return res.status(404).json({ message: 'User could not be found.' });
  }

  return res.json({ user: sanitizeUser(user) });
});

app.put('/api/v1/auth/profile', requireAuth, async (req, res) => {
  const user = users.find((item) => item.id === req.user.id);

  if (!user) {
    return res.status(404).json({ message: 'User could not be found.' });
  }

  const { fullName, phone, institution, password } = req.body;

  if (fullName) user.fullName = fullName;
  if (phone) user.phone = phone;
  if (institution) user.institution = institution;

  if (password) {
    user.passwordHash = await bcrypt.hash(password, 10);
  }

  return res.json({ user: sanitizeUser(user) });
});

app.post('/api/v1/leads/capture', async (req, res) => {
  const { fullName, email, phone, schoolDept, institution, source } = req.body;

  if (!fullName || !email || !phone) {
    return res.status(400).json({ message: 'fullName, email, and phone are required.' });
  }

  if (databaseReady) {
    const lead = await Lead.create({
      fullName,
      email: String(email).toLowerCase(),
      phone,
      schoolDept: schoolDept || institution || '',
      source: source || 'Landing_Page',
      emailSentCount: 0,
    });

    return res.status(201).json({
      message: 'Lead captured successfully.',
      lead: {
        id: lead._id.toString(),
        fullName: lead.fullName,
        email: lead.email,
        phone: lead.phone,
        schoolDept: lead.schoolDept,
        source: lead.source,
        emailSentCount: lead.emailSentCount,
        createdAt: lead.createdAt,
      },
    });
  }

  const lead = {
    id: `lead-${Date.now()}`,
    fullName,
    email,
    phone,
    schoolDept: schoolDept || institution || '',
    source: source || 'Landing_Page',
    emailSentCount: 0,
    createdAt: new Date().toISOString(),
  };

  leads.push(lead);

  return res.status(201).json({
    message: 'Lead captured successfully.',
    lead,
  });
});

app.get('/api/v1/leads', requireAuth, requireAdmin, (req, res) => {
  const { institution, source } = req.query;

  let filteredLeads = [...leads];

  if (institution) {
    filteredLeads = filteredLeads.filter((lead) =>
      (lead.schoolDept || '').toLowerCase().includes(String(institution).toLowerCase())
    );
  }

  if (source) {
    filteredLeads = filteredLeads.filter((lead) => lead.source === source);
  }

  return res.json({
    total: filteredLeads.length,
    leads: filteredLeads,
  });
});

app.post('/api/v1/leads/trigger-outreach', requireAuth, requireAdmin, (req, res) => {
  const { leadIds } = req.body || {};

  const selectedLeads = leadIds?.length
    ? leads.filter((lead) => leadIds.includes(lead.id))
    : leads;

  selectedLeads.forEach((lead) => {
    lead.emailSentCount += 1;
  });

  return res.json({
    message: 'Outreach workflow triggered successfully.',
    triggered: selectedLeads.length,
    leads: selectedLeads,
  });
});

const normalizeCourseInput = (input) => ({
  slug: String(input.slug || input.title || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
  title: String(input.title || '').trim(),
  description: String(input.description || '').trim(),
  duration: String(input.duration || '').trim(),
  price: Number(input.price),
  currency: String(input.currency || 'NGN').trim().toUpperCase(),
  level: String(input.level || 'Beginner').trim(),
  status: ['draft', 'published', 'paused', 'archived'].includes(input.status) ? input.status : 'draft',
  featured: Boolean(input.featured),
  thumbnailUrl: String(input.thumbnailUrl || '').trim(),
  ...(Array.isArray(input.lessons) ? { lessons: input.lessons } : {}),
});

const validateCourseInput = (course) => {
  if (!course.slug || !course.title || !course.description || !Number.isFinite(course.price) || course.price < 0) {
    return 'title, description, and a valid non-negative price are required.';
  }

  return null;
};

const normalizeLessonInput = (input, fallbackOrder = 0) => ({
  title: String(input.title || '').trim(),
  type: ['video', 'guide', 'quiz'].includes(input.type) ? input.type : 'video',
  contentUrl: String(input.contentUrl || '').trim(),
  duration: String(input.duration || '').trim(),
  order: Number.isFinite(Number(input.order)) ? Number(input.order) : fallbackOrder,
  isPreview: Boolean(input.isPreview),
});

const validateLessonInput = (lesson) => {
  if (!lesson.title) return 'A lesson title is required.';
  return null;
};

app.get('/api/v1/admin/courses', requireAuth, requireAdmin, async (req, res) => {
  if (databaseReady) {
    const records = await Course.find({}).sort({ createdAt: -1 }).lean();
    return res.json({ courses: records.map((course) => ({ ...course, id: course._id.toString() })) });
  }

  return res.json({ courses });
});

app.post('/api/v1/admin/courses', requireAuth, requireAdmin, async (req, res) => {
  const courseInput = normalizeCourseInput(req.body || {});
  const validationError = validateCourseInput(courseInput);

  if (validationError) return res.status(400).json({ message: validationError });

  if (databaseReady) {
    const course = await Course.create({ ...courseInput, lessons: courseInput.lessons || [] });
    return res.status(201).json({ course: { ...course.toObject(), id: course._id.toString() } });
  }

  if (courses.some((course) => course.slug === courseInput.slug)) {
    return res.status(409).json({ message: 'A course with this slug already exists.' });
  }

  const course = { id: `course-${Date.now()}`, lessons: [], ...courseInput };
  courses.push(course);
  return res.status(201).json({ course });
});

app.put('/api/v1/admin/courses/:courseId', requireAuth, requireAdmin, async (req, res) => {
  const courseInput = normalizeCourseInput(req.body || {});
  const validationError = validateCourseInput(courseInput);

  if (validationError) return res.status(400).json({ message: validationError });

  if (databaseReady) {
    const course = await Course.findByIdAndUpdate(req.params.courseId, courseInput, { new: true, runValidators: true });

    if (!course) return res.status(404).json({ message: 'Course not found.' });
    return res.json({ course: { ...course.toObject(), id: course._id.toString() } });
  }

  const course = courses.find((item) => item.id === req.params.courseId);
  if (!course) return res.status(404).json({ message: 'Course not found.' });

  Object.assign(course, courseInput);
  return res.json({ course });
});

app.delete('/api/v1/admin/courses/:courseId', requireAuth, requireAdmin, async (req, res) => {
  if (databaseReady) {
    const course = await Course.findByIdAndUpdate(req.params.courseId, { status: 'archived' }, { new: true });
    if (!course) return res.status(404).json({ message: 'Course not found.' });
    return res.json({ course: { ...course.toObject(), id: course._id.toString() } });
  }

  const course = courses.find((item) => item.id === req.params.courseId);
  if (!course) return res.status(404).json({ message: 'Course not found.' });

  course.status = 'archived';
  return res.json({ course });
});

app.post('/api/v1/admin/courses/:courseId/lessons', requireAuth, requireAdmin, async (req, res) => {
  if (databaseReady) {
    const course = await Course.findById(req.params.courseId);
    if (!course) return res.status(404).json({ message: 'Course not found.' });

    const lesson = normalizeLessonInput(req.body || {}, course.lessons.length);
    const validationError = validateLessonInput(lesson);
    if (validationError) return res.status(400).json({ message: validationError });

    course.lessons.push(lesson);
    await course.save();
    return res.status(201).json({ lesson: course.lessons[course.lessons.length - 1] });
  }

  const course = courses.find((item) => item.id === req.params.courseId);
  if (!course) return res.status(404).json({ message: 'Course not found.' });

  const lesson = normalizeLessonInput(req.body || {}, course.lessons.length);
  const validationError = validateLessonInput(lesson);
  if (validationError) return res.status(400).json({ message: validationError });

  const storedLesson = { id: `lesson-${Date.now()}`, ...lesson };
  course.lessons.push(storedLesson);
  return res.status(201).json({ lesson: storedLesson });
});

app.put('/api/v1/admin/courses/:courseId/lessons/:lessonId', requireAuth, requireAdmin, async (req, res) => {
  if (databaseReady) {
    const course = await Course.findById(req.params.courseId);
    if (!course) return res.status(404).json({ message: 'Course not found.' });

    const lesson = course.lessons.id(req.params.lessonId);
    if (!lesson) return res.status(404).json({ message: 'Lesson not found.' });

    const nextLesson = normalizeLessonInput(req.body || {}, lesson.order);
    const validationError = validateLessonInput(nextLesson);
    if (validationError) return res.status(400).json({ message: validationError });

    Object.assign(lesson, nextLesson);
    await course.save();
    return res.json({ lesson });
  }

  const course = courses.find((item) => item.id === req.params.courseId);
  const lesson = course?.lessons.find((item) => item.id === req.params.lessonId);
  if (!course) return res.status(404).json({ message: 'Course not found.' });
  if (!lesson) return res.status(404).json({ message: 'Lesson not found.' });

  const nextLesson = normalizeLessonInput(req.body || {}, lesson.order);
  const validationError = validateLessonInput(nextLesson);
  if (validationError) return res.status(400).json({ message: validationError });

  Object.assign(lesson, nextLesson);
  return res.json({ lesson });
});

app.delete('/api/v1/admin/courses/:courseId/lessons/:lessonId', requireAuth, requireAdmin, async (req, res) => {
  if (databaseReady) {
    const course = await Course.findById(req.params.courseId);
    if (!course) return res.status(404).json({ message: 'Course not found.' });

    const lesson = course.lessons.id(req.params.lessonId);
    if (!lesson) return res.status(404).json({ message: 'Lesson not found.' });

    lesson.deleteOne();
    await course.save();
    return res.json({ message: 'Lesson deleted.' });
  }

  const course = courses.find((item) => item.id === req.params.courseId);
  if (!course) return res.status(404).json({ message: 'Course not found.' });

  const lessonIndex = course.lessons.findIndex((item) => item.id === req.params.lessonId);
  if (lessonIndex === -1) return res.status(404).json({ message: 'Lesson not found.' });

  course.lessons.splice(lessonIndex, 1);
  return res.json({ message: 'Lesson deleted.' });
});

app.get('/api/v1/courses', async (req, res) => {
  if (databaseReady) {
    const records = await Course.find({ status: 'published' }).lean();
    const payload = records.map((course) => ({
      id: course._id.toString(),
      slug: course.slug,
      title: course.title,
      description: course.description,
      duration: course.duration,
      price: course.price,
      currency: course.currency,
      level: course.level,
      status: course.status,
      featured: course.featured,
      thumbnailUrl: course.thumbnailUrl,
    }));

    return res.json({ courses: payload.length ? payload : defaultCourses });
  }

  return res.json({ courses: courses.filter((course) => course.status === 'published') });
});

app.get('/api/v1/courses/:courseId', async (req, res) => {
  if (databaseReady) {
    const course = await Course.findOne({
      status: 'published',
      $or: [{ _id: req.params.courseId }, { slug: req.params.courseId }],
    }).lean();

    if (!course) {
      return res.status(404).json({ message: 'Course not found.' });
    }

    return res.json({
      course: {
        id: course._id.toString(),
        slug: course.slug,
        title: course.title,
        description: course.description,
        duration: course.duration,
        price: course.price,
        currency: course.currency,
        level: course.level,
      },
    });
  }

  const course = courses.find(
    (item) => item.status === 'published' && (item.id === req.params.courseId || item.slug === req.params.courseId)
  );

  if (!course) {
    return res.status(404).json({ message: 'Course not found.' });
  }

  return res.json({ course });
});

app.get('/api/v1/courses/:courseId/lessons', requireAuth, async (req, res) => {
  if (databaseReady) {
    const user = await User.findById(req.user.id);
    const course = await Course.findOne({ $or: [{ _id: req.params.courseId }, { slug: req.params.courseId }] });

    if (!course) {
      return res.status(404).json({ message: 'Course not found.' });
    }

    const approvedEnrollment = await Enrollment.findOne({
      userId: req.user.id,
      courseId: course._id.toString(),
      status: 'approved',
      paid: true,
    });
    const hasAccess = user && (approvedEnrollment || user.enrolledCourses.includes(course._id.toString()) || user.enrolledCourses.includes(course.slug));

    if (!hasAccess) {
      return res.status(403).json({ message: 'Enrollment required to access this course.' });
    }

    return res.json({
      courseId: course._id.toString(),
      title: course.title,
      lessons: course.lessons,
    });
  }

  const user = users.find((item) => item.id === req.user.id);
  const course = courses.find((item) => item.id === req.params.courseId || item.slug === req.params.courseId);

  if (!course) {
    return res.status(404).json({ message: 'Course not found.' });
  }

  const approvedEnrollment = enrollments.find(
    (enrollment) => enrollment.userId === req.user.id && enrollment.courseId === course.id && enrollment.status === 'approved'
  );

  if (!user || (!approvedEnrollment && !user.enrolledCourses.includes(course.id))) {
    return res.status(403).json({ message: 'Enrollment required to access this course.' });
  }

  return res.json({
    courseId: course.id,
    title: course.title,
    lessons: course.lessons,
  });
});

app.post('/api/v1/payments/initialize', requireAuth, async (req, res) => {
  const { courseId } = req.body;

  let course;

  if (databaseReady) {
    course = await Course.findOne({ $or: [{ _id: courseId }, { slug: courseId }] });
  } else {
    course = courses.find((item) => item.id === courseId || item.slug === courseId);
  }

  if (!course) {
    return res.status(404).json({ message: 'Course not found.' });
  }

  if (!process.env.PAYSTACK_SECRET_KEY) {
    return res.status(503).json({ message: 'Paystack is not configured on the server.' });
  }

  const user = databaseReady ? await User.findById(req.user.id) : findUserById(req.user.id);
  if (!user) {
    return res.status(404).json({ message: 'Student account not found.' });
  }

  const storedCourseId = databaseReady ? course._id.toString() : course.id;
  const existingEnrollment = databaseReady
    ? await Enrollment.findOne({ userId: req.user.id, courseId: storedCourseId, status: { $in: ['pending_payment', 'paid_pending_approval', 'approved'] } })
    : enrollments.find((item) => item.userId === req.user.id && item.courseId === storedCourseId && ['pending_payment', 'paid_pending_approval', 'approved'].includes(item.status));

  if (existingEnrollment) {
    return res.status(409).json({ message: 'You already have an active enrollment for this course.' });
  }

  const reference = `GDS-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;

  if (databaseReady) {
    await Enrollment.create({
      userId: req.user.id,
      courseId: storedCourseId,
      paymentReference: reference,
      paymentProvider: 'paystack',
      status: 'pending_payment',
      paid: false,
    });
  } else {
    enrollments.push({
      id: `enrollment-${Date.now()}`,
      userId: req.user.id,
      courseId: course.id,
      paymentReference: reference,
      status: 'pending_payment',
      paid: false,
    });
  }

  const paystackResponse = await fetch('https://api.paystack.co/transaction/initialize', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: user.email,
      amount: getCourseAmountMinor(course),
      currency: normalizeCurrency(course.currency || 'NGN'),
      reference,
      callback_url: process.env.PAYSTACK_CALLBACK_URL || 'https://gdsticketing.vercel.app/payment/callback',
      metadata: { userId: req.user.id, courseId: storedCourseId },
    }),
  });
  const paystackPayload = await paystackResponse.json();

  if (!paystackResponse.ok || !paystackPayload.status) {
    if (databaseReady) {
      await Enrollment.deleteOne({ paymentReference: reference });
    } else {
      const enrollmentIndex = enrollments.findIndex((item) => item.paymentReference === reference);
      if (enrollmentIndex >= 0) enrollments.splice(enrollmentIndex, 1);
    }
    return res.status(502).json({ message: paystackPayload.message || 'Unable to initialize Paystack checkout.' });
  }

  return res.json({
    reference,
    amount: course.price,
    currency: course.currency,
    course: course.title,
    authorizationUrl: paystackPayload.data.authorization_url,
  });
});

app.post('/api/v1/payments/webhook', async (req, res) => {
  const signature = req.headers['x-paystack-signature'];
  const expectedSignature = crypto.createHmac('sha512', process.env.PAYSTACK_SECRET_KEY || '').update(req.rawBody || '').digest('hex');
  const validSignature = signature && process.env.PAYSTACK_SECRET_KEY
    && String(signature).length === expectedSignature.length
    && crypto.timingSafeEqual(Buffer.from(String(signature)), Buffer.from(expectedSignature));

  if (!validSignature) {
    return res.status(401).json({ message: 'Invalid Paystack signature.' });
  }

  const { event, data } = req.body || {};
  if (event !== 'charge.success' || !data?.reference) {
    return res.status(200).json({ message: 'Event received.' });
  }

  const reference = data.reference;

  if (databaseReady) {
    const enrollment = await Enrollment.findOne({ paymentReference: reference, status: 'pending_payment' });
    if (!enrollment) {
      return res.status(404).json({ message: 'Payment reference is not linked to a pending enrollment.' });
    }

    const course = await Course.findOne({ _id: enrollment.courseId });
    const expectedCurrency = normalizeCurrency(course?.currency || 'NGN');
    if (!course || Number(data.amount) !== getCourseAmountMinor(course) || normalizeCurrency(data.currency) !== expectedCurrency) {
      return res.status(400).json({ message: 'Paystack amount or currency does not match the course.' });
    }

    await Enrollment.updateOne({ _id: enrollment._id }, { $set: { paid: true, status: 'paid_pending_approval' } });
    return res.json({ message: 'Payment received and queued for admin approval.', reference });
  }

  const enrollment = enrollments.find((item) => item.paymentReference === reference);

  const course = enrollment && courses.find((item) => item.id === enrollment.courseId);
  if (!enrollment || !course) {
    return res.status(404).json({ message: 'Payment reference is not linked to a pending enrollment.' });
  }
  if (Number(data.amount) !== getCourseAmountMinor(course) || normalizeCurrency(data.currency) !== normalizeCurrency(course.currency || 'NGN')) {
    return res.status(400).json({ message: 'Paystack amount or currency does not match the course.' });
  }

  enrollment.status = 'paid_pending_approval';
  enrollment.paid = true;

  return res.json({ message: 'Payment received and queued for admin approval.', reference });
});

app.get('/api/v1/payments/verify/:reference', requireAuth, async (req, res) => {
  if (!process.env.PAYSTACK_SECRET_KEY) {
    return res.status(503).json({ message: 'Paystack is not configured on the server.' });
  }

  const paystackResponse = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(req.params.reference)}`, {
    headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
  });
  const payload = await paystackResponse.json();
  if (!paystackResponse.ok || !payload.status || !payload.data) {
    return res.status(400).json({ message: payload.message || 'Payment has not been confirmed.' });
  }

  const enrollment = databaseReady
    ? await Enrollment.findOne({ paymentReference: req.params.reference, userId: req.user.id })
    : enrollments.find((item) => item.paymentReference === req.params.reference && item.userId === req.user.id);
  if (!enrollment) {
    return res.status(404).json({ message: 'Payment reference is not linked to your enrollment.' });
  }

  const course = databaseReady
    ? await Course.findOne({ _id: enrollment.courseId })
    : courses.find((item) => item.id === enrollment.courseId);
  if (!course) {
    return res.status(404).json({ message: 'The course for this payment could not be found.' });
  }

  const transactionStatus = String(payload.data.status || '').toLowerCase();
  const paymentStatus = transactionStatus === 'success'
    ? 'paid_pending_approval'
    : ['failed', 'abandoned', 'reversed'].includes(transactionStatus)
      ? 'failed'
      : 'pending_payment';

  if (transactionStatus === 'success' && (Number(payload.data.amount) !== getCourseAmountMinor(course) || normalizeCurrency(payload.data.currency) !== normalizeCurrency(course.currency || 'NGN'))) {
    return res.status(400).json({ message: 'Paystack amount or currency does not match the course.' });
  }

  const paymentMessage = paymentStatus === 'failed'
    ? 'Payment failed. You can try checkout again.'
    : paymentStatus === 'pending_payment'
      ? 'Payment is still pending with Paystack.'
      : 'Payment verified and awaiting admin approval.';

  if (databaseReady) {
    const updateResult = await Enrollment.updateOne(
      { paymentReference: req.params.reference, userId: req.user.id },
      { $set: { paid: paymentStatus === 'paid_pending_approval', status: paymentStatus } }
    );
    if (updateResult.matchedCount !== 1) {
      return res.status(404).json({ message: 'Payment reference is not linked to your enrollment.' });
    }
  } else {
    enrollment.status = paymentStatus;
    enrollment.paid = paymentStatus === 'paid_pending_approval';
  }

  return res.json({ reference: req.params.reference, status: paymentStatus, message: paymentMessage });
});

app.get('/api/v1/enrollments/me', requireAuth, async (req, res) => {
  if (databaseReady) {
    const records = await Enrollment.find({ userId: req.user.id }).sort({ createdAt: -1 }).lean();
    const courseIds = records.map((record) => record.courseId);
    const courseRecords = await Course.find({ _id: { $in: courseIds } }).lean();
    const courseMap = new Map(courseRecords.map((course) => [course._id.toString(), course]));
    return res.json({
      enrollments: records.map((record) => ({
        ...record,
        id: record._id.toString(),
        course: courseMap.get(record.courseId) ? {
          id: record.courseId,
          title: courseMap.get(record.courseId).title,
          price: courseMap.get(record.courseId).price,
          currency: courseMap.get(record.courseId).currency,
        } : null,
      })),
    });
  }

  return res.json({
    enrollments: enrollments.filter((item) => item.userId === req.user.id).reverse().map((item) => ({
      ...item,
      course: courses.find((course) => course.id === item.courseId) || null,
    })),
  });
});

app.get('/api/v1/admin/enrollments', requireAuth, requireAdmin, async (req, res) => {
  if (databaseReady) {
    const records = await Enrollment.find({ status: 'paid_pending_approval' }).sort({ createdAt: -1 }).lean();
    const userIds = records.map((record) => record.userId);
    const courseIds = records.map((record) => record.courseId);
    const [studentRecords, courseRecords] = await Promise.all([
      User.find({ _id: { $in: userIds } }).lean(),
      Course.find({ _id: { $in: courseIds } }).lean(),
    ]);
    const studentMap = new Map(studentRecords.map((student) => [student._id.toString(), student]));
    const courseMap = new Map(courseRecords.map((course) => [course._id.toString(), course]));
    return res.json({
      enrollments: records.map((record) => ({
        id: record._id.toString(),
        status: record.status,
        paid: record.paid,
        paymentReference: record.paymentReference,
        createdAt: record.createdAt,
        student: studentMap.has(record.userId) ? sanitizeUser(studentMap.get(record.userId)) : null,
        course: courseMap.has(record.courseId) ? {
          id: record.courseId,
          title: courseMap.get(record.courseId).title,
          price: courseMap.get(record.courseId).price,
          currency: courseMap.get(record.courseId).currency,
        } : null,
      })),
    });
  }

  return res.json({
    enrollments: enrollments.filter((item) => item.status === 'paid_pending_approval').map((item) => ({
      ...item,
      student: sanitizeUser(findUserById(item.userId)),
      course: courses.find((course) => course.id === item.courseId) || null,
    })),
  });
});

app.patch('/api/v1/admin/enrollments/:enrollmentId/approve', requireAuth, requireAdmin, async (req, res) => {
  if (databaseReady) {
    const enrollment = await Enrollment.findOne({ _id: req.params.enrollmentId, status: 'paid_pending_approval' });
    if (!enrollment) return res.status(404).json({ message: 'Paid enrollment awaiting approval was not found.' });

    const user = await User.findById(enrollment.userId);
    if (!user) return res.status(404).json({ message: 'Student account was not found.' });

    enrollment.status = 'approved';
    enrollment.approvedAt = new Date();
    enrollment.approvedBy = req.user.id;
    await enrollment.save();
    if (!user.enrolledCourses.includes(enrollment.courseId)) {
      user.enrolledCourses.push(enrollment.courseId);
      await user.save();
    }
    return res.json({ message: 'Course access approved.', enrollmentId: enrollment._id.toString() });
  }

  const enrollment = enrollments.find((item) => item.id === req.params.enrollmentId && item.status === 'paid_pending_approval');
  if (!enrollment) return res.status(404).json({ message: 'Paid enrollment awaiting approval was not found.' });
  const user = findUserById(enrollment.userId);
  if (!user) return res.status(404).json({ message: 'Student account was not found.' });

  enrollment.status = 'approved';
  enrollment.approvedAt = new Date().toISOString();
  enrollment.approvedBy = req.user.id;
  if (!user.enrolledCourses.includes(enrollment.courseId)) user.enrolledCourses.push(enrollment.courseId);
  return res.json({ message: 'Course access approved.', enrollmentId: enrollment.id });
});

app.get('/api/v1/admin/dashboard-stats', requireAuth, requireAdmin, (req, res) => {
  const activeStudents = users.filter((user) => user.role === 'student' && user.paymentStatus).length;
  const totalRevenue = users
    .filter((user) => user.role === 'student' && user.paymentStatus)
    .reduce((sum) => sum + 45000, 0);

  return res.json({
    totalLeads: leads.length,
    conversionRate: leads.length ? ((activeStudents / leads.length) * 100).toFixed(2) : 0,
    totalRevenue,
    activeStudents,
  });
});

app.get('/api/v1/admin/enrolled-students', requireAuth, requireAdmin, (req, res) => {
  const students = users
    .filter((user) => user.role === 'student' && user.paymentStatus)
    .map((user) => sanitizeUser(user));

  return res.json({ students });
});

app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).json({ message: 'Internal server error.' });
});

const ensureSuperAdmin = async () => {
  const email = String(process.env.SUPER_ADMIN_EMAIL || '').trim().toLowerCase();
  const password = process.env.SUPER_ADMIN_PASSWORD;
  const fullName = process.env.SUPER_ADMIN_NAME || 'GDS Super Admin';

  if (!databaseReady || !email || !password) return;

  const existingUser = await User.findOne({ email });

  if (existingUser) {
    if (existingUser.role !== 'super_admin') {
      existingUser.role = 'super_admin';
      await existingUser.save();
    }
    return;
  }

  await User.create({
    fullName,
    email,
    role: 'super_admin',
    passwordHash: await bcrypt.hash(password, 12),
  });
};

connectDB().then(async (connected) => {
  if (process.env.NODE_ENV === 'production' && (!connected || !process.env.JWT_SECRET || !process.env.PAYSTACK_SECRET_KEY)) {
    console.error('Production startup blocked: MongoDB, JWT_SECRET, and PAYSTACK_SECRET_KEY are required.');
    process.exit(1);
  }

  databaseReady = connected;
  await ensureSuperAdmin();
  app.listen(port, () => {
    if (connected) {
      console.log('MongoDB connected successfully.');
    } else {
      console.log('MongoDB URI not configured. Continuing with in-memory storage for local development.');
    }
    console.log(`GDS Ticketing API listening on http://localhost:${port}`);
  });
});
