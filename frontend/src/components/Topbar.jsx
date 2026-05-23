import { useNavigate, useLocation } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import ProfileMenu from './ProfileMenu';

/**
 * Topbar — top navigation bar for the marketplace app.
 */
export default function Topbar({ topbarStatus, onShowAll, onShowPremium, theme, onToggleTheme, onOpenLogin, onOpenSignup }) {
  const navigate = useNavigate();
  const location = useLocation();
  const isPremiumActive = new URLSearchParams(location.search).get('category') === 'premium';
  const { isAuthenticated } = useAuth();

  const handleHome = () => {
    onShowAll?.();
    navigate('/');
  };

  const handleAllTemplates = () => {
    onShowAll?.();
    navigate('/app');
  };

  return (
    <nav className="topbar" role="navigation" aria-label="Main navigation">

      {/* Brand */}
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

        {isAuthenticated ? (
          /* Profile avatar + dropdown */
          <ProfileMenu variant="topbar" />
        ) : (
          <button
            type="button"
            className="topbar-auth__register-btn"
            onClick={onOpenSignup}
            aria-label="Log in or create account"
          >
            Log in / Sign up
          </button>
        )}
      </div>

    </nav>
  );
}
