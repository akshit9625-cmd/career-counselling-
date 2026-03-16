import { useState, useEffect } from 'react'
import { api } from './api'
import AuthModal from './components/AuthModal'
import ProfileModal from './components/ProfileModal'
import Sidebar from './components/Sidebar'
import ChatArea from './components/ChatArea'

export default function App() {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [sessions, setSessions] = useState([])
  const [activeSession, setActiveSession] = useState(null)
  const [messages, setMessages] = useState([])
  const [showProfile, setShowProfile] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const userId = localStorage.getItem('userId')
    const userName = localStorage.getItem('userName')
    if (userId && userName) {
      const u = { id: userId, name: userName }
      setUser(u)
      loadSessions(userId)
      loadProfile(userId)
    }
    setLoading(false)
  }, [])

  async function loadSessions(userId) {
    try { const data = await api.getSessions(userId); setSessions(data) } catch (e) {}
  }
  async function loadProfile(userId) {
    try { const data = await api.getProfile(userId); setProfile(data) } catch (e) {}
  }
  async function handleAuth(userData) {
    setUser(userData)
    await loadSessions(userData.id)
    setShowProfile(true)
  }
  async function handleNewSession() {
    if (!user) return
    try {
      const session = await api.createSession(user.id)
      setSessions(prev => [session, ...prev])
      setActiveSession(session)
      setMessages([])
    } catch (e) {}
  }
  async function handleSelectSession(sessionId) {
    try {
      const session = await api.getSession(sessionId)
      setActiveSession(session)
      setMessages(session.messages || [])
    } catch (e) {}
  }
  async function handleDeleteSession(sessionId) {
    try {
      await api.deleteSession(sessionId)
      setSessions(prev => prev.filter(s => s.id !== sessionId))
      if (activeSession?.id === sessionId) { setActiveSession(null); setMessages([]) }
    } catch (e) {}
  }

  function handleLogout() {
    setUser(null)
    setProfile(null)
    setSessions([])
    setActiveSession(null)
    setMessages([])
    setShowProfile(false)
  }

  if (loading) return (
    <div style={{ height:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--bg)' }}>
      <div style={{ width:'32px', height:'32px', border:'2px solid var(--border)', borderTopColor:'var(--gold)', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
    </div>
  )

  return (
    <div style={{ display:'flex', height:'100vh', overflow:'hidden', background:'var(--bg)' }}>
      {!user && <AuthModal onAuth={handleAuth} />}
      {showProfile && user && <ProfileModal userId={user.id} onSave={p => { setProfile(p); setShowProfile(false) }} onClose={() => setShowProfile(false)} />}
      <Sidebar
        user={user} profile={profile} sessions={sessions}
        activeSessionId={activeSession?.id}
        onNewSession={handleNewSession}
        onSelectSession={handleSelectSession}
        onEditProfile={() => setShowProfile(true)}
        onDeleteSession={handleDeleteSession}
        onLogout={handleLogout}
      />
      <ChatArea user={user} session={activeSession} messages={messages} setMessages={setMessages}
        onSessionsRefresh={() => user && loadSessions(user.id)} />
    </div>
  )
}
