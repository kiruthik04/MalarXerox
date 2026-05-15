import React, { useState, useEffect } from 'react';
import { Plus, RefreshCw, CheckCircle, Clock, Trash2, UserX, Search } from 'lucide-react';
import { generateBillPDF } from '../utils/pdfGenerator';
import { api } from '../services/api';

export default function DebtsPage({ role }) {
  const [debts, setDebts] = useState([]);
  const [form, setForm] = useState({ customerName: '', phone: '', amount: '', reason: '' });
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const load = () => {
    setLoading(true);
    api.getDebts()
      .then(data => { setDebts(data); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const save = async (e) => {
    e.preventDefault();
    if (!form.customerName || !form.amount) return;
    try {
      await api.addDebt({ ...form, amount: parseFloat(form.amount) });
      setMsg('✅ Debt added!');
      setForm({ customerName: '', phone: '', amount: '', reason: '' });
      load();
    } catch (err) {
      setMsg(`❌ ${err.message || 'Failed.'}`);
    }
    setTimeout(() => setMsg(''), 3000);
  };

  const settle = async (id) => {
    if (!window.confirm('Mark this debt as paid and generate bill?')) return;
    try {
      const bill = await api.settleDebt(id);
      
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
    } catch (err) {
      console.error(err);
      setMsg('❌ Failed to settle debt.');
    }
  };

  const settleMultiple = async (ids) => {
    if (!window.confirm(`Mark ${ids.length} debts as paid and generate a combined bill?`)) return;
    setLoading(true);
    try {
      const bill = await api.settleMultipleDebts(ids);
      
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
      doc.save(`Combined_Settlement_${bill.displayId || bill.id}_${bill.customerName || 'Customer'}.pdf`);
      
      setMsg('✅ Multiple debts settled & Combined Bill generated!');
      setTimeout(() => setMsg(''), 4000);
      load();
    } catch (err) {
      setMsg(`❌ Failed: ${err.message || 'Unknown error'}`);
      setLoading(false);
    }
  };


  const remove = async (id) => {
    if (!window.confirm('Delete this record?')) return;
    try {
      await api.deleteDebt(id);
      load();
    } catch (err) {
      console.error('Failed to delete debt', err);
    }
  };

  const filteredDebts = debts.filter(d => 
    d.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (d.phone && d.phone.includes(searchTerm))
  );

  const pendingTotal = debts.filter(d => !d.settled).reduce((sum, d) => sum + d.amount, 0);
  const filteredPendingDebts = filteredDebts.filter(d => !d.settled);
  const filteredPendingTotal = filteredPendingDebts.reduce((sum, d) => sum + d.amount, 0);

  return (
    <div>
      <div className="page-header">
        <div><h2>Customer Debts</h2><p>Track pending payments and credits</p></div>
        {role !== 'EMPLOYEE' && (
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                className="form-input" 
                placeholder="Filter by customer..." 
                value={searchTerm} 
                onChange={e => setSearchTerm(e.target.value)}
                style={{ paddingLeft: '32px', width: '250px', marginBottom: 0 }}
              />
            </div>
            <button className="btn-outline" onClick={load}><RefreshCw size={15} /> Refresh</button>
          </div>
        )}
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

          {role !== 'EMPLOYEE' && (
            <>
              <div className="stat-card" style={{ marginTop: '1.5rem', background: 'white', border: '1px solid #fee2e2' }}>
                <div className="stat-title">Total Pending Debts</div>
                <div className="stat-value" style={{ color: '#ef4444' }}>₹{pendingTotal.toFixed(2)}</div>
              </div>

              {searchTerm && filteredPendingDebts.length > 0 && (
                <div className="stat-card" style={{ marginTop: '1rem', background: '#f0fdf4', border: '1px solid #dcfce7' }}>
                  <div className="stat-title" style={{ color: '#166534' }}>Total for "{searchTerm}"</div>
                  <div className="stat-value" style={{ color: '#15803d' }}>₹{filteredPendingTotal.toFixed(2)}</div>
                  <p style={{ fontSize: '0.75rem', marginTop: '0.5rem', color: '#166534' }}>{filteredPendingDebts.length} pending records</p>
                  <button 
                    className="btn-success" 
                    style={{ width: '100%', marginTop: '0.75rem' }}
                    onClick={() => settleMultiple(filteredPendingDebts.map(d => d.id))}
                  >
                    <CheckCircle size={14} /> Settle All Filtered
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {role !== 'EMPLOYEE' && (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr><th>Customer</th><th className="text-right">Amount</th><th>Added On</th><th>Reason</th><th className="text-center">Status</th><th className="text-center">Actions</th></tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>Loading...</td></tr>
                ) : filteredDebts.length === 0 ? (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>No records found for "{searchTerm}"</td></tr>
                ) : filteredDebts.map(d => (
                  <tr key={d.id} style={{ opacity: d.settled ? 0.6 : 1 }}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{d.customerName}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{d.phone || 'No phone'}</div>
                    </td>
                    <td className="text-right" style={{ fontWeight: 700, color: d.settled ? 'var(--text-muted)' : '#ef4444' }}>₹{d.amount.toFixed(2)}</td>
                    <td style={{ fontSize: '0.85rem' }}>
                      <div>{new Date(d.createdAt).toLocaleDateString()}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{new Date(d.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    </td>
                    <td style={{ fontSize: '0.85rem' }}>{d.reason || '—'}</td>
                    <td className="text-center">
                      {d.settled 
                        ? <span className="badge badge-green"><CheckCircle size={12} /> Paid</span>
                        : <span className="badge" style={{ background: '#fef3c7', color: '#92400e' }}><Clock size={12} /> Pending</span>
                      }
                    </td>
                    <td className="text-center">
                      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', justifyContent: 'center' }}>
                        {!d.settled && (
                          <button className="btn-success" style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }} onClick={() => settle(d.id)}>
                            Mark Paid
                          </button>
                        )}
                        <button onClick={() => remove(d.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center' }} title="Delete Record"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}



