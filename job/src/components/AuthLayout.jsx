export function AuthLayout({ title, subtitle, children }) {
  return (
    <main className="auth-page">
      <section className="auth-brand" aria-hidden="true">
        <div className="brand-logo">JobPortal</div>
        <h2>Your next opportunity starts here.</h2>
        <p>Manage jobs, applications and accounts from one admin panel.</p>
      </section>
      <section className="auth-card">
        <h1>{title}</h1>
        <p className="auth-subtitle">{subtitle}</p>
        {children}
      </section>
    </main>
  )
}
