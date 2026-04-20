import { plans } from '../data/courses'

export function PricingSection() {
  return (
    <section className="section" id="pricing">
      <div className="container">
        <h2>Invest in your future. Cancel anytime.</h2>
        <div className="pricing-grid">
          {plans.map((plan) => (
            <article
              key={plan.id}
              className={`card pricing-card ${plan.isPopular ? 'popular' : ''}`}
            >
              {plan.isPopular ? <p className="course-badge">Most Popular</p> : null}
              <h3>{plan.name}</h3>
              <p className="price">
                {plan.monthlyPrice === null ? 'Custom' : `$${plan.monthlyPrice}/mo`}
              </p>
              <ul>
                {plan.features.map((feature) => (
                  <li key={feature}>• {feature}</li>
                ))}
              </ul>
              <button className={plan.isPopular ? 'button-primary' : 'button-outline'}>
                {plan.ctaLabel}
              </button>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
