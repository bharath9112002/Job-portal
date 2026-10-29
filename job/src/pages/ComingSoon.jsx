import { Link } from 'react-router-dom'
import { AdminLayout } from '../components/AdminLayout'

/** Placeholder for sections that later modules will build. */
export default function ComingSoon({ title }) {
  return (
    <AdminLayout>
      <div className="panel coming-soon">
        <h1>{title}</h1>
        <p className="muted">This section is coming in a later module.</p>
        <Link to="/dashboard" className="btn btn-primary">
          Back to dashboard
        </Link>
      </div>
    </AdminLayout>
  )
}
