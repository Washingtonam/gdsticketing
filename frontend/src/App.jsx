import { useEffect, useMemo, useState } from 'react';
import './App.css';
import { CourseCatalogPage, CourseDetailPage } from './pages/CoursePages.jsx';
import { AuthPage } from './pages/AuthPages.jsx';
import { MyCoursesPage, StudentDashboardPage } from './pages/StudentPages.jsx';
import { AdminDashboardPage, AdminPaymentsPage } from './pages/AdminPages.jsx';
import { AdminCatalogPage } from './pages/AdminCatalogPage.jsx';
import { OwnerControlsPage } from './pages/OwnerControlsPage.jsx';
import { LearningPage } from './pages/LearningPage.jsx';
import { AdminLessonsPage } from './pages/AdminLessonsPage.jsx';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const pricingCards = [
  {
    name: 'Student Access',
    price: '₦45,000',
    description: 'Perfect for beginners exploring ticketing fundamentals and Sabre workflows.',
    features: ['Core course access', 'PNR practice guides', 'Progress tracking'],
    featured: false,
  },
  {
    name: 'Career Launch',
    price: '₦75,000',
    description: 'Built for students preparing for agency-level operations and practical ticketing confidence.',
    features: ['Everything in Student Access', 'Advanced module walkthroughs', 'Agency simulation tasks'],
    featured: true,
  },
];

const benefits = [
  'SABRE command fundamentals',
  'PNR creation and fare logic',
  'Real-world agency workflows',
  'Career-ready training stack',
];

const curriculum = [
  'Introduction to GDS systems and airline reservation logic',
  'Sabre command structures and passenger data entry',
  'PNR creation, amendments, and ticket issuance',
  'Course quizzes and practical ticketing exercises',
];

const initialLeadForm = {
  fullName: '',
  email: '',
  phone: '',
  schoolDept: '',
};

const initialAuthForm = {
  fullName: '',
  email: '',
  password: '',
  phone: '',
  institution: '',
};

const initialCourseForm = {
  title: '',
  description: '',
  targetAudience: '',
  duration: '4 weeks',
  price: '45000',
  currency: 'NGN',
  pricingTier: '',
  groupDiscountPercent: '0',
  level: 'Beginner',
  status: 'draft',
  featured: false,
  thumbnailUrl: '',
  introVideoUrl: '',
  syllabusUrl: '',
};

const initialLessonForm = {
  title: '',
  type: 'video',
  contentUrl: '',
  contentMimeType: '',
  resourceTitle: '',
  terminalInstructions: '',
  week: '1',
  day: '1',
  duration: '',
  order: '0',
  isPreview: false,
  required: true,
  questionsJson: '[]',
};

const initialModuleForm = {
  title: '',
  description: '',
  order: '0',
  unlockMode: 'immediate',
  unlockAfterDays: '0',
  assessmentRequired: false,
};

const formatMoney = (amount) =>
  new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format(amount || 0);

const getCurrentPath = () => window.location.pathname || '/';

