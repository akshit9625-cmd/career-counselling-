import { useState, useRef, useEffect } from 'react'
import { api } from '../api'

const SUGGESTIONS = [
  { icon: '🔄', label: 'Career transition', msg: 'How do I successfully transition into a new industry?' },
  { icon: '💰', label: 'Salary negotiation', msg: 'How can I negotiate a higher salary?' },
  { icon: '📈', label: 'Skills and growth', msg: 'What skills should I develop to advance my career?' },
  { icon: '🎯', label: 'Interview prep', msg: 'Help me prepare for a senior-level job interview.' },
  { icon: '✍️', label: 'Resume tips', msg: 'How can I improve my resume to stand out?' },
  { icon: '🌱', label: 'Early career', msg: 'I just graduated. What are the best steps to start my career?' },
]

function fmt(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/^### (.+)$/gm, '<div style="font-weight:600;font-size:15px;margin:10px 0 4px">$1</div>')
    .replace(/^- (.+)$/gm, '<div style="display:flex;gap:8px;margin:3px 0"><span style="color:var(--gold);flex-shrink:0">›</span><span>$1</span></div>')
    .replace(/\n\n/g, '<div style="height:8px"></div>')
    .replace(/\n/g, '<br/>')
}

export default function ChatArea({ user, session, messages, setMessages, onSessionsRefresh }) {
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const endRef = useRef(null)
  const taRef = useRef(null)
  const initials = (user?.name || 'U').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, isTyping])

  function resize() {
    const t = taRef.current; if (!t) return
    t.style.height = 'auto'; t.style.height = Math.min(t.scrollHeight, 140) + 'px'
  }

  async function send(text) {
    const msg = (text || input).trim()
    if (!msg || isTyping || !session) return
    setInput(''); if (taRef.current) taRef.current.style.height = 'auto'
    setMessages(prev => [...prev, { role:'user', content:msg, created_at: new Date().toISOString(), id:'tmp-'+Date.now() }])
    setIsTyping(true)
    try {
      const data = await api.sendMessage(session.id, user.id, msg)
      setMessages(prev => [...prev, { role:'assistant', content:data.reply, created_at:data.created_at, id:data.message_id }])
      onSessionsRefresh()
    } catch(e) {
      setMessages(prev => [...prev, { role:'assistant', content:'Error: ' + e.message, created_at: new Date().toISOString(), id:'err-'+Date.now() }])
    } finally { setIsTyping(false) }
  }

  const h = new Date().getHours()
  const greeting = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', height:'100vh', overflow:'hidden' }}>
      <div style={{ padding:'20px 32px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0, background:'var(--surface)' }}>
        <div>
          <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:'20px', fontWeight:600, color:'var(--text)' }}>{session ? session.title : greeting + ', ' + (user?.name?.split(' ')[0]||'')}</div>
          <div style={{ fontSize:'12px', color:'var(--text2)', marginTop:'2px' }}>{session ? messages.length + ' messages' : 'Your personal career counsellor'}</div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:'6px', fontSize:'12px', color:'var(--sage)', background:'rgba(122,154,106,0.08)', border:'1px solid rgba(122,154,106,0.2)', padding:'5px 12px', borderRadius:'20px' }}>
          <span style={{ display:'inline-block', width:'6px', height:'6px', background:'var(--sage)', borderRadius:'50%', animation:'pulse 2s infinite' }} />
          AI Online
        </div>
      </div>
      <div style={{ flex:1, overflowY:'auto', padding:'28px 32px', display:'flex', flexDirection:'column', gap:'20px' }}>
        {!session || messages.length === 0 ? (
          <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', textAlign:'center', padding:'40px 20px', animation:'fadeUp 0.5s ease both' }}>
            <div style={{ fontSize:'40px', marginBottom:'20px', width:'72px', height:'72px', background:'var(--surface2)', border:'1px solid var(--border2)', borderRadius:'20px', display:'flex', alignItems:'center', justifyContent:'center' }}>🧭</div>
            <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:'28px', fontWeight:600, color:'var(--text)', lineHeight:1.25, marginBottom:'12px' }}>Where would you like your career to go?</h2>
            <p style={{ fontSize:'14px', color:'var(--text2)', maxWidth:'380px', lineHeight:1.7, marginBottom:'32px' }}>I am here to guide your professional journey from career pivots to salary negotiations.</p>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px', width:'100%', maxWidth:'460px' }}>
              {SUGGESTIONS.map(sg => (
                <button key={sg.label} style={{ padding:'12px 14px', background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', color:'var(--text)', fontSize:'13px', textAlign:'left', display:'flex', alignItems:'center', gap:'8px', lineHeight:1.4 }} onClick={() => send(sg.msg)}>
                  <span style={{ fontSize:'16px', flexShrink:0 }}>{sg.icon}</span>{sg.label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg, i) => (
              <div key={msg.id||i} style={{ display:'flex', gap:'10px', alignItems:'flex-end', justifyContent: msg.role==='user' ? 'flex-end' : 'flex-start', animation:'fadeUp 0.3s ease both' }}>
                {msg.role==='assistant' && <div style={{ width:'30px', height:'30px', borderRadius:'50%', flexShrink:0, background:'var(--surface2)', border:'1px solid var(--border2)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Cormorant Garamond',serif", fontSize:'14px', color:'var(--gold)' }}>P</div>}
                <div style={{ display:'flex', flexDirection:'column', gap:'4px', maxWidth:'75%' }}>
                  <div style={{ padding:'12px 16px', borderRadius:'14px', fontSize:'14px', lineHeight:1.7, ...(msg.role==='user' ? { borderBottomRightRadius:'4px', background:'var(--gold)', color:'var(--bg)' } : { borderBottomLeftRadius:'4px', background:'var(--surface2)', border:'1px solid var(--border)', color:'var(--text)' }) }}>
                    {msg.role==='assistant' ? <div dangerouslySetInnerHTML={{__html: fmt(msg.content)}} /> : msg.content}
                  </div>
                  <div style={{ fontSize:'10px', color:'var(--text3)', padding:'0 4px', textAlign: msg.role==='user' ? 'right' : 'left' }}>
                    {new Date(msg.created_at).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}
                  </div>
                </div>
                {msg.role==='user' && <div style={{ width:'30px', height:'30px', borderRadius:'50%', flexShrink:0, background:'linear-gradient(135deg,var(--gold),var(--rust))', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'11px', fontWeight:600, color:'var(--bg)' }}>{initials}</div>}
              </div>
            ))}
            {isTyping && (
              <div style={{ display:'flex', gap:'10px', alignItems:'flex-end' }}>
                <div style={{ width:'30px', height:'30px', borderRadius:'50%', flexShrink:0, background:'var(--surface2)', border:'1px solid var(--border2)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Cormorant Garamond',serif", fontSize:'14px', color:'var(--gold)' }}>P</div>
                <div style={{ padding:'14px 18px', background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:'14px', borderBottomLeftRadius:'4px', display:'flex', gap:'5px', alignItems:'center' }}>
                  {[0,1,2].map(i => <span key={i} style={{ display:'inline-block', width:'6px', height:'6px', background:'var(--text3)', borderRadius:'50%', animation:'bounce 1.2s infinite', animationDelay: i*0.2 + 's' }} />)}
                </div>
              </div>
            )}
          </>
        )}
        <div ref={endRef} />
      </div>
      <div style={{ padding:'16px 32px 24px', borderTop:'1px solid var(--border)', flexShrink:0 }}>
        <div style={{ display:'flex', alignItems:'flex-end', gap:'10px', background:'var(--surface2)', border:'1px solid var(--border2)', borderRadius:'var(--radius)', padding:'10px 12px' }}>
          <textarea ref={taRef} style={{ flex:1, border:'none', outline:'none', background:'transparent', color:'var(--text)', fontSize:'14px', lineHeight:1.6, resize:'none', minHeight:'22px', maxHeight:'140px' }}
            placeholder={session ? 'Ask me anything about your career...' : 'Click New Session to start...'}
            value={input} onChange={e => { setInput(e.target.value); resize() }}
            onKeyDown={e => { if (e.key==='Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
            disabled={!session || isTyping} rows={1} />
          <button style={{ width:'34px', height:'34px', flexShrink:0, background:'var(--gold)', border:'none', borderRadius:'8px', color:'var(--bg)', display:'flex', alignItems:'center', justifyContent:'center', opacity:(!input.trim()||isTyping||!session)?0.4:1 }}
            onClick={() => send()} disabled={!input.trim()||isTyping||!session}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
          </button>
        </div>
        <div style={{ fontSize:'11px', color:'var(--text3)', textAlign:'center', marginTop:'8px' }}>Enter to send · Shift+Enter for new line</div>
      </div>
    </div>
  )
}