const FEATURES = [
  { icon: '⚡', title: 'Drag & Drop Editor', desc: 'Reorder fields, add blocks, and customise layouts without touching code.' },
  { icon: '🎨', title: 'Theme Support', desc: 'Light and dark form themes that match your brand out of the box.' },
  { icon: '📐', title: 'Multi-Column Layouts', desc: 'Switch between single and two-column layouts with one click.' },
  { icon: '✦', title: 'Premium Templates', desc: 'Unlock advanced KYC, multi-step, and enterprise-grade form templates.' },
  { icon: '🔒', title: 'Secure by Default', desc: 'All submissions are encrypted in transit and at rest.' },
  { icon: '📊', title: 'Analytics Ready', desc: 'Track completion rates, drop-offs, and field-level engagement.' },
];

export default function FeaturesPage() {
  return (
    <div className="static-page">
      <div className="static-page__inner">
        <h1 className="static-page__title">Features</h1>
        <p className="static-page__lead">Everything you need to build, deploy, and analyse forms — in one place.</p>
        <div className="static-page__feature-grid">
          {FEATURES.map((f) => (
            <div key={f.title} className="static-page__feature-card">
              <span className="static-page__feature-icon">{f.icon}</span>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
