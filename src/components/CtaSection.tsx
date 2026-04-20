import { Link } from 'react-router-dom'

export function CtaSection() {
  return (
    <section className="section">
      <div className="container">
        <div className="cta-card">
          <h2>Ready to Build Your Future?</h2>
          <p>
            Join thousands of learners mastering crypto and AI — and earning while they do it.
          </p>
          <Link className="button button-light" to="/courses">
            Get Started Free
          </Link>
        </div>
      </div>
    </section>
  )
}
