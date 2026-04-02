'use client';

import { useState, useEffect, useRef } from 'react';
import Sidebar from '@/components/Sidebar';
import Navbar from '@/components/Navbar';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { Send, Trash2, Bot, Sparkles, Zap, TrendingUp } from 'lucide-react';

export default function AdminChatPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const chatRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => { fetchData(); }, []);
  useEffect(() => { if (chatRef.current) { chatRef.current.scrollTop = chatRef.current.scrollHeight; } }, [messages]);

  const fetchData = async () => {
    try {
      const msgRes = await fetch('/api/chat');
      const msgs = await msgRes.json();
      setMessages(Array.isArray(msgs) ? msgs : []);
    } catch (e) {}
    setLoading(false);
  };

  const handleSend = async (e, textOverride) => {
    if (e) e.preventDefault();
    const userMsg = textOverride || input.trim();
    if (!userMsg || sending) return;

    setInput('');
    const userMsgObj = { role: 'user', content: userMsg, createdAt: new Date() };
    setMessages(prev => [...prev, userMsgObj]);

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
        accumulatedContent += decoder.decode(value);
        setMessages(prev => prev.map(m => m.id === aiMsgId ? { ...m, content: accumulatedContent } : m));
      }
    } catch (err) {
      setMessages(prev => prev.map(m => m.id === aiMsgId ? { ...m, content: 'Xatolik yuz berdi. Iltimos API kalitni tekshiring.' } : m));
    }
    setSending(false);
    inputRef.current?.focus();
  };

  const clearHistory = async () => {
    if (!confirm('Suhbat tarixini tozalashni xohlaysizmi?')) return;
    await fetch('/api/chat', { method: 'DELETE' });
    setMessages([]);
  };

  const ChartRenderer = ({ jsonStr }) => {
    try {
      const config = JSON.parse(jsonStr);
      const { type, title } = config;
      const COLORS = ['#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#3b82f6'];
      let data = config.data;
      let dataKeys = ['value'];
      if (data && data.labels && data.datasets) {
        const labels = data.labels;
        const datasets = data.datasets;
        dataKeys = datasets.map((ds, i) => ds.label || `val${i}`);
        data = labels.map((label, i) => {
          const entry = { name: label };
          datasets.forEach((ds, di) => { entry[dataKeys[di]] = ds.data[i] ?? 0; });
          return entry;
        });
      }
      return (
        <div style={{ margin: '16px 0', padding: '20px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', width: '100%' }}>
          {title && <div style={{ fontSize: '11px', fontWeight: 900, marginBottom: '16px', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-ghost)' }}>{title}</div>}
          <div style={{ width: '100%', height: 280 }}>
            <ResponsiveContainer>
              {type === 'bar' ? (
                <BarChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
                  <XAxis dataKey="name" stroke="var(--text-ghost)" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--text-ghost)" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '12px' }} />
                  {dataKeys.map((key, i) => <Bar key={key} dataKey={key} fill={COLORS[i % COLORS.length]} radius={[4, 4, 0, 0]} />)}
                </BarChart>
              ) : type === 'line' ? (
                <LineChart data={data}>
                  <XAxis dataKey="name" stroke="var(--text-ghost)" fontSize={10} />
                  <YAxis stroke="var(--text-ghost)" fontSize={10} />
                  <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '12px' }} />
                  {dataKeys.map((key, i) => <Line key={key} type="monotone" dataKey={key} stroke={COLORS[i % COLORS.length]} strokeWidth={2} dot={{ r: 3 }} />)}
                </LineChart>
              ) : (
                <PieChart>
                  <Pie data={data} dataKey={dataKeys[0]} nameKey="name" cx="50%" cy="50%" outerRadius={90} stroke="none">
                    {data.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '12px' }} />
                </PieChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>
      );
    } catch (e) { return <pre style={{ fontSize: '12px', opacity: 0.6 }}>{jsonStr}</pre>; }
  };

  const quickPrompts = [
    { title: 'Bugungi sotuvlar', text: 'Bugungi sotuvlar holatini tahlil qil', icon: <TrendingUp size={14} /> },
    { title: 'Eng yaxshi xodimlar', text: 'Eng samarali xodimlar ro\'yxati', icon: <Sparkles size={14} /> },
    { title: 'Moliyaviy hisobot', text: 'Oylik moliyaviy hisobot ber', icon: <Zap size={14} /> },
  ];

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleTimeString('uz', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <Navbar />
      <main className="main-content" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - var(--navbar-height))', padding: 0 }}>

        {/* HEADER */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '14px 24px',
          background: 'var(--bg-card)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid var(--border)',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: 38, height: 38, borderRadius: '10px',
              background: 'linear-gradient(135deg, var(--primary-500), var(--primary-600))',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text)',
            }}>
              <Bot size={20} />
            </div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text)' }}>Executive AI</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 6px #10b981' }} />
                <span style={{ fontSize: '10px', color: '#10b981', fontWeight: 700 }}>Onlayn</span>
              </div>
            </div>
          </div>
          {messages.length > 0 && (
            <button onClick={clearHistory} className="btn btn-danger btn-sm" style={{ fontSize: '10px', fontWeight: 800, padding: '8px 14px' }}>
              <Trash2 size={12} /> Tozalash
            </button>
          )}
        </div>

        {/* CHAT AREA */}
        <div ref={chatRef} className="custom-scrollbar" style={{
          flex: 1, overflowY: 'auto', padding: '24px',
          background: 'var(--bg-base)', scrollBehavior: 'smooth'
        }}>
          {loading ? (
            <div className="loading-container" style={{ minHeight: '300px' }}><div className="loading-spinner" /></div>
          ) : messages.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '65vh', animation: 'fadeIn 0.5s ease' }}>
              <div style={{ width: 72, height: 72, borderRadius: '20px', background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                <Sparkles size={32} style={{ color: 'var(--primary-500)' }} />
              </div>
              <div style={{ fontSize: '20px', fontWeight: 900, color: 'var(--text)', textTransform: 'uppercase', letterSpacing: '2px' }}>Ilg'or AI Tahlilchi</div>
              <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '10px', textAlign: 'center', maxWidth: '400px', lineHeight: '1.7' }}>
                KPI, moliyaviy tahlil va xodimlar hisobotini yuritish bo'yicha sun'iy intellekt maslahatlarini oling.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginTop: '40px', width: '100%', maxWidth: '720px' }}>
                {quickPrompts.map((prompt, i) => (
                  <div key={i} onClick={() => handleSend(null, prompt.text)} style={{
                    background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                    padding: '18px', borderRadius: '12px', cursor: 'pointer', transition: 'all 0.2s',
                    display: 'flex', flexDirection: 'column', gap: '10px'
                  }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(124,58,237,0.06)'; e.currentTarget.style.borderColor = 'rgba(124,58,237,0.2)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-elevated)'; e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'none'; }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary-400)' }}>
                      {prompt.icon}
                      <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase' }}>{prompt.title}</span>
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.5' }}>{prompt.text}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {messages.map((m, i) => (
                <div key={i} style={{
                  display: 'flex', gap: '12px',
                  flexDirection: m.role === 'user' ? 'row-reverse' : 'row',
                  animation: 'fadeIn 0.3s ease'
                }}>
                  {m.role === 'assistant' && (
                    <div style={{ width: 32, height: 32, borderRadius: '10px', background: 'linear-gradient(135deg, var(--primary-500), var(--primary-600))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text)', flexShrink: 0, alignSelf: 'flex-start', marginTop: '2px' }}>
                      <Bot size={16} />
                    </div>
                  )}
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: m.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: m.role === 'user' ? '65%' : '100%' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                      <span style={{ fontSize: '10px', fontWeight: 800, color: m.role === 'user' ? 'var(--primary-400)' : 'var(--text-ghost)', textTransform: 'uppercase' }}>
                        {m.role === 'user' ? 'Siz' : 'AI Tahlilchi'}
                      </span>
                      {m.createdAt && <span style={{ fontSize: '9px', color: 'var(--text-3)' }}>{formatTime(m.createdAt)}</span>}
                    </div>
                    <div className={m.role === 'assistant' ? 'ai-bubble' : 'user-bubble'}>
                      {m.role === 'assistant' ? (
                        <ReactMarkdown remarkPlugins={[remarkGfm]} components={{
                          code({ node, inline, className, children, ...props }) {
                            const match = /language-(\w+)/.exec(className || '');
                            const content = String(children).replace(/\n$/, '');
                            if (!inline && (match?.[1] === 'chart' || (content.startsWith('{') && content.includes('"type"')))) {
                              return <ChartRenderer jsonStr={content} />;
                            }
                            return <code className={`inline-code ${className || ''}`} {...props}>{children}</code>;
                          }
                        }}>
                          {m.content || ' '}
                        </ReactMarkdown>
                      ) : m.content}
                    </div>
                  </div>
                </div>
              ))}
              {sending && (
                <div style={{ display: 'flex', gap: '12px', animation: 'fadeIn 0.3s ease' }}>
                  <div style={{ width: 32, height: 32, borderRadius: '10px', background: 'linear-gradient(135deg, var(--primary-500), var(--primary-600))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text)', flexShrink: 0 }}>
                    <Bot size={16} />
                  </div>
                  <div className="ai-bubble" style={{ padding: '14px 18px' }}>
                    <div className="typing-dots"><span /><span /><span /></div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* INPUT */}
        <div style={{ padding: '16px 24px', background: 'var(--bg-card)', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
          <form onSubmit={handleSend} style={{ position: 'relative' }}>
            <input
              ref={inputRef} type="text" value={input} onChange={e => setInput(e.target.value)} disabled={sending}
              placeholder="Tizim bo'yicha tahliliy savol yozing..."
              style={{
                width: '100%', padding: '15px 56px 15px 20px', borderRadius: '14px',
                background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                color: 'var(--text)', fontSize: '14px', outline: 'none', transition: 'border-color 0.2s',
                boxSizing: 'border-box'
              }}
              onFocus={e => e.target.style.borderColor = 'rgba(124,58,237,0.4)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />
            <button type="submit" disabled={sending || !input.trim()} style={{
              position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)',
              width: '38px', height: '38px', borderRadius: '10px',
              background: input.trim() ? 'var(--primary-500)' : 'var(--bg-elevated)',
              color: input.trim() ? 'var(--text)' : 'var(--text-3)',
              border: 'none', cursor: input.trim() ? 'pointer' : 'default',
              display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s'
            }}>
              <Send size={16} />
            </button>
          </form>
        </div>
      </main>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: var(--border); border-radius: 10px; }

        .ai-bubble {
          background: var(--bg-elevated);
          border: 1px solid var(--row-border);
          border-left: 3px solid var(--primary-500);
          border-radius: 4px 14px 14px 14px;
          padding: 16px 20px;
          color: var(--text);
          font-size: 14px;
          line-height: 1.75;
          width: 100%;
        }
        .user-bubble {
          background: rgba(124,58,237,0.12);
          border: 1px solid rgba(124,58,237,0.25);
          border-radius: 14px 14px 4px 14px;
          padding: 13px 18px;
          color: var(--text);
          font-size: 14px;
          line-height: 1.6;
        }
        .ai-bubble p { margin: 0 0 10px 0; }
        .ai-bubble p:last-child { margin-bottom: 0; }
        .ai-bubble h1, .ai-bubble h2, .ai-bubble h3 { color: var(--text); margin: 16px 0 8px 0; font-weight: 800; }
        .ai-bubble h1 { font-size: 17px; }
        .ai-bubble h2 { font-size: 15px; }
        .ai-bubble h3 { font-size: 13px; color: var(--primary-400); }
        .ai-bubble ul, .ai-bubble ol { margin: 8px 0; padding-left: 20px; }
        .ai-bubble li { margin: 4px 0; color: var(--text-2); }
        .ai-bubble strong { color: var(--text); font-weight: 700; }
        .ai-bubble em { color: var(--text-2); }
        .ai-bubble blockquote { border-left: 3px solid var(--primary-400); margin: 10px 0; padding: 8px 16px; background: rgba(124,58,237,0.06); border-radius: 0 8px 8px 0; color: var(--text-2); }
        .ai-bubble table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 13px; }
        .ai-bubble th { background: rgba(124,58,237,0.15); padding: 8px 12px; text-align: left; font-weight: 700; border: 1px solid var(--border); color: var(--text); }
        .ai-bubble td { padding: 7px 12px; border: 1px solid var(--row-border); color: var(--text-2); }
        .ai-bubble tr:nth-child(even) td { background: var(--row-hover); }
        .inline-code { background: rgba(124,58,237,0.15); border: 1px solid rgba(124,58,237,0.2); padding: 2px 6px; border-radius: 4px; font-size: 12px; font-family: monospace; color: var(--primary-300); }
        .ai-bubble pre { background: var(--bg-deep); border: 1px solid var(--border); border-radius: 8px; padding: 14px; margin: 10px 0; overflow-x: auto; }
        .ai-bubble pre code { background: none; border: none; padding: 0; color: var(--text-2); font-size: 13px; }

        .typing-dots { display: flex; gap: 5px; align-items: center; height: 20px; }
        .typing-dots span { width: 7px; height: 7px; border-radius: 50%; background: var(--primary-400); animation: typingBounce 1.2s infinite; }
        .typing-dots span:nth-child(2) { animation-delay: 0.15s; }
        .typing-dots span:nth-child(3) { animation-delay: 0.3s; }
        @keyframes typingBounce { 0%, 60%, 100% { transform: translateY(0); opacity: 0.4; } 30% { transform: translateY(-6px); opacity: 1; } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
