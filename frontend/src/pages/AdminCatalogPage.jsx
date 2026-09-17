export function AdminCatalogPage({
  courseForm,
  uploadingThumbnail,
  uploadingSyllabus,
  editingCourseId,
  adminCourses,
  saveCourse,
  handleCourseChange,
  handleThumbnailUpload,
  handleSyllabusUpload,
  resetCourseForm,
  editCourse,
  navigate,
  archiveCourse,
}) {
  return (
    <section className="admin-panel admin-shell-panel">
      <div className="page-intro admin-route-intro">
        <div>
          <p className="mini-label">Admin workspace</p>
          <h2>Catalog controls</h2>
        </div>
        <span className="page-intro-badge admin-badge-pill">Course library</span>
      </div>
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
          Target audience
          <input name="targetAudience" value={courseForm.targetAudience} onChange={handleCourseChange} placeholder="Aspiring travel consultants" />
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
          Pricing tier
          <input name="pricingTier" value={courseForm.pricingTier} onChange={handleCourseChange} placeholder="Career Launch" />
        </label>
        <label>
          Group discount (%)
          <input name="groupDiscountPercent" type="number" min="0" max="100" value={courseForm.groupDiscountPercent} onChange={handleCourseChange} />
        </label>
        <label>
          Course thumbnail
          <input type="file" accept="image/*" onChange={handleThumbnailUpload} disabled={uploadingThumbnail} />
          <span className="field-hint">{uploadingThumbnail ? 'Uploading to Cloudinary...' : courseForm.thumbnailUrl ? 'Thumbnail ready to save' : 'JPG, PNG, or WebP'}</span>
        </label>
        <label>
          Intro video URL
          <input name="introVideoUrl" type="url" value={courseForm.introVideoUrl} onChange={handleCourseChange} placeholder="https://..." />
        </label>
        <label>
          Syllabus PDF
          <input type="file" accept="application/pdf" onChange={handleSyllabusUpload} disabled={uploadingSyllabus} />
          <span className="field-hint">{uploadingSyllabus ? 'Uploading to Cloudinary...' : courseForm.syllabusUrl ? 'Syllabus ready to save' : 'PDF preview'}</span>
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
          <div key={course.id || course.slug} className="admin-course-item">
            <div>
              <p className="mini-label">{course.level || 'Course'}</p>
              <h4>{course.title}</h4>
              <span>{course.status || 'draft'}</span>
            </div>
            <div className="admin-course-actions">
              <button type="button" className="text-btn" onClick={() => editCourse(course)}>Edit</button>
              <button type="button" className="text-btn" onClick={() => navigate(`/admin/courses/${course.id || course.slug}/lessons`)}>Lessons</button>
              <button type="button" className="text-btn danger-btn" onClick={() => archiveCourse(course)}>Archive</button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
