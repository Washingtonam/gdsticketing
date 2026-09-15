import { useEffect, useMemo, useState } from 'react';
import './App.css';

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
  const [status, setStatus] = useState('');
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const dashboardMetrics = useMemo(
    () => [
      { label: 'Enrolled', value: user?.enrolledCourses?.length || 0 },
      { label: 'Payment', value: user?.paymentStatus ? 'Active' : 'Pending' },
      { label: 'Course', value: user?.enrolledCourses?.[0] ? 'Unlocked' : 'Not started' },
    ],
    [user]
  );

  useEffect(() => {
    localStorage.setItem('gds_token', token);
  }, [token]);

  useEffect(() => {
    localStorage.setItem('gds_user', JSON.stringify(user || null));
  }, [user]);

  useEffect(() => {
    const loadCourses = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/v1/courses');
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
        const response = await fetch('http://localhost:5000/api/v1/auth/me', {
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

  const handleLeadChange = (event) => {
    const { name, value } = event.target;
    setLeadForm((previous) => ({ ...previous, [name]: value }));
  };

  const handleAuthChange = (event) => {
    const { name, value } = event.target;
    setAuthForm((previous) => ({ ...previous, [name]: value }));
  };

  const handleLeadSubmit = async (event) => {
    event.preventDefault();

    try {
      const response = await fetch('http://localhost:5000/api/v1/leads/capture', {
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

      const response = await fetch('http://localhost:5000/api/v1/payments/initialize', {
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

      setStatus(`Checkout started for ${course.title}. Complete the payment flow and your course access will unlock.`);
      setView('dashboard');
    } catch (error) {
      setStatus(error.message || 'Unable to start enrollment checkout.');
    } finally {
      setCheckoutLoading(false);
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

      const response = await fetch(`http://localhost:5000${endpoint}`, {
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
              <span className="pill">Career-ready ticketing skills</span>
              <h1>Start your GDS journey with practical, agency-style training.</h1>
              <p>
                Learn Sabre workflows, PNR creation, fare logic, and ticketing support skills that get students job-ready in an increasingly digital travel ecosystem.
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
              <p className="mini-label">Student dashboard</p>
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

          <div className="dashboard-grid">
            <div className="dashboard-card">
              <h3>Enrollment status</h3>
              <ul>
                <li>Course access: {user.paymentStatus ? 'Unlocked' : 'Awaiting payment'}</li>
                <li>Institution: {user.institution || 'Not provided'}</li>
                <li>Phone: {user.phone || 'Not provided'}</li>
                <li>Active enrollments: {user.enrolledCourses?.length || 0}</li>
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
        </section>
      )}
    </div>
  );
}

export default App;
