import { useState } from 'react'

export default function LoginPage({ onLogin, error }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setBusy(true)
    await onLogin(email, password)
    setBusy(false)
  }

  return (
    <main className="login-page">
      <section className="login-hero">
        <div className="login-brand">
          <span className="brand-mark">AT</span>
          <div><strong>ALEXTRANSPO</strong><small>Attendance Management</small></div>
        </div>

        <div className="login-hero-content">
          <span className="eyebrow">SMART ATTENDANCE</span>
          <h1>Track your time.<br /><em>Stay on route.</em></h1>
          <p>Secure employee attendance with real-time GPS verification and reliable work-hour records.</p>
          <div className="login-features">
            <span>⌖ GPS VERIFIED</span><span>◉ SECURE ACCESS</span><span>◷ LIVE RECORDS</span>
          </div>
        </div>

        <div className="route-lines"><i></i><i></i><i></i></div>
        <div className="hero-pin hero-pin-one">●</div>
        <div className="hero-pin hero-pin-two">●</div>
      </section>

      <section className="login-panel">
        <form className="login-form" onSubmit={submit}>
          <div className="mobile-brand">
            <span className="brand-mark">AT</span><strong>ALEXTRANSPO</strong>
          </div>

          <span className="login-label">EMPLOYEE PORTAL</span>
          <h2>Welcome back</h2>
          <p className="login-subtitle">Sign in to continue to your attendance dashboard.</p>

          <label>Email address
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" placeholder="employee@example.com" />
          </label>

          <label>Password
            <div className="password-field">
              <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required autoComplete="current-password" placeholder="Enter your password" />
              <button type="button" onClick={() => setShowPassword(!showPassword)}>{showPassword ? 'Hide' : 'Show'}</button>
            </div>
          </label>

          {error && <p className="login-error">{error}</p>}

          <button className="login-submit" disabled={busy}>
            {busy ? 'Signing in...' : 'Sign in to AlexTranspo →'}
          </button>

          <div className="login-security">
            <span>🔒</span>
            <div><strong>Secure attendance access</strong><small>Login activity and attendance records are securely recorded.</small></div>
          </div>
        </form>
        <footer className="login-footer">ALEXTRANSPO · Employee Attendance System</footer>
      </section>
    </main>
  )
}