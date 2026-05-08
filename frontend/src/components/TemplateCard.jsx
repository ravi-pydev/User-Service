import { useNavigate } from 'react-router-dom';

/**
 * TemplateCard — renders a single template card in the marketplace gallery.
 * Clicking anywhere on the card navigates to the detail page.
 * Use and Favorite buttons stop propagation so they don't trigger navigation.
 *
 * Props:
 *   template          {object}   - template data
 *   onUse             {function} - called with template.id when "Use" is clicked
 *   onToggleFavorite  {function} - called with template.id when save/favorite is clicked
 */
export default function TemplateCard({ template, onUse, onToggleFavorite }) {
  const navigate = useNavigate();

  const {
    id,
    name,
    description,
    template_type,
    is_premium,
    is_favorite,
    thumbnail_url,
    accent_color,
    thumbnail,
  } = template;

  const displayType = template_type ?? template.type;

  return (
    <div
      className="template-card template-card--clickable"
      onClick={() => navigate(`/templates/${id}`)}
      role="button"
      tabIndex={0}
      aria-label={`View details for ${name}`}
      onKeyDown={(e) => e.key === 'Enter' && navigate(`/templates/${id}`)}
    >

      {/* ── Thumbnail / accent thumb ────────────────────────────────────── */}
      {thumbnail_url ? (
        <img
          className="template-card-thumbnail"
          src={thumbnail_url}
          alt={`${name} thumbnail`}
        />
      ) : thumbnail ? (
        <div
          className="template-card-thumb-placeholder"
          style={{ background: accent_color ?? '#3b82f6' }}
          aria-hidden="true"
        >
          {thumbnail}
        </div>
      ) : null}

      {/* ── Premium badge ──────────────────────────────────────────────── */}
      {is_premium && (
        <span className="premium-badge" aria-label="Premium template">
          Premium
        </span>
      )}

      {/* ── Content ────────────────────────────────────────────────────── */}
      <h3 className="template-card-name">{name}</h3>
      <p className="template-card-description">{description}</p>
      <span className="type-badge">{displayType}</span>

      {/* ── Actions ────────────────────────────────────────────────────── */}
      <div className="template-card-actions">
        <button
          type="button"
          className="template-card-use-btn"
          onClick={(e) => { e.stopPropagation(); onUse?.(id); }}
          aria-label={`Use template: ${name}`}
        >
          Use
        </button>

        <button
          type="button"
          className="template-card-favorite-btn"
          onClick={(e) => { e.stopPropagation(); onToggleFavorite?.(id); }}
          aria-label={is_favorite ? `Remove ${name} from favorites` : `Save ${name} to favorites`}
          aria-pressed={Boolean(is_favorite)}
        >
          {is_favorite ? '♥' : '♡'}
        </button>
      </div>

    </div>
  );
}
