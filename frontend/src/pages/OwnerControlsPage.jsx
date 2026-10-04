export function OwnerControlsPage({ adminUsers, handleRoleChange, handleDeleteUser }) {
  const launchSummary = [
    { label: 'Marketing engine', value: 'Meta + WhatsApp', detail: 'Lead generation through low-budget ad testing and direct social follow-up.' },
    { label: 'Content pipeline', value: '4 modules', detail: 'Aviation, OTA, GDS, and visa processing path remain the main learning sequence.' },
    { label: 'Institutional outreach', value: 'Planned', detail: 'University and department visits will extend the campaign beyond the web.' },
    { label: 'Support workflow', value: 'Active', detail: 'Student onboarding and approval steps are tracked through the portal and support channels.' },
  ];

  const activeAdmins = adminUsers.filter((account) => account.role === 'admin').length;
  const studentUsers = adminUsers.filter((account) => account.role === 'student').length;

  return (
    <section className="admin-panel admin-shell-panel owner-shell-panel">
      <div className="page-intro admin-route-intro owner-route-intro">
        <div>
          <p className="mini-label">Owner workspace</p>
          <h2>Launch command center</h2>
        </div>
        <span className="page-intro-badge owner-badge-pill">Super admin</span>
      </div>

      <div className="owner-summary-grid">
        {launchSummary.map((item) => (
          <div className="owner-summary-card" key={item.label}>
            <p>{item.label}</p>
            <h3>{item.value}</h3>
            <span>{item.detail}</span>
          </div>
        ))}
      </div>

      <div className="admin-panel-heading">
        <div>
          <p className="mini-label">Owner controls</p>
          <h3>User access</h3>
        </div>
        <span className="admin-badge">Super admin</span>
      </div>
      <p className="admin-panel-copy">Promote trusted students to portal admins. The super admin account cannot be changed from this screen.</p>

      <div className="owner-quick-grid">
        <div className="dashboard-card owner-mini-panel">
          <h3>Portfolio status</h3>
          <ul>
            <li>Active student accounts: {studentUsers}</li>
            <li>Portal admins: {activeAdmins}</li>
            <li>Launch focus: first-cohort conversion</li>
          </ul>
        </div>
        <div className="dashboard-card owner-mini-panel">
          <h3>Operational priorities</h3>
          <ul>
            <li>Record and publish lesson content</li>
            <li>Continue Meta lead generation</li>
            <li>Review payment approvals daily</li>
            <li>Follow up with institution leads</li>
          </ul>
        </div>
      </div>

      <div className="user-table-wrap">
        <table className="user-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Role</th>
              <th>Enrollment</th>
              <th>Access</th>
              <th>Manage</th>
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
                <td>
                  {account.role === 'super_admin' ? (
                    <span className="muted-text">Protected</span>
                  ) : (
                    <button type="button" className="text-btn danger-btn" onClick={() => handleDeleteUser(account)}>Delete</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
