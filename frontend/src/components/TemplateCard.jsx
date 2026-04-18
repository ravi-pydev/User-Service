/**
 * TemplateCard — renders a single template card in the marketplace gallery.
 *
 * Props:
 *   template          {object}   - template data:
 *                                    id, name, description, category, type,
 *                                    is_premium, is_favorite, thumbnail_url (optional)
 *   onUse             {function} - called with template.id when "Use" is clicked
 *   onToggleFavorite  {function} - called with template.id when save/favorite is clicked
 */
export default function TemplateCard({ template, onUse, onToggleFavorite }) {
  const {
    id,
    name,
    description,
    type,
    is_premium,
    is_favorite,
    thumbnail_url,
  } = template;

  return (
    <div className="template-card">

      {/* ── Thumbnail ──────────────────────────────────────────────────── */}
      {thumbnail_url && (
        <img
          className="template-card-thumbnail"
          src={thumbnail_url}
          alt={`${name} thumbnail`}
        />
      )}

      {/* ── Premium badge ──────────────────────────────────────────────── */}
      {is_premium && (
        <span className="premium-badge" aria-label="Premium template">
          Premium
        </span>
      )}

      {/* ── Content ────────────────────────────────────────────────────── */}
      <h3 className="template-card-name">{name}</h3>
      <p className="template-card-description">{description}</p>
      <span className="type-badge">{type}</span>

      {/* ── Actions ────────────────────────────────────────────────────── */}
      <div className="template-card-actions">
        <button
          type="button"
          className="template-card-use-btn"
          onClick={() => onUse?.(id)}
          aria-label={`Use template: ${name}`}
        >
          Use
        </button>

        <button
          type="button"
          className="template-card-favorite-btn"
          onClick={() => onToggleFavorite?.(id)}
          aria-label={is_favorite ? `Remove ${name} from favorites` : `Save ${name} to favorites`}
          aria-pressed={Boolean(is_favorite)}
        >
          {is_favorite ? '♥' : '♡'}
        </button>
      </div>

    </div>
  );
}
