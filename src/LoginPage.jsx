import { useState } from 'react'

export default function LoginPage({ onLogin, error }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setBusy(true)
    await onLogin(email, password)
    setBusy(false)
  }

  return <main className="center-page">
    <form className="login-card card" onSubmit={submit}>
      <span className="eyebrow">ALEXTRANSPO</span>
      <h1>Employee Login</h1>
      <p>Sign in before recording Time In or Time Out.</p>
      <label>Email<input type="email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" /></label>
      <label>Password<input type="password" value={password} onChange={e => setPassword(e.target.value)} required autoComplete="current-password" /></label>
      {error && <p className="error-message">{error}</p>}
      <button className="time-in" disabled={busy}>{busy ? 'Signing in...' : 'Sign in'}</button>
    </form>
  </main>
}