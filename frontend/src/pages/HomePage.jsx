import { useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

/**
 * HomePage — public landing page for FormForge.
 *
 * Props:
 *   onOpenSignup {function} - opens the signup modal
 *   onOpenLogin  {function} - opens the login modal
 */
export default function HomePage({ onOpenSignup, onOpenLogin }) {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  return (
    <div className="home">

      {/* ── Hero ──────────────────────────────────────────────────── */}
      <section className="home-hero" aria-labelledby="hero-heading">
        <div className="home-hero__inner">
          <div className="home-hero__badge">✦ 100+ ready-to-use templates</div>
          <h1 id="hero-heading" className="home-hero__title">
            Build beautiful forms<br />
            <span className="home-hero__title-accent">in minutes</span>
          </h1>
          <p className="home-hero__subtitle">
            FormForge gives you a marketplace of professional form templates.
            Pick one, customise it, and go live — no code, no friction.
          </p>
          <div className="home-hero__cta">
            {!isAuthenticated && (
              <button
                type="button"
                className="home-btn home-btn--primary home-btn--lg"
                onClick={onOpenSignup}
              >
                Get started free
              </button>
            )}
            <button
              type="button"
              className="home-btn home-btn--ghost home-btn--lg"
              onClick={() => navigate('/app')}
            >
              Browse templates →
            </button>
          </div>
          {!isAuthenticated && (
            <p className="home-hero__note">No credit card required · Free forever plan</p>
          )}
        </div>

        {/* Decorative form preview card */}
        <div className="home-hero__preview" aria-hidden="true">
          <div className="home-preview-card">
            <div className="home-preview-card__header">
              <span className="home-preview-card__dot home-preview-card__dot--red" />
              <span className="home-preview-card__dot home-preview-card__dot--yellow" />
              <span className="home-preview-card__dot home-preview-card__dot--green" />
              <span className="home-preview-card__title">Contact Form</span>
            </div>
            <div className="home-preview-card__body">
              <div className="home-preview-field">
                <div className="home-preview-field__label" />
                <div className="home-preview-field__input" />
              </div>
              <div className="home-preview-field">
                <div className="home-preview-field__label" />
                <div className="home-preview-field__input" />
              </div>
              <div className="home-preview-field">
                <div className="home-preview-field__label" />
                <div className="home-preview-field__textarea" />
              </div>
              <div className="home-preview-card__submit" />
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats strip ───────────────────────────────────────────── */}
      <section className="home-stats" aria-label="Platform statistics">
        <div className="home-stats__inner">
          {[
            { value: '100+', label: 'Form templates' },
            { value: '12', label: 'Categories' },
            { value: '5 min', label: 'Average setup time' },
            { value: 'Free', label: 'To get started' },
          ].map(({ value, label }) => (
            <div key={label} className="home-stats__item">
              <span className="home-stats__value">{value}</span>
              <span className="home-stats__label">{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ──────────────────────────────────────────────── */}
      <section className="home-features" aria-labelledby="features-heading">
        <div className="home-section-inner">
          <div className="home-section-header">
            <h2 id="features-heading" className="home-section-title">
              Everything you need to build great forms
            </h2>
            <p className="home-section-subtitle">
              From simple contact forms to complex multi-step surveys — FormForge has a template for every use case.
            </p>
          </div>

          <div className="home-features__grid">
            {[
              {
                icon: '⚡',
                title: 'Instant templates',
                desc: 'Pick from 100+ professionally designed templates and have a working form in under 5 minutes.',
              },
              {
                icon: '🎨',
                title: 'Visual customisation',
                desc: 'Drag, drop, and edit fields directly in the builder. Change layouts, labels, and field types with a click.',
              },
              {
                icon: '🔒',
                title: 'Secure by default',
                desc: 'JWT-based authentication, hashed passwords, and HTTPS-only API calls keep your data safe.',
              },
              {
                icon: '✦',
                title: 'Premium templates',
                desc: 'Unlock advanced multi-step forms, KYC flows, and enterprise-grade layouts with a Premium plan.',
              },
              {
                icon: '📊',
                title: 'Submission tracking',
                desc: 'Every form submission is stored and accessible from your dashboard — no third-party tools needed.',
              },
              {
                icon: '🌙',
                title: 'Dark mode',
                desc: 'A polished dark theme ships out of the box. Your eyes will thank you during late-night sessions.',
              },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="home-feature-card">
                <div className="home-feature-card__icon" aria-hidden="true">{icon}</div>
                <h3 className="home-feature-card__title">{title}</h3>
                <p className="home-feature-card__desc">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Template categories ────────────────────────────────────── */}
      <section className="home-categories" aria-labelledby="categories-heading">
        <div className="home-section-inner">
          <div className="home-section-header">
            <h2 id="categories-heading" className="home-section-title">
              Templates for every industry
            </h2>
            <p className="home-section-subtitle">
              Browse by category or search for exactly what you need.
            </p>
          </div>

          <div className="home-categories__grid">
            {[
              { icon: '📋', label: 'Contact Forms', count: '12 templates' },
              { icon: '🏥', label: 'Healthcare', count: '8 templates' },
              { icon: '🎓', label: 'Education', count: '10 templates' },
              { icon: '💼', label: 'Business', count: '15 templates' },
              { icon: '🛒', label: 'E-commerce', count: '9 templates' },
              { icon: '🎉', label: 'Events', count: '7 templates' },
              { icon: '🔐', label: 'KYC / Identity', count: '6 templates' },
              { icon: '📝', label: 'Surveys', count: '11 templates' },
            ].map(({ icon, label, count }) => (
              <button
                key={label}
                type="button"
                className="home-category-card"
                onClick={() => navigate('/app')}
                aria-label={`Browse ${label}`}
              >
                <span className="home-category-card__icon" aria-hidden="true">{icon}</span>
                <span className="home-category-card__label">{label}</span>
                <span className="home-category-card__count">{count}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ──────────────────────────────────────────── */}
      <section className="home-how" aria-labelledby="how-heading">
        <div className="home-section-inner">
          <div className="home-section-header">
            <h2 id="how-heading" className="home-section-title">How it works</h2>
            <p className="home-section-subtitle">Three steps from zero to live form.</p>
          </div>

          <div className="home-how__steps">
            {[
              {
                step: '01',
                title: 'Choose a template',
                desc: 'Browse the marketplace and pick the template that fits your use case.',
              },
              {
                step: '02',
                title: 'Customise it',
                desc: 'Use the visual builder to add, remove, and reorder fields. No code needed.',
              },
              {
                step: '03',
                title: 'Collect responses',
                desc: 'Share your form and watch submissions roll in — all tracked in your dashboard.',
              },
            ].map(({ step, title, desc }) => (
              <div key={step} className="home-how__step">
                <div className="home-how__step-number" aria-hidden="true">{step}</div>
                <h3 className="home-how__step-title">{title}</h3>
                <p className="home-how__step-desc">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA banner ────────────────────────────────────────────── */}
      <section className="home-cta" aria-labelledby="cta-heading">
        <div className="home-cta__inner">
          <h2 id="cta-heading" className="home-cta__title">
            Ready to build your first form?
          </h2>
          <p className="home-cta__subtitle">
            Join thousands of teams using FormForge to collect data faster.
          </p>
          <div className="home-cta__actions">
            {!isAuthenticated ? (
              <>
                <button
                  type="button"
                  className="home-btn home-btn--white home-btn--lg"
                  onClick={onOpenSignup}
                >
                  Create free account
                </button>
                <button
                  type="button"
                  className="home-btn home-btn--ghost-white home-btn--lg"
                  onClick={onOpenLogin}
                >
                  Log in
                </button>
              </>
            ) : (
              <button
                type="button"
                className="home-btn home-btn--white home-btn--lg"
                onClick={() => navigate('/app')}
              >
                Go to templates →
              </button>
            )}
          </div>
        </div>
      </section>

    </div>
  );
}
