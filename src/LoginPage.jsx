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

  return <main className="login-page gps-login">
    <div className="login-map">
      <div className="map-grid"></div>
      <div className="map-pin">●</div>
      <div className="map-card"><span>GPS ATTENDANCE</span><strong>Location verified</strong><small>Secure employee check-in</small></div>
      <div className="login-brand"><span className="brand-mark">AT</span><div><strong>ALEXTRANSPO</strong><small>Employee Attendance System</small></div></div>
      <div className="map-copy"><span>SMART GPS ATTENDANCE</span><h1>Attendance<br />made simple.</h1><p>Time In and Time Out with verified location records.</p></div>
    </div>
    <div className="login-panel">
      <form className="login-form" onSubmit={submit}>
        <div className="mobile-brand"><span className="brand-mark">AT</span><strong>ALEXTRANSPO</strong></div>
        <span className="login-label">EMPLOYEE LOGIN</span>
        <h2>Welcome back</h2>
        <p className="login-subtitle">Sign in to access your attendance dashboard.</p>
        <label>Email address<input type="email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" placeholder="employee@example.com" /></label>
        <label>Password<div className="password-field"><input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required autoComplete="current-password" placeholder="Enter your password" /><button type="button" onClick={() => setShowPassword(!showPassword)}>{showPassword ? 'Hide' : 'Show'}</button></div></label>
        {error && <p className="login-error">{error}</p>}
        <button className="login-submit" disabled={busy}>{busy ? 'Signing in...' : 'Sign in to AlexTranspo →'}</button>
        <div className="login-security"><span>🔒</span><div><strong>Secure attendance access</strong><small>Your login and attendance activity are securely recorded.</small></div></div>
      </form>
      <footer className="login-footer">ALEXTRANSPO · Employee Attendance System</footer>
    </div>
  </main>
}