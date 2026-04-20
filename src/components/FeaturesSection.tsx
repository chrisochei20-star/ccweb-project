import { platformFeatures } from '../data/courses'

export function FeaturesSection() {
  return (
    <section className="section">
      <div className="container">
        <h2>Why Learn With Us</h2>
        <p className="section-subtitle">Crypto & AI Courses</p>
        <div className="features-grid">
          {platformFeatures.map((feature) => (
            <article className="card" key={feature.title}>
              <div className="feature-icon" aria-hidden>
                *
              </div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
