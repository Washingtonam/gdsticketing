export function MyCoursesPage({ approvedCourses, courses, formatMoney, navigate }) {
  return (
    <section className="page-section">
      <div className="page-intro">
        <div>
          <p className="mini-label">Student portal</p>
          <h2>My courses</h2>
        </div>
        <span className="page-intro-badge student-badge">Learning access</span>
      </div>
      <div className="pricing-grid">
        {approvedCourses.length ? approvedCourses.map((enrollment) => {
          const course = enrollment.course || courses.find((item) => item.id === enrollment.courseId || item.slug === enrollment.courseId) || null;
          if (!course) return null;
          return (
            <article className="pricing-card" key={enrollment.id || enrollment.courseId}>
              <p className="card-name">{course.title}</p>
              <h3>{formatMoney(course.price || 0)}</h3>
              <p className="card-copy">{course.description}</p>
              <button type="button" className="secondary-btn full-width" onClick={() => navigate(`/courses/${course.slug || course.id}/learn`)}>
                Continue learning
              </button>
            </article>
          );
        }) : (
          <div className="dashboard-card">
            <h3>No approved courses yet</h3>
            <p>Your approved learning access will appear here after payment confirmation and admin approval.</p>
            <button type="button" className="primary-btn" onClick={() => navigate('/courses')}>Browse courses</button>
          </div>
        )}
      </div>
    </section>
  );
}

export function StudentDashboardPage({ user, dashboardMetrics, courses, enrollments, checkoutLoading, formatMoney, handleEnrollment, logout }) {
  return (
    <section className="dashboard-shell student-dashboard-shell">
      <div className="page-intro">
        <div>
          <p className="mini-label">Student workspace</p>
          <h2>Learning dashboard</h2>
        </div>
        <span className="page-intro-badge student-badge">Access portal</span>
      </div>
      <div className="dashboard-header">
        <div>
          <p className="mini-label">Student dashboard</p>
          <h2>Welcome back, {user?.fullName}</h2>
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

      <div className="dashboard-card">
        <h3>Available courses</h3>
        <div className="pricing-grid">
          {courses.map((course) => {
            const enrollment = enrollments.find((item) => item.courseId === course.id || item.course?.id === course.id);
            const isApproved = enrollment?.status === 'approved';
            const isRetryable = enrollment?.status === 'failed';
            const buttonLabel = isApproved
              ? 'Access approved'
              : enrollment?.status === 'paid_pending_approval'
                ? 'Awaiting approval'
                : enrollment?.status === 'pending_payment'
                  ? 'Payment pending'
                  : isRetryable
                    ? 'Retry payment'
                    : 'Pay with Paystack';

            return (
              <article className="pricing-card" key={course.id || course.slug}>
                <p className="card-name">{course.title}</p>
                <h3>{formatMoney(course.price)}</h3>
                <p className="card-copy">{course.description}</p>
                <button type="button" className="secondary-btn full-width" onClick={() => handleEnrollment(course)} disabled={(Boolean(enrollment) && !isRetryable) || checkoutLoading}>
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
            <li>Institution: {user?.institution || 'Not provided'}</li>
            <li>Phone: {user?.phone || 'Not provided'}</li>
            <li>Active enrollments: {enrollments.filter((item) => item.status === 'approved').length}</li>
          </ul>
        </div>

        <div className="dashboard-card">
          <h3>Learning path</h3>
          <ul>
            {user?.enrolledCourses?.length ? user.enrolledCourses.map((courseId) => <li key={courseId}>{courseId}</li>) : (
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
  );
}
