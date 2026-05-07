import React, { useState, useEffect } from 'react';
import { Plus, RefreshCw, Wallet } from 'lucide-react';

export default function ExpensesPage({ token }) {
  const [expenses, setExpenses] = useState([]);
  const [form, setForm] = useState({ description: '', amount: '', category: 'Supplies' });
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const categories = ['Supplies', 'Electricity', 'Rent', 'Internet', 'Salary', 'Maintenance', 'Other'];

  const load = () => {
    setLoading(true);
    fetch('http://localhost:8080/api/expenses', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => { setExpenses(data); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const save = async (e) => {
    e.preventDefault();
    if (!form.description || !form.amount) return;
    const res = await fetch('http://localhost:8080/api/expenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ ...form, amount: parseFloat(form.amount) }),
    });
    if (res.ok) {
      setMsg('✅ Expense recorded!');
      setForm({ description: '', amount: '', category: 'Supplies' });
      load();
    } else setMsg('❌ Failed to record.');
    setTimeout(() => setMsg(''), 3000);
  };


  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div>
      <div className="page-header">
        <div><h2>Business Expenses</h2><p>Track your spending and overheads</p></div>
        <button className="btn-outline" onClick={load}><RefreshCw size={15} /> Refresh</button>
      </div>

      {msg && <div style={{ marginBottom: '1rem', padding: '0.75rem 1rem', borderRadius: '8px', background: msg.startsWith('✅') ? '#dcfce7' : '#fee2e2', color: msg.startsWith('✅') ? '#166534' : '#991b1b', fontWeight: 600 }}>{msg}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem' }}>
        <div>
          <div className="admin-card">
            <h3><Plus size={18} /> New Expense</h3>
            <form onSubmit={save}>
              <div className="form-group">
                <label>Description</label>
                <input className="form-input" placeholder="e.g. EB Bill - March" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label>Amount (₹)</label>
                <input className="form-input" type="number" step="0.01" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label>Category</label>
                <select className="form-select" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                  {categories.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button type="submit" className="btn-success" style={{ padding: '0.6rem 1.5rem' }}>
                  <Plus size={16} /> Save Expense
                </button>
              </div>
            </form>
          </div>
          
          <div className="stat-card" style={{ marginTop: '1.5rem', background: 'white' }}>
            <div className="stat-title">Total Tracked Expenses</div>
            <div className="stat-value" style={{ color: '#ef4444' }}>₹{totalExpenses.toFixed(2)}</div>
          </div>
        </div>

        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr><th>Date</th><th>Category</th><th>Description</th><th>Amount</th></tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} style={{ textAlign: 'center', padding: '2rem' }}>Loading...</td></tr>
              ) : expenses.length === 0 ? (
                <tr><td colSpan={4} style={{ textAlign: 'center', padding: '2rem' }}>No expenses recorded yet</td></tr>
              ) : expenses.map(e => (
                <tr key={e.id}>
                  <td style={{ fontSize: '0.85rem' }}>{new Date(e.createdAt).toLocaleDateString()}</td>
                  <td><span className="badge badge-green" style={{ background: '#f3f4f6', color: '#374151' }}>{e.category}</span></td>
                  <td><strong>{e.description}</strong></td>
                  <td style={{ color: '#ef4444', fontWeight: 700 }}>₹{e.amount.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
