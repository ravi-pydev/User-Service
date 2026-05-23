const FAQS = [
  { q: 'How do I reset my password?', a: 'Go to the login page and click "Forgot password". We\'ll send a reset link to your email.' },
  { q: 'Can I export form submissions?', a: 'Yes — from your dashboard, open any form and click Export → CSV or JSON.' },
  { q: 'What payment methods do you accept?', a: 'We accept all major credit cards via Stripe. Annual plans get a 20% discount.' },
  { q: 'How do I cancel my subscription?', a: 'You can cancel anytime from Settings → Billing. Your access continues until the end of the billing period.' },
  { q: 'Is there a free plan?', a: 'Yes. The free plan includes unlimited free templates and up to 100 submissions per month.' },
];

export default function HelpCenterPage() {
  return (
    <div className="static-page">
      <div className="static-page__inner">
        <h1 className="static-page__title">Help Center</h1>
        <p className="static-page__lead">Quick answers to common questions.</p>
        <div className="static-page__faq-list">
          {FAQS.map((faq) => (
            <div key={faq.q} className="static-page__faq-item">
              <h3 className="static-page__faq-q">{faq.q}</h3>
              <p className="static-page__faq-a">{faq.a}</p>
            </div>
          ))}
        </div>
        <section className="static-page__section">
          <h2>Still need help?</h2>
          <p>Email us at <strong>support@formforge.io</strong> and we'll get back to you within one business day.</p>
        </section>
      </div>
    </div>
  );
}
