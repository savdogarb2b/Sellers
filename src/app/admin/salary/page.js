'use client';
import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import Navbar from '@/components/Navbar';

export default function SalaryPage() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => { 
    fetch('/api/employees').then(r => r.json()).then(d => { setEmployees(d); setLoading(false); }); 
  }, []);

  const handlePrintPayslip = (emp, stats) => {
    const printWindow = window.open('', '', 'width=600,height=600');
    const html = `
      <div style="font-family: sans-serif; padding: 20px; max-width: 500px; margin: auto; border: 1px solid #ccc;">
        <h2 style="text-align: center; margin-bottom: 5px;">TO'LOV VARAQASI</h2>
        <p style="text-align: center; color: #666; margin-top: 0;">${selectedYear}-yil ${selectedMonth}-oy uchun</p>
        <hr />
        <p><strong>Xodim:</strong> ${emp.name}</p>
        <table style="width: 100%; margin-top: 20px; border-collapse: collapse;">
          <tr><td style="padding: 8px 0; border-bottom: 1px solid #eee;">Fiksa oylik:</td><td style="text-align: right; border-bottom: 1px solid #eee;">${stats.fixed.toLocaleString()} so'm</td></tr>
          <tr><td style="padding: 8px 0; border-bottom: 1px solid #eee;">KPI Bonusi:</td><td style="text-align: right; border-bottom: 1px solid #eee;">+${stats.kpi.toLocaleString()} so'm</td></tr>
          <tr><td style="padding: 8px 0; border-bottom: 1px solid #eee;">Qo'shimcha bonuslar:</td><td style="text-align: right; border-bottom: 1px solid #eee;">+${stats.bonus.toLocaleString()} so'm</td></tr>
          <tr><td style="padding: 8px 0; border-bottom: 1px solid #eee;">Jarimalar:</td><td style="text-align: right; border-bottom: 1px solid #eee;">-${stats.penalty.toLocaleString()} so'm</td></tr>
          <tr><td style="padding: 12px 0; font-weight: bold; font-size: 18px;">Umumiy to'lov:</td><td style="text-align: right; font-weight: bold; font-size: 18px;">${stats.net.toLocaleString()} so'm</td></tr>
        </table>
        <p style="text-align: center; margin-top: 40px; font-size: 12px; color: #888;">Tizim tomonidan avtomatik shakllantirildi</p>
      </div>
      <script>window.print(); setTimeout(() => window.close(), 500);</script>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <Navbar />
      <main className="main-content">
        <div className="animate-in">
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
            <div style={{ display: 'flex', gap: '8px', background: 'var(--bg-card)', padding: '6px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <select className="form-input" style={{ width: '120px', background: 'transparent', border: 'none', fontWeight: 600, padding: '4px' }} value={selectedMonth} onChange={e => setSelectedMonth(Number(e.target.value))}>
                {months.map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
              </select>
              <select className="form-input" style={{ width: '80px', background: 'transparent', border: 'none', fontWeight: 600, padding: '4px' }} value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))}>
                {Array.from({length: 5}, (_, i) => <option key={i} value={new Date().getFullYear() - i}>{new Date().getFullYear() - i}</option>)}
              </select>
            </div>
          </div>

          {loading ? (
            <div className="loading-container animate-in"><div className="loading-spinner" /></div>
          ) : (
            <div className="card glass-panel animate-in" style={{ padding: '0', overflow: 'hidden' }}>
              <div className="table-container">
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left' }}>Xodim</th>
                      <th style={{ textAlign: 'left' }}>Fiksa</th>
                      <th style={{ textAlign: 'left' }}>KPI Bonus</th>
                      <th style={{ textAlign: 'left' }}>Qo'shimcha</th>
                      <th style={{ textAlign: 'left' }}>Jarimalar</th>
                      <th style={{ textAlign: 'left' }}>Jami Maosh</th>
                      <th style={{ textAlign: 'right' }}>Harakat</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employees.map((emp, idx) => {
                      const isCurrentMonth = (d) => {
                        const dt = new Date(d);
                        return dt.getMonth() + 1 === selectedMonth && dt.getFullYear() === selectedYear;
                      };

                      const fixedSalary = emp.fixedSalary || 0;
                      const kpiBonus = emp.kpis?.reduce((sum, k) => {
                        const pct = k.targetValue > 0 ? (k.currentValue || 0) / k.targetValue : 0;
                        return sum + (pct >= 1 ? 300000 : pct >= 0.8 ? 150000 : 0);
                      }, 0) || 0;

                      const periodBonuses = (emp.bonusRecords || []).filter(r => isCurrentMonth(r.date)).reduce((s, r) => s + r.amount, 0);
                      const periodPenalties = (emp.penaltyRecords || []).filter(r => isCurrentMonth(r.date)).reduce((s, r) => s + r.amount, 0);
                      const netSalary = fixedSalary + kpiBonus + periodBonuses - periodPenalties;
                      const stats = { fixed: fixedSalary, kpi: kpiBonus, bonus: periodBonuses, penalty: periodPenalties, net: netSalary };

                      return (
                        <tr key={emp.id} style={{ cursor: 'default' }}>
                          <td>
                            <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-primary)' }}>{emp.name}</div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{emp.email}</div>
                          </td>
                          <td style={{ fontSize: '13px', fontWeight: 600 }}>{fixedSalary.toLocaleString()}</td>
                          <td>
                            <span className="activity-pill success" style={{ background: 'var(--bg-input)', color: 'var(--accent-teal)', fontWeight: 600 }}>+{kpiBonus.toLocaleString()}</span>
                          </td>
                          <td>
                            <span className="activity-pill success" style={{ background: 'var(--bg-input)', color: 'var(--accent-blue)', fontWeight: 600 }}>+{periodBonuses.toLocaleString()}</span>
                          </td>
                          <td>
                            <span className="activity-pill danger" style={{ background: 'var(--bg-input)', color: 'var(--danger-400)', fontWeight: 600 }}>-{periodPenalties.toLocaleString()}</span>
                          </td>
                          <td>
                            <div style={{ fontWeight: 800, fontSize: '14px', color: netSalary >= fixedSalary ? 'var(--accent-teal)' : 'var(--danger-400)' }}>
                              {netSalary.toLocaleString()} <span style={{fontSize: '10px'}}>so'm</span>
                            </div>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <button className="btn btn-secondary btn-sm" onClick={() => handlePrintPayslip(emp, stats)}>
                               Chek chiqarish
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {employees.length === 0 && (
                  <div className="empty-state" style={{ padding: '60px' }}>
                    <div className="empty-state-text">Hech qanday xodim topilmadi</div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

const months = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'];
