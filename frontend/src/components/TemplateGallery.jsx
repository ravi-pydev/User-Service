import TemplateCard from './TemplateCard';

/* ── Hero config map ─────────────────────────────────────────────────────────
   Each entry defines the hero shown for a specific filter combination.
   Keys are checked in order — first match wins.
   ─────────────────────────────────────────────────────────────────────────── */
const HERO_CONFIG = [
  // ── Category ──────────────────────────────────────────────────────────────
  {
    match: (f) => f.category === 'premium',
    icon: '✦',
    gradient: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
    title: 'Premium Templates',
    subtitle: 'Unlock advanced multi-step forms, HR onboarding flows, legal intakes, and more.',
  },
  {
    match: (f) => f.category === 'basic',
    icon: '🆓',
    gradient: 'linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%)',
    title: 'Free Templates',
    subtitle: 'Fully featured templates available on every plan — no credit card required.',
  },

  // ── Layout ────────────────────────────────────────────────────────────────
  {
    match: (f) => f.layout === 'multi-step',
    icon: '🪜',
    gradient: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
    title: 'Multi-Step Forms',
    subtitle: 'Break long forms into guided steps to improve completion rates.',
  },
  {
    match: (f) => f.layout === 'two-column',
    icon: '⬛⬛',
    gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    title: 'Two-Column Layouts',
    subtitle: 'Compact, side-by-side field layouts that make the most of wider screens.',
  },
  {
    match: (f) => f.layout === 'single-column',
    icon: '▬',
    gradient: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
    title: 'Single-Column Forms',
    subtitle: 'Clean, focused layouts that guide users through one field at a time.',
  },

  // ── Field count ───────────────────────────────────────────────────────────
  {
    match: (f) => f.field_count === 'large',
    icon: '📋',
    gradient: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
    title: 'Large Forms (7+ fields)',
    subtitle: 'Comprehensive forms for detailed data collection — applications, surveys, and more.',
  },
  {
    match: (f) => f.field_count === 'medium',
    icon: '📝',
    gradient: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
    title: 'Medium Forms (4–6 fields)',
    subtitle: 'The sweet spot — enough fields to gather what you need without overwhelming users.',
  },
  {
    match: (f) => f.field_count === 'small',
    icon: '⚡',
    gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    title: 'Quick Forms (≤ 3 fields)',
    subtitle: 'Minimal friction, maximum conversions. Perfect for lead capture and sign-ups.',
  },

  // ── Has required fields ───────────────────────────────────────────────────
  {
    match: (f) => f.has_required,
    icon: '✅',
    gradient: 'linear-gradient(135deg, #10b981 0%, #047857 100%)',
    title: 'Forms with Required Fields',
    subtitle: 'Templates that enforce mandatory inputs — ideal for compliance and data integrity.',
  },

  // ── Field type ────────────────────────────────────────────────────────────
  {
    match: (f) => f.field_type === 'email',
    icon: '📧',
    gradient: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
    title: 'Email Field Templates',
    subtitle: 'Forms that include email capture — newsletters, registrations, and contact forms.',
  },
  {
    match: (f) => f.field_type === 'date',
    icon: '📅',
    gradient: 'linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)',
    title: 'Date Field Templates',
    subtitle: 'Templates with date pickers — bookings, appointments, and event registrations.',
  },
  {
    match: (f) => f.field_type === 'dropdown',
    icon: '🔽',
    gradient: 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)',
    title: 'Dropdown Field Templates',
    subtitle: 'Forms with select menus — great for categorised choices and structured responses.',
  },
  {
    match: (f) => f.field_type === 'textarea',
    icon: '💬',
    gradient: 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)',
    title: 'Long-Text Field Templates',
    subtitle: 'Templates with textarea inputs — feedback forms, support tickets, and open-ended surveys.',
  },
  {
    match: (f) => f.field_type === 'checkbox',
    icon: '☑️',
    gradient: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
    title: 'Checkbox Field Templates',
    subtitle: 'Forms with multi-select options — consent forms, preference surveys, and checklists.',
  },
  {
    match: (f) => f.field_type === 'password',
    icon: '🔒',
    gradient: 'linear-gradient(135deg, #64748b 0%, #475569 100%)',
    title: 'Password Field Templates',
    subtitle: 'Registration and authentication forms that include secure password inputs.',
  },
  {
    match: (f) => f.field_type === 'text',
    icon: '🔤',
    gradient: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
    title: 'Text Field Templates',
    subtitle: 'Versatile forms built around free-text inputs — names, addresses, and custom data.',
  },

  // ── Search ────────────────────────────────────────────────────────────────
  {
    match: (f) => Boolean(f.search?.trim()),
    icon: '🔍',
    gradient: 'linear-gradient(135deg, #6b7280 0%, #374151 100%)',
    title: (f) => `Search: "${f.search.trim()}"`,
    subtitle: 'Showing templates that match your search query.',
  },

  // ── Template type (dynamic) ───────────────────────────────────────────────
  {
    match: (f) => Boolean(f.type),
    icon: '📂',
    gradient: 'linear-gradient(135deg, #1e40af 0%, #1d4ed8 100%)',
    title: (f) => `${f.type} Templates`,
    subtitle: (f) => `Browsing all templates in the "${f.type}" category.`,
  },

  // ── Default (no filters) ──────────────────────────────────────────────────
  {
    match: () => true,
    icon: '🗂️',
    gradient: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
    title: 'All Templates',
    subtitle: 'Browse our full library of professionally designed form templates.',
  },
];

/**
 * Resolve the hero config for the current filter state.
 */
function resolveHero(filters) {
  const config = HERO_CONFIG.find((c) => c.match(filters)) ?? HERO_CONFIG[HERO_CONFIG.length - 1];
  return {
    icon: config.icon,
    gradient: config.gradient,
    title: typeof config.title === 'function' ? config.title(filters) : config.title,
    subtitle: typeof config.subtitle === 'function' ? config.subtitle(filters) : config.subtitle,
  };
}

/**
 * TemplateGallery — renders the full template grid with a dynamic hero section.
 *
 * Props:
 *   templates         {object[]}  - array of template objects
 *   templateCount     {number}    - total count to display in the header
 *   filters           {object}    - current filter state (drives the hero)
 *   onUse             {function}  - passed to each TemplateCard
 *   onToggleFavorite  {function}  - passed to each TemplateCard
 *   isPremiumView     {boolean}   - kept for backward compat (overrides hero to premium)
 */
export default function TemplateGallery({
  templates = [],
  templateCount = 0,
  filters = {},
  onUse,
  onToggleFavorite,
  isPremiumView = false,
}) {
  // isPremiumView forces the premium hero regardless of filter state
  const effectiveFilters = isPremiumView ? { ...filters, category: 'premium' } : filters;
  const hero = resolveHero(effectiveFilters);

  return (
    <section
      className="template-gallery"
      aria-label={hero.title}
    >
      {/* ── Dynamic hero banner ────────────────────────────────────────── */}
      <div
        className="gallery-hero"
        style={{ background: hero.gradient }}
        aria-hidden="false"
      >
        <span className="gallery-hero__icon" aria-hidden="true">{hero.icon}</span>
        <div className="gallery-hero__text">
          <h1 className="gallery-hero__title">{hero.title}</h1>
          <p className="gallery-hero__subtitle">{hero.subtitle}</p>
        </div>
        <span className="gallery-hero__count" aria-label={`${templateCount} templates`}>
          {templateCount} template{templateCount !== 1 ? 's' : ''}
        </span>
      </div>

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
