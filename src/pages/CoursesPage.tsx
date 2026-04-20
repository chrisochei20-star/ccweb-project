import { Link, useSearchParams } from 'react-router-dom'
import { categories, courses } from '../data/courses'

function CoursesPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const selectedCategory = searchParams.get('category') ?? 'all'

  const filteredCourses =
    selectedCategory === 'all'
      ? courses
      : courses.filter((course) => course.category === selectedCategory)

  return (
    <main>
      <section className="section">
        <div className="container">
          <h1 className="section-title">Course Library</h1>
          <p className="section-subtitle">Master crypto and AI at your own pace.</p>

          <div className="chips">
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() =>
                  setSearchParams(category === 'all' ? {} : { category })
                }
                className={`chip ${selectedCategory === category ? 'chip--active' : ''}`}
              >
                {category === 'all' ? 'All Courses' : category}
              </button>
            ))}
          </div>

          {filteredCourses.length === 0 ? (
            <p className="empty-state">No courses in this category yet.</p>
          ) : (
            <div className="course-grid">
              {filteredCourses.map((course) => (
                <Link key={course.id} to={`/courses/${course.id}`} className="course-card">
                  <div className="course-card__badge">{course.level}</div>
                  <h2>{course.title}</h2>
                  <p>{course.description}</p>
                  <div className="course-card__meta">
                    <span>{course.lessons.length} lessons</span>
                    <span>{course.tokensReward} tokens reward</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  )
}

export { CoursesPage }
