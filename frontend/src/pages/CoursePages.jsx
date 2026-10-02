const formatMoney = (amount, currency = 'NGN') => {
  const normalizedCurrency = String(currency || 'NGN').trim().toUpperCase();
  const localeMap = {
    NGN: { locale: 'en-NG', currency: 'NGN' },
    USD: { locale: 'en-US', currency: 'USD' },
    GBP: { locale: 'en-GB', currency: 'GBP' },
    EUR: { locale: 'en-IE', currency: 'EUR' },
  };
  const config = localeMap[normalizedCurrency] || localeMap.NGN;

  return new Intl.NumberFormat(config.locale, {
    style: 'currency',
    currency: config.currency,
    maximumFractionDigits: normalizedCurrency === 'NGN' ? 0 : 2,
  }).format(amount || 0);
};

export function CourseCatalogPage({ courses, displayCourses, navigate }) {
  return (
    <section className="page-section">
      <div className="page-intro">
        <div>
          <p className="mini-label">Public catalog</p>
          <h2>Choose your course</h2>
        </div>
        <span className="page-intro-badge student-badge">Public view</span>
      </div>
      <div className="pricing-grid">
        {(courses.length ? courses : displayCourses).map((course) => (
          <article key={course.id || course.slug} className="pricing-card">
            {course.thumbnailUrl && <img className="course-card-image" src={course.thumbnailUrl} alt="" />}
            <p className="card-name">{course.title}</p>
            <h3>{course.displayPrice || formatMoney(course.price, course.currency || 'NGN')}</h3>
            <p className="card-copy">{course.description}</p>
            <ul>
              {[
                ...(course.lessons || []),
                ...(course.modules || []).flatMap((module) => module.lessons || []),
              ].slice(0, 3).map((lesson) => (
                <li key={lesson._id || lesson.id || `${course.id}-${lesson.title}`}>{lesson.title}</li>
              ))}
            </ul>
            <button type="button" className="secondary-btn full-width" onClick={() => navigate(`/courses/${course.slug || course.id}`)}>
              View course
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}

export function CourseDetailPage({ selectedCourse, formatMoney, handleEnrollment, navigate, selectedCourseAccessState }) {
  if (!selectedCourse) {
    return (
      <section className="page-section">
        <p className="mini-label">Course detail</p>
        <h2>Course not found</h2>
      </section>
    );
  }

  const outlineLessons = [
    ...(selectedCourse.lessons || []),
    ...(selectedCourse.modules || []).flatMap((module) => module.lessons || []),
  ];

  const accessStatusText = selectedCourseAccessState?.isApproved
    ? 'Your access is already approved. Continue learning whenever you are ready.'
    : selectedCourseAccessState?.status === 'paid_pending_approval'
      ? 'Your payment is confirmed and waiting for admin approval.'
      : selectedCourseAccessState?.status === 'pending_payment'
        ? 'Your enrollment is already in progress. Please complete checkout to continue.'
        : selectedCourseAccessState?.status === 'failed'
          ? 'Your last payment did not complete. You can trigger a fresh checkout.'
          : 'Access is granted after successful payment and admin approval.';

  const isEnrollmentActionBlocked = Boolean(selectedCourseAccessState && !selectedCourseAccessState.isFailed);
  const primaryActionLabel = selectedCourseAccessState?.isApproved
    ? 'Continue learning'
    : selectedCourseAccessState?.status === 'paid_pending_approval'
      ? 'Awaiting approval'
      : selectedCourseAccessState?.status === 'pending_payment'
        ? 'Checkout pending'
        : selectedCourseAccessState?.status === 'failed'
          ? 'Retry enrollment'
          : 'Enroll now';

  const handlePrimaryAction = () => {
    if (selectedCourseAccessState?.isApproved) {
      navigate(`/courses/${selectedCourse.slug || selectedCourse.id}/learn`);
      return;
    }
    if (selectedCourseAccessState && !selectedCourseAccessState.isFailed) {
      return;
    }
    handleEnrollment(selectedCourse);
  };

  return (
    <section className="page-section">
      <div className="page-intro">
        <div>
          <p className="mini-label">Course overview</p>
          <h2>{selectedCourse.title}</h2>
        </div>
        <span className="page-intro-badge">Course detail</span>
      </div>
      <div className="course-detail-shell">
        {selectedCourse.thumbnailUrl && <img className="course-detail-image" src={selectedCourse.thumbnailUrl} alt="" />}
        <div className="course-detail-copy">
          <p className="mini-label">Course overview</p>
          <h2>{selectedCourse.title}</h2>
          <p>{selectedCourse.description}</p>
          <div className="course-detail-meta">
            <span>{selectedCourse.duration || '4 weeks'}</span>
            <span>{selectedCourse.level || 'Beginner'}</span>
            <span>{formatMoney(selectedCourse.price || 0, selectedCourse.currency || 'NGN')}</span>
          </div>
          <div className="cta-row">
            <button type="button" className="primary-btn" onClick={handlePrimaryAction} disabled={isEnrollmentActionBlocked && !selectedCourseAccessState?.isFailed}>
              {primaryActionLabel}
            </button>
            <button type="button" className="secondary-btn" onClick={() => navigate('/courses')}>
              Back to catalog
            </button>
          </div>
          <p className="field-hint">{accessStatusText}</p>
          <div className="learning-outline">
            <h3>Course structure</h3>
            <ul>
              {outlineLessons.length ? outlineLessons.slice(0, 6).map((lesson) => (
                <li key={lesson._id || lesson.id || `${selectedCourse.id}-${lesson.title}`}>
                  {lesson.title} {lesson.duration ? `· ${lesson.duration}` : ''}
                </li>
              )) : (
                <>
                  <li>Day 1: Foundations</li>
                  <li>Day 2: Workflow practice</li>
                  <li>Day 3: Guided assignments</li>
                </>
              )}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
