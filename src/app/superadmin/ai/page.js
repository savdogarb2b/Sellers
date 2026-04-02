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
import { Send, Trash2, Bot, Zap, TrendingUp, Building2 } from 'lucide-react';

export default function SuperadminAIPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [organizations, setOrganizations] = useState([]);
  const [selectedOrgId, setSelectedOrgId] = useState('');
  const chatRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => { fetchData(); }, []);
  useEffect(() => { if (chatRef.current) { chatRef.current.scrollTop = chatRef.current.scrollHeight; } }, [messages]);

  const fetchData = async () => {
    try {
      const [msgRes, setRes, orgRes] = await Promise.all([
        fetch('/api/superadmin/ai'),
        fetch('/api/superadmin/settings'),
        fetch('/api/superadmin/organizations')
      ]);
      const msgs = await msgRes.json();
      const settings = await setRes.json();
      const orgs = await orgRes.json();
      
      setMessages(Array.isArray(msgs) ? msgs : []);
      if (settings.ACTIVE_AI_PROVIDER) setAiProvider(settings.ACTIVE_AI_PROVIDER);
      setOrganizations(orgs);
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
      const res = await fetch('/api/superadmin/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg,
          organizationId: selectedOrgId
        }),
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
        m.id === aiMsgId ? { ...m, content: 'Xatolik yuz berdi. Iltimos qayta urinib ko\'ring.' } : m
      ));
    }
    setSending(false);
    inputRef.current?.focus();
  };

  const clearHistory = async () => {
    if (!confirm('Suhbat tarixini tozalashni xohlaysizmi?')) return;
    await fetch('/api/superadmin/ai', { method: 'DELETE' });
    setMessages([]);
  };

  const ChartRenderer = ({ jsonStr }) => {
    try {
      const config = JSON.parse(jsonStr);
      const { type, title } = config;
      const COLORS = ['#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#3b82f6'];

      // Chart.js formatini Recharts formatiga o'tkazish
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
        <div style={{ margin: '20px 0', padding: '24px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px', width: '100%' }}>
          {title && <div style={{ fontSize: '11px', fontWeight: 950, marginBottom: '20px', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-ghost)' }}>{title}</div>}
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              {type === 'bar' ? (
                <BarChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="name" stroke="var(--text-ghost)" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--text-ghost)" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px' }} />
                  {dataKeys.map((key, i) => <Bar key={key} dataKey={key} fill={COLORS[i % COLORS.length]} radius={[4, 4, 0, 0]} />)}
                </BarChart>
              ) : type === 'line' ? (
                <LineChart data={data}>
                  <XAxis dataKey="name" stroke="var(--text-ghost)" fontSize={10} />
                  <YAxis stroke="var(--text-ghost)" fontSize={10} />
                  <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px' }} />
                  {dataKeys.map((key, i) => <Line key={key} type="monotone" dataKey={key} stroke={COLORS[i % COLORS.length]} strokeWidth={3} dot={{ r: 4 }} />)}
                </LineChart>
              ) : (
                <PieChart>
                  <Pie data={data} dataKey={dataKeys[0]} nameKey="name" cx="50%" cy="50%" outerRadius={80} stroke="none">
                    {data.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
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

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleTimeString('uz', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <Navbar />
      <main className="main-content" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - var(--navbar-height))', padding: 0 }}>
        
        {/* SUPERADMIN HEADER */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '16px 32px',
          background: 'var(--bg-card)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid var(--border)',
          flexShrink: 0,
          zIndex: 10
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: 44, height: 44, borderRadius: '14px',
              background: 'linear-gradient(135deg, #ec4899, #8b5cf6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', boxShadow: '0 8px 24px rgba(236, 72, 153, 0.25)'
            }}>
              <Zap size={22} />
            </div>
            <div>
              <div style={{ fontSize: '15px', fontWeight: 950, letterSpacing: '0.5px', color: 'var(--text)' }}>GLOBAL AI ANALYST</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                <Building2 size={10} style={{ color: 'var(--primary-400)' }} />
                <span style={{ fontSize: '10px', color: 'var(--text-ghost)', fontWeight: 800, textTransform: 'uppercase' }}>Superadmin Nazorati</span>
              </div>
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <select
              value={selectedOrgId}
              onChange={e => setSelectedOrgId(e.target.value)}
              style={{
                fontSize: '11px', fontWeight: 800, padding: '10px 16px',
                background: 'var(--bg-elevated)', color: 'var(--text)', border: '1px solid var(--border)',
                borderRadius: '12px', outline: 'none', cursor: 'pointer', maxWidth: '200px'
              }}
            >
              <option value="">Barcha Tashkilotlar</option>
              {organizations.map(org => <option key={org.id} value={org.id}>{org.name}</option>)}
            </select>

            <button onClick={clearHistory} className="btn btn-danger btn-sm" style={{ fontSize: '10px', fontWeight: 900, padding: '10px 16px' }}>
              <Trash2 size={12} />
            </button>
          </div>
        </div>

        {/* CHAT AREA */}
        <div ref={chatRef} className="custom-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '32px 0', background: 'var(--bg-base)' }}>
          <div style={{ width: '100%', maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '32px', padding: '0 24px' }}>
            
            {loading ? (
              <div className="loading-container"><div className="loading-spinner" /></div>
            ) : messages.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
                <div style={{
                  width: 80, height: 80, borderRadius: '24px',
                  background: 'rgba(236, 72, 153, 0.05)', border: '1px solid rgba(236, 72, 153, 0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px'
                }}>
                  <TrendingUp size={36} style={{ color: '#ec4899' }} />
                </div>
                <div style={{ fontSize: '24px', fontWeight: 950, textAlign: 'center', textTransform: 'uppercase', letterSpacing: '2px', color: 'var(--text)' }}>Global Tizim Analizi</div>
                <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '12px', textAlign: 'center', maxWidth: '500px', lineHeight: '1.6' }}>
                   Barcha tashkilotlar ma'lumotlarini tahlil qilish, kutilayotgan sotuvlarni prognoz qilish va global strategiyalarni ishlab chiqish uchun savol bering.
                </p>
              </div>
            ) : (
              messages.map((m, i) => (
                <div key={i} style={{ display: 'flex', gap: '16px', alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '90%' }}>
                  {m.role === 'assistant' && (
                    <div style={{ width: 34, height: 34, borderRadius: '10px', background: 'linear-gradient(135deg, #ec4899, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', flexShrink: 0 }}>
                      <Bot size={18} />
                    </div>
                  )}
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                    <div style={{ 
                      padding: '16px 24px', 
                      borderRadius: m.role === 'user' ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                      background: m.role === 'user' ? 'rgba(236, 72, 153, 0.1)' : 'var(--bg-elevated)',
                      border: m.role === 'user' ? '1px solid rgba(236, 72, 153, 0.2)' : '1px solid var(--border)',
                      color: 'var(--text)', fontSize: '14px', lineHeight: '1.8'
                    }}>
                      <ReactMarkdown 
                        remarkPlugins={[remarkGfm]}
                        components={{
                          code({ node, inline, className, children, ...props }) {
                             const match = /language-(\w+)/.exec(className || '');
                             const content = String(children).replace(/\n$/, '');
                             if (!inline && (match?.[1] === 'chart' || (content.startsWith('{') && content.includes('"type"')))) {
                               return <ChartRenderer jsonStr={content} />;
                             }
                             return <code className={className} {...props}>{children}</code>;
                          }
                        }}
                      >
                        {m.content}
                      </ReactMarkdown>
                    </div>
                    <div style={{ fontSize: '9px', color: 'var(--text-ghost)', marginTop: '6px', textTransform: 'uppercase', fontWeight: 800 }}>
                      {m.role === 'user' ? 'Superadmin' : 'Analytic Engine'} • {formatTime(m.createdAt)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* INPUT AREA */}
        <div style={{ padding: '32px', background: 'var(--bg-base)', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
          <form onSubmit={handleSend} style={{ maxWidth: '1000px', margin: '0 auto', position: 'relative' }}>
            <div style={{ position: 'relative' }}>
              <input
                ref={inputRef} type="text" value={input} onChange={e => setInput(e.target.value)} disabled={sending}
                placeholder="Global moliya va samaradorlik tahlili..."
                style={{
                  width: '100%', padding: '22px 70px 22px 28px', borderRadius: '22px',
                  background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                  color: 'var(--text)', fontSize: '15px', outline: 'none', transition: 'all 0.3s'
                }}
                onFocus={e => e.target.style.borderColor = '#ec4899'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}
              />
              <button
                type="submit" disabled={sending || !input.trim()}
                style={{
                  position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
                  width: '52px', height: '52px', borderRadius: '16px',
                  background: 'linear-gradient(135deg, #ec4899, #8b5cf6)', color: '#fff',
                  border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 4px 15px rgba(236, 72, 153, 0.3)'
                }}
              >
                <Send size={22} />
              </button>
            </div>
          </form>
        </div>
      </main>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: var(--border); borderRadius: 10px; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
