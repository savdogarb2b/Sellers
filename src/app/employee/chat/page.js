'use client';
import { useState, useEffect, useRef } from 'react';
import Sidebar from '@/components/Sidebar';
import Navbar from '@/components/Navbar';

export default function EmployeeChatPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => { fetch('/api/chat').then(r => r.json()).then(setMessages); }, []);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

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
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <Navbar />
      <main className="main-content" style={{ padding: 0 }}>
        <div style={{ height: 'calc(100vh - var(--navbar-height))', display: 'flex', flexDirection: 'column', gap: '0' }}>
          
          {/* Header */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '12px 24px',
            background: 'var(--bg-card)',
            borderBottom: '1px solid var(--border-color)',
            flexShrink: 0
          }}>
            <div>
              <div style={{ fontSize: '16px', fontWeight: 950, textTransform: 'uppercase', letterSpacing: '2px' }}>AI Yordamchi</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: '4px', fontWeight: 700 }}>Shaxsiy maslahatchi</div>
            </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <button className="btn btn-secondary" onClick={() => setMessages([])} style={{ fontSize: '9px', fontWeight: 900, padding: '10px 16px' }}>
                TOZALASH
              </button>
            </div>
          </div>

          {/* Messages */}
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
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ fontSize: '18px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px' }}>AI STRATEGIK YORDAMCHI</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>Menga savol bering va men sizga sotuvda yordam beraman.</div>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`chat-message ${m.role}`} style={{ animation: 'fadeIn 0.3s ease forwards' }}>
                <div style={{ display: 'flex', flexDirection: 'column', maxWidth: '75%', marginLeft: m.role === 'user' ? 'auto' : '0' }}>
                  <div style={{ fontSize: '10px', color: 'var(--text-ghost)', fontWeight: 800, textTransform: 'uppercase', marginBottom: '6px', textAlign: m.role === 'user' ? 'right' : 'left', letterSpacing: '0.5px' }}>
                    {m.role === 'user' ? 'SIZ' : 'AI YORDAMCHI'}
                  </div>
                  <div style={{ 
                    whiteSpace: 'pre-wrap',
                    padding: '12px 14px',
                    borderRadius: m.role === 'user' ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
                    background: m.role === 'user' ? 'var(--primary-ghost)' : 'rgba(255,255,255,0.03)',
                    color: m.role === 'user' ? 'var(--text-primary)' : 'var(--text-primary)',
                    border: m.role === 'assistant' ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(124, 58, 237, 0.15)',
                    fontWeight: 500,
                    fontSize: '11.5px',
                    lineHeight: '1.6',
                  }}>{m.content}</div>
                </div>
              </div>
            ))}
            {sending && (
              <div className="chat-message assistant">
                <div style={{ display: 'flex', flexDirection: 'column', maxWidth: '75%' }}>
                   <div style={{ fontSize: '9px', color: 'var(--text-ghost)', fontWeight: 800, textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.5px' }}>AI YORDAMCHI</div>
                   <div style={{ padding: '12px 16px', borderRadius: '12px 12px 12px 4px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                     <div className="loading-spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }} />
                   </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <form style={{ flexShrink: 0, padding: '12px 24px', background: 'var(--bg-card)', borderTop: '1px solid var(--border-color)' }}>
            <div className="card glass-panel" style={{ display: 'flex', gap: '10px', alignItems: 'center', padding: '4px 12px', marginBottom: 0, borderRadius: '14px' }}>
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); sendMessage(); } }}
                placeholder="Xabar yozish..."
                style={{
                  flex: 1, background: 'transparent', border: 'none', color: 'white',
                  fontSize: '13px', fontFamily: 'Inter, sans-serif', fontWeight: 500, outline: 'none',
                  padding: '10px 0',
                }}
              />
              <button type="button" className="btn btn-primary" onClick={sendMessage} disabled={sending} style={{ fontSize: '10px', fontWeight: 900, padding: '8px 16px', borderRadius: '10px' }}>
                YUBORISH
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
