import { useState, useRef, useEffect } from 'react';
import useAuth from '../hooks/useAuth';

/**
 * ProfileMenu — avatar button that opens a dropdown with user info + logout.
 *
 * Props:
 *   variant  {'topbar'|'header'}  - controls colour scheme
 */
export default function ProfileMenu({ variant = 'topbar' }) {
  const { user, logout, isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open]);

  if (!isAuthenticated || !user) return null;

  // Generate initials safely — username may be undefined in edge cases
  const username = user.username ?? '';
  const initials = username
    .split(/[\s_-]+/)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .slice(0, 2)
    .join('') || username[0]?.toUpperCase() || '?';

  const handleLogout = () => {
    setOpen(false);
    logout();
  };

  return (
    <div
      className={`profile-menu profile-menu--${variant}`}
      ref={containerRef}
    >
      {/* Avatar trigger */}
      <button
        type="button"
        className="profile-menu__avatar"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="true"
        aria-expanded={open}
        aria-label={`${username} — account menu`}
        title={username}
      >
        {initials}
        {/* Online indicator dot */}
        <span className="profile-menu__online-dot" aria-hidden="true" />
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="profile-menu__dropdown"
          role="menu"
          aria-label="Account menu"
        >
          {/* User info header */}
          <div className="profile-menu__info">
            <div className="profile-menu__avatar-lg" aria-hidden="true">
              {initials}
            </div>
            <div className="profile-menu__details">
              <span className="profile-menu__name">{username}</span>
              <span className="profile-menu__email">{user.email}</span>
            </div>
          </div>

          <div className="profile-menu__divider" />

          {/* Tier badge */}
          <div className="profile-menu__tier">
            <span className={`profile-menu__tier-badge${user.is_premium ? ' profile-menu__tier-badge--premium' : ''}`}>
              {user.is_premium ? '✦ Premium' : 'Free plan'}
            </span>
          </div>

          <div className="profile-menu__divider" />

          {/* Actions */}
          <button
            type="button"
            className="profile-menu__item profile-menu__item--logout"
            role="menuitem"
            onClick={handleLogout}
          >
            <span className="profile-menu__item-icon" aria-hidden="true">↩</span>
            Log out
          </button>
        </div>
      )}
    </div>
  );
}
