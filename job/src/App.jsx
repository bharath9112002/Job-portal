import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { HomeRedirect, ProtectedRoute, PublicOnlyRoute } from './auth/routes'
import { ApplicationsProvider } from './context/ApplicationsProvider'
import { AuthProvider } from './context/AuthProvider'
import { SavedJobsProvider } from './context/SavedJobsProvider'
import ApplicationDetails from './pages/applications/ApplicationDetails'
import ApplicationList from './pages/applications/ApplicationList'
import CandidateForm from './pages/candidates/CandidateForm'
import CandidateList from './pages/candidates/CandidateList'
import CandidateHome from './pages/candidate/CandidateHome'
import MyApplicationDetails from './pages/candidate/MyApplicationDetails'
import MyApplications from './pages/candidate/MyApplications'
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
import Reports from './pages/Reports'
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
import './reports.css'
import './candidate-portal.css'

const publicOnly = (page) => <PublicOnlyRoute>{page}</PublicOnlyRoute>
const adminPage = (page) => <ProtectedRoute roles={['admin']}>{page}</ProtectedRoute>
const candidatePage = (page) => <ProtectedRoute roles={['candidate']}>{page}</ProtectedRoute>

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

              {/* ---------- Admin portal ---------- */}
              <Route path="/dashboard" element={adminPage(<Dashboard />)} />

              <Route path="/companies" element={adminPage(<CompanyList />)} />
              <Route path="/companies/new" element={adminPage(<CompanyForm />)} />
              <Route path="/companies/:id" element={adminPage(<CompanyDetails />)} />
              <Route path="/companies/:id/edit" element={adminPage(<CompanyForm />)} />

              <Route path="/jobs" element={adminPage(<JobList />)} />
              <Route path="/jobs/new" element={adminPage(<JobForm />)} />
              <Route path="/jobs/:id" element={adminPage(<JobDetails />)} />
              <Route path="/jobs/:id/edit" element={adminPage(<JobForm />)} />

              <Route path="/search" element={adminPage(<JobSearch />)} />
              <Route path="/search/:id" element={adminPage(<JobView />)} />
              <Route path="/saved" element={adminPage(<SavedJobs />)} />

              <Route path="/candidates" element={adminPage(<CandidateList />)} />
              <Route path="/candidates/new" element={adminPage(<CandidateForm />)} />
              <Route path="/candidates/:id" element={adminPage(<CandidateProfile />)} />
              <Route path="/candidates/:id/edit" element={adminPage(<CandidateForm />)} />

              <Route path="/applications" element={adminPage(<ApplicationList />)} />
              <Route path="/applications/:id" element={adminPage(<ApplicationDetails />)} />

              <Route path="/reports" element={adminPage(<Reports />)} />

              {/* ---------- Candidate portal ---------- */}
              <Route path="/candidate" element={candidatePage(<CandidateHome />)} />
              <Route path="/candidate/jobs" element={candidatePage(<JobSearch />)} />
              <Route path="/candidate/jobs/:id" element={candidatePage(<JobView />)} />
              <Route path="/candidate/saved" element={candidatePage(<SavedJobs />)} />
              <Route path="/candidate/applications" element={candidatePage(<MyApplications />)} />
              <Route path="/candidate/applications/:id" element={candidatePage(<MyApplicationDetails />)} />
              <Route path="/candidate/profile" element={candidatePage(<CandidateProfile self />)} />
              <Route path="/candidate/profile/edit" element={candidatePage(<CandidateForm self />)} />

              <Route path="*" element={<HomeRedirect />} />
            </Routes>
          </BrowserRouter>
        </ApplicationsProvider>
      </SavedJobsProvider>
    </AuthProvider>
  )
}

export default App
