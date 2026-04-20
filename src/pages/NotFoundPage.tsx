import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <main className="not-found">
      <div className="container">
        <h1>404</h1>
        <h2>Page not found</h2>
        <p>The page you're looking for doesn't exist or has been moved.</p>
        <Link to="/" className="button-primary">
          Go home
        </Link>
      </div>
    </main>
  )
}
