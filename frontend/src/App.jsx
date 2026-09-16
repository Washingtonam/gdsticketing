import { useEffect, useMemo, useState } from 'react';
import './App.css';

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
  duration: '4 weeks',
  price: '45000',
  currency: 'NGN',
  level: 'Beginner',
  status: 'draft',
  featured: false,
  thumbnailUrl: '',
};

const initialLessonForm = {
  title: '',
  type: 'video',
  contentUrl: '',
  duration: '',
  order: '0',
  isPreview: false,
};

const formatMoney = (amount) =>
  new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format(amount || 0);

function App() {
  const [view, setView] = useState('landing');
  const [authMode, setAuthMode] = useState('login');
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
  const [editingLessonId, setEditingLessonId] = useState('');
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const [adminUsers, setAdminUsers] = useState([]);
  const [status, setStatus] = useState('');
  const [checkoutLoading, setCheckoutLoading] = useState(false);

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
  }, [token, user?.role]);

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
  }, [token, user?.role]);

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

  const handleEnrollment = async (course) => {
    if (!token) {
      setStatus('Please create an account or log in before enrolling in a course.');
      setAuthMode('register');
      setView('auth');
      return;
    }

    try {
      setCheckoutLoading(true);
      setStatus('Preparing your secure checkout...');

      const response = await fetch(`${API_URL}/api/v1/payments/initialize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
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

      setStatus(`Payment started for ${course.title}. After Paystack confirms it, an admin will approve your access.`);
      setView('dashboard');
    } catch (error) {
      setStatus(error.message || 'Unable to start enrollment checkout.');
    } finally {
      setCheckoutLoading(false);
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
      setStatus(`Access approved for ${enrollment.student?.fullName || 'the student'}.`);
    } catch (error) {
      setStatus(error.message || 'Unable to approve course access.');
    }
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
      duration: course.duration || '',
      price: String(course.price || ''),
      currency: course.currency || 'NGN',
      level: course.level || 'Beginner',
      status: course.status || 'draft',
      featured: Boolean(course.featured),
      thumbnailUrl: course.thumbnailUrl || '',
    });
  };

  const editLesson = (course, lesson) => {
    setSelectedCourseId(course.id);
    setEditingLessonId(lesson._id || lesson.id || '');
    setLessonForm({
      title: lesson.title || '',
      type: lesson.type || 'video',
      contentUrl: lesson.contentUrl || '',
      duration: lesson.duration || '',
      order: String(lesson.order ?? 0),
      isPreview: Boolean(lesson.isPreview),
    });
  };

  const resetLessonForm = () => {
    setEditingLessonId('');
    setLessonForm(initialLessonForm);
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
        body: JSON.stringify({ ...lessonForm, order: Number(lessonForm.order) }),
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
        body: JSON.stringify({ ...courseForm, price: Number(courseForm.price) }),
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
      setView('dashboard');
      setStatus('');
      setAuthForm(initialAuthForm);
    } catch (error) {
      setStatus(error.message || 'Login failed. Please try again.');
    }
  };

  const logout = () => {
    setToken('');
    setUser(null);
    setView('landing');
    setStatus('');
  };

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
      <header className="topbar">
        <div className="brand-wrap">
          <div className="brand-mark">GDS</div>
          <div>
            <p className="eyebrow">GDS TICKETING</p>
            <h2>Student Academy</h2>
          </div>
        </div>

        <nav className="nav">
          <a href="#program">Program</a>
          <a href="#pricing">Pricing</a>
          <a href="#curriculum">Curriculum</a>
          {user ? (
            <>
              <button type="button" className="nav-btn" onClick={() => setView('dashboard')}>Dashboard</button>
              <button type="button" className="nav-btn" onClick={logout}>Logout</button>
            </>
          ) : (
            <>
              <button type="button" className="nav-btn" onClick={() => { setAuthMode('login'); setView('auth'); }}>Login</button>
              <button type="button" className="nav-btn" onClick={() => { setAuthMode('register'); setView('auth'); }}>Register</button>
            </>
          )}
        </nav>
      </header>

      {view === 'landing' && (
        <>
          <main className="hero-section">
            <div className="hero-copy">
              <span className="pill">GDS TICKETING ACADEMY · LAGOS</span>
              <h1>Learn the systems that move the world.</h1>
              <p>
                Practical Sabre and GDS training for ambitious students building a real career in travel operations, airline ticketing, and agency support.
              </p>

              <div className="cta-row">
                <button type="button" className="primary-btn" onClick={() => { setAuthMode('register'); setView('auth'); }}>Reserve my student spot</button>
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

      {view === 'auth' && (
        <section className="auth-shell">
          <div className="auth-card">
            <p className="mini-label">Student portal</p>
            <h2>{authMode === 'login' ? 'Welcome back' : 'Create your account'}</h2>

            <form onSubmit={handleAuthSubmit} className="lead-form auth-form">
              {authMode === 'register' && (
                <label>
                  Full name
                  <input
                    type="text"
                    name="fullName"
                    value={authForm.fullName}
                    onChange={handleAuthChange}
                    placeholder="Jane Doe"
                    required
                  />
                </label>
              )}

              <label>
                Email address
                <input
                  type="email"
                  name="email"
                  value={authForm.email}
                  onChange={handleAuthChange}
                  placeholder="jane@example.com"
                  required
                />
              </label>

              {authMode === 'register' && (
                <>
                  <label>
                    Phone number
                    <input
                      type="tel"
                      name="phone"
                      value={authForm.phone}
                      onChange={handleAuthChange}
                      placeholder="0803 000 0000"
                    />
                  </label>
                  <label>
                    Institution
                    <input
                      type="text"
                      name="institution"
                      value={authForm.institution}
                      onChange={handleAuthChange}
                      placeholder="University of Lagos"
                    />
                  </label>
                </>
              )}

              <label>
                Password
                <input
                  type="password"
                  name="password"
                  value={authForm.password}
                  onChange={handleAuthChange}
                  placeholder="Enter your password"
                  required
                />
              </label>

              <button type="submit" className="primary-btn block-btn">
                {authMode === 'login' ? 'Login to dashboard' : 'Create account'}
              </button>
            </form>

            <div className="switch-row">
              <button
                type="button"
                className="text-btn"
                onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
              >
                {authMode === 'login' ? 'Need an account? Register' : 'Already have an account? Login'}
              </button>
            </div>

            {status ? <p className="form-status">{status}</p> : null}
          </div>
        </section>
      )}

      {view === 'dashboard' && user && (
        <section className="dashboard-shell">
          <div className="dashboard-header">
            <div>
              <p className="mini-label">
                {user.role === 'super_admin' ? 'Owner dashboard' : user.role === 'admin' ? 'Admin dashboard' : 'Student dashboard'}
              </p>
              <h2>Welcome back, {user.fullName}</h2>
            </div>
            <button type="button" className="secondary-btn" onClick={logout}>Logout</button>
          </div>

          <div className="metrics-grid">
            {dashboardMetrics.map((metric) => (
              <div key={metric.label} className="metric-card">
                <p>{metric.label}</p>
                <h3>{metric.value}</h3>
              </div>
            ))}
          </div>

          {user.role === 'student' && (
            <>
              <div className="dashboard-card">
                <h3>Available courses</h3>
                <div className="pricing-grid">
                  {courses.map((course) => {
                    const enrollment = enrollments.find((item) => item.courseId === course.id || item.course?.id === course.id);
                    const isApproved = enrollment?.status === 'approved';
                    const buttonLabel = isApproved
                      ? 'Access approved'
                      : enrollment?.status === 'paid_pending_approval'
                        ? 'Awaiting approval'
                        : enrollment?.status === 'pending_payment'
                          ? 'Payment pending'
                          : 'Pay with Paystack';

                    return (
                      <article className="pricing-card" key={course.id || course.slug}>
                        <p className="card-name">{course.title}</p>
                        <h3>{formatMoney(course.price)}</h3>
                        <p className="card-copy">{course.description}</p>
                        <button
                          type="button"
                          className="secondary-btn full-width"
                          onClick={() => handleEnrollment(course)}
                          disabled={Boolean(enrollment) || checkoutLoading}
                        >
                          {checkoutLoading && !enrollment ? 'Preparing checkout...' : buttonLabel}
                        </button>
                      </article>
                    );
                  })}
                </div>
              </div>

              <div className="dashboard-grid">
              <div className="dashboard-card">
                <h3>Enrollment status</h3>
                <ul>
                  <li>Course access: {enrollments.some((item) => item.status === 'approved') ? 'Approved' : 'Awaiting payment or approval'}</li>
                  <li>Institution: {user.institution || 'Not provided'}</li>
                  <li>Phone: {user.phone || 'Not provided'}</li>
                  <li>Active enrollments: {enrollments.filter((item) => item.status === 'approved').length}</li>
                </ul>
              </div>

              <div className="dashboard-card">
                <h3>Learning path</h3>
                <ul>
                  {user.enrolledCourses?.length ? (
                    user.enrolledCourses.map((courseId) => <li key={courseId}>{courseId}</li>)
                  ) : (
                    <>
                      <li>Sabre command structures</li>
                      <li>PNR creation and data handling</li>
                      <li>Ticket issuance and fare checks</li>
                    </>
                  )}
                </ul>
              </div>
              </div>
            </>
          )}

          {['admin', 'super_admin'].includes(user.role) && (
            <div className="admin-panel">
              <div className="admin-panel-heading">
                <div>
                  <p className="mini-label">Payment review</p>
                  <h3>Course access approvals</h3>
                </div>
                <span className="admin-badge">{adminEnrollments.length} pending</span>
              </div>
              <p className="admin-panel-copy">Approve access only after the Paystack payment appears here as confirmed.</p>
              <div className="user-table-wrap">
                <table className="user-table">
                  <thead>
                    <tr><th>Student</th><th>Course</th><th>Amount</th><th>Reference</th><th>Action</th></tr>
                  </thead>
                  <tbody>
                    {adminEnrollments.length ? adminEnrollments.map((enrollment) => (
                      <tr key={enrollment.id}>
                        <td><strong>{enrollment.student?.fullName || 'Unknown student'}</strong><span>{enrollment.student?.email || ''}</span></td>
                        <td>{enrollment.course?.title || 'Unknown course'}</td>
                        <td>{formatMoney(enrollment.course?.price)}</td>
                        <td>{enrollment.paymentReference}</td>
                        <td><button type="button" className="primary-btn" onClick={() => approveEnrollment(enrollment)}>Approve access</button></td>
                      </tr>
                    )) : (
                      <tr><td colSpan="5" className="muted-text">No paid enrollments are waiting for approval.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {user.role === 'super_admin' && (
            <div className="admin-panel">
              <div className="admin-panel-heading">
                <div>
                  <p className="mini-label">Owner controls</p>
                  <h3>User access</h3>
                </div>
                <span className="admin-badge">Super admin</span>
              </div>
              <p className="admin-panel-copy">Promote trusted students to portal admins. The super admin account cannot be changed from this screen.</p>
              <div className="user-table-wrap">
                <table className="user-table">
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Role</th>
                      <th>Enrollment</th>
                      <th>Access</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adminUsers.map((account) => (
                      <tr key={account.id}>
                        <td>
                          <strong>{account.fullName}</strong>
                          <span>{account.email}</span>
                        </td>
                        <td><span className={`role-pill role-${account.role}`}>{account.role.replace('_', ' ')}</span></td>
                        <td>{account.enrolledCourses?.length || 0} courses</td>
                        <td>
                          {account.role === 'super_admin' ? (
                            <span className="muted-text">Protected</span>
                          ) : (
                            <select value={account.role} onChange={(event) => handleRoleChange(account, event.target.value)}>
                              <option value="student">Student</option>
                              <option value="admin">Admin</option>
                            </select>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {['admin', 'super_admin'].includes(user.role) && (
            <div className="admin-panel">
              <div className="admin-panel-heading">
                <div>
                  <p className="mini-label">Catalog controls</p>
                  <h3>Courses and pricing</h3>
                </div>
                <span className="admin-badge">Editable catalog</span>
              </div>
              <p className="admin-panel-copy">Create courses, change pricing, and publish or archive offers without changing application code.</p>

              <form className="course-editor" onSubmit={saveCourse}>
                <label>
                  Course title
                  <input name="title" value={courseForm.title} onChange={handleCourseChange} placeholder="Sabre Core Ticketing" required />
                </label>
                <label>
                  Price
                  <input name="price" type="number" min="0" value={courseForm.price} onChange={handleCourseChange} required />
                </label>
                <label>
                  Duration
                  <input name="duration" value={courseForm.duration} onChange={handleCourseChange} placeholder="4 weeks" />
                </label>
                <label>
                  Level
                  <select name="level" value={courseForm.level} onChange={handleCourseChange}>
                    <option>Beginner</option>
                    <option>Intermediate</option>
                    <option>Advanced</option>
                  </select>
                </label>
                <label>
                  Course thumbnail
                  <input type="file" accept="image/*" onChange={handleThumbnailUpload} disabled={uploadingThumbnail} />
                  <span className="field-hint">{uploadingThumbnail ? 'Uploading to Cloudinary...' : courseForm.thumbnailUrl ? 'Thumbnail ready to save' : 'JPG, PNG, or WebP'}</span>
                </label>
                <label className="course-editor-wide">
                  Description
                  <textarea name="description" value={courseForm.description} onChange={handleCourseChange} placeholder="Describe the outcome students will get." required />
                </label>
                <label>
                  Visibility
                  <select name="status" value={courseForm.status} onChange={handleCourseChange}>
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="paused">Paused</option>
                    <option value="archived">Archived</option>
                  </select>
                </label>
                <label className="checkbox-label">
                  <input name="featured" type="checkbox" checked={courseForm.featured} onChange={handleCourseChange} />
                  Featured course
                </label>
                <div className="course-editor-actions">
                  <button type="submit" className="primary-btn">{editingCourseId ? 'Save changes' : 'Create course'}</button>
                  {editingCourseId && <button type="button" className="secondary-btn" onClick={resetCourseForm}>Cancel</button>}
                </div>
              </form>

              <div className="admin-course-list">
                {adminCourses.map((course) => (
                  <div className="admin-course-row" key={course.id}>
                    <div>
                      {course.thumbnailUrl && <img className="admin-course-thumb" src={course.thumbnailUrl} alt="" />}
                      <strong>{course.title}</strong>
                      <span>{formatMoney(course.price)} · {course.status || 'draft'} · {course.lessons?.length || 0} lessons</span>
                    </div>
                    <div className="admin-course-actions">
                      <button type="button" className="text-btn" onClick={() => editCourse(course)}>Edit</button>
                      <button type="button" className="text-btn" onClick={() => { setSelectedCourseId(course.id); resetLessonForm(); }}>Lessons</button>
                      {course.status !== 'archived' && <button type="button" className="text-btn danger-btn" onClick={() => archiveCourse(course)}>Archive</button>}
                    </div>
                  </div>
                ))}
              </div>

              {selectedCourseId && (
                <div className="lesson-editor">
                  <div className="lesson-editor-heading">
                    <div>
                      <p className="mini-label">Content manager</p>
                      <h4>{adminCourses.find((course) => course.id === selectedCourseId)?.title} lessons</h4>
                    </div>
                    <button type="button" className="text-btn" onClick={() => { setSelectedCourseId(''); resetLessonForm(); }}>Close</button>
                  </div>

                  <form className="course-editor" onSubmit={saveLesson}>
                    <label>
                      Lesson title
                      <input name="title" value={lessonForm.title} onChange={handleLessonChange} placeholder="PNR creation and passenger data" required />
                    </label>
                    <label>
                      Lesson type
                      <select name="type" value={lessonForm.type} onChange={handleLessonChange}>
                        <option value="video">Video</option>
                        <option value="guide">Guide</option>
                        <option value="quiz">Quiz</option>
                      </select>
                    </label>
                    <label>
                      Content URL
                      <input name="contentUrl" type="url" value={lessonForm.contentUrl} onChange={handleLessonChange} placeholder="https://..." />
                    </label>
                    <label>
                      Upload lesson file
                      <input type="file" accept="video/*,application/pdf,image/*" onChange={handleLessonFileUpload} disabled={uploadingFile} />
                      <span className="field-hint">{uploadingFile ? 'Uploading to Cloudinary...' : 'Video, PDF, or image'}</span>
                    </label>
                    <label>
                      Duration
                      <input name="duration" value={lessonForm.duration} onChange={handleLessonChange} placeholder="12 minutes" />
                    </label>
                    <label>
                      Order
                      <input name="order" type="number" min="0" value={lessonForm.order} onChange={handleLessonChange} />
                    </label>
                    <label className="checkbox-label">
                      <input name="isPreview" type="checkbox" checked={lessonForm.isPreview} onChange={handleLessonChange} />
                      Free preview lesson
                    </label>
                    <div className="course-editor-actions">
                      <button type="submit" className="primary-btn">{editingLessonId ? 'Save lesson' : 'Add lesson'}</button>
                      {editingLessonId && <button type="button" className="secondary-btn" onClick={resetLessonForm}>Cancel</button>}
                    </div>
                  </form>

                  <div className="lesson-list">
                    {(adminCourses.find((course) => course.id === selectedCourseId)?.lessons || []).map((lesson) => (
                      <div className="lesson-row" key={lesson._id || lesson.id}>
                        <div>
                          <strong>{lesson.order + 1}. {lesson.title}</strong>
                          <span>{lesson.type} {lesson.isPreview ? '· Preview' : ''} {lesson.duration ? `· ${lesson.duration}` : ''}</span>
                        </div>
                        <div className="admin-course-actions">
                          <button type="button" className="text-btn" onClick={() => editLesson(adminCourses.find((course) => course.id === selectedCourseId), lesson)}>Edit</button>
                          <button type="button" className="text-btn danger-btn" onClick={() => deleteLesson(adminCourses.find((course) => course.id === selectedCourseId), lesson)}>Delete</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      )}
    </div>
  );
}

export default App;
