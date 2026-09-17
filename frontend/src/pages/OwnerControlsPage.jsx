export function OwnerControlsPage({ adminUsers, handleRoleChange, handleDeleteUser }) {
  return (
    <section className="admin-panel admin-shell-panel owner-shell-panel">
      <div className="page-intro admin-route-intro owner-route-intro">
        <div>
          <p className="mini-label">Owner workspace</p>
          <h2>User access</h2>
        </div>
        <span className="page-intro-badge owner-badge-pill">Super admin</span>
      </div>
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
