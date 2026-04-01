'use client';

import { useState, useEffect, useRef } from 'react';
import Sidebar from '@/components/Sidebar';
import Navbar from '@/components/Navbar';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Send, Trash2, Bot, User, Sparkles } from 'lucide-react';

export default function EmployeeChatPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const chatRef = useRef(null);

  useEffect(() => { fetchData(); }, []);
  useEffect(() => { if (chatRef.current) { chatRef.current.scrollTop = chatRef.current.scrollHeight; } }, [messages]);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/chat');
      const msgs = await res.json();
      setMessages(Array.isArray(msgs) ? msgs : []);
    } catch (e) {}
    setLoading(false);
  };

  const handleSend = async (e) => {
    if (e) e.preventDefault();
    if (!input.trim() || sending) return;

    const userMsg = input.trim();
    setInput('');
    
    setMessages(prev => [...prev, { role: 'user', content: userMsg, createdAt: new Date() }]);
    
    const aiMsgId = Date.now().toString();
    setMessages(prev => [...prev, { id: aiMsgId, role: 'assistant', content: '', createdAt: new Date() }]);
    
    setSending(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg }),
      });

      if (!res.ok) throw new Error('Stream error');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        accumulatedContent += chunk;

        setMessages(prev => prev.map(m => 
          m.id === aiMsgId ? { ...m, content: accumulatedContent } : m
        ));
      }
    } catch (err) {
      setMessages(prev => prev.map(m => 
        m.id === aiMsgId ? { ...m, content: 'Xatolik yuz berdi. Qayta urinib ko\'ring.' } : m
      ));
    }
    setSending(false);
  };

  const clearHistory = async () => {
    if (!confirm('Chat tarixini tozalashni xohlaysizmi?')) return;
    await fetch('/api/chat', { method: 'DELETE' });
    setMessages([]);
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <Navbar />
      <main className="main-content" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - var(--navbar-height))', padding: 0 }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 24px', background: 'var(--bg-card)', borderBottom: '1px solid var(--border-color)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: 32, height: 32, borderRadius: '10px', background: 'var(--primary-500)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000' }}><Bot size={18} /></div>
            <div>
              <div style={{ fontSize: '15px', fontWeight: 950, letterSpacing: '0.5px' }}>AI YORDAMCHI</div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Shaxsiy maslahatchi</div>
            </div>
          </div>
          <button className="btn btn-secondary" onClick={clearHistory} style={{ fontSize: '9px', fontWeight: 950, padding: '8px 12px', color: '#ef4444', background: 'rgba(239, 68, 68, 0.05)' }}>
            <Trash2 size={12} style={{ marginRight: '6px' }} /> TOZALASH
          </button>
        </div>

        {/* Chat Area */}
        <div ref={chatRef} style={{ flex: 1, overflowY: 'auto', padding: '30px 40px', background: 'var(--bg-deeper)', display: 'flex', flexDirection: 'column', gap: '20px', minHeight: 0 }}>
          {loading ? <div className="loading-container"><div className="loading-spinner" /></div> : messages.length === 0 ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <Sparkles size={40} style={{ color: 'var(--primary-500)', marginBottom: '16px' }} />
              <div style={{ fontSize: '18px', fontWeight: 950, textAlign: 'center' }}>AI STRATEGIK YORDAMCHI</div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '12px', marginTop: '8px', textAlign: 'center' }}>Menga savol bering va men sizga sotuvda yordam beraman.</p>
            </div>
          ) : (
            <div style={{ width: '100%', maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {messages.map((m, i) => (
                <div key={i} style={{ display: 'flex', gap: '14px', alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
                  {m.role === 'assistant' && <div style={{ width: 28, height: 28, borderRadius: '8px', background: 'var(--primary-500)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', flexShrink: 0, marginTop: '4px' }}><Bot size={14} /></div>}
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                    <div style={{ fontSize: '9px', fontWeight: 900, color: 'var(--text-ghost)', textTransform: 'uppercase', marginBottom: '4px' }}>{m.role === 'user' ? 'SIZ' : 'AI SYSTEM'}</div>
                    <div style={{ 
                      padding: '12px 16px', borderRadius: '14px',
                      background: m.role === 'user' ? 'var(--primary-500)' : 'var(--bg-card)',
                      color: m.role === 'user' ? '#000' : 'var(--text-primary)',
                      border: '1px solid var(--border-color)', fontSize: '13px', lineHeight: '1.6', fontWeight: 500
                    }}>
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Input */}
        <div style={{ padding: '16px 40px', background: 'var(--bg-card)', borderTop: '1px solid var(--border-color)', flexShrink: 0 }}>
          <form onSubmit={handleSend} style={{ maxWidth: '1000px', margin: '0 auto', position: 'relative' }}>
            <input
              type="text" value={input} onChange={e => setInput(e.target.value)} disabled={sending}
              placeholder="Xabar yozish..."
              style={{ width: '100%', padding: '14px 50px 14px 20px', background: 'var(--bg-deeper)', border: '1px solid var(--border-color)', borderRadius: '12px', color: 'white', fontSize: '13px', outline: 'none' }}
            />
            <button type="submit" disabled={sending || !input.trim()} style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', width: '34px', height: '34px', borderRadius: '10px', background: 'var(--primary-500)', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none' }}>
              <Send size={16} />
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
