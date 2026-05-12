import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiFetch } from '../api/client.js';
import TemplateIcon from './TemplateIcon.jsx';

/**
 * TemplateDetailPage — full detail view for a single template.
 *
 * Fetches the template by id from /api/templates/:id/
 * Shows metadata, field schema, and Use / Favorite actions.
 *
 * Props:
 *   user              {object|null}  - current user (to know premium status)
 *   onUse             {function}     - called with template.id to open in builder
 *   onToggleFavorite  {function}     - called with template.id to toggle favorite
 *   onOpenLogin       {function}     - opens the login modal (for unauthenticated users)
 */
export default function TemplateDetailPage({ user, onUse, onToggleFavorite, onOpenLogin }) {
  const { id } = useParams();
  const navigate = useNavigate();

  const [template, setTemplate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [favoriteLoading, setFavoriteLoading] = useState(false);

  const fetchTemplate = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiFetch(`/api/templates/${id}/`);
      setTemplate(data);
    } catch (err) {
      if (err?.status === 401) {
        setError('login_required');
      } else if (err?.status === 403 && err?.payload?.code === 'premium_required') {
        setError('premium_required');
      } else {
        setError('Failed to load template details.');
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchTemplate();
  }, [fetchTemplate]);

  const handleUse = () => {
    onUse?.(Number(id));
  };

  const handleToggleFavorite = async () => {
    setFavoriteLoading(true);
    await onToggleFavorite?.(Number(id));
    // Refresh to get updated is_favorite
    await fetchTemplate();
    setFavoriteLoading(false);
  };

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="detail-page detail-page--loading" aria-busy="true">
        <div className="detail-page__spinner" aria-label="Loading template…" />
        <p>Loading template…</p>
      </div>
    );
  }

  // ── Login required ───────────────────────────────────────────────────────
  if (error === 'login_required') {
    return (
      <div className="detail-page detail-page--locked">
        <button className="detail-page__back-btn" onClick={() => navigate('/app')}>
          ← Back to gallery
        </button>
        <div className="detail-page__locked-banner">
          <span style={{ fontSize: '2.5rem' }}>🔒</span>
          <h1>Sign in to view this template</h1>
          <p>Create a free account or log in to access template details.</p>
          <button
            className="detail-page__use-btn"
            onClick={() => onOpenLogin?.()}
          >
            Log in / Sign up
          </button>
        </div>
      </div>
    );
  }

  // ── Premium locked (no schema returned) ─────────────────────────────────
  if (error === 'premium_required') {
    return (
      <div className="detail-page detail-page--locked">
        <button className="detail-page__back-btn" onClick={() => navigate('/app')}>
          ← Back to gallery
        </button>
        <div className="detail-page__locked-banner">
          <span className="premium-badge">Premium</span>
          <h1>Premium Template</h1>
          <p>Upgrade to Premium to view the full details and use this template.</p>
          <button
            className="detail-page__use-btn"
            onClick={handleUse}
          >
            Unlock with Premium
          </button>
        </div>
      </div>
    );
  }

  // ── Generic error ────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="detail-page detail-page--error">
        <button className="detail-page__back-btn" onClick={() => navigate('/app')}>
          ← Back to gallery
        </button>
        <p className="detail-page__error-msg">{error}</p>
      </div>
    );
  }

  if (!template) return null;

  const {
    name,
    description,
    template_type,
    category,
    is_premium,
    is_favorite,
    accent_color,
    thumbnail,
    schema,
  } = template;

  const fields = schema?.fields ?? [];
  const layout = schema?.layout ?? 'single-column';
  const steps = schema?.steps ?? [];

  // Group fields by step for multi-step layouts
  const fieldsByStep =
    layout === 'multi-step'
      ? steps.reduce((acc, stepName, idx) => {
          acc[idx + 1] = { name: stepName, fields: fields.filter((f) => f.step === idx + 1) };
          return acc;
        }, {})
      : null;

  return (
    <div className="detail-page">
      {/* ── Back navigation ──────────────────────────────────────────── */}
      <button className="detail-page__back-btn" onClick={() => navigate('/app')}>
        ← Back to gallery
      </button>

      {/* ── Hero header ──────────────────────────────────────────────── */}
      <div
        className="detail-page__hero"
        style={{ borderLeftColor: accent_color }}
      >
        <div className="detail-page__hero-thumb">
          <TemplateIcon
            templateType={template_type}
            accentColor={accent_color}
            name={name}
            size="detail"
          />
        </div>

        <div className="detail-page__hero-info">
          <div className="detail-page__hero-badges">
            <span className="type-badge">{template_type}</span>
            {is_premium && <span className="detail-page__premium-badge">Premium</span>}
            <span className="detail-page__category-badge">{category}</span>
          </div>
          <h1 className="detail-page__title">{name}</h1>
          <p className="detail-page__description">{description}</p>

          <div className="detail-page__actions">
            <button
              className="detail-page__use-btn"
              onClick={handleUse}
              style={{ background: accent_color }}
            >
              Use this template
            </button>
            <button
              className="detail-page__favorite-btn"
              onClick={handleToggleFavorite}
              disabled={favoriteLoading}
              aria-pressed={Boolean(is_favorite)}
              aria-label={is_favorite ? 'Remove from favorites' : 'Save to favorites'}
            >
              {is_favorite ? '♥ Saved' : '♡ Save'}
            </button>
          </div>
        </div>
      </div>

      {/* ── About section ────────────────────────────────────────────── */}
      <div className="detail-page__about">
        <h2 className="detail-page__section-title">About this template</h2>
        <p className="detail-page__about-text">{description}</p>
      </div>

      {/* ── Schema overview ──────────────────────────────────────────── */}
      <div className="detail-page__schema">
        <div className="detail-page__schema-meta">
          <div className="detail-page__meta-pill">
            <span className="detail-page__meta-label">Layout</span>
            <span className="detail-page__meta-value">{layout.replace('-', ' ')}</span>
          </div>
          <div className="detail-page__meta-pill">
            <span className="detail-page__meta-label">Fields</span>
            <span className="detail-page__meta-value">{fields.length}</span>
          </div>
          {steps.length > 0 && (
            <div className="detail-page__meta-pill">
              <span className="detail-page__meta-label">Steps</span>
              <span className="detail-page__meta-value">{steps.length}</span>
            </div>
          )}
          <div className="detail-page__meta-pill">
            <span className="detail-page__meta-label">Required fields</span>
            <span className="detail-page__meta-value">
              {fields.filter((f) => f.required).length}
            </span>
          </div>
        </div>

        {/* ── Field list ─────────────────────────────────────────────── */}
        <h2 className="detail-page__section-title">Form Fields</h2>

        {layout === 'multi-step' ? (
          <div className="detail-page__steps">
            {steps.map((stepName, idx) => {
              const stepNum = idx + 1;
              const stepFields = fieldsByStep[stepNum]?.fields ?? [];
              return (
                <div key={stepNum} className="detail-page__step">
                  <div className="detail-page__step-header">
                    <span className="detail-page__step-number">{stepNum}</span>
                    <h3 className="detail-page__step-name">{stepName}</h3>
                  </div>
                  <div className="detail-page__field-list">
                    {stepFields.map((field) => (
                      <FieldRow key={field.name} field={field} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="detail-page__field-list">
            {fields.map((field) => (
              <FieldRow key={field.name} field={field} />
            ))}
          </div>
        )}
      </div>

      {/* ── Bottom CTA ───────────────────────────────────────────────── */}
      <div className="detail-page__cta">
        <button
          className="detail-page__use-btn detail-page__use-btn--large"
          onClick={handleUse}
          style={{ background: accent_color }}
        >
          Use this template
        </button>
      </div>
    </div>
  );
}

/* ── FieldRow sub-component ─────────────────────────────────────────────── */
function FieldRow({ field }) {
  const typeLabels = {
    text: 'Text',
    email: 'Email',
    password: 'Password',
    textarea: 'Textarea',
    dropdown: 'Dropdown',
    date: 'Date',
    checkbox: 'Checkbox',
  };

  return (
    <div className="detail-page__field-row">
      <div className="detail-page__field-main">
        <span className="detail-page__field-label">{field.label}</span>
        {field.required && (
          <span className="detail-page__field-required" aria-label="Required">
            Required
          </span>
        )}
      </div>
      <div className="detail-page__field-meta">
        <span className="detail-page__field-type">{typeLabels[field.type] ?? field.type}</span>
        {field.placeholder && (
          <span className="detail-page__field-placeholder">e.g. "{field.placeholder}"</span>
        )}
        {field.options && (
          <span className="detail-page__field-options">
            Options: {field.options.join(', ')}
          </span>
        )}
      </div>
    </div>
  );
}
