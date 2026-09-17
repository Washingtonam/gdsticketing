export function LearningPage({
  selectedCourse,
  learningModules,
  learningLessons,
  learningLoading,
  learningError,
  activeLessonIndex,
  setActiveLessonIndex,
  isLessonCompleted,
  toggleLessonCompletion,
  quizAnswers,
  setQuizAnswers,
  quizResult,
  setQuizResult,
  quizSubmitting,
  submitQuiz,
  navigate,
}) {
  if (!selectedCourse) {
    return (
      <section className="page-section">
        <p className="mini-label">Learning portal</p>
        <h2>Course unavailable</h2>
      </section>
    );
  }

  const moduleSource = learningModules.length ? learningModules : selectedCourse.modules || [];
  const lessons = (learningLessons.length ? learningLessons : selectedCourse.lessons || [
    { id: 'day-1', title: 'Day 1: Foundations', duration: '45 mins', type: 'video', contentUrl: '' },
    { id: 'day-2', title: 'Day 2: Workflow practice', duration: '60 mins', type: 'guide', contentUrl: '' },
    { id: 'day-3', title: 'Day 3: Guided assignment', duration: '35 mins', type: 'quiz', contentUrl: '' },
  ]).slice().sort((first, second) => (first.order || 0) - (second.order || 0)).map((lesson) => ({ ...lesson, moduleTitle: lesson.moduleTitle || '' }));
  const structuredLessons = moduleSource.length
    ? moduleSource.slice().sort((first, second) => (first.order || 0) - (second.order || 0)).flatMap((module) => (module.lessons || []).map((lesson) => ({ ...lesson, moduleTitle: module.title, moduleId: module._id || module.id, moduleUnlockMode: module.unlockMode, moduleAssessmentRequired: module.assessmentRequired })))
    : lessons;

  const activeLesson = structuredLessons[activeLessonIndex] || structuredLessons[0];
  const activeLessonId = activeLesson?._id || activeLesson?.id || `lesson-${activeLessonIndex}`;
  const courseProgressKey = selectedCourse.id || selectedCourse.slug;
  const completedLessons = structuredLessons.filter((lesson) => isLessonCompleted(courseProgressKey, lesson._id || lesson.id || `${selectedCourse.id}-lesson-${lesson.title}`)).length;
  const completionPercent = structuredLessons.length ? (completedLessons / structuredLessons.length) * 100 : 0;
  const previousLessonEnabled = activeLessonIndex > 0;
  const nextLessonEnabled = activeLessonIndex < structuredLessons.length - 1;
  const currentLessonCompleted = isLessonCompleted(courseProgressKey, activeLessonId);

  return (
    <section className="page-section learning-page-shell">
      <div className="page-intro">
        <div>
          <p className="mini-label">Learning portal</p>
          <h2>{selectedCourse.title}</h2>
        </div>
        <span className="page-intro-badge student-badge">Course journey</span>
      </div>
      {learningLoading && <p className="form-status">Loading your course lessons...</p>}
      {learningError && <p className="form-status">{learningError}</p>}
      <div className="learning-page">
        <aside className="learning-sidebar">
          <p className="mini-label">Course roadmap</p>
          <h3>{selectedCourse.title}</h3>
          <div className="progress-label-row"><span>Progress</span><strong>{Math.round(completionPercent)}%</strong></div>
          <div className="progress-bar"><span style={{ width: `${completionPercent}%` }} /></div>
          <ul className="module-list">
            {structuredLessons.map((lesson, index) => {
              const lessonKey = lesson._id || lesson.id || `${selectedCourse.id}-lesson-${index}`;
              const isComplete = isLessonCompleted(courseProgressKey, lessonKey);
              const weekNumber = Math.floor(index / 5) + 1;
              return (
                <li key={lessonKey} className={index === activeLessonIndex ? 'active' : ''} onClick={() => setActiveLessonIndex(index)}>
                  <div className="lesson-tag-row">
                    <strong>{lesson.moduleTitle || `Week ${lesson.week || weekNumber}`}</strong>
                    {isComplete && <span className="complete-chip">Done</span>}
                  </div>
                  <span>{lesson.moduleUnlockMode === 'scheduled' ? `Unlocks day ${lesson.unlockAfterDays || '?'}` : `Lesson ${index + 1}`}</span>
                  <span>{lesson.title}</span>
                </li>
              );
            })}
          </ul>
        </aside>

        <div className="learning-content">
          <div className="learning-header">
            <div><p className="mini-label">Current lesson</p><h2>{activeLesson.title}</h2></div>
            <button type="button" className="primary-btn" onClick={() => navigate('/dashboard/my-courses')}>Back to my courses</button>
          </div>
          <div className="lesson-resource-card">
            <p>{activeLesson.duration || '45 mins'} · {activeLesson.type || 'video'}</p>
            <h3>Learning material</h3>
            {['guide', 'pdf'].includes(activeLesson.type) ? (
              activeLesson.contentUrl ? <a href={activeLesson.contentUrl} target="_blank" rel="noreferrer" className="secondary-btn" onClick={() => { if (!currentLessonCompleted) toggleLessonCompletion(courseProgressKey, activeLessonId); }}>Open PDF guide</a>
                : <p className="muted-text">The PDF guide has not been uploaded yet.</p>
            ) : activeLesson.type === 'quiz' ? (
              <div className="quiz-card">
                <div className="quiz-content">
                  <p>Knowledge check</p>
                  {activeLesson.questions?.length ? activeLesson.questions.map((question, questionIndex) => (
                    <fieldset className="quiz-question" key={question._id || questionIndex}>
                      <legend>{questionIndex + 1}. {question.prompt}</legend>
                      {question.options.map((option, optionIndex) => (
                        <label key={`${questionIndex}-${optionIndex}`} className="quiz-option">
                          <input type="radio" name={`question-${questionIndex}`} checked={String(quizAnswers[questionIndex]) === String(optionIndex)} onChange={() => { setQuizAnswers((previous) => ({ ...previous, [questionIndex]: optionIndex })); setQuizResult(null); }} />
                          {option}
                        </label>
                      ))}
                    </fieldset>
                  )) : <p className="muted-text">This quiz has not been configured yet.</p>}
                  {quizResult && <p className="quiz-result">Score: {quizResult.score}/{quizResult.total} ({quizResult.percent}%). {quizResult.passed ? 'Passed' : 'Try again'}</p>}
                  <button type="button" className="secondary-btn" disabled={quizSubmitting || !activeLesson.questions?.length} onClick={() => submitQuiz(courseProgressKey, activeLessonId, activeLesson)}>{quizSubmitting ? 'Submitting...' : 'Submit quiz'}</button>
                </div>
              </div>
            ) : ['text', 'assignment'].includes(activeLesson.type) ? (
              <div className="lesson-text-content">
                <p>{activeLesson.terminalInstructions || 'Read the instructions for this lesson, then mark it complete when you are done.'}</p>
              </div>
            ) : (
              <div className="video-placeholder">
                {activeLesson.contentUrl ? <video controls className="lesson-video" src={activeLesson.contentUrl} onEnded={() => { if (!currentLessonCompleted) toggleLessonCompletion(courseProgressKey, activeLessonId); }}>Your browser does not support video playback.</video>
                  : <p>Video lesson content will appear here once the lesson file is uploaded.</p>}
              </div>
            )}
            {activeLesson.resourceTitle && <p className="field-hint">Resource: {activeLesson.resourceTitle}</p>}
            {activeLesson.terminalInstructions && <div className="terminal-instructions"><h4>Practical terminal access</h4><p>{activeLesson.terminalInstructions}</p></div>}
          </div>
          <div className="learning-actions">
            <button type="button" className="secondary-btn" disabled={!previousLessonEnabled} onClick={() => setActiveLessonIndex((value) => Math.max(0, value - 1))}>Previous</button>
            <button type="button" className="primary-btn" onClick={() => toggleLessonCompletion(courseProgressKey, activeLessonId)}>{currentLessonCompleted ? 'Mark incomplete' : 'Mark complete'}</button>
            <button type="button" className="secondary-btn" disabled={!nextLessonEnabled} onClick={() => setActiveLessonIndex((value) => Math.min(structuredLessons.length - 1, value + 1))}>Next lesson</button>
          </div>
        </div>
      </div>
    </section>
  );
}
