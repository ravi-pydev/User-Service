import TemplateCard from './TemplateCard';

/**
 * TemplateGallery — renders the full template grid.
 *
 * Props:
 *   templates         {object[]}  - array of template objects
 *   templateCount     {number}    - total count to display in the header
 *   onUse             {function}  - passed to each TemplateCard
 *   onToggleFavorite  {function}  - passed to each TemplateCard
 *   isPremiumView     {boolean}   - true when showing the premium listing page
 */
export default function TemplateGallery({
  templates = [],
  templateCount = 0,
  onUse,
  onToggleFavorite,
  isPremiumView = false,
}) {
  return (
    <section className="template-gallery" aria-label={isPremiumView ? 'Premium templates' : 'Template gallery'}>

      {/* ── Premium page hero ──────────────────────────────────────────── */}
      {isPremiumView && (
        <div className="gallery-premium-hero">
          <span className="gallery-premium-hero__icon">✦</span>
          <div>
            <h1 className="gallery-premium-hero__title">Premium Templates</h1>
            <p className="gallery-premium-hero__subtitle">
              Unlock advanced multi-step forms, HR onboarding flows, legal intakes, and more.
            </p>
          </div>
        </div>
      )}

      {/* ── Count header ───────────────────────────────────────────────── */}
      <p className="template-gallery-count">
        {templateCount} {isPremiumView ? 'premium' : ''} template{templateCount !== 1 ? 's' : ''}
      </p>

      {/* ── Grid ───────────────────────────────────────────────────────── */}
      <div className="template-grid" id="template-grid">
        {templates.length === 0 ? (
          <p className="template-gallery-empty">No templates found.</p>
        ) : (
          templates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              onUse={onUse}
              onToggleFavorite={onToggleFavorite}
            />
          ))
        )}
      </div>

    </section>
  );
}
