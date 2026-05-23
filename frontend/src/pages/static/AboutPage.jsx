export default function AboutPage() {
  return (
    <div className="static-page">
      <div className="static-page__inner">
        <h1 className="static-page__title">About FormForge</h1>
        <p className="static-page__lead">
          FormForge is a no-code form builder that lets teams create beautiful, production-ready
          forms in minutes — without writing a single line of code.
        </p>
        <section className="static-page__section">
          <h2>Our Mission</h2>
          <p>
            We believe great forms shouldn't require a developer. Our mission is to give every
            team — from startups to enterprises — the tools to collect data, onboard users, and
            build workflows with ease.
          </p>
        </section>
        <section className="static-page__section">
          <h2>Who We Are</h2>
          <p>
            FormForge was founded in 2023 by a small team of designers and engineers who were
            tired of rebuilding the same form components over and over. Today we serve thousands
            of teams across 40+ countries.
          </p>
        </section>
      </div>
    </div>
  );
}
