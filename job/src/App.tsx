import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './auth/AuthContext'
import { ProtectedRoute, PublicOnlyRoute } from './auth/routes'
import ComingSoon from './pages/ComingSoon'
import CompanyDetails from './pages/companies/CompanyDetails'
import CompanyForm from './pages/companies/CompanyForm'
import CompanyList from './pages/companies/CompanyList'
import Dashboard from './pages/Dashboard'
import ForgotPassword from './pages/ForgotPassword'
import JobDetails from './pages/jobs/JobDetails'
import JobForm from './pages/jobs/JobForm'
import JobList from './pages/jobs/JobList'
import Login from './pages/Login'
import Register from './pages/Register'
import JobSearch from './pages/search/JobSearch'
import JobView from './pages/search/JobView'
import './App.css'
import './dashboard.css'
import './companies.css'
import './jobs.css'
import './search.css'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<PublicOnlyRoute><Login /></PublicOnlyRoute>} />
          <Route path="/register" element={<PublicOnlyRoute><Register /></PublicOnlyRoute>} />
          <Route path="/forgot-password" element={<PublicOnlyRoute><ForgotPassword /></PublicOnlyRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/companies" element={<ProtectedRoute><CompanyList /></ProtectedRoute>} />
          <Route path="/companies/new" element={<ProtectedRoute><CompanyForm /></ProtectedRoute>} />
          <Route path="/companies/:id" element={<ProtectedRoute><CompanyDetails /></ProtectedRoute>} />
          <Route path="/companies/:id/edit" element={<ProtectedRoute><CompanyForm /></ProtectedRoute>} />
          <Route path="/jobs" element={<ProtectedRoute><JobList /></ProtectedRoute>} />
          <Route path="/jobs/new" element={<ProtectedRoute><JobForm /></ProtectedRoute>} />
          <Route path="/jobs/:id" element={<ProtectedRoute><JobDetails /></ProtectedRoute>} />
          <Route path="/jobs/:id/edit" element={<ProtectedRoute><JobForm /></ProtectedRoute>} />
          <Route path="/search" element={<ProtectedRoute><JobSearch /></ProtectedRoute>} />
          <Route path="/search/:id" element={<ProtectedRoute><JobView /></ProtectedRoute>} />
          {[
            ['/candidates', 'Candidates'],
            ['/applications', 'Applications'],
          ].map(([path, title]) => (
            <Route key={path} path={path} element={<ProtectedRoute><ComingSoon title={title} /></ProtectedRoute>} />
          ))}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
