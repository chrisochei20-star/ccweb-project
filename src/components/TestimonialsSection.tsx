import { testimonials } from '../data/courses'

export function TestimonialsSection() {
  return (
    <section className="section">
      <div className="container">
        <div className="section-head">
          <div>
            <h2 className="section-title">What Our Students Say</h2>
            <p className="section-subtitle">Real results from real learners.</p>
          </div>
        </div>
        <div className="testimonial-grid">
          {testimonials.map((testimonial) => (
            <article className="card" key={testimonial.id}>
              <p>{testimonial.quote}</p>
              <div className="testimonial-author">
                {testimonial.name} — {testimonial.role}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
