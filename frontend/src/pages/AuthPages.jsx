export function AuthPage({
  mode,
  authForm,
  showPassword,
  status,
  handleAuthChange,
  handleAuthSubmit,
  setShowPassword,
  setAuthMode,
  navigate,
}) {
  return (
    <section className="auth-shell">
      <div className="page-intro auth-page-intro">
        <div>
          <p className="mini-label">Student portal</p>
          <h2>{mode === 'login' ? 'Login' : 'Register'}</h2>
        </div>
        <span className="page-intro-badge auth-badge">{mode === 'login' ? 'Account access' : 'New student'}</span>
      </div>
      <div className="auth-card">
        <p className="mini-label">Student portal</p>
        <h2>{mode === 'login' ? 'Welcome back' : 'Create your account'}</h2>

        <form onSubmit={handleAuthSubmit} className="lead-form auth-form">
          {mode === 'register' && (
            <label>
              Full name
              <input type="text" name="fullName" value={authForm.fullName} onChange={handleAuthChange} placeholder="Jane Doe" required />
            </label>
          )}

          <label>
            Email address
            <input type="email" name="email" value={authForm.email} onChange={handleAuthChange} placeholder="jane@example.com" required />
          </label>

          {mode === 'register' && (
            <>
              <label>
                Phone number
                <input type="tel" name="phone" value={authForm.phone} onChange={handleAuthChange} placeholder="0803 000 0000" />
              </label>
              <label>
                Institution
                <input type="text" name="institution" value={authForm.institution} onChange={handleAuthChange} placeholder="University of Lagos" />
              </label>
            </>
          )}

          <label>
            Password
            <span className="password-field">
              <input type={showPassword ? 'text' : 'password'} name="password" value={authForm.password} onChange={handleAuthChange} placeholder="Enter your password" required />
              <button type="button" className="password-toggle" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? 'Hide password' : 'Show password'} title={showPassword ? 'Hide password' : 'Show password'}>
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </span>
          </label>

          <button type="submit" className="primary-btn block-btn">
            {mode === 'login' ? 'Login to dashboard' : 'Create account'}
          </button>
        </form>

        <div className="switch-row">
          <button
            type="button"
            className="text-btn"
            onClick={() => {
              const nextMode = mode === 'login' ? 'register' : 'login';
              setAuthMode(nextMode);
              navigate(nextMode === 'login' ? '/login' : '/register');
            }}
          >
            {mode === 'login' ? 'Need an account? Register' : 'Already have an account? Login'}
          </button>
        </div>

        {status ? <p className="form-status">{status}</p> : null}
      </div>
    </section>
  );
}
