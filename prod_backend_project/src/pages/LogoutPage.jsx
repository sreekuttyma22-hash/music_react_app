import './AuthPages.css';

function LogoutPage({ onLogin, onCreateAccount }) {
  return (
    <main className="auth-page auth-page-centered">
      <section className="logout-panel">
        <div className="logout-icon" aria-hidden="true">✓</div>
        <p className="auth-kicker">Melody Music Institute</p>
        <h1>You’re all signed out</h1>
        <p>Your staff workspace is closed. Come back whenever you’re ready for the next note.</p>
        <div className="logout-actions">
          <button className="auth-primary-button" type="button" onClick={onLogin}>Log in again</button>
          <button className="auth-secondary-button" type="button" onClick={onCreateAccount}>Create an account</button>
        </div>
      </section>
    </main>
  );
}

export default LogoutPage;
