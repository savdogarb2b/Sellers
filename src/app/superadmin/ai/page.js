'use client';
import { useState, useEffect, useRef } from 'react';
import Sidebar from '@/components/Sidebar';
import Navbar from '@/components/Navbar';

export default function SuperadminAIPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [orgs, setOrgs] = useState([]);
  const [selectedOrg, setSelectedOrg] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const chatRef = useRef(null);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages]);

  const fetchData = async () => {
    const [msgRes, orgRes] = await Promise.all([
      fetch('/api/superadmin/ai'),
      fetch('/api/organizations'),
    ]);
    const msgs = await msgRes.json();
    const organizations = await orgRes.json();
    setMessages(Array.isArray(msgs) ? msgs : []);
    setOrgs(organizations);
    setLoading(false);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || sending) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg, createdAt: new Date() }]);
    setSending(true);

    try {
      const res = await fetch('/api/superadmin/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg, organizationId: selectedOrg || null }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.content, createdAt: new Date() }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Xatolik yuz berdi. Qayta urinib ko\'ring.', createdAt: new Date() }]);
    }
    setSending(false);
  };

  const clearHistory = async () => {
    if (!confirm('Chat tarixini tozalashni xohlaysizmi?')) return;
    await fetch('/api/superadmin/ai', { method: 'DELETE' });
    setMessages([]);
  };

  const quickActions = [
    'Barcha tashkilotlar umumiy holati qanday?',
    'Eng yaxshi natijali tashkilot qaysi?',
    'Xodimlar KPI tahlili qiling',
    'Sotuv strategiyasi bo\'yicha maslahat bering',
    'Moliyaviy tahlil va tavsiyalar',
    'Kechikishlar muammosiga yechim taklif qiling',
  ];

  return (
    <div className="app-layout">
      <Sidebar />
      <Navbar />
      <main className="main-content" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - var(--navbar-height))', padding: 0 }}>
        <div className="animate-in" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          {/* Header */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '12px 24px',
            background: 'var(--bg-card)',
            borderBottom: '1px solid var(--border-color)',
            flexShrink: 0
          }}>
            <div>
              <div style={{ fontSize: '16px', fontWeight: 950, textTransform: 'uppercase', letterSpacing: '2px' }}>AI Strategik Maslahatchi</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: '4px', fontWeight: 700 }}>Tashkilotlar haqida sun'iy intellekt yordamida tahlil</div>
            </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              {/* Org Selector */}
              <select
                className="form-input"
                value={selectedOrg}
                onChange={e => setSelectedOrg(e.target.value)}
                style={{ width: '240px', fontSize: '11px', fontWeight: 700, padding: '10px 14px' }}
              >
                <option value="">Barcha Tashkilotlar</option>
                {orgs.map(org => (
                  <option key={org.id} value={org.id}>{org.name}</option>
                ))}
              </select>
              <button className="btn btn-secondary" onClick={clearHistory} style={{ fontSize: '9px', fontWeight: 900, padding: '10px 16px' }}>
                TARIXNI TOZALASH
              </button>
            </div>
          </div>

          {/* Chat Area */}
          <div
            ref={chatRef}
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '20px 24px',
              background: 'var(--bg-deeper)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              minHeight: 0,
            }}
          >
            {loading ? (
              <div className="loading-container"><div className="loading-spinner" /></div>
            ) : messages.length === 0 ? (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ fontSize: '14px', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '24px' }}>AI Maslahatchi bilan Suhbat Boshlang</div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', maxWidth: '700px', width: '100%' }}>
                  {quickActions.map((q, i) => (
                    <button
                      key={i}
                      onClick={() => { setInput(q); }}
                      className="card glass-panel"
                      style={{
                        padding: '16px',
                        cursor: 'pointer',
                        border: '1px solid rgba(255,255,255,0.06)',
                        textAlign: 'left',
                        fontSize: '11px',
                        fontWeight: 700,
                        color: 'var(--text-secondary)',
                        fontFamily: 'Inter, sans-serif',
                        lineHeight: '1.5',
                        transition: 'all 0.2s ease',
                        marginBottom: 0,
                      }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary-500)'; e.currentTarget.style.color = 'var(--primary-400)'; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((m, i) => (
                <div
                  key={i}
                  style={{
                    alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                    maxWidth: '75%',
                    animation: 'fadeIn 0.3s ease forwards',
                  }}
                >
                  <div style={{ fontSize: '9px', fontWeight: 800, color: 'var(--text-ghost)', textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.5px' }}>
                    {m.role === 'user' ? 'SIZ' : 'AI MASLAHATCHI'}
                  </div>
                  <div style={{ 
                    whiteSpace: 'pre-wrap',
                    padding: '12px 14px',
                    borderRadius: m.role === 'user' ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
                    background: m.role === 'user' ? 'var(--primary-ghost)' : 'rgba(255,255,255,0.03)',
                    color: 'var(--text-primary)',
                    border: m.role === 'assistant' ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(124, 58, 237, 0.15)',
                    fontWeight: 500,
                    fontSize: '11.5px',
                    lineHeight: '1.6',
                  }}>{m.content}</div>
                </div>
              ))
            )}

            {sending && (
              <div style={{ alignSelf: 'flex-start', maxWidth: '75%' }}>
                <div style={{ fontSize: '9px', color: 'var(--text-ghost)', fontWeight: 800, textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.5px' }}>AI MASLAHATCHI</div>
                <div style={{ padding: '12px 16px', borderRadius: '12px 12px 12px 4px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="loading-spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }} />
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <form onSubmit={handleSend} style={{ flexShrink: 0, padding: '12px 24px', background: 'var(--bg-card)', borderTop: '1px solid var(--border-color)' }}>
            <div className="card glass-panel" style={{ display: 'flex', gap: '10px', alignItems: 'center', padding: '4px 12px', marginBottom: 0, borderRadius: '14px' }}>
              {selectedOrg && (
                <div style={{ fontSize: '9px', fontWeight: 900, color: 'var(--primary-400)', padding: '4px 10px', background: 'var(--primary-ghost)', borderRadius: '10px', whiteSpace: 'nowrap', flexShrink: 0 }}>
                  {orgs.find(o => o.id === selectedOrg)?.name || 'Tanlangan'}
                </div>
              )}
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Tashkilot haqida savolingizni yozing..."
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
              <button type="submit" className="btn btn-primary" disabled={sending || !input.trim()} style={{ fontSize: '10px', fontWeight: 900, padding: '8px 16px', borderRadius: '10px' }}>
                {sending ? 'KUTING...' : 'YUBORISH'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
