export default function ContactPage() {
  return (
    <div className="static-page">
      <div className="static-page__inner">
        <h1 className="static-page__title">Contact Us</h1>
        <p className="static-page__lead">We'd love to hear from you. Reach out through any of the channels below.</p>
        <div className="static-page__contact-grid">
          <div className="static-page__card">
            <span className="static-page__feature-icon">💬</span>
            <h3>General Enquiries</h3>
            <p><a href="mailto:ravidarshan@formforge.in">ravidarshan@formforge.in</a></p>
          </div>
          <div className="static-page__card">
            <span className="static-page__feature-icon">🛠️</span>
            <h3>Technical Support</h3>
            <p><a href="mailto:ravidarshan@formforge.in">ravidarshan@formforge.in</a></p>
          </div>
          <div className="static-page__card">
            <span className="static-page__feature-icon">💼</span>
            <h3>Sales & Partnerships</h3>
            <p><a href="mailto:ravidarshan@formforge.in">ravidarshan@formforge.in</a></p>
          </div>
          <div className="static-page__card">
            <span className="static-page__feature-icon">📰</span>
            <h3>Press</h3>
            <p><a href="mailto:ravidarshan@formforge.in">ravidarshan@formforge.in</a></p>
          </div>
        </div>
      </div>
    </div>
  );
}