function App() {
  const [view, setView] = useState('landing');
  const [route, setRoute] = useState(getCurrentPath());
  const [authMode, setAuthMode] = useState('login');
  const [showPassword, setShowPassword] = useState(false);
  const [token, setToken] = useState(() => localStorage.getItem('gds_token') || '');
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('gds_user') || 'null'));
  const [leadForm, setLeadForm] = useState(initialLeadForm);
  const [authForm, setAuthForm] = useState(initialAuthForm);
  const [courses, setCourses] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [adminEnrollments, setAdminEnrollments] = useState([]);
  const [adminCourses, setAdminCourses] = useState([]);
  const [courseForm, setCourseForm] = useState(initialCourseForm);
  const [editingCourseId, setEditingCourseId] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [lessonForm, setLessonForm] = useState(initialLessonForm);
  const [moduleForm, setModuleForm] = useState(initialModuleForm);
  const [editingModuleId, setEditingModuleId] = useState('');
  const [editingLessonId, setEditingLessonId] = useState('');
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const [uploadingSyllabus, setUploadingSyllabus] = useState(false);
  const [adminUsers, setAdminUsers] = useState([]);
  const [status, setStatus] = useState('');
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [pendingEnrollmentCourse, setPendingEnrollmentCourse] = useState(null);
  const [activeLessonIndex, setActiveLessonIndex] = useState(0);
  const [learningLessons, setLearningLessons] = useState([]);
  const [learningModules, setLearningModules] = useState([]);
  const [learningLoading, setLearningLoading] = useState(false);
  const [learningError, setLearningError] = useState('');
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizResult, setQuizResult] = useState(null);
  const [quizSubmitting, setQuizSubmitting] = useState(false);
  const [enrollmentRefreshKey, setEnrollmentRefreshKey] = useState(0);
  const [adminEnrollmentRefreshKey, setAdminEnrollmentRefreshKey] = useState(0);
  const [studentProgress, setStudentProgress] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('gds_student_progress') || '{}');
    } catch (error) {
      return {};
    }
  });

  const loadStudentProgress = async () => {
    if (!token) {
      setStudentProgress({});
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/v1/progress/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.message || 'Unable to load progress.');
      }

      setStudentProgress(payload.progress || {});
    } catch (error) {
      setStudentProgress({});
    }
  };

  const dashboardMetrics = useMemo(() => {
    if (['admin', 'super_admin'].includes(user?.role)) {
      return [
        { label: 'Role', value: user.role === 'super_admin' ? 'Owner' : 'Admin' },
        { label: 'Courses', value: adminCourses.length },
        { label: 'Access', value: 'Management' },
      ];
    }

    return [
      { label: 'Enrolled', value: user?.enrolledCourses?.length || 0 },
      { label: 'Payment', value: user?.paymentStatus ? 'Active' : 'Pending' },
      { label: 'Course', value: user?.enrolledCourses?.[0] ? 'Unlocked' : 'Not started' },
    ];
  }, [adminCourses.length, user]);

  useEffect(() => {
    localStorage.setItem('gds_token', token);
  }, [token]);

  useEffect(() => {
    localStorage.setItem('gds_user', JSON.stringify(user || null));
  }, [user]);

  useEffect(() => {
    localStorage.setItem('gds_student_progress', JSON.stringify(studentProgress));
  }, [studentProgress]);

  useEffect(() => {
    const loadCourses = async () => {
      try {
        const response = await fetch(`${API_URL}/api/v1/courses`);
        if (!response.ok) {
          throw new Error('Failed to load courses');
        }

        const payload = await response.json();
        setCourses(payload.courses || []);
      } catch (error) {
        setCourses([]);
      }
    };

    loadCourses();
  }, []);

  useEffect(() => {
    if (!token) return;

    const loadMe = async () => {
      try {
        const response = await fetch(`${API_URL}/api/v1/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          throw new Error('Session expired');
        }

        const payload = await response.json();
        setUser(payload.user);
        const nextRoute = payload.user?.role === 'student' ? '/dashboard' : '/admin';
        window.history.pushState({}, '', nextRoute);
        setRoute(nextRoute);
        setView('dashboard');
      } catch (error) {
        setToken('');
        setUser(null);
        setView('landing');
      }
    };

    loadMe();
  }, [token]);

  useEffect(() => {
    if (!token) {
      setStudentProgress({});
      return;
    }

    loadStudentProgress();
  }, [token, user?.id]);

  useEffect(() => {
    if (window.location.pathname !== '/payment/callback') return;

    const reference = new URLSearchParams(window.location.search).get('reference')
      || new URLSearchParams(window.location.search).get('trxref');
    if (!reference) {
      setStatus('Payment callback received without a transaction reference.');
      return;
    }

    if (!token) {
      setStatus('Please log in again to confirm the payment status.');
      setView('auth');
      return;
    }

    const verifyPayment = async () => {
      try {
        setStatus('Confirming your Paystack payment...');
        const response = await fetch(`${API_URL}/api/v1/payments/verify/${encodeURIComponent(reference)}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.message || 'Unable to confirm payment.');

        setStatus(payload.status === 'failed'
          ? 'Payment failed. Please try again when you are ready.'
          : payload.status === 'pending_payment'
            ? 'Paystack is still processing the payment. Your course will update when the payment is confirmed.'
            : 'Payment successful. Your course access is now active.');
        setEnrollmentRefreshKey((value) => value + 1);
        const nextRoute = '/dashboard';
        window.history.replaceState({}, '', nextRoute);
        setRoute(nextRoute);
        setView('dashboard');
      } catch (error) {
        setStatus(error.message || 'Unable to confirm payment.');
        const nextRoute = '/dashboard';
        window.history.replaceState({}, '', nextRoute);
        setRoute(nextRoute);
        setView('dashboard');
      }
    };

    verifyPayment();
  }, [token]);

  useEffect(() => {
    const handlePopState = () => setRoute(getCurrentPath());
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    if (!token || !['admin', 'super_admin'].includes(user?.role)) return;

    const loadAdminCourses = async () => {
      try {
        const response = await fetch(`${API_URL}/api/v1/admin/courses`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const payload = await response.json();

        if (!response.ok) throw new Error(payload.message || 'Unable to load courses.');
        setAdminCourses(payload.courses || []);
      } catch (error) {
        setStatus(error.message || 'Unable to load courses.');
      }
    };

    loadAdminCourses();
  }, [token, user?.role]);

  useEffect(() => {
    if (!token || user?.role !== 'student') return;

    const loadEnrollments = async () => {
      try {
        const response = await fetch(`${API_URL}/api/v1/enrollments/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.message || 'Unable to load enrollments.');
        setEnrollments(payload.enrollments || []);
      } catch (error) {
        setStatus(error.message || 'Unable to load enrollments.');
      }
    };

    loadEnrollments();
  }, [enrollmentRefreshKey, token, user?.role]);

  useEffect(() => {
    if (!token || !['admin', 'super_admin'].includes(user?.role)) return;

    const loadAdminEnrollments = async () => {
      try {
        const response = await fetch(`${API_URL}/api/v1/admin/enrollments`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.message || 'Unable to load payment approvals.');
        setAdminEnrollments(payload.enrollments || []);
      } catch (error) {
        setStatus(error.message || 'Unable to load payment approvals.');
      }
    };

    loadAdminEnrollments();
  }, [adminEnrollmentRefreshKey, token, user?.role]);

  useEffect(() => {
    if (!token || user?.role !== 'super_admin') return;

    const loadAdminUsers = async () => {
      try {
        const response = await fetch(`${API_URL}/api/v1/admin/users`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const payload = await response.json();

        if (!response.ok) throw new Error(payload.message || 'Unable to load users.');
        setAdminUsers(payload.users || []);
      } catch (error) {
        setStatus(error.message || 'Unable to load users.');
      }
    };

    loadAdminUsers();
  }, [token, user?.role]);

  const handleLeadChange = (event) => {
    const { name, value } = event.target;
    setLeadForm((previous) => ({ ...previous, [name]: value }));
  };

  const handleAuthChange = (event) => {
    const { name, value } = event.target;
    setAuthForm((previous) => ({ ...previous, [name]: value }));
  };

  const handleCourseChange = (event) => {
    const { name, value, type, checked } = event.target;
    setCourseForm((previous) => ({ ...previous, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleLessonChange = (event) => {
    const { name, value, type, checked } = event.target;
    setLessonForm((previous) => ({ ...previous, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleModuleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setModuleForm((previous) => ({ ...previous, [name]: type === 'checkbox' ? checked : value }));
  };

  const uploadToCloudinary = async (file, folder) => {
    if (!file) return '';

    setUploadingFile(true);
    try {
      const signatureResponse = await fetch(`${API_URL}/api/v1/admin/uploads/signature`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ folder }),
      });
      const signature = await signatureResponse.json();
      if (!signatureResponse.ok) throw new Error(signature.message || 'Unable to prepare upload.');

      const formData = new FormData();
      formData.append('file', file);
      formData.append('api_key', signature.apiKey);
      formData.append('timestamp', signature.timestamp);
      formData.append('signature', signature.signature);
      formData.append('folder', signature.folder);

      const uploadResponse = await fetch(`https://api.cloudinary.com/v1_1/${signature.cloudName}/auto/upload`, {
        method: 'POST',
        body: formData,
      });
      const result = await uploadResponse.json();
      if (!uploadResponse.ok) throw new Error(result.error?.message || 'Cloudinary upload failed.');

      return result.secure_url;
    } finally {
      setUploadingFile(false);
    }
  };

  const handleThumbnailUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploadingThumbnail(true);
      const url = await uploadToCloudinary(file, 'gds-ticketing/course-thumbnails');
      setCourseForm((previous) => ({ ...previous, thumbnailUrl: url }));
      setStatus('Course thumbnail uploaded. Save the course to attach it.');
    } catch (error) {
      setStatus(error.message || 'Unable to upload course thumbnail.');
    } finally {
      setUploadingThumbnail(false);
    }
  };

  const handleSyllabusUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploadingSyllabus(true);
      const url = await uploadToCloudinary(file, 'gds-ticketing/course-syllabi');
      setCourseForm((previous) => ({ ...previous, syllabusUrl: url }));
      setStatus('Syllabus uploaded. Save the course to attach it.');
    } catch (error) {
      setStatus(error.message || 'Unable to upload syllabus.');
    } finally {
      setUploadingSyllabus(false);
    }
  };

  const handleLessonFileUpload = async (event) => {
    try {
      const url = await uploadToCloudinary(event.target.files?.[0], `gds-ticketing/courses/${selectedCourseId}`);
      if (url) setLessonForm((previous) => ({ ...previous, contentUrl: url }));
      setStatus('Lesson file uploaded successfully. Save the lesson to attach it.');
    } catch (error) {
      setStatus(error.message || 'Unable to upload lesson file.');
    }
  };

  const handleLeadSubmit = async (event) => {
    event.preventDefault();

    try {
      const response = await fetch(`${API_URL}/api/v1/leads/capture`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...leadForm,
          source: 'Landing_Page',
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.message || 'Unable to submit lead form.');
      }

      setStatus('Your request has been submitted. You will receive a welcome email soon.');
      setLeadForm(initialLeadForm);
    } catch (error) {
      setStatus(error.message || 'Something went wrong. Please try again.');
    }
  };

  const initializeCheckout = async (course, authToken) => {
    try {
      setCheckoutLoading(true);
      setStatus('Preparing your secure checkout...');

      const response = await fetch(`${API_URL}/api/v1/payments/initialize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ courseId: course.id || course.slug }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Unable to start enrollment checkout.');
      }

      if (result.authorizationUrl) {
        window.open(result.authorizationUrl, '_blank', 'noopener,noreferrer');
      }

      setStatus(`Payment started for ${course.title}. Your access will activate automatically after Paystack confirms it.`);
      const nextRoute = '/dashboard';
      window.history.pushState({}, '', nextRoute);
      setRoute(nextRoute);
      setView('dashboard');
    } catch (error) {
      setStatus(error.message || 'Unable to start enrollment checkout.');
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleEnrollment = async (course) => {
    if (!token) {
      setPendingEnrollmentCourse(course);
      setStatus('Please create an account or log in before enrolling in a course.');
      setAuthMode('register');
      navigate('/register');
      return;
    }

    await initializeCheckout(course, token);
  };

  const handleDeleteUser = async (account) => {
    if (!window.confirm(`Delete ${account.fullName}'s account and enrollment records? This cannot be undone.`)) return;

    try {
      const response = await fetch(`${API_URL}/api/v1/admin/users/${account.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message || 'Unable to delete user.');
      setAdminUsers((previous) => previous.filter((item) => item.id !== account.id));
      setStatus(`${account.fullName} and their enrollment records were deleted.`);
    } catch (error) {
      setStatus(error.message || 'Unable to delete user.');
    }
  };

  const approveEnrollment = async (enrollment) => {
    try {
      const response = await fetch(`${API_URL}/api/v1/admin/enrollments/${enrollment.id}/approve`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message || 'Unable to approve course access.');
      setAdminEnrollments((previous) => previous.filter((item) => item.id !== enrollment.id));
      setAdminEnrollmentRefreshKey((value) => value + 1);
      setStatus(`Access approved for ${enrollment.student?.fullName || 'the student'}.`);
    } catch (error) {
      setStatus(error.message || 'Unable to approve course access.');
    }
  };

  const toggleLessonCompletion = async (courseKey, lessonId) => {
    if (!courseKey || !lessonId || !token) return;

    const currentProgress = studentProgress[courseKey] || [];
    const nextCompleted = !currentProgress.includes(lessonId);

    try {
      const response = await fetch(`${API_URL}/api/v1/progress/${encodeURIComponent(courseKey)}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ lessonId, completed: nextCompleted }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.message || 'Unable to update lesson progress.');
      }

      setStudentProgress(payload.progress || { ...studentProgress, [courseKey]: currentProgress });
      setStatus(nextCompleted ? 'Lesson saved as complete.' : 'Lesson marked as incomplete.');
    } catch (error) {
      setStatus(error.message || 'Unable to update lesson progress.');
    }
  };

  const submitQuiz = async (courseKey, lessonId, lesson) => {
    if (!courseKey || !lessonId || !token || !lesson?.questions?.length) return;

    try {
      setQuizSubmitting(true);
      const response = await fetch(`${API_URL}/api/v1/courses/${encodeURIComponent(courseKey)}/lessons/${encodeURIComponent(lessonId)}/quiz/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ answers: lesson.questions.map((question, index) => quizAnswers[index] ?? null) }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message || 'Unable to submit quiz.');
      setQuizResult(payload);
      if (payload.passed) {
        setStudentProgress(payload.progress || studentProgress);
        setStatus('Quiz passed. Lesson completed.');
      } else {
        setStatus('Quiz submitted. Review the material and try again.');
      }
    } catch (error) {
      setStatus(error.message || 'Unable to submit quiz.');
    } finally {
      setQuizSubmitting(false);
    }
  };

  const isLessonCompleted = (courseKey, lessonId) => {
    if (!courseKey || !lessonId) return false;
    return (studentProgress[courseKey] || []).includes(lessonId);
  };

  const handleRoleChange = async (account, role) => {
    try {
      const response = await fetch(`${API_URL}/api/v1/admin/users/${account.id}/role`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ role }),
      });
      const payload = await response.json();

      if (!response.ok) throw new Error(payload.message || 'Unable to update role.');

      setAdminUsers((previous) => previous.map((item) => (item.id === account.id ? payload.user : item)));
      setStatus(`${account.fullName} is now a ${role === 'admin' ? 'portal admin' : 'student'}.`);
    } catch (error) {
      setStatus(error.message || 'Unable to update role.');
    }
  };

  const editCourse = (course) => {
    setEditingCourseId(course.id || '');
    setCourseForm({
      title: course.title || '',
      description: course.description || '',
      targetAudience: course.targetAudience || '',
      duration: course.duration || '',
      price: String(course.price || ''),
      currency: course.currency || 'NGN',
      pricingTier: course.pricingTier || '',
      groupDiscountPercent: String(course.groupDiscountPercent || 0),
      level: course.level || 'Beginner',
      status: course.status || 'draft',
      featured: Boolean(course.featured),
      thumbnailUrl: course.thumbnailUrl || '',
      introVideoUrl: course.introVideoUrl || '',
      syllabusUrl: course.syllabusUrl || '',
    });
  };

  const editLesson = (course, lesson) => {
    setSelectedCourseId(course.id);
    setEditingLessonId(lesson._id || lesson.id || '');
    setLessonForm({
      title: lesson.title || '',
      type: lesson.type || 'video',
      contentUrl: lesson.contentUrl || '',
      contentMimeType: lesson.contentMimeType || '',
      resourceTitle: lesson.resourceTitle || '',
      terminalInstructions: lesson.terminalInstructions || '',
      week: String(lesson.week ?? 1),
      day: String(lesson.day ?? 1),
      duration: lesson.duration || '',
      order: String(lesson.order ?? 0),
      isPreview: Boolean(lesson.isPreview),
      required: lesson.required !== false,
      questionsJson: JSON.stringify(lesson.questions || [], null, 2),
    });
  };

  const resetLessonForm = () => {
    setEditingLessonId('');
    setLessonForm(initialLessonForm);
  };

  const resetModuleForm = () => {
    setEditingModuleId('');
    setModuleForm(initialModuleForm);
  };

  const saveModule = async (event) => {
    event.preventDefault();
    const course = adminCourses.find((item) => item.id === selectedCourseId);
    if (!course || !moduleForm.title.trim()) return;

    const moduleId = editingModuleId;
    const nextModule = {
      ...(moduleId ? (course.modules || []).find((item) => (item._id || item.id) === moduleId) : {}),
      title: moduleForm.title.trim(),
      description: moduleForm.description.trim(),
      order: Number(moduleForm.order) || 0,
      unlockMode: moduleForm.unlockMode,
      unlockAfterDays: Number(moduleForm.unlockAfterDays) || 0,
      assessmentRequired: Boolean(moduleForm.assessmentRequired),
      lessons: moduleId ? ((course.modules || []).find((item) => (item._id || item.id) === moduleId)?.lessons || []) : [],
    };
    const modules = moduleId
      ? (course.modules || []).map((item) => ((item._id || item.id) === moduleId ? nextModule : item))
      : [...(course.modules || []), nextModule];

    try {
      const response = await fetch(`${API_URL}/api/v1/admin/courses/${course.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...course, modules, price: Number(course.price) }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message || 'Unable to save module.');
      setAdminCourses((previous) => previous.map((item) => item.id === course.id ? payload.course : item));
      setStatus('Module saved successfully.');
      resetModuleForm();
    } catch (error) {
      setStatus(error.message || 'Unable to save module.');
    }
  };

  const editModule = (module) => {
    setEditingModuleId(module._id || module.id || '');
    setModuleForm({
      title: module.title || '',
      description: module.description || '',
      order: String(module.order ?? 0),
      unlockMode: module.unlockMode || 'immediate',
      unlockAfterDays: String(module.unlockAfterDays ?? 0),
      assessmentRequired: Boolean(module.assessmentRequired),
    });
  };

  const saveLesson = async (event) => {
    event.preventDefault();
    if (!selectedCourseId) return;

    try {
      const endpoint = editingLessonId
        ? `${API_URL}/api/v1/admin/courses/${selectedCourseId}/lessons/${editingLessonId}`
        : `${API_URL}/api/v1/admin/courses/${selectedCourseId}/lessons`;
      const response = await fetch(endpoint, {
        method: editingLessonId ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...lessonForm,
          week: Number(lessonForm.week),
          day: Number(lessonForm.day),
          order: Number(lessonForm.order),
          questions: (() => {
            try {
              return JSON.parse(lessonForm.questionsJson || '[]');
            } catch (error) {
              return [];
            }
          })(),
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message || 'Unable to save lesson.');

      setAdminCourses((previous) => previous.map((course) => {
        if (course.id !== selectedCourseId) return course;
        const lessons = editingLessonId
          ? course.lessons.map((lesson) => ((lesson._id || lesson.id) === editingLessonId ? payload.lesson : lesson))
          : [...(course.lessons || []), payload.lesson];
        return { ...course, lessons: lessons.sort((first, second) => (first.order || 0) - (second.order || 0)) };
      }));
      setStatus('Lesson saved successfully.');
      resetLessonForm();
    } catch (error) {
      setStatus(error.message || 'Unable to save lesson.');
    }
  };

  const deleteLesson = async (course, lesson) => {
    const lessonId = lesson._id || lesson.id;

    try {
      const response = await fetch(`${API_URL}/api/v1/admin/courses/${course.id}/lessons/${lessonId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message || 'Unable to delete lesson.');

      setAdminCourses((previous) => previous.map((item) => item.id === course.id
        ? { ...item, lessons: item.lessons.filter((itemLesson) => (itemLesson._id || itemLesson.id) !== lessonId) }
        : item));
      setStatus('Lesson deleted.');
    } catch (error) {
      setStatus(error.message || 'Unable to delete lesson.');
    }
  };

  const resetCourseForm = () => {
    setEditingCourseId('');
    setCourseForm(initialCourseForm);
  };

  const saveCourse = async (event) => {
    event.preventDefault();

    try {
      const endpoint = editingCourseId
        ? `${API_URL}/api/v1/admin/courses/${editingCourseId}`
        : `${API_URL}/api/v1/admin/courses`;
      const response = await fetch(endpoint, {
        method: editingCourseId ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ...courseForm, price: Number(courseForm.price), groupDiscountPercent: Number(courseForm.groupDiscountPercent) }),
      });
      const payload = await response.json();

      if (!response.ok) throw new Error(payload.message || 'Unable to save course.');

      setAdminCourses((previous) => editingCourseId
        ? previous.map((course) => (course.id === editingCourseId ? payload.course : course))
        : [payload.course, ...previous]);
      setCourses((previous) => editingCourseId
        ? previous.map((course) => (course.id === editingCourseId ? payload.course : course))
        : [...previous, payload.course]);
      setStatus(`${payload.course.title} saved successfully.`);
      resetCourseForm();
    } catch (error) {
      setStatus(error.message || 'Unable to save course.');
    }
  };

  const archiveCourse = async (course) => {
    try {
      const response = await fetch(`${API_URL}/api/v1/admin/courses/${course.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message || 'Unable to archive course.');

      setAdminCourses((previous) => previous.map((item) => (item.id === course.id ? payload.course : item)));
      setCourses((previous) => previous.filter((item) => item.id !== course.id));
      setStatus(`${course.title} was archived.`);
    } catch (error) {
      setStatus(error.message || 'Unable to archive course.');
    }
  };

  const handleAuthSubmit = async (event) => {
    event.preventDefault();

    try {
      const endpoint = authMode === 'login' ? '/api/v1/auth/login' : '/api/v1/auth/register';
      const payload = authMode === 'login'
        ? { email: authForm.email, password: authForm.password }
        : {
            fullName: authForm.fullName,
            email: authForm.email,
            password: authForm.password,
            phone: authForm.phone,
            institution: authForm.institution,
          };

      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Authentication failed.');
      }

      setToken(result.token);
      setUser(result.user);
      const courseToEnroll = pendingEnrollmentCourse;
      setPendingEnrollmentCourse(null);
      const nextRoute = result.user?.role === 'student' ? '/dashboard' : '/admin';
      window.history.pushState({}, '', nextRoute);
      setRoute(nextRoute);
      setView('dashboard');
      setStatus('');
      setAuthForm(initialAuthForm);
      if (courseToEnroll && result.user?.role === 'student') {
        await initializeCheckout(courseToEnroll, result.token);
      }
    } catch (error) {
      setStatus(error.message || 'Login failed. Please try again.');
    }
  };

  const logout = () => {
    setToken('');
    setUser(null);
    window.history.pushState({}, '', '/');
    setRoute('/');
    setView('landing');
    setStatus('');
  };

  const navigate = (path) => {
    if (path === window.location.pathname) return;
    window.history.pushState({}, '', path);
    const nextPath = getCurrentPath();
    setRoute(nextPath);
    if (nextPath === '/') {
      setAuthMode('login');
      setView('landing');
    } else if (nextPath === '/login') {
      setAuthMode('login');
      setView('auth');
    } else if (nextPath === '/register') {
      setAuthMode('register');
      setView('auth');
    } else if (['/dashboard', '/dashboard/my-courses', '/admin', '/admin/payments', '/admin/catalog', '/owner'].includes(nextPath) || nextPath.startsWith('/admin/courses/') || nextPath.startsWith('/courses/')) {
      setView('dashboard');
    }
  };

  const routeSegments = route.split('/').filter(Boolean);
  const isLandingRoute = route === '/';
  const isLoginRoute = route === '/login';
  const isRegisterRoute = route === '/register';
  const isCatalogRoute = route === '/courses';
  const isCourseDetailRoute = routeSegments[0] === 'courses' && routeSegments.length === 2 && routeSegments[1] !== 'learn';
  const isCourseLearnRoute = routeSegments[0] === 'courses' && routeSegments.length === 3 && routeSegments[2] === 'learn';
  const isStudentDashboardRoute = route === '/dashboard';
  const isMyCoursesRoute = route === '/dashboard/my-courses';
  const isAdminDashboardRoute = route === '/admin';
  const isAdminPaymentsRoute = route === '/admin/payments';
  const isAdminCatalogRoute = route === '/admin/catalog';
  const isOwnerRoute = route === '/owner';
  const isAdminLessonsRoute = routeSegments[0] === 'admin' && routeSegments[1] === 'courses' && routeSegments.length === 4 && routeSegments[3] === 'lessons';
  const isStudentPortalActive = isStudentDashboardRoute || isMyCoursesRoute || isCourseLearnRoute;
  const isAdminPortalActive = isAdminDashboardRoute || isAdminPaymentsRoute || isAdminCatalogRoute || isOwnerRoute || isAdminLessonsRoute;
  const isWorkspaceRoute = isStudentPortalActive || isAdminPortalActive;

  const selectedCourseSlug = isCourseDetailRoute || isCourseLearnRoute ? routeSegments[1] : '';
  const selectedCourse = courses.find((course) => course.slug === selectedCourseSlug || course.id === selectedCourseSlug) || adminCourses.find((course) => course.slug === selectedCourseSlug || course.id === selectedCourseSlug) || null;
  const selectedAdminCourseId = isAdminLessonsRoute ? routeSegments[2] : '';
  const selectedAdminCourse = adminCourses.find((course) => course.id === selectedAdminCourseId || course.slug === selectedAdminCourseId) || null;
  const approvedCourses = enrollments.filter((item) => item.status === 'approved');

  useEffect(() => {
    setActiveLessonIndex(0);
    setQuizAnswers({});
    setQuizResult(null);
  }, [selectedCourseSlug, route]);

  useEffect(() => {
    setQuizAnswers({});
    setQuizResult(null);
  }, [activeLessonIndex]);

  useEffect(() => {
    if (!isCourseLearnRoute || !selectedCourseSlug || !token) {
      setLearningLessons([]);
      setLearningModules([]);
      setLearningError('');
      return;
    }

    const loadLearningLessons = async () => {
      setLearningLoading(true);
      setLearningError('');
      try {
        const response = await fetch(`${API_URL}/api/v1/courses/${encodeURIComponent(selectedCourseSlug)}/lessons`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.message || 'Unable to load course lessons.');
        setLearningLessons(payload.lessons || []);
        setLearningModules(payload.modules || []);
      } catch (error) {
        setLearningLessons([]);
        setLearningError(error.message || 'Unable to load course lessons.');
      } finally {
        setLearningLoading(false);
      }
    };

    loadLearningLessons();
  }, [isCourseLearnRoute, selectedCourseSlug, token]);

  const displayCourses = courses.length
    ? courses.map((course) => ({
        ...course,
        displayPrice: formatMoney(course.price),
      }))
    : pricingCards.map((card) => ({
        id: card.name.toLowerCase().replace(/\s+/g, '-'),
        slug: card.name.toLowerCase().replace(/\s+/g, '-'),
        title: card.name,
        description: card.description,
        price: card.price.includes('₦') ? Number(card.price.replace(/[^\d]/g, '')) : 0,
        currency: 'NGN',
        level: card.featured ? 'Advanced' : 'Beginner',
        duration: '4-6 weeks',
        displayPrice: card.price,
      }));


  return (
    <div className="page-shell">
      {!isWorkspaceRoute && (
        <header className="topbar">
          <div className="brand-wrap">
            <div className="brand-mark">GDS</div>
            <div>
              <p className="eyebrow">GDS TICKETING</p>
              <h2>Student Academy</h2>
            </div>
          </div>

          <nav className="nav">
            <button type="button" className={`nav-btn ${isLandingRoute ? 'active' : ''}`} onClick={() => navigate('/')}>Home</button>
            <button type="button" className={`nav-btn ${isCatalogRoute || isCourseDetailRoute ? 'active' : ''}`} onClick={() => navigate('/courses')}>Courses</button>
            {user ? (
              <>
                <button type="button" className={`nav-btn ${user.role === 'student' ? '' : ''}`} onClick={() => navigate(user.role === 'student' ? '/dashboard' : '/admin')}>Dashboard</button>
                {user.role === 'student' && <button type="button" className="nav-btn" onClick={() => navigate('/dashboard/my-courses')}>My courses</button>}
                {['admin', 'super_admin'].includes(user.role) && <button type="button" className="nav-btn" onClick={() => navigate('/admin/payments')}>Payments</button>}
                {user.role === 'super_admin' && <button type="button" className="nav-btn" onClick={() => navigate('/owner')}>Owner</button>}
                <button type="button" className="nav-btn" onClick={logout}>Logout</button>
              </>
            ) : (
              <>
                <button type="button" className={`nav-btn ${isLoginRoute ? 'active' : ''}`} onClick={() => { setAuthMode('login'); navigate('/login'); }}>Login</button>
                <button type="button" className={`nav-btn ${isRegisterRoute ? 'active' : ''}`} onClick={() => { setAuthMode('register'); navigate('/register'); }}>Register</button>
              </>
            )}
          </nav>
        </header>
      )}

      {isCatalogRoute && <CourseCatalogPage courses={courses} displayCourses={displayCourses} navigate={navigate} />}
      {isCourseDetailRoute && <CourseDetailPage selectedCourse={selectedCourse} formatMoney={formatMoney} handleEnrollment={handleEnrollment} navigate={navigate} />}
      {isMyCoursesRoute && <MyCoursesPage approvedCourses={approvedCourses} courses={courses} formatMoney={formatMoney} navigate={navigate} />}
      {isCourseLearnRoute && <LearningPage selectedCourse={selectedCourse} learningModules={learningModules} learningLessons={learningLessons} learningLoading={learningLoading} learningError={learningError} activeLessonIndex={activeLessonIndex} setActiveLessonIndex={setActiveLessonIndex} isLessonCompleted={isLessonCompleted} toggleLessonCompletion={toggleLessonCompletion} quizAnswers={quizAnswers} setQuizAnswers={setQuizAnswers} quizResult={quizResult} setQuizResult={setQuizResult} quizSubmitting={quizSubmitting} submitQuiz={submitQuiz} navigate={navigate} />}

      {isLandingRoute && (
        <>
          <main className="hero-section">
            <div className="hero-copy">
              <span className="pill">GDS TICKETING ACADEMY · LAGOS</span>
              <h1>Learn the systems that move the world.</h1>
              <p>
                Practical Sabre and GDS training for ambitious students building a real career in travel operations, airline ticketing, and agency support.
              </p>

              <div className="cta-row">
                <button type="button" className="primary-btn" onClick={() => { setAuthMode('register'); navigate('/register'); }}>Reserve my student spot</button>
                <a href="#pricing" className="secondary-btn">View pricing</a>
              </div>

              <ul className="benefits-list">
                {benefits.map((benefit) => (
                  <li key={benefit}>{benefit}</li>
                ))}
              </ul>
            </div>

            <div className="hero-visual" aria-label="Students learning in a modern academy">
              <img
                src="https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=1200&q=85"
                alt="Modern academy building with students nearby"
              />
              <div className="hero-visual-caption">
                <span className="caption-kicker">A practical learning environment</span>
                <strong>From classroom confidence to agency capability.</strong>
                <span className="caption-meta">Structured lessons · Guided practice · Career support</span>
              </div>
              <div className="hero-stat">
                <strong>01</strong>
                <span>Learn by doing</span>
              </div>
            </div>

            <div className="lead-card" id="lead-form">
              <p className="lead-label">Student special discount</p>
              <h3>Join the institutional outreach list</h3>

              <form onSubmit={handleLeadSubmit} className="lead-form">
                <label>
                  Full name
                  <input
                    type="text"
                    name="fullName"
                    value={leadForm.fullName}
                    onChange={handleLeadChange}
                    placeholder="Jane Doe"
                    required
                  />
                </label>
                <label>
                  Email address
                  <input
                    type="email"
                    name="email"
                    value={leadForm.email}
                    onChange={handleLeadChange}
                    placeholder="jane@example.com"
                    required
                  />
                </label>
                <label>
                  Phone number
                  <input
                    type="tel"
                    name="phone"
                    value={leadForm.phone}
                    onChange={handleLeadChange}
                    placeholder="0803 000 0000"
                    required
                  />
                </label>
                <label>
                  Institution / Department
                  <input
                    type="text"
                    name="schoolDept"
                    value={leadForm.schoolDept}
                    onChange={handleLeadChange}
                    placeholder="School of Travel & Tourism"
                  />
                </label>

                <button type="submit" className="primary-btn block-btn">Request my discount</button>
              </form>

              {status ? <p className="form-status">{status}</p> : null}
            </div>
          </main>

          <section className="info-grid" id="program">
            <div className="info-card accent-card">
              <p className="mini-label">Why this works</p>
              <h3>Built for students who need hands-on travel-tech skills.</h3>
              <p>
                We blend practical ticketing fundamentals with structured learning so students can move from classroom theory to agency-ready confidence.
              </p>
            </div>
            <div className="info-card">
              <p className="mini-label">Industry focus</p>
              <h3>Sabre-ready workflows</h3>
              <p>
                From PNR entry to standard booking journeys, students learn the most relevant processes used in modern travel operations.
              </p>
            </div>
          </section>

          <section className="trust-strip" aria-label="Academy standards">
            <div>
              <span className="trust-number">01</span>
              <strong>Industry-led curriculum</strong>
              <p>Learn the workflows travel teams use every day.</p>
            </div>
            <div>
              <span className="trust-number">02</span>
              <strong>Guided practice</strong>
              <p>Build confidence through structured exercises and feedback.</p>
            </div>
            <div>
              <span className="trust-number">03</span>
              <strong>Clear student access</strong>
              <p>Pay once, see your enrollment, and learn from your portal.</p>
            </div>
          </section>

          <section className="pricing-section" id="pricing">
            <div className="section-heading">
              <p className="mini-label">School pricing</p>
              <h2>Standard industry price vs. student special discount</h2>
            </div>

            <div className="pricing-grid">
              {displayCourses.map((course) => {
                const isFeatured = course.level === 'Advanced' || course.title === 'Career Launch';
                const features = course.lessons
                  ? course.lessons.map((lesson) => lesson.title)
                  : pricingCards.find((card) => card.name === course.title)?.features || ['Core course access'];

                return (
                  <article key={course.id || course.slug} className={`pricing-card ${isFeatured ? 'featured' : ''}`}>
                    {course.thumbnailUrl && <img className="course-card-image" src={course.thumbnailUrl} alt="" />}
                    <p className="card-name">{course.title}</p>
                    <h3>{course.displayPrice || formatMoney(course.price)}</h3>
                    <p className="card-copy">{course.description}</p>
                    <ul>
                      {features.slice(0, 3).map((feature) => (
                        <li key={feature}>{feature}</li>
                      ))}
                    </ul>
                    <button
                      type="button"
                      className="secondary-btn full-width"
                      onClick={() => handleEnrollment(course)}
                      disabled={checkoutLoading}
                    >
                      {checkoutLoading ? 'Preparing checkout...' : 'Enroll now'}
                    </button>
                  </article>
                );
              })}
            </div>
          </section>

          <section className="curriculum-section" id="curriculum">
            <div className="section-heading">
              <p className="mini-label">What students learn</p>
              <h2>Structured learning roadmap</h2>
            </div>

            <div className="curriculum-grid">
              {curriculum.map((item) => (
                <div className="curriculum-item" key={item}>
                  <span>•</span>
                  <p>{item}</p>
                </div>
              ))}
            </div>
          </section>
        </>
      )}

      {(isLoginRoute || isRegisterRoute) && (
        <AuthPage
          mode={isLoginRoute ? 'login' : 'register'}
          authForm={authForm}
          showPassword={showPassword}
          status={status}
          handleAuthChange={handleAuthChange}
          handleAuthSubmit={handleAuthSubmit}
          setShowPassword={setShowPassword}
          setAuthMode={setAuthMode}
          navigate={navigate}
        />
      )}

      {view === 'dashboard' && user && user.role === 'student' && isStudentDashboardRoute && (
        <StudentDashboardPage
          user={user}
          dashboardMetrics={dashboardMetrics}
          courses={courses}
          enrollments={enrollments}
          checkoutLoading={checkoutLoading}
          formatMoney={formatMoney}
          handleEnrollment={handleEnrollment}
          logout={logout}
        />
      )}

      {['admin', 'super_admin'].includes(user?.role) && (isAdminDashboardRoute || isAdminPaymentsRoute || isAdminCatalogRoute || isOwnerRoute || isAdminLessonsRoute) && (
        <div className="admin-workspace-shell">
          <aside className="admin-sidebar" aria-label="Admin sections">
            <div className="admin-sidebar-header">
              <p className="mini-label">Workspace</p>
              <span className="admin-side-label">{user.role === 'super_admin' ? 'Owner' : 'Admin'}</span>
            </div>
            <button type="button" className={route === '/admin' ? 'active' : ''} onClick={() => navigate('/admin')}>Dashboard</button>
            <button type="button" className={route === '/admin/payments' ? 'active' : ''} onClick={() => navigate('/admin/payments')}>Payment review</button>
            <button type="button" className={route === '/admin/catalog' ? 'active' : ''} onClick={() => navigate('/admin/catalog')}>Catalog controls</button>
            {user.role === 'super_admin' && <button type="button" className={route === '/owner' ? 'active' : ''} onClick={() => navigate('/owner')}>Owner controls</button>}
          </aside>

          <div className="admin-page-content">
            {isAdminDashboardRoute && <AdminDashboardPage user={user} dashboardMetrics={dashboardMetrics} adminCourses={adminCourses} adminEnrollments={adminEnrollments} navigate={navigate} logout={logout} />}
            {isAdminPaymentsRoute && <AdminPaymentsPage adminEnrollments={adminEnrollments} formatMoney={formatMoney} approveEnrollment={approveEnrollment} />}
            {isAdminCatalogRoute && <AdminCatalogPage courseForm={courseForm} uploadingThumbnail={uploadingThumbnail} uploadingSyllabus={uploadingSyllabus} editingCourseId={editingCourseId} adminCourses={adminCourses} saveCourse={saveCourse} handleCourseChange={handleCourseChange} handleThumbnailUpload={handleThumbnailUpload} handleSyllabusUpload={handleSyllabusUpload} resetCourseForm={resetCourseForm} editCourse={editCourse} navigate={navigate} archiveCourse={archiveCourse} />}
            {isOwnerRoute && <OwnerControlsPage adminUsers={adminUsers} handleRoleChange={handleRoleChange} handleDeleteUser={handleDeleteUser} />}
            {isAdminLessonsRoute && <AdminLessonsPage selectedAdminCourse={selectedAdminCourse} lessonForm={lessonForm} moduleForm={moduleForm} editingLessonId={editingLessonId} editingModuleId={editingModuleId} uploadingFile={uploadingFile} handleLessonChange={handleLessonChange} handleModuleChange={handleModuleChange} handleLessonFileUpload={handleLessonFileUpload} saveLesson={saveLesson} saveModule={saveModule} resetLessonForm={resetLessonForm} resetModuleForm={resetModuleForm} editModule={editModule} editLesson={editLesson} deleteLesson={deleteLesson} navigate={navigate} />}
          </div>
        </div>
      )}

    </div>
  );
}

export default App;
