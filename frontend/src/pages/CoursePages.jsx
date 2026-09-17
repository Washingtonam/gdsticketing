const formatMoney = (amount) =>
  new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format(amount || 0);

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
            <h3>{course.displayPrice || formatMoney(course.price)}</h3>
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

export function CourseDetailPage({ selectedCourse, formatMoney, handleEnrollment, navigate }) {
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
            <span>{formatMoney(selectedCourse.price || 0)}</span>
          </div>
          <div className="cta-row">
            <button type="button" className="primary-btn" onClick={() => handleEnrollment(selectedCourse)}>
              Enroll now
            </button>
            <button type="button" className="secondary-btn" onClick={() => navigate('/courses')}>
              Back to catalog
            </button>
          </div>
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
