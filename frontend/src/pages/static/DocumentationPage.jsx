const SECTIONS = [
  { title: 'Getting Started', items: ['Creating your first form', 'Using templates', 'Publishing & sharing'] },
  { title: 'Form Builder', items: ['Adding fields', 'Drag & drop reordering', 'Multi-step forms', 'Column layouts'] },
  { title: 'Premium', items: ['Upgrading your account', 'Premium templates', 'Advanced field types'] },
  { title: 'API Reference', items: ['Authentication', 'Templates endpoint', 'Submissions endpoint'] },
];

export default function DocumentationPage() {
  return (
    <div className="static-page">
      <div className="static-page__inner">
        <h1 className="static-page__title">Documentation</h1>
        <p className="static-page__lead">Everything you need to get the most out of FormForge.</p>
        <div className="static-page__doc-grid">
          {SECTIONS.map((sec) => (
            <div key={sec.title} className="static-page__card">
              <h2 className="static-page__card-title">{sec.title}</h2>
              <ul className="static-page__doc-list">
                {sec.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
