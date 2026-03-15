import { useState } from 'react'
import { api } from '../api'

export default function AuthModal({ onAuth }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit() {
    if (!name.trim() || !email.trim()) return setError('Please fill in all fields.')
    setLoading(true); setError('')
    try {
      const user = await api.createUser(name.trim(), email.trim())
      localStorage.setItem('userId', user.id)
      localStorage.setItem('userName', user.name)
      onAuth(user)
    } catch (e) {
      setError(e.message.includes('already') ? 'Email already registered.' : 'Cannot connect to server.')
    } finally { setLoading(false) }
  }

  const s = {
    overlay: { position: 'fixed', inset: 0, background: 'rgba(10,9,8,0.9)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 },
    modal: { background: 'var(--surface)', border: '1px solid var(--border2)', borderRadius: 'var(--radius)', padding: '40px', width: '420px', maxWidth: '90vw', boxShadow: '0 32px 80px rgba(0,0,0,0.6)', animation: 'fadeUp 0.3s ease' },
    input: { width: '100%', padding: '11px 14px', background: 'var(--surface2)', border: '1px solid var(--border2)', borderRadius: 'var(--radius-sm)', fontSize: '14px', color: 'var(--text)', outline: 'none', marginBottom: '16px' },
    label: { display: 'block', fontSize: '11px', fontWeight: 500, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--text2)', marginBottom: '6px' },
  }

  return (
    <div style={s.overlay}>
      <div style={s.modal}>
        <div style={{ fontSize: '32px', color: 'var(--gold)', marginBottom: '20px' }}>&#x2B21;</div>
        <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '26px', fontWeight: 600, color: 'var(--text)', marginBottom: '8px' }}>Welcome to Pathfinder</h2>
        <p style={{ fontSize: '14px', color: 'var(--text2)', lineHeight: 1.6, marginBottom: '28px' }}>Your AI career counsellor. Enter your details to begin.</p>
        {error && <div style={{ background: 'rgba(196,99,58,0.1)', border: '1px solid rgba(196,99,58,0.3)', color: 'var(--rust)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', fontSize: '13px', marginBottom: '16px' }}>{error}</div>}
        <label style={s.label}>Full Name</label>
        <input style={s.input} placeholder="e.g. Alex Johnson" value={name} onChange={e => setName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
        <label style={s.label}>Email Address</label>
        <input style={s.input} type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
        <button style={{ width: '100%', padding: '13px', background: 'var(--gold)', color: 'var(--bg)', border: 'none', borderRadius: 'var(--radius-sm)', fontSize: '14px', fontWeight: 600, opacity: loading ? 0.7 : 1 }} onClick={handleSubmit} disabled={loading}>
          {loading ? 'Setting up...' : 'Get Started'}
        </button>
      </div>
    </div>
  )
}