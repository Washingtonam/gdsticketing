export function AdminLessonsPage({
  selectedAdminCourse,
  lessonForm,
  moduleForm,
  editingLessonId,
  editingModuleId,
  uploadingFile,
  handleLessonChange,
  handleModuleChange,
  handleLessonFileUpload,
  saveLesson,
  saveModule,
  resetLessonForm,
  resetModuleForm,
  editModule,
  editLesson,
  deleteLesson,
  navigate,
}) {
  if (!selectedAdminCourse) {
    return (
      <section className="page-section">
        <p className="mini-label">Course content</p>
        <h2>Choose a course to manage</h2>
      </section>
    );
  }

  const lessons = selectedAdminCourse.lessons || [];
  const modules = selectedAdminCourse.modules || [];

  return (
    <section className="page-section admin-lessons-page admin-lesson-shell">
      <div className="page-intro admin-route-intro">
        <div><p className="mini-label">Admin workspace</p><h2>Course lessons</h2></div>
        <span className="page-intro-badge admin-badge-pill">Curriculum</span>
      </div>
      <div className="section-heading admin-header-row">
        <div><p className="mini-label">Course content</p><h2>{selectedAdminCourse.title}</h2></div>
        <button type="button" className="secondary-btn" onClick={() => navigate('/admin/catalog')}>Back to catalog</button>
      </div>

      <div className="admin-lessons-layout">
        <form className="course-editor" onSubmit={saveLesson}>
          <label>Lesson title<input name="title" value={lessonForm.title} onChange={handleLessonChange} placeholder="Day 1: Ticketing basics" required /></label>
          <label>Module<select name="moduleId" value={lessonForm.moduleId} onChange={handleLessonChange}><option value="">Top-level lesson</option>{modules.slice().sort((first, second) => (first.order || 0) - (second.order || 0)).map((module) => <option key={module._id || module.id} value={module._id || module.id}>{module.title}</option>)}</select></label>
          <label>Lesson type<select name="type" value={lessonForm.type} onChange={handleLessonChange}><option value="video">Video</option><option value="guide">Guide</option><option value="pdf">PDF</option><option value="text">Text</option><option value="quiz">Quiz</option><option value="assignment">Assignment</option></select></label>
          <label>Content URL<input name="contentUrl" type="url" value={lessonForm.contentUrl} onChange={handleLessonChange} placeholder="https://..." /></label>
          <label>Resource title<input name="resourceTitle" value={lessonForm.resourceTitle} onChange={handleLessonChange} placeholder="Day 1 cheat sheet" /></label>
          <label>Upload lesson file<input type="file" accept="video/*,application/pdf,image/*" onChange={handleLessonFileUpload} disabled={uploadingFile} /><span className="field-hint">{uploadingFile ? 'Uploading...' : 'Video, PDF, or image'}</span></label>
          <label>Week<input name="week" type="number" min="1" value={lessonForm.week} onChange={handleLessonChange} /></label>
          <label>Day<input name="day" type="number" min="1" value={lessonForm.day} onChange={handleLessonChange} /></label>
          <label>Duration<input name="duration" value={lessonForm.duration} onChange={handleLessonChange} placeholder="45 minutes" /></label>
          <label>Order<input name="order" type="number" min="0" value={lessonForm.order} onChange={handleLessonChange} /></label>
          <label className="checkbox-label"><input name="isPreview" type="checkbox" checked={lessonForm.isPreview} onChange={handleLessonChange} />Free preview lesson</label>
          {lessonForm.type === 'quiz' && <label className="course-editor-wide">Quiz questions JSON<textarea name="questionsJson" value={lessonForm.questionsJson} onChange={handleLessonChange} rows="8" placeholder='[{"prompt":"What does PNR mean?","options":["Passenger Name Record","Price Net Rule"],"answerIndex":0}]' /><span className="field-hint">Use prompt, options, and zero-based answerIndex.</span></label>}
          <label className="checkbox-label"><input name="required" type="checkbox" checked={lessonForm.required} onChange={handleLessonChange} />Required for completion</label>
          <label className="course-editor-wide">Terminal instructions<textarea name="terminalInstructions" value={lessonForm.terminalInstructions} onChange={handleLessonChange} placeholder="Add emulator access steps or practice credentials guidance." /></label>
          <div className="course-editor-actions"><button type="submit" className="primary-btn">{editingLessonId ? 'Save lesson' : 'Add lesson'}</button>{editingLessonId && <button type="button" className="secondary-btn" onClick={resetLessonForm}>Cancel</button>}</div>
        </form>

        <form className="course-editor module-editor" onSubmit={saveModule}>
          <div className="course-editor-wide"><p className="mini-label">Structure builder</p><h3>{editingModuleId ? 'Edit module' : 'Add module container'}</h3></div>
          <label>Module title<input name="title" value={moduleForm.title} onChange={handleModuleChange} placeholder="Week 1: Foundations" required /></label>
          <label>Order<input name="order" type="number" min="0" value={moduleForm.order} onChange={handleModuleChange} /></label>
          <label className="course-editor-wide">Module description<textarea name="description" value={moduleForm.description} onChange={handleModuleChange} placeholder="What students will complete in this container." /></label>
          <label>Unlock mode<select name="unlockMode" value={moduleForm.unlockMode} onChange={handleModuleChange}><option value="immediate">Immediately on enrollment</option><option value="scheduled">Scheduled drip</option></select></label>
          <label>Unlock after days<input name="unlockAfterDays" type="number" min="0" value={moduleForm.unlockAfterDays} onChange={handleModuleChange} disabled={moduleForm.unlockMode !== 'scheduled'} /></label>
          <label className="checkbox-label"><input name="assessmentRequired" type="checkbox" checked={moduleForm.assessmentRequired} onChange={handleModuleChange} />Assessment required</label>
          <div className="course-editor-actions"><button type="submit" className="primary-btn">{editingModuleId ? 'Save module' : 'Add module'}</button>{editingModuleId && <button type="button" className="secondary-btn" onClick={resetModuleForm}>Cancel</button>}</div>
        </form>

        <div className="lesson-builder-panel">
          <h3>Module containers</h3>
          {modules.length ? <div className="schedule-list">{modules.slice().sort((first, second) => (first.order || 0) - (second.order || 0)).map((module) => (
            <div className="schedule-item" key={module._id || module.id || module.title}>
              <div><p className="mini-label">Container {Number(module.order || 0) + 1} · {module.unlockMode === 'scheduled' ? `Day ${module.unlockAfterDays}` : 'Immediate access'}</p><strong>{module.title}</strong><span>{module.lessons?.length || 0} lessons · {module.assessmentRequired ? 'Assessment required' : 'No assessment'}</span></div>
              <button type="button" className="text-btn" onClick={() => editModule(module)}>Edit</button>
            </div>
          ))}</div> : <p className="muted-text">No modules yet. Add a module container before assigning lessons.</p>}
          <h3>Day-by-day schedule</h3>
          {lessons.length || modules.some((module) => module.lessons?.length) ? <div className="schedule-list">{[...lessons, ...modules.flatMap((module) => (module.lessons || []).map((lesson) => ({ ...lesson, moduleTitle: module.title })))].sort((first, second) => (first.order || 0) - (second.order || 0)).map((lesson, index) => {
            const weekNumber = Math.floor(index / 5) + 1;
            const dayNumber = index + 1;
            return <div className="schedule-item" key={lesson._id || lesson.id || `${selectedAdminCourse.id}-lesson-${index}`}><div><p className="mini-label">{lesson.moduleTitle || 'Top-level lesson'} · Week {lesson.week || weekNumber} · Day {lesson.day || dayNumber}</p><strong>{lesson.title}</strong><span>{lesson.type} · {lesson.duration || 'No duration'} · {lesson.isPreview ? 'Preview' : 'Full access'}</span></div><div className="admin-course-actions"><button type="button" className="text-btn" onClick={() => editLesson(selectedAdminCourse, lesson)}>Edit</button><button type="button" className="text-btn danger-btn" onClick={() => deleteLesson(selectedAdminCourse, lesson)}>Delete</button></div></div>;
          })}</div> : <p className="muted-text">No lessons yet. Add the first day of content for this course.</p>}
        </div>
      </div>
    </section>
  );
}
