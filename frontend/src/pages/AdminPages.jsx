export function AdminDashboardPage({ user, dashboardMetrics, adminCourses, adminEnrollments, navigate, logout }) {
  const isOwner = user?.role === 'super_admin';

  return (
    <section className="dashboard-shell admin-dashboard-shell">
      <div className="page-intro admin-intro">
        <div>
          <p className="mini-label">Admin workspace</p>
          <h2>{isOwner ? 'Owner dashboard' : 'Admin dashboard'}</h2>
        </div>
        <span className="page-intro-badge admin-badge-pill">{isOwner ? 'Owner access' : 'Admin access'}</span>
      </div>
      <div className="dashboard-header">
        <div>
          <p className="mini-label">{isOwner ? 'Owner dashboard' : 'Admin dashboard'}</p>
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

      <div className="admin-panel">
        <div className="admin-panel-heading">
          <div>
            <p className="mini-label">Workspace</p>
            <h3>Operations overview</h3>
          </div>
          <span className="admin-badge">{isOwner ? 'Owner access' : 'Admin access'}</span>
        </div>
        <p className="admin-panel-copy">Open a dedicated page for payment review, catalog control, or owner tools from the admin navigation.</p>
        <div className="dashboard-grid">
          <div className="dashboard-card">
            <h3>Quick actions</h3>
            <ul>
              <li><button type="button" className="text-btn" onClick={() => navigate('/admin/payments')}>Review payments</button></li>
              <li><button type="button" className="text-btn" onClick={() => navigate('/admin/catalog')}>Manage catalog</button></li>
              {isOwner && <li><button type="button" className="text-btn" onClick={() => navigate('/owner')}>Owner controls</button></li>}
            </ul>
          </div>
          <div className="dashboard-card">
            <h3>Latest status</h3>
            <ul>
              <li>Courses in management: {adminCourses.length}</li>
              <li>Payments awaiting review: {adminEnrollments.length}</li>
              <li>Role: {isOwner ? 'Owner' : 'Admin'}</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

export function AdminPaymentsPage({ adminEnrollments, formatMoney, approveEnrollment }) {
  return (
    <section className="admin-panel admin-shell-panel">
      <div className="page-intro admin-route-intro">
        <div>
          <p className="mini-label">Admin workspace</p>
          <h2>Payment review</h2>
        </div>
        <span className="page-intro-badge admin-badge-pill">Transactions</span>
      </div>
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
    </section>
  );
}
