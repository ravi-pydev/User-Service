const POSTS = [
  { title: 'Introducing Multi-Step Forms', date: 'April 12, 2025', excerpt: 'Break long forms into digestible steps to improve completion rates by up to 40%.' },
  { title: 'Dark Mode Support is Here', date: 'March 3, 2025', excerpt: 'Every form and template now supports a fully themed dark mode out of the box.' },
  { title: 'How to Build a KYC Flow in 5 Minutes', date: 'February 18, 2025', excerpt: 'A step-by-step walkthrough of our Documents & Declaration premium template.' },
];

export default function BlogPage() {
  return (
    <div className="static-page">
      <div className="static-page__inner">
        <h1 className="static-page__title">Blog</h1>
        <p className="static-page__lead">Product updates, tutorials, and best practices from the FormForge team.</p>
        <div className="static-page__card-list">
          {POSTS.map((post) => (
            <div key={post.title} className="static-page__card">
              <span className="static-page__card-date">{post.date}</span>
              <h2 className="static-page__card-title">{post.title}</h2>
              <p>{post.excerpt}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
