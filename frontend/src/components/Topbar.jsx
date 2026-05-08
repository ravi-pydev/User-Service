import { useNavigate, useLocation } from 'react-router-dom';

/**
 * Topbar — top navigation bar for FormForge.
 */
export default function Topbar({ user, topbarStatus, onShowAll, onShowPremium, onLogin, onRegister, theme, onToggleTheme }) {
  const navigate = useNavigate();
  const location = useLocation();
  const isPremiumActive = new URLSearchParams(location.search).get('category') === 'premium';

  const handleHome = () => {
    onShowAll?.();
    navigate('/');
  };

  const handleAllTemplates = () => {
    onShowAll?.();
    navigate('/');
  };

  return (
    <nav className="topbar" role="navigation" aria-label="Main navigation">

      {/* Brand — click goes home */}
      <button
        type="button"
        className="topbar-brand"
        onClick={handleHome}
        aria-label="FormForge — go to home"
      >
        <span className="topbar-brand__icon">⬡</span>
        FormForge
      </button>

      {/* Nav links */}
      <div className="topbar-nav">
        <button
          type="button"
          className={!isPremiumActive ? 'topbar-nav__btn--active' : ''}
          onClick={handleAllTemplates}
          aria-label="Show all templates"
          aria-current={!isPremiumActive ? 'page' : undefined}
        >
          All Templates
        </button>
        <button
          type="button"
          className={isPremiumActive ? 'topbar-nav__btn--active' : ''}
          onClick={onShowPremium}
          aria-label="Show premium templates"
          aria-current={isPremiumActive ? 'page' : undefined}
        >
          Premium ✦
        </button>
      </div>

      {/* Right side */}
      <div className="topbar-user">
        {topbarStatus && (
          <span className="topbar-status" role="status" aria-live="polite">
            {topbarStatus}
          </span>
        )}

        {/* Theme toggle */}
        <button
          type="button"
          className="topbar-theme-btn"
          onClick={onToggleTheme}
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>

        {user ? (
          <span className="topbar-user__info">
            <span className="topbar-user__name">{user.username}</span>
            <span className="tier-badge">{user.is_premium ? 'Premium' : 'Free'}</span>
          </span>
        ) : (
          <div className="topbar-auth">
            <button
              type="button"
              className="topbar-auth__login-btn"
              onClick={onLogin}
              aria-label="Log in"
            >
              Log in
            </button>
            <button
              type="button"
              className="topbar-auth__register-btn"
              onClick={onRegister}
              aria-label="Create account"
            >
              Sign up
            </button>
          </div>
        )}
      </div>

    </nav>
  );
}
