import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { courses } from '../data/courses'

const quizQuestions = [
  {
    question:
      'What is the primary purpose of a consensus mechanism in blockchain?',
    options: [
      'To encrypt user data',
      'To agree on the state of the ledger without a central authority',
      'To increase transaction speed',
      'To reduce gas fees',
    ],
    correct:
      'To agree on the state of the ledger without a central authority',
    explanation:
      'Consensus mechanisms allow distributed nodes to agree on which transactions are valid without a trusted third party.',
  },
  {
    question:
      'Which of the following is NOT a property of a cryptographic hash function?',
    options: [
      'Deterministic output',
      'Reversible computation',
      'Avalanche effect',
      'Fixed-length output',
    ],
    correct: 'Reversible computation',
    explanation:
      'Cryptographic hash functions are one-way; you cannot reverse the hash to find the original input.',
  },
  {
    question: "What does 'immutability' mean in blockchain?",
    options: [
      'Transactions are free',
      'Data once written cannot be altered',
      'Anyone can write to the chain',
      'The network never goes offline',
    ],
    correct: 'Data once written cannot be altered',
    explanation:
      'Immutability means that once data is recorded on the blockchain, it cannot be changed or deleted.',
  },
]

export function CoursePage() {
  const { courseId = '' } = useParams()
  const course = useMemo(() => courses.find((entry) => entry.id === courseId), [
    courseId,
  ])

  const [enrolled, setEnrolled] = useState(false)
  const [activeTab, setActiveTab] = useState<'lessons' | 'quiz' | 'tutor'>(
    'lessons'
  )
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [showFeedback, setShowFeedback] = useState(false)
  const [questionIndex, setQuestionIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [quizDone, setQuizDone] = useState(false)

  if (!course) {
    return (
      <main className="container section">
        <div className="empty-state">
          <h1>Course Not Found</h1>
          <p>This course doesn't exist or has been removed.</p>
          <Link to="/courses" className="text-link">
            Browse courses
          </Link>
        </div>
      </main>
    )
  }

  const question = quizQuestions[questionIndex]
  const isCorrect = selectedAnswer === question.correct

  function handleEnroll() {
    setEnrolled(true)
  }

  function handleSubmitAnswer() {
    if (!selectedAnswer) {
      return
    }
    if (!showFeedback && selectedAnswer === question.correct) {
      setScore((prev) => prev + 1)
    }
    setShowFeedback(true)
  }

  function handleNext() {
    setShowFeedback(false)
    setSelectedAnswer(null)
    if (questionIndex === quizQuestions.length - 1) {
      setQuizDone(true)
      return
    }
    setQuestionIndex((prev) => prev + 1)
  }

  function handleResetQuiz() {
    setQuizDone(false)
    setQuestionIndex(0)
    setShowFeedback(false)
    setSelectedAnswer(null)
    setScore(0)
  }

  return (
    <main className="course-page">
      <header className="course-topbar">
        <div className="container course-topbar-content">
          <Link to="/courses" className="text-link muted">
            Back to courses
          </Link>
          <div>
            <p className="small muted">Course</p>
            <h1 className="course-title">{course.title}</h1>
          </div>
          <button className="button primary tiny" type="button">
            Mark Complete
          </button>
        </div>
      </header>

      <section className="course-layout">
        <div className="course-video-column">
          <div className="course-video-placeholder">
            <button className="play-button" type="button" aria-label="Play lesson">
              ▶
            </button>
            <p className="muted">Explore this lesson to deepen your understanding.</p>
          </div>

          <article className="lesson-summary container">
            <p className="badge">{course.category}</p>
            <h2>{course.title}</h2>
            <p>{course.description}</p>
          </article>
        </div>

        <aside className="course-sidebar">
          <div className="tabs">
            <button
              type="button"
              className={activeTab === 'lessons' ? 'active' : ''}
              onClick={() => setActiveTab('lessons')}
            >
              Lessons
            </button>
            <button
              type="button"
              className={activeTab === 'quiz' ? 'active' : ''}
              onClick={() => setActiveTab('quiz')}
            >
              Quiz
            </button>
            <button
              type="button"
              className={activeTab === 'tutor' ? 'active' : ''}
              onClick={() => setActiveTab('tutor')}
            >
              AI Tutor
            </button>
          </div>

          {activeTab === 'lessons' && (
            <div className="panel">
              <h3>Course Lessons</h3>
              {!enrolled ? (
                <div className="card note">
                  <p>Please sign in to enroll</p>
                  <button type="button" className="button primary" onClick={handleEnroll}>
                    Enroll &amp; Start
                  </button>
                </div>
              ) : (
                <ul className="lesson-list">
                  {course.lessons.map((lesson, index) => (
                    <li key={lesson}>
                      <span>{index + 1}.</span>
                      <span>{lesson}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {activeTab === 'quiz' && (
            <div className="panel">
              {!quizDone ? (
                <>
                  <div className="quiz-meta">
                    <p>
                      Question {questionIndex + 1}/{quizQuestions.length}
                    </p>
                    <p className="badge">Quiz</p>
                  </div>
                  <p className="quiz-question">{question.question}</p>
                  <div className="quiz-options">
                    {question.options.map((option) => {
                      const selected = selectedAnswer === option
                      return (
                        <button
                          key={option}
                          type="button"
                          className={selected ? 'selected' : ''}
                          onClick={() => setSelectedAnswer(option)}
                          disabled={showFeedback}
                        >
                          {option}
                        </button>
                      )
                    })}
                  </div>
                  {showFeedback ? (
                    <div className={`quiz-feedback ${isCorrect ? 'ok' : 'error'}`}>
                      <p>{isCorrect ? 'Correct!' : 'Incorrect'}</p>
                      <small>{question.explanation}</small>
                    </div>
                  ) : null}
                  <button
                    type="button"
                    className="button primary"
                    onClick={showFeedback ? handleNext : handleSubmitAnswer}
                    disabled={!selectedAnswer}
                  >
                    {showFeedback
                      ? questionIndex === quizQuestions.length - 1
                        ? 'See Results'
                        : 'Next Question'
                      : 'Submit Answer'}
                  </button>
                </>
              ) : (
                <div className="result">
                  <h3>Quiz Complete!</h3>
                  <p className="score">{score}%</p>
                  <p>{score >= 2 ? 'Great job! Keep learning.' : 'Review the lesson and try again.'}</p>
                  <button type="button" className="button primary" onClick={handleResetQuiz}>
                    Retry Quiz
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'tutor' && (
            <div className="panel">
              <h3>Hi! I&apos;m your AI tutor.</h3>
              <p className="muted">
                Great question! Use the dedicated AI Tutor page for full AI-powered answers with
                streaming.
              </p>
              <Link to="/ai-tutor" className="button outline">
                Open AI Tutor
              </Link>
            </div>
          )}
        </aside>
      </section>
    </main>
  )
}
