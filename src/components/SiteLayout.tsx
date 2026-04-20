import { useState } from 'react'
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
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <div className="site-shell">
      <header className="site-header">
        <div className="container header-inner">
          <NavLink to="/" className="brand">
            <span className="brand-icon" aria-hidden>
              A
            </span>
            <span>AI Tutor</span>
          </NavLink>
          <nav className="desktop-nav" aria-label="Primary">
            {navigationLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) => (isActive ? 'active' : undefined)}
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
          <div className="header-actions">
            <NavLink className="button-primary" to="/courses">
              Get Started
            </NavLink>
            <button
              className="menu-toggle"
              type="button"
              onClick={() => setIsMenuOpen((open) => !open)}
              aria-expanded={isMenuOpen}
              aria-controls="mobile-nav"
            >
              Menu
            </button>
          </div>
        </div>
        {isMenuOpen && (
          <div className="mobile-nav-wrap" id="mobile-nav">
            <nav className="container mobile-nav" aria-label="Mobile">
              {navigationLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.end}
                  className={({ isActive }) => (isActive ? 'active' : undefined)}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {link.label}
                </NavLink>
              ))}
            </nav>
          </div>
        )}
      </header>

      <main id="main-content" className="main-content">
        <Outlet />
      </main>

      <footer className="site-footer">
        <div className="container footer-grid">
          <div>
            <h4>Crypto & AI Courses</h4>
            <p>
              Master blockchain, DeFi, smart contracts, and AI with expert-led
              courses.
            </p>
          </div>
          <div>
            <h4>AI Tutoring</h4>
            <p>
              24/7 personalized AI tutor that adapts to your learning pace.
            </p>
          </div>
          <div>
            <h4>Earn Tokens</h4>
            <p>
              Learn and earn - get rewarded with tokens for completing courses.
            </p>
          </div>
          <div>
            <h4>Affiliate Program</h4>
            <p>
              Refer friends and earn recurring commissions automatically.
            </p>
          </div>
        </div>
        <div className="container footer-grid" style={{ marginTop: '22px' }}>
          {footerLinks.map((link) => (
            <NavLink key={link.label} to={link.to}>
              {link.label}
            </NavLink>
          ))}
        </div>
        <p className="container footer-copy">
          &copy; 2026 Chrisccwebfoundation. All rights reserved.
        </p>
      </footer>
    </div>
  )
}
