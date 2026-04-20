import { Link } from 'react-router-dom'

export function HeroSection() {
  return (
    <section className="hero">
      <div className="container hero-inner">
        <p className="eyebrow">The Future of Learning</p>
        <h1>
          Learn Crypto & AI.
          <br />
          Earn While You Learn.
        </h1>
        <p>
          Master blockchain and artificial intelligence with AI-powered tutoring
          and earn through subscriptions, tokens, and affiliates.
        </p>
        <div className="hero-actions">
          <Link className="button-primary" to="/courses">
            Start Free
          </Link>
          <Link className="button-outline" to="/courses">
            Browse Courses
          </Link>
        </div>
      </div>
    </section>
  )
}
