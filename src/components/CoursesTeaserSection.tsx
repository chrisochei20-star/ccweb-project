import { Link } from 'react-router-dom'
import { topCourses } from '../data/courses'

export function CoursesTeaserSection() {
  return (
    <section className="section">
      <div className="container">
        <div className="section-head">
          <div>
            <h2 className="heading-md">Popular Courses</h2>
            <p className="muted">Start learning today with our top-rated programs.</p>
          </div>
          <Link className="text-link desktop-only" to="/courses">
            View all
          </Link>
        </div>
        <div className="teaser-grid">
          {topCourses.map((course) => (
            <Link className="course-card card" key={course.id} to={`/courses/${course.id}`}>
              <div className="tag tag-primary">{course.level}</div>
              <h3 className="heading-sm">{course.title}</h3>
              <p className="muted">{course.description}</p>
              <div className="row tiny muted">
                <span>{course.lessons.length} lessons</span>
                <span>{course.tokensReward} tokens reward</span>
              </div>
            </Link>
          ))}
        </div>
        <Link className="text-link mobile-only" to="/courses">
          View all courses
        </Link>
      </div>
    </section>
  )
}
