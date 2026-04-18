/**
 * Sidebar — left sidebar for the User Service marketplace.
 *
 * Props:
 *   filters          {object}    - { search, category, type } current filter state
 *   onSearchChange   {function}  - called with new search string
 *   onCategoryChange {function}  - called with new category string
 *   onTypeChange     {function}  - called with new type string
 *   onClearFilters   {function}  - called to reset all filters
 *   availableTypes   {string[]}  - list of type strings to render as filter options
 *   recent           {object[]}  - recently used templates [{ id, name }]
 *   favorites        {object[]}  - favourited templates [{ id, name }]
 *   onOpenTemplate   {function}  - called with template id when a recent/favourite item is clicked
 */
export default function Sidebar({
  filters = { search: '', category: '', type: '' },
  onSearchChange,
  onCategoryChange,
  onTypeChange,
  onClearFilters,
  availableTypes = [],
  recent = [],
  favorites = [],
  onOpenTemplate,
}) {
  const categories = ['all', 'premium', 'free'];

  return (
    <aside className="sidebar" aria-label="Filters and navigation">

      {/* ── Search ─────────────────────────────────────────────────────── */}
      <section className="sidebar-section sidebar-search" aria-labelledby="search-label">
        <label id="search-label" htmlFor="sidebar-search-input" className="sidebar-label">
          Search
        </label>
        <input
          id="sidebar-search-input"
          type="search"
          className="sidebar-input"
          placeholder="Search templates…"
          value={filters.search}
          onChange={(e) => onSearchChange?.(e.target.value)}
          aria-label="Search templates"
        />
      </section>

      {/* ── Category filter ─────────────────────────────────────────────── */}
      <section className="sidebar-section sidebar-categories" aria-labelledby="category-label">
        <span id="category-label" className="sidebar-label">
          Category
        </span>
        <div className="sidebar-button-group" role="group" aria-labelledby="category-label">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              className={`sidebar-filter-btn${filters.category === (cat === 'all' ? '' : cat) ? ' active' : ''}`}
              onClick={() => onCategoryChange?.(cat === 'all' ? '' : cat)}
              aria-pressed={filters.category === (cat === 'all' ? '' : cat)}
            >
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>
      </section>

      {/* ── Type filter ─────────────────────────────────────────────────── */}
      {availableTypes.length > 0 && (
        <section className="sidebar-section sidebar-types" aria-labelledby="type-label">
          <span id="type-label" className="sidebar-label">
            Type
          </span>
          <div className="sidebar-button-group" role="group" aria-labelledby="type-label">
            <button
              type="button"
              className={`sidebar-filter-btn${filters.type === '' ? ' active' : ''}`}
              onClick={() => onTypeChange?.('')}
              aria-pressed={filters.type === ''}
            >
              All
            </button>
            {availableTypes.map((t) => (
              <button
                key={t}
                type="button"
                className={`sidebar-filter-btn${filters.type === t ? ' active' : ''}`}
                onClick={() => onTypeChange?.(t)}
                aria-pressed={filters.type === t}
              >
                {t}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* ── Clear filters ────────────────────────────────────────────────── */}
      <section className="sidebar-section sidebar-clear">
        <button
          type="button"
          className="sidebar-clear-btn"
          onClick={onClearFilters}
          aria-label="Clear all filters"
        >
          Clear Filters
        </button>
      </section>

      {/* ── Recently Used ────────────────────────────────────────────────── */}
      <section className="sidebar-section sidebar-recent" aria-labelledby="recent-label">
        <h2 id="recent-label" className="sidebar-section-heading">
          Recently Used
        </h2>
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
                  aria-label={`Open ${item.name}`}
                >
                  {item.name}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ── Favorites ────────────────────────────────────────────────────── */}
      <section className="sidebar-section sidebar-favorites" aria-labelledby="favorites-label">
        <h2 id="favorites-label" className="sidebar-section-heading">
          Favorites
        </h2>
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
                  aria-label={`Open ${item.name}`}
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
