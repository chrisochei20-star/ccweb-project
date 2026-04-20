const testimonials = [
  {
    quote:
      "The AI tutor helped me understand DeFi protocols in days - not weeks. I've already earned back my subscription through token rewards.",
    name: 'Sarah K.',
    role: 'Software Engineer',
  },
  {
    quote:
      "Best crypto education platform I've used. The courses are practical and the affiliate program is genuinely profitable.",
    name: 'James L.',
    role: 'Crypto Trader',
  },
  {
    quote:
      "Started with zero blockchain knowledge. Now I'm building smart contracts and earning tokens while learning. Incredible platform.",
    name: 'Maria G.',
    role: 'Product Manager',
  },
]

export function TestimonialsSection() {
  return (
    <section className="section">
      <div className="container">
        <div className="section-headline">
          <h2 className="section-title">
            What Our <span className="text-muted">Students Say</span>
          </h2>
          <p className="section-subtitle">Real results from real learners.</p>
        </div>
        <div className="testimonial-grid">
          {testimonials.map((testimonial) => (
            <article className="card testimonial-card" key={testimonial.name}>
              <p className="testimonial-quote">{testimonial.quote}</p>
              <div className="testimonial-footer">
                <div className="avatar">{testimonial.name.charAt(0)}</div>
                <div>
                  <p className="testimonial-name">{testimonial.name}</p>
                  <p className="testimonial-role">{testimonial.role}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
