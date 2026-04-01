'use client';
import { useState, useEffect, useRef } from 'react';
import Sidebar from '@/components/Sidebar';
import Navbar from '@/components/Navbar';

export default function ChatPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => { fetch('/api/chat').then(r => r.json()).then(setMessages); }, []);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    sendMessage();
  };

  const sendMessage = async () => {
    if (!input.trim() || sending) return;
    const msg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: msg, createdAt: new Date() }]);
    setSending(true);
    
    try {
      const res = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: msg }) });
      const data = await res.json();
      setMessages(prev => [...prev, data]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Xatolik yuz berdi. Qayta urinib ko\'ring.' }]);
    }
    setSending(false);
    inputRef.current?.focus();
  };

  const quickPrompts = [
    'Bugungi sotuvlar holatini tahlil qil',
    'Eng samarali xodimlar roʻyxati',
    'KPI bajarilish foizini koʻrsat',
    'Oylik moliyaviy hisobot ber',
  ];

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleTimeString('uz', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <Navbar />
      <main className="main-content" style={{ padding: 0 }}>
        <div style={{ height: 'calc(100vh - var(--navbar-height))', display: 'flex', flexDirection: 'column', gap: '0' }}>
          
          {/* Chat Header */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '12px 24px',
            background: 'var(--bg-card)',
            borderBottom: '1px solid var(--border-color)',
            flexShrink: 0
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{
                width: '42px', height: '42px', borderRadius: '14px',
                background: 'linear-gradient(135deg, var(--primary-500), var(--primary-600))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#0f172a', fontWeight: 950, fontSize: '16px',
                boxShadow: '0 4px 16px rgba(124, 58, 237, 0.25)',
              }}>AI</div>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.5px' }}>AI Strategik Tahlilchi</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-teal)', boxShadow: '0 0 8px var(--accent-teal)' }} />
                  <span style={{ fontSize: '10px', color: 'var(--accent-teal)', fontWeight: 700, textTransform: 'uppercase' }}>Faol</span>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 700, background: 'var(--bg-input)', padding: '6px 14px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                {messages.length} XABAR
              </div>
              {messages.length > 0 && (
                <button 
                  className="btn btn-secondary" 
                  style={{ fontSize: '9px', padding: '6px 14px', fontWeight: 800 }}
                  onClick={() => { if (confirm('Suhbat tarixini tozalashni xohlaysizmi?')) { fetch('/api/chat', { method: 'DELETE' }); setMessages([]); } }}
                >
                  TOZALASH
                </button>
              )}
            </div>
          </div>

          {/* Messages Area */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '20px 24px',
            background: 'var(--bg-deeper)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}>
            {messages.length === 0 && (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '24px' }}>
                <div style={{
                  width: '80px', height: '80px', borderRadius: '24px',
                  background: 'rgba(124, 58, 237, 0.06)',
                  border: '2px solid rgba(124, 58, 237, 0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '28px', fontWeight: 950, color: 'var(--primary-500)',
                }}>
                  AI
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '18px', fontWeight: 950, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>AI Strategik Tahlilchi</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', maxWidth: '400px', lineHeight: '1.6', fontWeight: 500 }}>
                    Xodimlar, sotuvlar, KPI ko'rsatkichlari va moliyaviy ma'lumotlar bo'yicha savol bering. AI real vaqtda tahlil qiladi.
                  </div>
                </div>
                {/* Quick Prompts */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', maxWidth: '500px', width: '100%', marginTop: '8px' }}>
                  {quickPrompts.map((prompt, i) => (
                    <button
                      key={i}
                      onClick={() => { setInput(prompt); inputRef.current?.focus(); }}
                      style={{
                        padding: '12px 16px',
                        background: 'var(--bg-input)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '12px',
                        color: 'var(--text-primary)',
                        fontSize: '12px',
                        fontWeight: 600,
                        fontFamily: 'Inter, sans-serif',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.2s ease',
                        lineHeight: '1.4',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(124,58,237,0.06)'; e.currentTarget.style.borderColor = 'rgba(124,58,237,0.15)'; e.currentTarget.style.color = 'var(--primary-400)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.025)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m, i) => (
              <div key={i} style={{
                display: 'flex',
                justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start',
                gap: '12px',
              }}>
                {/* AI Avatar */}
                {m.role === 'assistant' && (
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '10px',
                    background: 'linear-gradient(135deg, var(--primary-500), var(--primary-600))',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 950, fontSize: '11px', color: '#0f172a',
                    flexShrink: 0, marginTop: '2px',
                  }}>AI</div>
                )}

                <div style={{ maxWidth: '75%', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{
                    display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start',
                    alignItems: 'center', gap: '8px',
                  }}>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      {m.role === 'user' ? 'SIZ' : 'AI TAHLILCHI'}
                    </span>
                    {m.createdAt && (
                      <span style={{ fontSize: '9px', color: 'var(--text-ghost)', fontWeight: 600 }}>{formatTime(m.createdAt)}</span>
                    )}
                  </div>
                  <div style={{
                    padding: '10px 14px',
                    borderRadius: m.role === 'user' ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
                    background: m.role === 'user'
                      ? 'linear-gradient(135deg, var(--primary-500), var(--primary-600))'
                      : 'rgba(255,255,255,0.035)',
                    color: m.role === 'user' ? '#0f172a' : 'var(--text-primary)',
                    border: m.role === 'assistant' ? '1px solid rgba(255,255,255,0.06)' : 'none',
                    fontSize: '11px',
                    fontWeight: m.role === 'user' ? 600 : 450,
                    lineHeight: '1.5',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    boxShadow: m.role === 'user' ? '0 4px 16px rgba(124, 58, 237, 0.2)' : '0 2px 8px rgba(0,0,0,0.15)',
                  }}>
                    {m.content}
                  </div>
                </div>

                {/* User Avatar */}
                {m.role === 'user' && (
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '10px',
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 800, fontSize: '11px', color: 'var(--text-secondary)',
                    flexShrink: 0, marginTop: '2px',
                  }}>A</div>
                )}
              </div>
            ))}

            {/* Typing Indicator */}
            {sending && (
              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <div style={{
                  width: '32px', height: '32px', borderRadius: '10px',
                  background: 'linear-gradient(135deg, var(--primary-500), var(--primary-600))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 950, fontSize: '11px', color: '#0f172a',
                  flexShrink: 0,
                }}>AI</div>
                <div style={{ maxWidth: '75%' }}>
                  <div style={{ fontSize: '9px', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>AI TAHLILCHI</div>
                  <div style={{
                    padding: '12px 16px',
                    borderRadius: '12px 12px 12px 4px',
                    background: 'rgba(255,255,255,0.025)',
                    border: '1px solid rgba(255,255,255,0.05)',
                    display: 'flex', gap: '6px', alignItems: 'center',
                  }}>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      {[0, 1, 2].map(d => (
                        <div key={d} style={{
                          width: '6px', height: '6px', borderRadius: '50%',
                          background: 'var(--primary-500)',
                          opacity: 0.4,
                          animation: `pulse-dot 1.4s ease-in-out ${d * 0.2}s infinite`,
                        }} />
                      ))}
                    </div>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, marginLeft: '8px' }}>Tahlil qilinmoqda...</span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={bottomRef} />
          </div>

          {/* Input Area */}
          <form onSubmit={handleSend} style={{ flexShrink: 0, padding: '12px 24px', background: 'var(--bg-card)', borderTop: '1px solid var(--border-color)' }}>
            <div className="card glass-panel" style={{ display: 'flex', gap: '10px', alignItems: 'center', padding: '4px 12px', marginBottom: 0, borderRadius: '14px' }}>
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Savolingizi yozing..."
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-primary)',
                  fontSize: '13px',
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 500,
                  outline: 'none',
                  padding: '10px 0',
                }}
              />
              <button
                type="submit"
                disabled={sending || !input.trim()}
                style={{
                  width: '36px', height: '36px', borderRadius: '10px',
                  background: input.trim() ? 'linear-gradient(135deg, var(--primary-500), var(--primary-600))' : 'rgba(255,255,255,0.04)',
                  border: input.trim() ? 'none' : '1px solid rgba(255,255,255,0.06)',
                  cursor: input.trim() ? 'pointer' : 'default',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.2s ease',
                  flexShrink: 0,
                  color: input.trim() ? '#0f172a' : 'var(--text-muted)',
                  fontWeight: 900, fontSize: '16px',
                  boxShadow: input.trim() ? '0 4px 16px rgba(124, 58, 237, 0.25)' : 'none',
                  opacity: sending ? 0.5 : 1,
                }}
              >
                &#x2191;
              </button>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '10px' }}>
              <span style={{ fontSize: '9px', color: 'var(--text-ghost)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>
                Enter — yuborish | Shift+Enter — yangi qator
              </span>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
