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

  useEffect(() => { fetchData(); }, []);
  useEffect(() => { if (chatRef.current) { chatRef.current.scrollTop = chatRef.current.scrollHeight; } }, [messages]);

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
    if (e) e.preventDefault();
    if (!input.trim() || sending) return;

    const userMsg = input.trim();
    setInput('');
    
    // Add user message to UI
    setMessages(prev => [...prev, { role: 'user', content: userMsg, createdAt: new Date() }]);
    
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

        // Update the AI message chunk-by-chunk
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

  const ChartRenderer = ({ jsonStr }) => {
    try {
      const config = JSON.parse(jsonStr);
      const { type, title, data } = config;
      const COLORS = ['#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#3b82f6'];
      return (
        <div style={{ margin: '20px 0', padding: '24px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', borderRadius: '16px', width: '100%' }}>
          {title && <div style={{ fontSize: '11px', fontWeight: 900, marginBottom: '20px', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-ghost)' }}>{title}</div>}
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              {type === 'bar' ? (
                <BarChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="name" stroke="var(--text-ghost)" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--text-ghost)" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px' }} />
                  <Bar dataKey="value" fill="var(--primary-500)" radius={[4, 4, 0, 0]} />
                </BarChart>
              ) : type === 'line' ? (
                <LineChart data={data}>
                  <XAxis dataKey="name" stroke="var(--text-ghost)" fontSize={10} />
                  <YAxis stroke="var(--text-ghost)" fontSize={10} />
                  <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px' }} />
                  <Line type="monotone" dataKey="value" stroke="var(--primary-500)" strokeWidth={3} dot={{ r: 4 }} />
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
    } catch (e) { return <pre style={{ fontSize: '10px' }}>{jsonStr}</pre>; }
  };

  const quickActions = [
    { text: 'Umumiy holat', icon: <TrendingUp size={14} /> },
    { text: 'KPI tahlili', icon: <BarChart2 size={14} /> },
    { text: 'Sotuv strategiyasi', icon: <Sparkles size={14} /> },
    { text: 'Moliya/Bonuslar', icon: <PieChartIcon size={14} /> },
  ];

  return (
    <div className="app-layout">
      <Sidebar />
      <Navbar />
      <main className="main-content" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - var(--navbar-height))', padding: 0 }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 32px', background: 'var(--bg-card)', borderBottom: '1px solid var(--border-color)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: 36, height: 36, borderRadius: '12px', background: 'var(--primary-500)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000' }}><Bot size={22} /></div>
            <div>
              <div style={{ fontSize: '16px', fontWeight: 950, letterSpacing: '0.5px' }}>STRATEGIK AI MASLAHATCHI</div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Professional tahliliy tizim</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <select className="form-input" value={selectedOrg} onChange={e => setSelectedOrg(e.target.value)} style={{ width: '220px', fontSize: '11px', fontWeight: 700, padding: '8px 12px' }}>
              <option value="">Barcha Tashkilotlar</option>
              {orgs.map(org => <option key={org.id} value={org.id}>{org.name}</option>)}
            </select>
            <button className="btn btn-secondary" onClick={clearHistory} style={{ fontSize: '10px', fontWeight: 900, padding: '8px 16px', color: '#ef4444', background: 'rgba(239, 68, 68, 0.05)' }}>
              <Trash2 size={12} style={{ marginRight: '6px' }} /> TOZALASH
            </button>
          </div>
        </div>

        {/* Chat Area */}
        <div ref={chatRef} style={{ flex: 1, overflowY: 'auto', padding: '40px 60px', background: 'var(--bg-deeper)', display: 'flex', flexDirection: 'column', gap: '28px', minHeight: 0 }}>
          {loading ? <div className="loading-container"><div className="loading-spinner" /></div> : messages.length === 0 ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', margin: '0 auto' }}>
              <div style={{ fontSize: '24px', fontWeight: 950, marginBottom: '12px', textAlign: 'center' }}>Xush kelibsiz, Superadmin!</div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '15px', marginBottom: '40px', textAlign: 'center', maxWidth: '600px' }}>Tizimdagi ma'lumotlar bilan ishlash uchun quyidagi tezkor savollardan foydalaning yoki o'z savolingizni yozing.</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', width: '100%', maxWidth: '1000px' }}>
                {quickActions.map((q, i) => (
                  <button key={i} onClick={() => { setInput(q.text); }} className="card glass-panel" style={{ padding: '24px', cursor: 'pointer', textAlign: 'left', marginBottom: 0, borderRadius: '16px', transition: 'all 0.3s ease', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ width: 32, height: 32, borderRadius: '8px', background: 'var(--primary-ghost)', color: 'var(--primary-400)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{q.icon}</div>
                    <div style={{ fontSize: '13px', fontWeight: 700 }}>{q.text}</div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '32px' }}>
              {messages.map((m, i) => (
                <div key={i} style={{ display: 'flex', gap: '20px', alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: m.role === 'user' ? '80%' : '100%', width: m.role === 'assistant' ? '100%' : 'auto' }}>
                  {m.role === 'assistant' && <div style={{ width: 32, height: 32, borderRadius: '10px', background: 'var(--primary-500)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', flexShrink: 0 }}><Bot size={18} /></div>}
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                    <div style={{ fontSize: '10px', fontWeight: 900, color: 'var(--text-ghost)', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '1px' }}>{m.role === 'user' ? 'SIZ' : 'AI EXECUTIVE'}</div>
                    <div style={{ 
                      padding: '24px', borderRadius: '20px', width: m.role === 'assistant' ? '100%' : 'auto',
                      background: m.role === 'user' ? 'var(--primary-500)' : 'var(--bg-card)',
                      color: m.role === 'user' ? '#000' : 'var(--text-primary)',
                      border: '1px solid var(--border-color)', fontSize: '14.5px', lineHeight: '1.8', fontWeight: 500,
                      boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                    }}>
                      <ReactMarkdown 
                        remarkPlugins={[remarkGfm]}
                        components={{
                          code({ node, inline, className, children, ...props }) {
                            const match = /language-(\w+)/.exec(className || '');
                            if (!inline && match && match[1] === 'chart') { return <ChartRenderer jsonStr={String(children).replace(/\n$/, '')} />; }
                            return <code className={className} {...props}>{children}</code>;
                          }
                        }}
                      >
                        {m.content}
                      </ReactMarkdown>
                    </div>
                  </div>
                  {m.role === 'user' && <div style={{ width: 32, height: 32, borderRadius: '10px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-color)' }}><User size={18} /></div>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Input */}
        <div style={{ padding: '24px 60px', background: 'var(--bg-card)', borderTop: '1px solid var(--border-color)', flexShrink: 0 }}>
          <form onSubmit={handleSend} style={{ width: '100%', margin: '0 auto', position: 'relative' }}>
            <input
              type="text" value={input} onChange={e => setInput(e.target.value)} disabled={sending}
              placeholder="Fikr yoki tahliliy so'rov yozing..."
              style={{ width: '100%', padding: '20px 70px 20px 30px', background: 'var(--bg-deeper)', border: '1px solid var(--border-color)', borderRadius: '18px', color: 'white', fontSize: '15px', outline: 'none' }}
            />
            <button type="submit" disabled={sending || !input.trim()} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', width: '44px', height: '44px', borderRadius: '14px', background: 'var(--primary-500)', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer' }}>
              <Send size={20} />
            </button>
          </form>
        </div>
      </main>

      <style jsx global>{`
        .chat-area table { border-collapse: collapse; width: 100%; margin: 16px 0; }
        .chat-area th, .chat-area td { border: 1px solid var(--border-color); padding: 12px; text-align: left; }
        .chat-area th { background: rgba(255,255,255,0.03); }
      `}</style>
    </div>
  );
}
