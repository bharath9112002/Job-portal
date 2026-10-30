import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { ProtectedRoute, PublicOnlyRoute } from './auth/routes'
import { ApplicationsProvider } from './context/ApplicationsProvider'
import { AuthProvider } from './context/AuthProvider'
import { SavedJobsProvider } from './context/SavedJobsProvider'
import ApplicationDetails from './pages/applications/ApplicationDetails'
import ApplicationList from './pages/applications/ApplicationList'
import CandidateForm from './pages/candidates/CandidateForm'
import CandidateList from './pages/candidates/CandidateList'
import CandidateProfile from './pages/candidates/CandidateProfile'
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
import SavedJobs from './pages/saved/SavedJobs'
import JobSearch from './pages/search/JobSearch'
import JobView from './pages/search/JobView'
import './App.css'
import './dashboard.css'
import './companies.css'
import './jobs.css'
import './search.css'
import './candidates.css'
import './applications.css'

const publicOnly = (page) => <PublicOnlyRoute>{page}</PublicOnlyRoute>
const protectedPage = (page) => <ProtectedRoute>{page}</ProtectedRoute>

function App() {
  return (
    <AuthProvider>
      <SavedJobsProvider>
        <ApplicationsProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={publicOnly(<Login />)} />
              <Route path="/register" element={publicOnly(<Register />)} />
              <Route path="/forgot-password" element={publicOnly(<ForgotPassword />)} />

              <Route path="/dashboard" element={protectedPage(<Dashboard />)} />

              <Route path="/companies" element={protectedPage(<CompanyList />)} />
              <Route path="/companies/new" element={protectedPage(<CompanyForm />)} />
              <Route path="/companies/:id" element={protectedPage(<CompanyDetails />)} />
              <Route path="/companies/:id/edit" element={protectedPage(<CompanyForm />)} />

              <Route path="/jobs" element={protectedPage(<JobList />)} />
              <Route path="/jobs/new" element={protectedPage(<JobForm />)} />
              <Route path="/jobs/:id" element={protectedPage(<JobDetails />)} />
              <Route path="/jobs/:id/edit" element={protectedPage(<JobForm />)} />

              <Route path="/search" element={protectedPage(<JobSearch />)} />
              <Route path="/search/:id" element={protectedPage(<JobView />)} />
              <Route path="/saved" element={protectedPage(<SavedJobs />)} />

              <Route path="/candidates" element={protectedPage(<CandidateList />)} />
              <Route path="/candidates/new" element={protectedPage(<CandidateForm />)} />
              <Route path="/candidates/:id" element={protectedPage(<CandidateProfile />)} />
              <Route path="/candidates/:id/edit" element={protectedPage(<CandidateForm />)} />

              <Route path="/applications" element={protectedPage(<ApplicationList />)} />
              <Route path="/applications/:id" element={protectedPage(<ApplicationDetails />)} />

              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </BrowserRouter>
        </ApplicationsProvider>
      </SavedJobsProvider>
    </AuthProvider>
  )
}

export default App
