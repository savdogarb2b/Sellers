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
import { Send, Trash2, Bot, User, BarChart2, PieChart as PieChartIcon, TrendingUp, Sparkles } from 'lucide-react';

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
    try {
      const [msgRes, orgRes] = await Promise.all([
        fetch('/api/superadmin/ai'),
        fetch('/api/organizations'),
      ]);
      const msgs = await msgRes.json();
      const organizations = await orgRes.json();
      setMessages(Array.isArray(msgs) ? msgs : []);
      setOrgs(organizations);
    } catch (e) {}
    setLoading(false);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || sending) return;

    const userMsg = input.trim();
    setInput('');
    
    // Add user message to UI
    const newUserMsg = { role: 'user', content: userMsg, createdAt: new Date() };
    setMessages(prev => [...prev, newUserMsg]);
    
    // Placeholder for AI message
    const aiMsgId = Date.now().toString();
    setMessages(prev => [...prev, { id: aiMsgId, role: 'assistant', content: '', createdAt: new Date() }]);
    
    setSending(true);

    try {
      const res = await fetch('/api/superadmin/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg, organizationId: selectedOrg || null }),
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

        // Update the specific AI message in state
        setMessages(prev => prev.map(m => 
          m.id === aiMsgId ? { ...m, content: accumulatedContent } : m
        ));
      }
    } catch (err) {
      setMessages(prev => prev.map(m => 
        m.id === aiMsgId ? { ...m, content: 'Xatolik yuz berdi. Iltimos qaytadan urinib ko\'ring.' } : m
      ));
    }
    setSending(false);
  };

  const clearHistory = async () => {
    if (!confirm('Chat tarixini tozalashni xohlaysizmi?')) return;
    await fetch('/api/superadmin/ai', { method: 'DELETE' });
    setMessages([]);
  };

  // Custom Chart Component for Markdown
  const ChartRenderer = ({ jsonStr }) => {
    try {
      const config = JSON.parse(jsonStr);
      const { type, title, data } = config;
      const COLORS = ['#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#3b82f6'];

      return (
        <div className="card glass-panel animate-in" style={{ 
          margin: '16px 0', padding: '20px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px'
        }}>
          {title && <div style={{ fontSize: '12px', fontWeight: 900, marginBottom: '20px', color: 'var(--text-primary)', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '1px' }}>{title}</div>}
          
          <div style={{ width: '100%', height: 250 }}>
            <ResponsiveContainer>
              {type === 'bar' ? (
                <BarChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="name" stroke="var(--text-ghost)" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--text-ghost)" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', fontSize: '11px' }}
                    itemStyle={{ color: 'var(--primary-400)' }}
                  />
                  <Bar dataKey="value" fill="var(--primary-500)" radius={[4, 4, 0, 0]} barSize={30} />
                </BarChart>
              ) : type === 'line' ? (
                <LineChart data={data}>
                  <XAxis dataKey="name" stroke="var(--text-ghost)" fontSize={10} />
                  <YAxis stroke="var(--text-ghost)" fontSize={10} />
                  <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px' }} />
                  <Line type="monotone" dataKey="value" stroke="var(--primary-500)" strokeWidth={3} dot={{ r: 4, fill: 'var(--primary-500)' }} activeDot={{ r: 6 }} />
                </LineChart>
              ) : (
                <PieChart>
                  <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} stroke="none">
                    {data.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>
      );
    } catch (e) {
      return <pre>{jsonStr}</pre>;
    }
  };

  const quickActions = [
    { text: 'Tashkilotlar umumiy holati', icon: <TrendingUp size={14} /> },
    { text: 'Xodimlar KPI tahlili (grafik)', icon: <BarChart2 size={14} /> },
    { text: 'Sotuv strategiyasi maslahati', icon: <Sparkles size={14} /> },
    { text: 'Moliya va jarimalar taqsimoti', icon: <PieChartIcon size={14} /> },
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
            padding: '16px 24px', background: 'var(--bg-card)', borderBottom: '1px solid var(--border-color)', flexShrink: 0
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
               <div style={{ width: 32, height: 32, borderRadius: '10px', background: 'linear-gradient(135deg, var(--primary-500), var(--primary-700))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000' }}>
                 <Bot size={20} />
               </div>
               <div>
                  <div style={{ fontSize: '15px', fontWeight: 950, letterSpacing: '0.5px' }}>AI EXECUTIVE ANALYST</div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Tizim tahlili va strategik yordamchi</div>
               </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <select
                className="form-input"
                value={selectedOrg}
                onChange={e => setSelectedOrg(e.target.value)}
                style={{ width: '220px', fontSize: '11px', fontWeight: 700, padding: '8px 12px', background: 'rgba(255,255,255,0.03)' }}
              >
                <option value="">Barcha Tashkilotlar</option>
                {orgs.map(org => <option key={org.id} value={org.id}>{org.name}</option>)}
              </select>
              <button 
                className="btn btn-secondary" 
                onClick={clearHistory} 
                style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '10px', fontWeight: 900, background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.1)', color: '#ef4444' }}
              >
                <Trash2 size={12} /> TOZALASH
              </button>
            </div>
          </div>

          {/* Chat Container */}
          <div
            ref={chatRef}
            style={{
              flex: 1, overflowY: 'auto', padding: '30px 40px', background: 'var(--bg-deeper)',
              display: 'flex', flexDirection: 'column', gap: '24px', minHeight: 0,
            }}
          >
            {loading ? (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="loading-spinner" />
              </div>
            ) : messages.length === 0 ? (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', maxWidth: '800px', margin: '0 auto' }}>
                <h3 style={{ fontSize: '20px', fontWeight: 950, marginBottom: '8px', textAlign: 'center' }}>Sizga qanday yordam bera olaman?</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '32px', textAlign: 'center', maxWidth: '500px' }}>
                  Tashkilotlar samaradorligini tahlil qilish, xodimlar KPI darajasini o'lchash va sotuv strategiyalarini ishlab chiqishda yordam beraman.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', width: '100%' }}>
                  {quickActions.map((q, i) => (
                    <button
                      key={i}
                      onClick={() => setInput(q.text)}
                      className="card glass-panel"
                      style={{
                        padding: '24px', cursor: 'pointer', textAlign: 'left', marginBottom: 0, borderRadius: '16px',
                        display: 'flex', flexDirection: 'column', gap: '12px', transition: 'all 0.3s ease', border: '1px solid var(--border-color)'
                      }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary-500)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                    >
                      <div style={{ width: 32, height: 32, borderRadius: '8px', background: 'var(--primary-ghost)', color: 'var(--primary-400)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {q.icon}
                      </div>
                      <div style={{ fontSize: '13px', fontWeight: 700 }}>{q.text}</div>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ maxWidth: '900px', width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {messages.map((m, i) => (
                  <div key={i} style={{ display: 'flex', gap: '16px', alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: m.role === 'user' ? '70%' : '90%' }}>
                    
                    {m.role === 'assistant' && (
                       <div style={{ width: 28, height: 28, borderRadius: '8px', background: 'var(--primary-500)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', flexShrink: 0, marginTop: '4px' }}>
                         <Bot size={16} />
                       </div>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                      <div style={{ fontSize: '10px', fontWeight: 900, color: 'var(--text-ghost)', textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '1px' }}>
                        {m.role === 'user' ? 'SIZ' : 'AI SYSTEM'}
                      </div>
                      
                      <div className="chat-bubble" style={{ 
                        padding: '16px 20px', borderRadius: '18px',
                        background: m.role === 'user' ? 'var(--primary-600)' : 'var(--bg-card)',
                        color: m.role === 'user' ? '#000' : 'var(--text-primary)',
                        border: '1px solid var(--border-color)',
                        fontSize: '13px', lineHeight: '1.7', fontWeight: 500,
                        boxShadow: m.role === 'assistant' ? '0 10px 15px -3px rgba(0,0,0,0.1)' : 'none'
                      }}>
                        <ReactMarkdown 
                          remarkPlugins={[remarkGfm]}
                          components={{
                            code({ node, inline, className, children, ...props }) {
                              const match = /language-(\w+)/.exec(className || '');
                              if (!inline && match && match[1] === 'chart') {
                                return <ChartRenderer jsonStr={String(children).replace(/\n$/, '')} />;
                              }
                              return (
                                <code className={className} {...props} style={{ background: 'rgba(0,0,0,0.3)', padding: '2px 6px', borderRadius: '4px' }}>
                                  {children}
                                </code>
                              );
                            }
                          }}
                        >
                          {m.content}
                        </ReactMarkdown>
                        {m.role === 'assistant' && !m.content && <div className="typing-dots"><span /><span /><span /></div>}
                      </div>
                    </div>

                    {m.role === 'user' && (
                       <div style={{ width: 28, height: 28, borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-primary)', flexShrink: 0, marginTop: '4px' }}>
                         <User size={16} />
                       </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Input Area */}
          <div style={{ padding: '24px 40px', background: 'var(--bg-card)', borderTop: '1px solid var(--border-color)', flexShrink: 0 }}>
            <form onSubmit={handleSend} style={{ maxWidth: '900px', margin: '0 auto', position: 'relative' }}>
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Strategik savol yozing (masalan: 'KPI bo'yicha tahliliy grafik ko'rsat')..."
                disabled={sending}
                style={{
                  width: '100%', padding: '18px 60px 18px 24px',
                  background: 'var(--bg-deeper)', border: '1px solid var(--border-color)',
                  borderRadius: '16px', color: 'var(--text-primary)', fontSize: '14px',
                  outline: 'none', transition: 'all 0.3s ease',
                  boxShadow: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)'
                }}
              />
              <button 
                type="submit" 
                disabled={sending || !input.trim()}
                style={{
                  position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
                  width: '40px', height: '40px', borderRadius: '12px',
                  background: 'var(--primary-500)', color: '#000',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: 'none', cursor: 'pointer', transition: 'all 0.2s ease',
                  opacity: (sending || !input.trim()) ? 0.5 : 1
                }}
              >
                <Send size={18} />
              </button>
            </form>
            <div style={{ textAlign: 'center', marginTop: '12px', fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600 }}>
               PRO VERSIYA • REAL-TIME ANALYST ENABLED
            </div>
          </div>
        </div>
      </main>

      <style jsx global>{`
        .chat-bubble table { width: 100%; border-collapse: collapse; margin: 12px 0; border: 1px solid var(--border-color); }
        .chat-bubble th, .chat-bubble td { border: 1px solid var(--border-color); padding: 8px 12px; text-align: left; }
        .chat-bubble th { background: rgba(255,255,255,0.05); font-weight: 800; }
        .typing-dots { display: flex; gap: 4px; padding: 4px 0; }
        .typing-dots span { width: 6px; height: 6px; background: var(--text-ghost); borderRadius: 50%; animation: typing 1s infinite ease-in-out; }
        .typing-dots span:nth-child(2) { animation-delay: 0.2s; }
        .typing-dots span:nth-child(3) { animation-delay: 0.4s; }
        @keyframes typing { 0%, 100% { transform: translateY(0); opacity: 0.3; } 50% { transform: translateY(-4px); opacity: 1; } }
      `}</style>
    </div>
  );
}
