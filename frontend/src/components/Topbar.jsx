/**
 * Topbar — top navigation bar for the User Service marketplace.
 *
 * Props:
 *   user          {object|null}  - current user ({ name, tier }) or null if not logged in
 *   topbarStatus  {string}       - status message to display (empty string = hidden)
 *   onShowAll     {function}     - called when "All Templates" button is clicked
 *   onShowPremium {function}     - called when "Premium" button is clicked
 */
export default function Topbar({ user, topbarStatus, onShowAll, onShowPremium }) {
  return (
    <nav className="topbar" role="navigation" aria-label="Main navigation">
      <div className="topbar-brand">User Service</div>

      <div className="topbar-nav">
        <button type="button" onClick={onShowAll} aria-label="Show all templates">
          All Templates
        </button>
        <button type="button" onClick={onShowPremium} aria-label="Show premium templates">
          Premium
        </button>
      </div>

      <div className="topbar-user">
        {user && (
          <span>
            {user.name}{' '}
            <span className="tier-badge">{user.tier}</span>
          </span>
        )}
        {topbarStatus && (
          <span className="topbar-status" role="status" aria-live="polite">
            {topbarStatus}
          </span>
        )}
      </div>
    </nav>
  );
}
