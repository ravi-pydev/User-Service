const COOKIES = [
  { name: 'auth_token', type: 'Essential', purpose: 'Keeps you logged in across sessions.' },
  { name: 'theme', type: 'Preference', purpose: 'Remembers your light/dark mode preference.' },
  { name: '_ga', type: 'Analytics', purpose: 'Google Analytics — tracks page views and usage patterns.' },
  { name: '_stripe_sid', type: 'Payment', purpose: 'Stripe session identifier for secure payment processing.' },
];

export default function CookiePolicyPage() {
  return (
    <div className="static-page">
      <div className="static-page__inner static-page__inner--narrow">
        <h1 className="static-page__title">Cookie Policy</h1>
        <p className="static-page__meta">Last updated: January 1, 2026</p>
        <section className="static-page__section">
          <h2>What Are Cookies?</h2>
          <p>Cookies are small text files stored on your device when you visit a website. They help us keep you logged in, remember your preferences, and understand how the service is used.</p>
        </section>
        <section className="static-page__section">
          <h2>Cookies We Use</h2>
          <table className="static-page__table">
            <thead>
              <tr><th>Name</th><th>Type</th><th>Purpose</th></tr>
            </thead>
            <tbody>
              {COOKIES.map((c) => (
                <tr key={c.name}>
                  <td><code>{c.name}</code></td>
                  <td>{c.type}</td>
                  <td>{c.purpose}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
        <section className="static-page__section">
          <h2>Managing Cookies</h2>
          <p>You can disable cookies in your browser settings. Note that disabling essential cookies will prevent you from staying logged in.</p>
        </section>
      </div>
    </div>
  );
}
