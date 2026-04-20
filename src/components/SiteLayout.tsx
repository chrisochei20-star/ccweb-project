import { NavLink, Outlet } from 'react-router-dom'

const navigationLinks = [
  { to: '/', label: 'Home', end: true },
  { to: '/courses', label: 'Courses' },
  { to: '/ai-tutor', label: 'AI Tutor' },
]

const footerLinks = [
  { to: '/courses', label: 'Blockchain Fundamentals' },
  { to: '/courses', label: 'Smart Contract Development' },
  { to: '/courses', label: 'DeFi Masterclass' },
  { to: '/courses', label: 'AI & Machine Learning Basics' },
]

export function SiteLayout() {
  return (
    <div className="site-shell">
      <header className="topbar">
        <div className="container topbar-inner">
          <NavLink to="/" className="brand">
            <span className="brand-mark" aria-hidden>
              ◉
            </span>
            <span className="brand-text">AI Tutor</span>
          </NavLink>
          <nav className="desktop-nav" aria-label="Primary">
            {navigationLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) =>
                  isActive ? 'nav-link nav-link-active' : 'nav-link'
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
          <a href="#pricing" className="cta-link">
            Get Started
          </a>
        </div>
      </header>

      <main id="main-content">
        <Outlet />
      </main>

      <footer className="site-footer">
        <div className="container footer-grid">
          <div>
            <h2 className="footer-title">Crypto & AI Courses</h2>
            <p className="footer-copy">
              Master blockchain, DeFi, smart contracts, and AI with expert-led
              courses.
            </p>
          </div>
          <div>
            <h2 className="footer-title">AI Tutoring</h2>
            <p className="footer-copy">
              24/7 personalized AI tutor that adapts to your learning pace.
            </p>
          </div>
          <div>
            <h2 className="footer-title">Earn Tokens</h2>
            <p className="footer-copy">
              Learn and earn - get rewarded with tokens for completing courses.
            </p>
          </div>
          <div>
            <h2 className="footer-title">Affiliate Program</h2>
            <p className="footer-copy">
              Refer friends and earn recurring commissions automatically.
            </p>
          </div>
        </div>
        <div className="container footer-links">
          {footerLinks.map((link) => (
            <NavLink key={link.label} to={link.to} className="footer-link">
              {link.label}
            </NavLink>
          ))}
        </div>
        <p className="container footer-bottom">
          &copy; 2026 Chrisccwebfoundation. All rights reserved.
        </p>
      </footer>
    </div>
  )
}
