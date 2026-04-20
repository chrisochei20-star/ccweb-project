import { Link } from 'react-router-dom'

export function HeroSection() {
  return (
    <section className="hero">
      <div className="container">
        <p className="eyebrow">The Future of Learning</p>
        <h1>
          Learn Crypto & AI.
          <br />
          Earn While You Learn.
        </h1>
        <p className="hero-description">
          Master blockchain and artificial intelligence with AI-powered tutoring
          and earn through subscriptions, tokens, and affiliates.
        </p>
        <div className="hero-actions">
          <Link className="btn btn-primary" to="/courses">
            Start Free
          </Link>
          <Link className="btn btn-outline" to="/courses">
            Browse Courses
          </Link>
        </div>
      </div>
    </section>
  )
}
