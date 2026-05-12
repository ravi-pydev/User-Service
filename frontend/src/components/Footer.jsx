import { useNavigate } from 'react-router-dom';

/**
 * Footer — site-wide footer.
 */
export default function Footer() {
  const navigate = useNavigate();
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer" role="contentinfo">
      <div className="site-footer__inner">

        {/* Brand column */}
        <div className="site-footer__brand-col">
          <button
            type="button"
            className="site-footer__brand"
            onClick={() => navigate('/')}
            aria-label="FormForge — go to home"
          >
            <span className="site-footer__brand-icon">⬡</span>
            FormForge
          </button>
          <p className="site-footer__tagline">
            Build beautiful forms in minutes.<br />
            No code required.
          </p>
        </div>

        {/* Links columns */}
        <div className="site-footer__links-grid">
          <div className="site-footer__col">
            <h3 className="site-footer__col-heading">Product</h3>
            <ul className="site-footer__list">
              <li><button type="button" className="site-footer__link" onClick={() => navigate('/app')}>Templates</button></li>
              <li><button type="button" className="site-footer__link" onClick={() => navigate('/app?category=premium')}>Premium</button></li>
              <li><button type="button" className="site-footer__link" onClick={() => navigate('/')}>Features</button></li>
            </ul>
          </div>

          <div className="site-footer__col">
            <h3 className="site-footer__col-heading">Company</h3>
            <ul className="site-footer__list">
              <li><button type="button" className="site-footer__link">About</button></li>
              <li><button type="button" className="site-footer__link">Blog</button></li>
              <li><button type="button" className="site-footer__link">Careers</button></li>
            </ul>
          </div>

          <div className="site-footer__col">
            <h3 className="site-footer__col-heading">Support</h3>
            <ul className="site-footer__list">
              <li><button type="button" className="site-footer__link">Documentation</button></li>
              <li><button type="button" className="site-footer__link">Help Center</button></li>
              <li><button type="button" className="site-footer__link">Contact</button></li>
            </ul>
          </div>

          <div className="site-footer__col">
            <h3 className="site-footer__col-heading">Legal</h3>
            <ul className="site-footer__list">
              <li><button type="button" className="site-footer__link">Privacy Policy</button></li>
              <li><button type="button" className="site-footer__link">Terms of Service</button></li>
              <li><button type="button" className="site-footer__link">Cookie Policy</button></li>
            </ul>
          </div>
        </div>

      </div>

      <div className="site-footer__bottom">
        <p className="site-footer__copy">© {year} FormForge. All rights reserved.</p>
        <div className="site-footer__socials" aria-label="Social links">
          <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="site-footer__social-link" aria-label="Twitter">
            𝕏
          </a>
          <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="site-footer__social-link" aria-label="GitHub">
            ⌥
          </a>
          <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="site-footer__social-link" aria-label="LinkedIn">
            in
          </a>
        </div>
      </div>
    </footer>
  );
}
