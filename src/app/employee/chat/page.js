'use client';

import { useState, useEffect, useRef } from 'react';
import Sidebar from '@/components/Sidebar';
import Navbar from '@/components/Navbar';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Bot, Sparkles, Zap, ShieldAlert, TrendingUp, Send, Trash2 } from 'lucide-react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
export default function EmployeeChatPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState('');
  const chatRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => { fetchData(); }, []);
  useEffect(() => { if (chatRef.current) { chatRef.current.scrollTop = chatRef.current.scrollHeight; } }, [messages]);

  // Fetch messages when session changes
  useEffect(() => {
    const fetchSessionMessages = async () => {
      setLoading(true);
      if (!currentSessionId) {
        setMessages([]);
      } else {
        try {
          const res = await fetch(`/api/chat/sessions/${currentSessionId}`);
          const msgs = await res.json();
          setMessages(Array.isArray(msgs) ? msgs : []);
        } catch (e) { setMessages([]); }
      }
      setLoading(false);
    };
    fetchSessionMessages();
  }, [currentSessionId]);

  const fetchData = async () => {
    try {
      const sessRes = await fetch('/api/chat/sessions');
      const sess = await sessRes.json();
      setSessions(Array.isArray(sess) ? sess : []);
      if (Array.isArray(sess) && sess.length > 0) {
        setCurrentSessionId(sess[0].id);
      } else {
        setLoading(false);
      }
    } catch (e) { setLoading(false); }
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

    let targetSessionId = currentSessionId;
    if (!targetSessionId) {
      try {
        const sessRes = await fetch('/api/chat/sessions', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: userMsg.slice(0, 30) + (userMsg.length > 30 ? '...' : '') })
        });
        const newSess = await sessRes.json();
        targetSessionId = newSess.id;
        setCurrentSessionId(targetSessionId);
        setSessions(prev => [newSess, ...prev]);
      } catch (e) {}
    }

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg, sessionId: targetSessionId }),
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
      setMessages(prev => prev.map(m => m.id === aiMsgId ? { ...m, content: 'Xatolik yuz berdi. Iltimos qayta urinib ko\'ring.' } : m));
    }
    setSending(false);
    inputRef.current?.focus();
  };

  const clearHistory = async () => {
    if (!currentSessionId) return;
    if (!confirm('Ushbu suhbat tarixini tozalashni va o\'chirishni xohlaysizmi?')) return;
    await fetch(`/api/chat/sessions/${currentSessionId}`, { method: 'DELETE' });
    setSessions(prev => prev.filter(s => s.id !== currentSessionId));
    setCurrentSessionId('');
    setMessages([]);
  };

  const startNewSession = () => {
    setCurrentSessionId('');
    setMessages([]);
  };

  const downloadAsPDF = async (messageId) => {
    const element = document.getElementById(`msg-${messageId}`);
    if (!element) return;
    
    try {
      const html2canvasModule = await import('html2canvas');
      const html2canvas = html2canvasModule.default;
      const { jsPDF } = await import('jspdf');

      const canvas = await html2canvas(element, { scale: 2, useCORS: true, backgroundColor: '#111827' });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [canvas.width / 2, canvas.height / 2]
      });
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 2, canvas.height / 2);
      pdf.save(`AI_Yordamchi_${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (e) {
      console.error('PDF xatosi', e);
      alert('PDF yuklashda xatolik yuz berdi');
    }
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
    { title: 'Bugungi vazifalar', text: 'Bugungi eng muhim vazifalar va maqsadlarni sanab oting.', icon: <Zap size={14} /> },
    { title: 'Mijoz e\'tirozi', text: 'Mijoz qimmat deb e\'tiroz bildirsa qanday javob berish kerak?', icon: <ShieldAlert size={14} /> },
    { title: 'Sotuv taktikasi', text: 'Sotuvlarni yopish uchun taktikalar o\'rgat.', icon: <TrendingUp size={14} /> },
  ];

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleTimeString('uz', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <Navbar />
      <main className="main-content" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - var(--navbar-height))', padding: 0, position: 'relative' }}>

        {/* HEADER */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '14px 24px', background: 'var(--bg-card)', backdropFilter: 'blur(20px)',
          borderBottom: '1px solid var(--border)', flexShrink: 0, zIndex: 10
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: 38, height: 38, borderRadius: '10px',
              background: 'linear-gradient(135deg, var(--primary-500), var(--primary-600))',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff'
            }}>
              <Bot size={20} />
            </div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text)' }}>AI Yordamchi</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 6px #10b981' }} />
                <span style={{ fontSize: '10px', color: '#10b981', fontWeight: 700 }}>Onlayn</span>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <select
              value={currentSessionId}
              onChange={e => {
                if (e.target.value === 'new') startNewSession();
                else setCurrentSessionId(e.target.value);
              }}
              style={{
                fontSize: '11px', fontWeight: 800, padding: '10px 16px',
                background: 'var(--bg-elevated)', color: 'var(--text)', border: '1px solid var(--border)',
                borderRadius: '12px', outline: 'none', cursor: 'pointer', maxWidth: '200px'
              }}
            >
              <option value="new">+ Yangi Suhbat</option>
              {sessions.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
            </select>

            {messages.length > 0 && (
              <button onClick={clearHistory} className="btn-hover" style={{
                background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-muted)',
                fontSize: '11px', fontWeight: 700, padding: '8px 12px', borderRadius: '8px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s'
              }}>
                <Trash2 size={14} /> Tozalash
              </button>
            )}
          </div>
        </div>

        {/* CHAT AREA */}
        <div ref={chatRef} className="custom-scrollbar" style={{
          flex: 1, overflowY: 'auto', background: 'var(--bg-base)', scrollBehavior: 'smooth',
          display: 'flex', flexDirection: 'column', paddingBottom: '160px'
        }}>
          {loading ? (
            <div className="loading-container" style={{ minHeight: '300px' }}><div className="loading-spinner" /></div>
          ) : messages.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, animation: 'fadeIn 0.5s ease', padding: '40px 20px' }}>
              <div style={{ width: 64, height: 64, borderRadius: '20px', background: 'linear-gradient(135deg, var(--primary-500), var(--primary-600))', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px', boxShadow: '0 10px 25px -5px rgba(124,58,237,0.4)' }}>
                <Sparkles size={32} style={{ color: '#fff' }} />
              </div>
              <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text)', marginBottom: '12px', textAlign: 'center' }}>Salom, men sizning AI Yordamchingizman</h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '15px', textAlign: 'center', maxWidth: '500px', lineHeight: '1.6', marginBottom: '40px' }}>
                Sotuvlar, mijozlar bilan muloqot va kundalik vazifalar bo'yicha sun'iy intellekt maslahatlarini oling.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', width: '100%', maxWidth: '700px' }}>
                {quickPrompts.map((prompt, i) => (
                  <button key={i} onClick={() => handleSend(null, prompt.text)} className="btn-hover" style={{
                    background: 'var(--bg-card)', border: '1px solid var(--border)',
                    padding: '16px', borderRadius: '12px', cursor: 'pointer', transition: 'all 0.2s',
                    display: 'flex', flexDirection: 'column', gap: '8px', textAlign: 'left'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary-400)' }}>
                      {prompt.icon}
                      <span style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase' }}>{prompt.title}</span>
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.4' }}>{prompt.text}</div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', width: '100%', paddingBottom: '20px' }}>
              {messages.map((m, i) => (
                <div key={i} id={`msg-${m.id || i}`} style={{ width: '100%', padding: '16px 20px', background: 'transparent', position: 'relative' }}>
                  <div style={{ maxWidth: '850px', margin: '0 auto', display: 'flex', flexDirection: m.role === 'user' ? 'row-reverse' : 'row', gap: '20px' }}>
                    
                    <div style={{ flexShrink: 0, marginTop: '2px' }}>
                      {m.role === 'assistant' ? (
                        <div style={{ width: 36, height: 36, borderRadius: '12px', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', boxShadow: 'var(--shadow-sm)' }}>
                          <Bot size={20} />
                        </div>
                      ) : (
                        <div style={{ width: 36, height: 36, borderRadius: '12px', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
                          <span style={{ fontSize: '14px', fontWeight: 800 }}>U</span>
                        </div>
                      )}
                    </div>

                    <div style={{ 
                      flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', 
                      alignItems: m.role === 'user' ? 'flex-end' : 'flex-start' 
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center', marginBottom: '8px' }}>
                        <div style={{ fontSize: '11px', fontWeight: 900, color: m.role === 'assistant' ? 'var(--primary)' : 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                          {m.role === 'assistant' ? 'AI Yordamchi' : 'Siz'}
                        </div>
                        {m.role === 'assistant' && (
                          <button onClick={() => downloadAsPDF(m.id || i)} className="btn-hover" style={{
                            background: 'transparent', border: 'none', color: 'var(--text-muted)',
                            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px',
                            fontSize: '10px', textTransform: 'uppercase', fontWeight: 700
                          }}>
                            <Download size={12} /> PDF yuklash
                          </button>
                        )}
                      </div>
                      
                      {m.role === 'assistant' ? (
                        <div className="claude-prose" style={{ width: '100%' }}>
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
                        </div>
                      ) : (
                        <div style={{
                          background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                          padding: '16px 20px', borderRadius: '20px 4px 20px 20px',
                          color: 'var(--text)', fontSize: '15.5px', lineHeight: '1.6',
                          boxShadow: 'var(--shadow-sm)', maxWidth: '90%', whiteSpace: 'pre-wrap'
                        }}>
                          {m.content}
                        </div>
                      )}
                    </div>

                  </div>
                </div>
              ))}
              {sending && (
                <div style={{ width: '100%', padding: '24px 20px', background: 'transparent' }}>
                  <div style={{ maxWidth: '850px', margin: '0 auto', display: 'flex', gap: '20px' }}>
                    <div style={{ flexShrink: 0, marginTop: '2px' }}>
                      <div style={{ width: 32, height: 32, borderRadius: '8px', background: 'linear-gradient(135deg, var(--primary-500), var(--primary-600))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                        <Bot size={18} />
                      </div>
                    </div>
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', height: '32px' }}>
                      <div className="typing-pulse" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* INPUT FIXED AT BOTTOM */}
        <div style={{ 
          position: 'absolute', bottom: 0, left: 0, right: 0, padding: '0 20px 24px', 
          background: 'linear-gradient(to top, var(--bg-base) 70%, transparent)' 
        }}>
          <div style={{ maxWidth: '850px', margin: '0 auto', position: 'relative' }}>
            <form onSubmit={handleSend} style={{ 
              position: 'relative', background: 'var(--bg-elevated)', 
              border: '1px solid rgba(124,58,237,0.3)', borderRadius: '20px', 
              boxShadow: '0 12px 30px -10px rgba(0,0,0,0.4)',
              display: 'flex', flexDirection: 'column'
            }}>
              <textarea
                ref={inputRef} value={input} onChange={e => setInput(e.target.value)} disabled={sending}
                placeholder="Yordamchidan so'rang..."
                style={{
                  width: '100%', padding: '16px 20px', background: 'transparent', border: 'none', 
                  color: 'var(--text)', fontSize: '15.5px', outline: 'none', resize: 'none', 
                  maxHeight: '200px', minHeight: '56px', overflowY: 'auto', fontFamily: 'inherit'
                }}
                rows={1}
                onInput={(e) => {
                  e.target.style.height = 'auto';
                  e.target.style.height = (e.target.scrollHeight) + 'px';
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend(e);
                  }
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                   {/* optional buttons like attach could go here */}
                </div>
                <button type="submit" disabled={sending || !input.trim()} style={{
                  width: '36px', height: '36px', borderRadius: '12px',
                  background: input.trim() ? 'var(--primary-500)' : 'var(--bg-card)',
                  color: input.trim() ? '#fff' : 'var(--text-3)',
                  border: '1px solid var(--border)', cursor: input.trim() ? 'pointer' : 'default',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s',
                  boxShadow: input.trim() ? '0 4px 12px rgba(124,58,237,0.3)' : 'none'
                }}>
                  <Send size={16} />
                </button>
              </div>
            </form>
            <div style={{ textAlign: 'center', marginTop: '10px', fontSize: '11px', color: 'var(--text-ghost)' }}>
              AI ko'rsatmalar xatolikka yo'l qo'yishi mumkin. E'tiborli bo'ling.
            </div>
          </div>
        </div>

      </main>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: var(--border); border-radius: 10px; }
        
        .claude-prose h1, .claude-prose h2, .claude-prose h3 {
          color: var(--text); margin: 1.5em 0 0.8em; font-weight: 900; letter-spacing: 0.5px; text-transform: uppercase;
        }
        .claude-prose h1 { 
          font-size: 1.3em; 
          border-bottom: 2px solid var(--primary); 
          display: inline-block; padding-bottom: 4px;
        }
        .claude-prose h2 { font-size: 1.15em; }
        .claude-prose h3 { font-size: 1.05em; }
        .claude-prose p { margin: 0 0 1.25em; color: var(--text-2); line-height: 1.7; font-size: 1.05em; }
        .claude-prose p:last-child { margin-bottom: 0; }
        .claude-prose ul, .claude-prose ol { margin: 0 0 1.25em 0; padding-left: 20px; color: var(--text-2); line-height: 1.7; font-size: 1.05em; }
        .claude-prose li { margin-bottom: 0.6em; }
        .claude-prose strong { color: var(--text); font-weight: 800; background: var(--bg-elevated); padding: 2px 6px; border-radius: 6px; border: 1px solid var(--border); }
        .claude-prose em { color: var(--text-2); font-style: italic; }
        .claude-prose blockquote {
          border-left: 4px solid var(--primary); margin: 1.5em 0; padding: 1em;
          color: var(--text-3); font-style: italic; background: var(--bg-elevated); border-radius: 0 12px 12px 0;
        }
        .claude-prose table {
          width: 100%; border-collapse: separate; border-spacing: 0; margin: 2em 0; font-size: 0.95em;
          border-radius: 12px; overflow: hidden; border: 1px solid var(--border); box-shadow: var(--shadow-sm);
        }
        .claude-prose th, .claude-prose td {
          padding: 14px 18px; text-align: left; border-bottom: 1px solid var(--row-border);
        }
        .claude-prose th { background: var(--bg-elevated); font-weight: 800; color: var(--text); text-transform: uppercase; font-size: 0.85em; letter-spacing: 1px; border-bottom: 2px solid var(--border); }
        .claude-prose tr:last-child td { border-bottom: none; }
        .claude-prose tr:hover td { background: var(--row-hover); }
        .claude-prose .inline-code {
          background: var(--bg-elevated); border: 1px solid var(--border);
          padding: 2px 6px; border-radius: 6px; font-size: 0.85em; font-family: 'JetBrains Mono', monospace; color: var(--primary);
        }
        .claude-prose pre {
          background: var(--bg-deep); border: 1px solid var(--border);
          border-radius: 12px; padding: 16px; margin: 1.5em 0; overflow-x: auto; box-shadow: inset 0 2px 10px rgba(0,0,0,0.05);
        }
        .claude-prose pre code {
          background: none; border: none; padding: 0; color: var(--text); font-size: 0.9em; font-family: 'JetBrains Mono', monospace;
        }
        
        .typing-pulse {
          width: 8px; height: 8px; border-radius: 50%;
          background: var(--primary-400); margin-left: 4px;
          animation: pulse 1s infinite alternate;
        }
        @keyframes pulse {
          0% { transform: scale(0.8); opacity: 0.5; }
          100% { transform: scale(1.4); opacity: 1; box-shadow: 0 0 8px var(--primary-500); }
        }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .btn-hover:hover { background: rgba(124,58,237,0.08) !important; border-color: rgba(124,58,237,0.3) !important; color: var(--primary-400) !important; }
      `}</style>
    </div>
  );
}
