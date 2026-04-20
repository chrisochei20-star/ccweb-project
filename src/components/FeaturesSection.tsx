import { FEATURES } from '../data/courses'

export function FeaturesSection() {
  return (
    <section className="section section-muted">
      <div className="container">
        <h2 className="section-title">Why Learn With Us</h2>
        <div className="feature-grid">
          {FEATURES.map((feature) => (
            <article className="card feature-card" key={feature.title}>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
