import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './auth/AuthContext'
import { ProtectedRoute, PublicOnlyRoute } from './auth/routes'
import ComingSoon from './pages/ComingSoon'
import CompanyDetails from './pages/companies/CompanyDetails'
import CompanyForm from './pages/companies/CompanyForm'
import CompanyList from './pages/companies/CompanyList'
import Dashboard from './pages/Dashboard'
import ForgotPassword from './pages/ForgotPassword'
import Login from './pages/Login'
import Register from './pages/Register'
import './App.css'
import './dashboard.css'
import './companies.css'

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
          {[
            ['/jobs', 'Jobs'],
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
