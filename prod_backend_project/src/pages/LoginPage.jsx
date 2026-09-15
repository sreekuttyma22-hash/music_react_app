import { useState } from 'react';
import API_CONFIG from '../apiConfig';
import { apiRequest, clearStaffSession, isStaffAdmin, isStaffApproved, saveStaffProfile } from '../apiClient';
import './AuthPages.css';

function LoginPage({ onLogin, onCreateAccount }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!email.trim() || !password) {
      setError('Enter your email and password to continue.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await apiRequest(API_CONFIG.ENDPOINTS.STAFF_LOGIN, {
        method: 'POST',
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const accessToken = response.access || response.access_token || response.token || response.tokens?.access;
      const refreshToken = response.refresh || response.refresh_token || response.tokens?.refresh;

      if (!accessToken) {
        throw new Error('Login response did not include an access token.');
      }

      localStorage.setItem('staff_access_token', accessToken);
      if (refreshToken) {
        localStorage.setItem('staff_refresh_token', refreshToken);
      }
      
      const staffProfile = response.staff || {};
      saveStaffProfile(staffProfile);

      if (!isStaffApproved()) {
        clearStaffSession();
        setError(staffProfile.is_active === false
          ? 'Your account is inactive. Contact an administrator.'
          : 'Your account is waiting for administrator approval.');
        return;
      }

      const destination = isStaffAdmin() ? 'admin' : 'app';
      onLogin(destination);
    } catch (requestError) {
      const errorMessage = requestError.message || 'Unable to log in. Please try again.';
      
      // Handle specific authentication states
      if (errorMessage.includes('awaiting administrator approval')) {
        setError('Your account is waiting for administrator approval.');
      } else if (errorMessage.includes('inactive')) {
        setError('Your account is inactive. Contact an administrator.');
      } else {
        setError(errorMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-brand-panel">
        <div className="auth-brand-mark" aria-hidden="true">♪</div>
        <p className="auth-eyebrow">Melody Music Institute</p>
        <h1>Every great lesson starts with a single note.</h1>
        <p className="auth-brand-copy">A calm, connected space for the people who keep every class in tune.</p>
        <div className="auth-staff-note" aria-hidden="true">
          <span>♫</span><span>♪</span><span>♩</span><span>♬</span>
        </div>
      </section>

      <section className="auth-form-panel">
        <div className="auth-form-wrap">
          {/* <p className="auth-kicker">Admin portal</p> */}
          <h2>Welcome back</h2>
          <p className="auth-intro">Sign in to manage your institute workspace.</p>

          <form className="auth-form" onSubmit={handleSubmit}>
            <label htmlFor="email">Email address</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Enter your email address"
              autoComplete="email"
            />

            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter your password"
              autoComplete="current-password"
            />

            {error && <p className="auth-error" role="alert">{error}</p>}

            <button className="auth-primary-button" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Signing in...' : 'Log in'}
            </button>
          </form>

          <p className="auth-switch">New staff member? <button type="button" onClick={onCreateAccount}>Create an account</button></p>
        </div>
      </section>
    </main>
  );
}

export default LoginPage;
