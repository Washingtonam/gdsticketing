import { useMemo, useState } from 'react';

export function AdminDashboardPage({ user, dashboardMetrics, adminCourses, adminEnrollments, navigate, logout }) {
  const isOwner = user?.role === 'super_admin';
  const launchChecklist = [
    { title: 'Video content', status: 'In progress', detail: 'Record and upload short lessons for Modules 1–4.' },
    { title: 'PDF resource bank', status: 'Ready', detail: 'Prepare airline and airport code guides for download.' },
    { title: 'Lead generation', status: 'Active', detail: 'Run micro-budget Meta campaigns and collect student interest.' },
    { title: 'Institution outreach', status: 'Planned', detail: 'Schedule UniBen, Wellspring, and department presentations.' },
    { title: 'Payment approval', status: 'Active', detail: 'Review Paystack confirmations and approve student access.' },
    { title: 'Student follow-up', status: 'Active', detail: 'Use WhatsApp and email to confirm onboarding and next steps.' },
  ];

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
              <li><button type="button" className="text-btn" onClick={() => navigate('/admin/payment-review')}>Review payments</button></li>
              <li><button type="button" className="text-btn" onClick={() => navigate('/admin/follow-up')}>Student follow-up</button></li>
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
          <div className="dashboard-card">
            <h3>Launch readiness</h3>
            <ul>
              <li>✓ Public course catalog is published</li>
              <li>✓ Payment review and approval flow is active</li>
              <li>✓ Student dashboard lists approval and support status</li>
              <li>✓ First cohort onboarding should start from the support channel</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="admin-panel launch-panel">
        <div className="admin-panel-heading">
          <div>
            <p className="mini-label">Launch board</p>
            <h3>First cohort action board</h3>
          </div>
          <span className="admin-badge">Cohort 1</span>
        </div>
        <div className="launch-checklist-grid">
          {launchChecklist.map((item) => (
            <div key={item.title} className="launch-checklist-item">
              <div className="launch-item-topline">
                <strong>{item.title}</strong>
                <span>{item.status}</span>
              </div>
              <p>{item.detail}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const formatDate = (value) => value
  ? new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
  : '—';

const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}[character]));

export function AdminPaymentsPage({ adminEnrollments, transactions, formatMoney, approveEnrollment }) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [courseFilter, setCourseFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const courses = [...new Set(transactions.map((item) => item.course?.title).filter(Boolean))].sort();

  const filteredTransactions = useMemo(() => transactions.filter((item) => {
    const query = search.trim().toLowerCase();
    const matchesSearch = !query || [
      item.student?.fullName,
      item.student?.email,
      item.paymentReference,
      item.transactionId,
      item.course?.title,
    ].some((value) => String(value || '').toLowerCase().includes(query));
    const createdAt = item.createdAt ? new Date(item.createdAt) : null;
    const afterStart = !dateFrom || (createdAt && createdAt >= new Date(`${dateFrom}T00:00:00`));
    const beforeEnd = !dateTo || (createdAt && createdAt < new Date(`${dateTo}T00:00:00`).setDate(new Date(`${dateTo}T00:00:00`).getDate() + 1));
    return matchesSearch
      && (statusFilter === 'all' || item.status === statusFilter)
      && (courseFilter === 'all' || item.course?.title === courseFilter)
      && afterStart
      && beforeEnd;
  }), [transactions, search, statusFilter, courseFilter, dateFrom, dateTo]);

  const exportCsv = () => {
    const columns = ['Transaction ID', 'Student', 'Email', 'Course', 'Amount', 'Currency', 'Status', 'Payment date'];
    const rows = filteredTransactions.map((item) => [
      item.transactionId || item.paymentReference || item.id,
      item.student?.fullName,
      item.student?.email,
      item.course?.title,
      item.amount,
      item.currency,
      item.status,
      item.createdAt,
    ]);
    const csv = [columns, ...rows]
      .map((row) => row.map((value) => {
        const text = String(value ?? '');
        const spreadsheetSafeText = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
        return `"${spreadsheetSafeText.replace(/"/g, '""')}"`;
      }).join(','))
      .join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'payment-transactions.csv';
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const exportPdf = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      window.alert('Allow pop-ups to open the printable transaction report.');
      return;
    }
    const rows = filteredTransactions.map((item) => `<tr>
      <td>${escapeHtml(item.transactionId || item.paymentReference || item.id)}</td>
      <td>${escapeHtml(item.student?.fullName)}</td>
      <td>${escapeHtml(item.student?.email)}</td>
      <td>${escapeHtml(item.course?.title)}</td>
      <td>${escapeHtml(formatMoney(item.amount, item.currency))}</td>
      <td>${escapeHtml(item.status)}</td>
      <td>${escapeHtml(formatDate(item.createdAt))}</td>
    </tr>`).join('');
    const report = `<!doctype html><html><head><title>Payment transactions</title>
      <style>body{font:12px Arial,sans-serif;padding:24px;color:#172033}h1{font-size:20px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #cbd5e1;padding:7px;text-align:left}th{background:#f1f5f9}</style>
      </head><body><h1>Payment transaction report</h1><p>${filteredTransactions.length} transaction(s)</p>
      <table><thead><tr><th>Transaction ID</th><th>Student</th><th>Email</th><th>Course</th><th>Amount</th><th>Status</th><th>Date</th></tr></thead><tbody>${rows}</tbody></table>
      <script>window.onload=()=>window.print()</script></body></html>`;
    printWindow.document.write(report);
    printWindow.document.close();
  };

  return (
    <section className="admin-panel admin-shell-panel">
      <div className="page-intro admin-route-intro">
        <div>
          <p className="mini-label">Admin workspace</p>
          <h2>Payment review</h2>
        </div>
        <span className="page-intro-badge admin-badge-pill">{transactions.length} transactions</span>
      </div>
      <div className="admin-panel-heading">
        <div>
          <p className="mini-label">Payment review</p>
          <h3>Transaction log</h3>
        </div>
        <span className="admin-badge">{adminEnrollments.length} awaiting approval</span>
      </div>
      <p className="admin-panel-copy">Search and filter the payment history. Approve access only after a confirmed payment is verified.</p>
      <div className="admin-filter-bar">
        <label>Search<input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Student, course, or reference" /></label>
        <label>From<input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} /></label>
        <label>To<input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} /></label>
        <label>Status<select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
          <option value="all">All statuses</option>
          {[...new Set(transactions.map((item) => item.status))].sort().map((status) => <option key={status} value={status}>{status.replaceAll('_', ' ')}</option>)}
        </select></label>
        <label>Course<select value={courseFilter} onChange={(event) => setCourseFilter(event.target.value)}>
          <option value="all">All courses</option>
          {courses.map((course) => <option key={course} value={course}>{course}</option>)}
        </select></label>
        <div className="admin-export-actions">
          <button type="button" className="secondary-btn" onClick={exportCsv}>Export CSV</button>
          <button type="button" className="secondary-btn" onClick={exportPdf}>Export PDF</button>
        </div>
      </div>
      <div className="user-table-wrap">
        <table className="user-table transaction-table">
          <thead>
            <tr><th>Date</th><th>Student</th><th>Course</th><th>Amount</th><th>Transaction ID</th><th>Status</th><th>Action</th></tr>
          </thead>
          <tbody>
            {filteredTransactions.length ? filteredTransactions.map((transaction) => (
              <tr key={transaction.id}>
                <td>{formatDate(transaction.createdAt)}</td>
                <td><strong>{transaction.student?.fullName || 'Unknown student'}</strong><span>{transaction.student?.email || ''}</span></td>
                <td>{transaction.course?.title || 'Unknown course'}</td>
                <td>{formatMoney(transaction.amount, transaction.currency)}</td>
                <td>{transaction.transactionId || transaction.paymentReference || transaction.id}</td>
                <td><span className={`transaction-status status-${transaction.status}`}>{transaction.status.replaceAll('_', ' ')}</span></td>
                <td>{adminEnrollments.some((item) => item.id === transaction.id)
                  ? <button type="button" className="primary-btn" onClick={() => approveEnrollment(adminEnrollments.find((item) => item.id === transaction.id))}>Approve access</button>
                  : '—'}</td>
              </tr>
            )) : (
              <tr><td colSpan="7" className="muted-text">No transactions match these filters.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

const followUpTemplates = {
  onboarding: {
    label: 'Welcome & onboarding',
    message: (student) => `Hello ${student.fullName}, welcome to your course! Please sign in to your student dashboard to review your course materials and next steps. Reply if you need any help getting started.`,
  },
  payment: {
    label: 'Payment confirmation',
    message: (student) => `Hello ${student.fullName}, we have received your payment and are reviewing your course access. We will let you know when your onboarding is complete.`,
  },
  checkIn: {
    label: 'Student check-in',
    message: (student) => `Hello ${student.fullName}, just checking in to see how you are getting on with your course onboarding. Please reply if you need any support.`,
  },
};

export function AdminFollowUpPage({ students, updateStudentStatus, prepareFollowUp }) {
  const [search, setSearch] = useState('');
  const visibleStudents = useMemo(() => students.filter((student) => {
    const query = search.trim().toLowerCase();
    return !query || [student.fullName, student.email, student.phone, student.institution]
      .some((value) => String(value || '').toLowerCase().includes(query));
  }), [students, search]);

  return (
    <section className="admin-panel admin-shell-panel">
      <div className="page-intro admin-route-intro">
        <div><p className="mini-label">Admin workspace</p><h2>Student follow-up</h2></div>
        <span className="page-intro-badge admin-badge-pill">{students.length} students</span>
      </div>
      <div className="admin-panel-heading">
        <div><p className="mini-label">Cohort onboarding</p><h3>Follow-up queue</h3></div>
        <span className="admin-badge">{students.filter((student) => student.status !== 'onboarded').length} to onboard</span>
      </div>
      <p className="admin-panel-copy">Track each student’s onboarding progress, prepare a WhatsApp or email follow-up, and review the interaction history.</p>
      <div className="admin-filter-bar follow-up-filter">
        <label>Find a student<input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Name, email, phone, or institution" /></label>
      </div>
      <div className="follow-up-list">
        {visibleStudents.length ? visibleStudents.map((student) => (
          <article className="follow-up-card" key={student.id}>
            <div className="follow-up-channel-status">
              {['whatsapp', 'email'].map((channel) => {
                const lastInteraction = (student.interactions || [])
                  .filter((interaction) => interaction.channel === channel)
                  .sort((first, second) => new Date(second.createdAt) - new Date(first.createdAt))[0];
                return (
                  <span key={channel}>
                    {channel === 'whatsapp' ? 'WhatsApp' : 'Email'}: {lastInteraction ? `Template prepared · ${formatDate(lastInteraction.createdAt)}` : 'Not contacted'}
                  </span>
                );
              })}
            </div>
            <div className="follow-up-student">
              <div>
                <p className="mini-label">{student.institution || 'Student'}</p>
                <h3>{student.fullName}</h3>
                <p><a href={`mailto:${student.email}`}>{student.email}</a>{student.phone && <> · <a href={`tel:${student.phone}`}>{student.phone}</a></>}</p>
              </div>
              <label className="follow-up-status">Onboarding status
                <select value={student.status || 'new'} onChange={(event) => updateStudentStatus(student.id, event.target.value)}>
                  <option value="new">New</option>
                  <option value="contacted">Contacted</option>
                  <option value="responded">Responded</option>
                  <option value="onboarded">Onboarded</option>
                </select>
              </label>
            </div>
            <div className="follow-up-actions">
              {Object.entries(followUpTemplates).map(([key, template]) => (
                <div className="follow-up-template" key={key}>
                  <strong>{template.label}</strong>
                  <div>
                    <button type="button" className="text-btn" onClick={() => prepareFollowUp(student, 'whatsapp', template.label, template.message(student))} disabled={!student.phone}>WhatsApp</button>
                    <button type="button" className="text-btn" onClick={() => prepareFollowUp(student, 'email', template.label, template.message(student))}>Email</button>
                  </div>
                </div>
              ))}
            </div>
            <details className="follow-up-history">
              <summary>Interaction history ({student.interactions?.length || 0})</summary>
              {student.interactions?.length ? (
                <ul>{student.interactions.map((interaction, index) => (
                  <li key={`${interaction.createdAt}-${index}`}>
                    <strong>{interaction.template}</strong>
                    <span>{interaction.channel} · {formatDate(interaction.createdAt)}</span>
                  </li>
                ))}</ul>
              ) : <p>No follow-up interactions recorded yet.</p>}
            </details>
          </article>
        )) : <p className="muted-text">No students match this search.</p>}
      </div>
    </section>
  );
}
