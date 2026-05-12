import { useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import ProfileMenu from './ProfileMenu';

/**
 * Header — site-wide navigation header used on the homepage and public pages.
 */
export default function Header({ onOpenLogin, onOpenSignup, theme, onToggleTheme }) {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  return (
    <header className="site-header" role="banner">
      {/* Brand */}
      <button
        type="button"
        className="site-header__brand"
        onClick={() => navigate('/')}
        aria-label="FormForge — go to home"
      >
        <span className="site-header__brand-icon">⬡</span>
        FormForge
      </button>

      {/* Nav links */}
      <nav className="site-header__nav" aria-label="Site navigation">
        <button
          type="button"
          className="site-header__nav-link"
          onClick={() => navigate('/app')}
        >
          Templates
        </button>
        <button
          type="button"
          className="site-header__nav-link"
          onClick={() => navigate('/app?category=premium')}
        >
          Premium ✦
        </button>
      </nav>

      {/* Right side */}
      <div className="site-header__actions">
        {/* Theme toggle */}
        <button
          type="button"
          className="site-header__theme-btn"
          onClick={onToggleTheme}
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>

        {isAuthenticated ? (
          /* Profile avatar + dropdown */
          <ProfileMenu variant="header" />
        ) : (
          <button
            type="button"
            className="site-header__btn site-header__btn--primary"
            onClick={onOpenSignup}
          >
            Log in / Sign up
          </button>
        )}
      </div>
    </header>
  );
}
