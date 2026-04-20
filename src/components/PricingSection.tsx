import { Check, Sparkles } from 'lucide-react'

type Tier = {
  name: string
  price: string
  description: string
  featured?: boolean
  cta: string
  features: string[]
}

const tiers: Tier[] = [
  {
    name: 'Starter',
    price: '$0',
    description: '3 free courses',
    cta: 'Subscribe Now',
    features: ['Community access', 'Basic AI tutor'],
  },
  {
    name: 'Pro',
    price: '$29/mo',
    description: 'All courses',
    cta: 'Subscribe Now',
    featured: true,
    features: ['Unlimited AI tutor', 'Earn tokens', 'Priority support'],
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    description: 'Everything in Pro',
    cta: 'Contact Sales',
    features: ['Team management', 'Custom courses', 'API access', 'Dedicated manager'],
  },
]

export function PricingSection() {
  return (
    <section className="section">
      <div className="container">
        <div className="section-title-wrap">
          <h2 className="section-title">Invest in your future. Cancel anytime.</h2>
        </div>
        <div className="pricing-grid">
          {tiers.map((tier) => (
            <article
              className={`pricing-card ${tier.featured ? 'pricing-card-featured' : ''}`}
              key={tier.name}
            >
              {tier.featured ? (
                <p className="pricing-badge">
                  <Sparkles size={14} />
                  Most Popular
                </p>
              ) : null}
              <h3>{tier.name}</h3>
              <p className="price">{tier.price}</p>
              <p className="small-text">{tier.description}</p>
              <ul>
                {tier.features.map((feature) => (
                  <li key={feature}>
                    <Check size={16} />
                    {feature}
                  </li>
                ))}
              </ul>
              <button className={`button ${tier.featured ? 'button-primary' : 'button-ghost'}`}>
                {tier.cta}
              </button>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
