import { Navigate, Route, Routes } from 'react-router-dom'
import { SiteLayout } from './components/SiteLayout'
import { AITutorPage } from './pages/AITutorPage'
import { CoursePage } from './pages/CoursePage'
import { CoursesPage } from './pages/CoursesPage'
import { HomePage } from './pages/HomePage'
import { NotFoundPage } from './pages/NotFoundPage'

function App() {
  return (
    <Routes>
      <Route element={<SiteLayout />}>
        <Route index element={<HomePage />} />
        <Route path="courses" element={<CoursesPage />} />
        <Route path="courses/:courseId" element={<CoursePage />} />
        <Route path="ai-tutor" element={<AITutorPage />} />
        <Route path="dashboard" element={<Navigate to="/" replace />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}

export default App
