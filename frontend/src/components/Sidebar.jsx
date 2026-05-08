/**
 * Sidebar — left sidebar for the User Service marketplace.
 *
 * Props:
 *   filters              {object}    - current filter state
 *   onSearchChange       {function}  - called with new search string
 *   onCategoryChange     {function}  - called with new category string
 *   onTypeChange         {function}  - called with new type string
 *   onLayoutChange       {function}  - called with new layout string
 *   onFieldTypeChange    {function}  - called with new field_type string
 *   onHasRequiredChange  {function}  - called with boolean
 *   onFieldCountChange   {function}  - called with new field_count string
 *   onClearFilters       {function}  - called to reset all filters
 *   availableTypes       {string[]}  - list of type strings from the API
 *   recent               {object[]}  - recently used templates
 *   favorites            {object[]}  - favourited templates
 *   onOpenTemplate       {function}  - called with template id
 */
export default function Sidebar({
  filters = {},
  onSearchChange,
  onCategoryChange,
  onTypeChange,
  onLayoutChange,
  onFieldTypeChange,
  onHasRequiredChange,
  onFieldCountChange,
  onClearFilters,
  availableTypes = [],
  recent = [],
  favorites = [],
  onOpenTemplate,
}) {
  const categories = ['all', 'free', 'premium'];

  const layouts = [
    { value: '',              label: 'All' },
    { value: 'single-column', label: 'Single column' },
    { value: 'two-column',    label: 'Two column' },
    { value: 'multi-step',    label: 'Multi-step' },
  ];

  const fieldTypes = [
    { value: '',         label: 'Any' },
    { value: 'text',     label: 'Text' },
    { value: 'email',    label: 'Email' },
    { value: 'password', label: 'Password' },
    { value: 'textarea', label: 'Textarea' },
    { value: 'dropdown', label: 'Dropdown' },
    { value: 'date',     label: 'Date' },
    { value: 'checkbox', label: 'Checkbox' },
  ];

  const fieldCounts = [
    { value: '',       label: 'Any' },
    { value: 'small',  label: 'Small (≤ 3)' },
    { value: 'medium', label: 'Medium (4–6)' },
    { value: 'large',  label: 'Large (7+)' },
  ];

  // Count active filters (excluding search which has its own visual)
  const activeCount = [
    filters.category,
    filters.type,
    filters.layout,
    filters.field_type,
    filters.has_required,
    filters.field_count,
  ].filter(Boolean).length;

  return (
    <aside className="sidebar" aria-label="Filters and navigation">

      {/* ── Search ─────────────────────────────────────────────────────── */}
      <section className="sidebar-section" aria-labelledby="search-label">
        <label id="search-label" htmlFor="sidebar-search-input" className="sidebar-label">
          Search
        </label>
        <input
          id="sidebar-search-input"
          type="search"
          className="sidebar-input"
          placeholder="Search templates…"
          value={filters.search ?? ''}
          onChange={(e) => onSearchChange?.(e.target.value)}
        />
      </section>

      {/* ── Category ───────────────────────────────────────────────────── */}
      <section className="sidebar-section" aria-labelledby="category-label">
        <span id="category-label" className="sidebar-label">Category</span>
        <div className="sidebar-button-group" role="group" aria-labelledby="category-label">
          {categories.map((cat) => {
            const val = cat === 'all' ? '' : cat === 'free' ? 'basic' : cat;
            const active = (filters.category ?? '') === val;
            return (
              <button
                key={cat}
                type="button"
                className={`sidebar-filter-btn${active ? ' active' : ''}`}
                onClick={() => onCategoryChange?.(val)}
                aria-pressed={active}
              >
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </button>
            );
          })}
        </div>
      </section>

      {/* ── Template type ──────────────────────────────────────────────── */}
      {availableTypes.length > 0 && (
        <section className="sidebar-section" aria-labelledby="type-label">
          <span id="type-label" className="sidebar-label">Template type</span>
          <select
            className="sidebar-input"
            value={filters.type ?? ''}
            onChange={(e) => onTypeChange?.(e.target.value)}
            aria-label="Filter by template type"
          >
            <option value="">All types</option>
            {availableTypes.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </section>
      )}

      {/* ── Layout ─────────────────────────────────────────────────────── */}
      <section className="sidebar-section" aria-labelledby="layout-label">
        <span id="layout-label" className="sidebar-label">Layout</span>
        <div className="sidebar-button-group" role="group" aria-labelledby="layout-label">
          {layouts.map(({ value, label }) => {
            const active = (filters.layout ?? '') === value;
            return (
              <button
                key={value || 'all'}
                type="button"
                className={`sidebar-filter-btn${active ? ' active' : ''}`}
                onClick={() => onLayoutChange?.(value)}
                aria-pressed={active}
              >
                {label}
              </button>
            );
          })}
        </div>
      </section>

      {/* ── Contains field type ────────────────────────────────────────── */}
      <section className="sidebar-section" aria-labelledby="field-type-label">
        <span id="field-type-label" className="sidebar-label">Contains field type</span>
        <select
          className="sidebar-input"
          value={filters.field_type ?? ''}
          onChange={(e) => onFieldTypeChange?.(e.target.value)}
          aria-label="Filter by field type"
        >
          {fieldTypes.map(({ value, label }) => (
            <option key={value || 'any'} value={value}>{label}</option>
          ))}
        </select>
      </section>

      {/* ── Field count ────────────────────────────────────────────────── */}
      <section className="sidebar-section" aria-labelledby="field-count-label">
        <span id="field-count-label" className="sidebar-label">Number of fields</span>
        <div className="sidebar-button-group" role="group" aria-labelledby="field-count-label">
          {fieldCounts.map(({ value, label }) => {
            const active = (filters.field_count ?? '') === value;
            return (
              <button
                key={value || 'any'}
                type="button"
                className={`sidebar-filter-btn${active ? ' active' : ''}`}
                onClick={() => onFieldCountChange?.(value)}
                aria-pressed={active}
              >
                {label}
              </button>
            );
          })}
        </div>
      </section>

      {/* ── Has required fields toggle ─────────────────────────────────── */}
      <section className="sidebar-section" aria-labelledby="required-label">
        <span id="required-label" className="sidebar-label">Required fields</span>
        <label className="sidebar-toggle" htmlFor="has-required-toggle">
          <input
            id="has-required-toggle"
            type="checkbox"
            className="sidebar-toggle__input"
            checked={Boolean(filters.has_required)}
            onChange={(e) => onHasRequiredChange?.(e.target.checked)}
          />
          <span className="sidebar-toggle__track" aria-hidden="true" />
          <span className="sidebar-toggle__label">
            {filters.has_required ? 'Has required fields' : 'Any'}
          </span>
        </label>
      </section>

      {/* ── Clear filters ──────────────────────────────────────────────── */}
      <section className="sidebar-section">
        <button
          type="button"
          className="sidebar-clear-btn"
          onClick={onClearFilters}
          aria-label="Clear all filters"
        >
          Clear filters{activeCount > 0 ? ` (${activeCount})` : ''}
        </button>
      </section>

      {/* ── Recently Used ──────────────────────────────────────────────── */}
      <section className="sidebar-section" aria-labelledby="recent-label">
        <h2 id="recent-label" className="sidebar-section-heading">Recently Used</h2>
        {recent.length === 0 ? (
          <p className="sidebar-empty">No recent templates.</p>
        ) : (
          <ul className="sidebar-list" aria-label="Recently used templates">
            {recent.map((item) => (
              <li key={item.id} className="sidebar-list-item">
                <button
                  type="button"
                  className="sidebar-list-btn"
                  onClick={() => onOpenTemplate?.(item.id)}
                >
                  {item.name}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ── Favorites ──────────────────────────────────────────────────── */}
      <section className="sidebar-section" aria-labelledby="favorites-label">
        <h2 id="favorites-label" className="sidebar-section-heading">Favorites</h2>
        {favorites.length === 0 ? (
          <p className="sidebar-empty">No favourites yet.</p>
        ) : (
          <ul className="sidebar-list" aria-label="Favourite templates">
            {favorites.map((item) => (
              <li key={item.id} className="sidebar-list-item">
                <button
                  type="button"
                  className="sidebar-list-btn"
                  onClick={() => onOpenTemplate?.(item.id)}
                >
                  {item.name}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

    </aside>
  );
}
