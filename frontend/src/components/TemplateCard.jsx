import { useNavigate } from 'react-router-dom';
import TemplateIcon from './TemplateIcon';

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
    accent_color,
  } = template;

  const displayType = template_type ?? template.type;

  return (
    <div
      className="template-card template-card--clickable"
      onClick={() => navigate(`/app/templates/${id}`)}
      role="button"
      tabIndex={0}
      aria-label={`View details for ${name}`}
      onKeyDown={(e) => e.key === 'Enter' && navigate(`/app/templates/${id}`)}
    >

      {/* ── Thumbnail ──────────────────────────────────────────────────── */}
      <TemplateIcon
        templateType={displayType}
        accentColor={accent_color}
        name={name}
        size="card"
      />

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
