import TemplateCard from './TemplateCard';

/**
 * TemplateGallery — renders the full template grid.
 *
 * Props:
 *   templates         {object[]}  - array of template objects
 *   templateCount     {number}    - total count to display in the header
 *   onUse             {function}  - passed to each TemplateCard
 *   onToggleFavorite  {function}  - passed to each TemplateCard
 */
export default function TemplateGallery({
  templates = [],
  templateCount = 0,
  onUse,
  onToggleFavorite,
}) {
  return (
    <section className="template-gallery" aria-label="Template gallery">

      {/* ── Count header ───────────────────────────────────────────────── */}
      <p className="template-gallery-count">{templateCount} templates</p>

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
