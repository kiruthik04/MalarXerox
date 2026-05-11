import React, { useState, useEffect } from 'react';
import { Plus, RefreshCw, CheckCircle, Clock, Trash2, UserX } from 'lucide-react';
import { generateBillPDF } from '../utils/pdfGenerator';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

export default function DebtsPage({ token }) {
  const [debts, setDebts] = useState([]);
  const [form, setForm] = useState({ customerName: '', phone: '', amount: '', reason: '' });
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const load = () => {
    setLoading(true);
    fetch(`${API_BASE}/api/debts`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => { setDebts(data); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const save = async (e) => {
    e.preventDefault();
    if (!form.customerName || !form.amount) return;
    const res = await fetch('http://localhost:8080/api/debts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ ...form, amount: parseFloat(form.amount) }),
    });
    if (res.ok) {
      setMsg('✅ Debt added!');
      setForm({ customerName: '', phone: '', amount: '', reason: '' });
      load();
    } else setMsg('❌ Failed.');
    setTimeout(() => setMsg(''), 3000);
  };

  const settle = async (id) => {
    if (!window.confirm('Mark this debt as paid and generate bill?')) return;
    const res = await fetch(`${API_BASE}/api/debts/${id}/settle`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) {
      const bill = await res.json();
      
      // Auto-generate PDF for the settlement
      const billData = {
        billId: bill.id,
        displayId: bill.displayId,
        customerName: bill.customerName,
        phone: bill.phone,
        items: JSON.parse(bill.itemsJson),
        grandTotal: bill.grandTotal,
        createdAt: bill.createdAt
      };
      
      const doc = generateBillPDF(billData);
      doc.save(`Settlement_${bill.displayId || bill.id}_${bill.customerName || 'Customer'}.pdf`);
      
      setMsg('✅ Debt settled & Bill generated!');
      setTimeout(() => setMsg(''), 4000);
      load();
    }
  };


  const remove = async (id) => {
    if (!window.confirm('Delete this record?')) return;
    await fetch(`${API_BASE}/api/debts/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    load();
  };

  const pendingTotal = debts.filter(d => !d.settled).reduce((sum, d) => sum + d.amount, 0);

  return (
    <div>
      <div className="page-header">
        <div><h2>Customer Debts</h2><p>Track pending payments and credits</p></div>
        <button className="btn-outline" onClick={load}><RefreshCw size={15} /> Refresh</button>
      </div>

      {msg && <div style={{ marginBottom: '1rem', padding: '0.75rem 1rem', borderRadius: '8px', background: '#dbeafe', color: '#1e40af', fontWeight: 600 }}>{msg}</div>}

      <div className="responsive-grid">
        <div>
          <div className="admin-card">
            <h3><Plus size={18} /> Record New Debt</h3>
            <form onSubmit={save}>
              <div className="form-group">
                <label>Customer Name</label>
                <input className="form-input" placeholder="e.g. Ramesh" value={form.customerName} onChange={e => setForm(f => ({ ...f, customerName: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label>Phone (Optional)</label>
                <input className="form-input" placeholder="e.g. 98456XXXXX" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>Amount (₹)</label>
                <input className="form-input" type="number" step="0.01" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label>Reason / Note</label>
                <textarea className="form-input" style={{ minHeight: '80px' }} placeholder="e.g. Balance for wedding album" value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}></textarea>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button type="submit" className="btn-success" style={{ padding: '0.6rem 1.5rem' }}>
                  <Plus size={16} /> Add to List
                </button>
              </div>
            </form>
          </div>

          <div className="stat-card" style={{ marginTop: '1.5rem', background: 'white', border: '1px solid #fee2e2' }}>
            <div className="stat-title">Total Pending Debts</div>
            <div className="stat-value" style={{ color: '#ef4444' }}>₹{pendingTotal.toFixed(2)}</div>
          </div>
        </div>

        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr><th>Customer</th><th>Amount</th><th>Added On</th><th>Reason</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>Loading...</td></tr>
              ) : debts.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>No debt records found</td></tr>
              ) : debts.map(d => (
                <tr key={d.id} style={{ opacity: d.settled ? 0.6 : 1 }}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{d.customerName}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{d.phone || 'No phone'}</div>
                  </td>
                  <td style={{ fontWeight: 700, color: d.settled ? 'var(--text-muted)' : '#ef4444' }}>₹{d.amount.toFixed(2)}</td>
                  <td style={{ fontSize: '0.85rem' }}>
                    <div>{new Date(d.createdAt).toLocaleDateString()}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{new Date(d.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                  </td>
                  <td style={{ fontSize: '0.85rem' }}>{d.reason || '—'}</td>
                  <td>
                    {d.settled 
                      ? <span className="badge badge-green"><CheckCircle size={12} style={{ marginRight: '4px' }} /> Paid</span>
                      : <span className="badge" style={{ background: '#fef3c7', color: '#92400e' }}><Clock size={12} style={{ marginRight: '4px' }} /> Pending</span>
                    }
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {!d.settled && (
                        <button className="btn-success" style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }} onClick={() => settle(d.id)}>
                          Mark Paid
                        </button>
                      )}
                      <button onClick={() => remove(d.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}



