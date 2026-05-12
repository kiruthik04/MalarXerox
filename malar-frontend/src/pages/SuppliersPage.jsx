import React, { useState, useEffect } from 'react';
import { Plus, RefreshCw, History, ArrowDownCircle, ArrowUpCircle, Receipt } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

export default function SuppliersPage({ token }) {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddSupplier, setShowAddSupplier] = useState(false);
  const [showAddBill, setShowAddBill] = useState(null);
  const [showHistory, setShowHistory] = useState(null);
  const [historyData, setHistoryData] = useState({ bills: [], payments: [] });
  
  const [supplierForm, setSupplierForm] = useState({ name: '', contact: '' });
  const [billForm, setBillForm] = useState({ amount: '', description: '' });
  const [msg, setMsg] = useState('');

  const loadSuppliers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/suppliers`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setSuppliers(Array.isArray(data) ? data : []);
      } else {
        console.error('Failed to load suppliers:', res.status);
        setSuppliers([]);
      }
    } catch (err) { 
      console.error(err); 
      setSuppliers([]);
    }
    setLoading(false);
  };

  const loadHistory = async (supplier) => {
    setShowHistory(supplier);
    try {
      const res = await fetch(`${API_BASE}/api/suppliers/${supplier.id}/history`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setHistoryData(data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { loadSuppliers(); }, []);

  const addSupplier = async (e) => {
    e.preventDefault();
    const res = await fetch(`${API_BASE}/api/suppliers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(supplierForm),
    });
    if (res.ok) {
      setMsg('✅ Supplier added!');
      setSupplierForm({ name: '', contact: '' });
      setShowAddSupplier(false);
      loadSuppliers();
    } else setMsg('❌ Failed to add.');
    setTimeout(() => setMsg(''), 3000);
  };

  const addBill = async (e) => {
    e.preventDefault();
    const res = await fetch(`${API_BASE}/api/suppliers/${showAddBill.id}/bill`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ ...billForm, amount: parseFloat(billForm.amount) }),
    });
    if (res.ok) {
      setMsg('✅ Bill added to balance!');
      setBillForm({ amount: '', description: '' });
      setShowAddBill(null);
      loadSuppliers();
    } else setMsg('❌ Failed to add bill.');
    setTimeout(() => setMsg(''), 3000);
  };

  return (
    <div>
      <div className="page-header">
        <div><h2>Suppliers & Balance</h2><p>Manage supplier records and outstanding balances</p></div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn-outline" onClick={loadSuppliers}><RefreshCw size={15} /> Refresh</button>
          <button className="btn-success" onClick={() => setShowAddSupplier(true)}><Plus size={15} /> New Supplier</button>
        </div>
      </div>

      {msg && <div style={{ marginBottom: '1rem', padding: '0.75rem 1rem', borderRadius: '8px', background: msg.startsWith('✅') ? '#dbeafe' : '#fee2e2', color: msg.startsWith('✅') ? '#1e40af' : '#991b1b', fontWeight: 600 }}>{msg}</div>}

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr><th>Supplier Name</th><th>Contact Info</th><th>Outstanding Balance</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} style={{ textAlign: 'center', padding: '2rem' }}>Loading...</td></tr>
            ) : suppliers.length === 0 ? (
              <tr><td colSpan={4} style={{ textAlign: 'center', padding: '2rem' }}>No suppliers found.</td></tr>
            ) : suppliers.map(s => (
              <tr key={s.id}>
                <td><strong>{s.name}</strong></td>
                <td>{s.contact || '—'}</td>
                <td><strong style={{ color: (s.balance || 0) > 0 ? '#ef4444' : '#10b981' }}>₹{(s.balance || 0).toFixed(2)}</strong></td>
                <td>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn-outline" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }} onClick={() => setShowAddBill(s)}>
                      <Plus size={14} /> Add Bill
                    </button>
                    <button className="btn-outline" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }} onClick={() => loadHistory(s)}>
                      <History size={14} /> History
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Supplier Modal */}
      {showAddSupplier && (
        <div className="modal-overlay" onClick={() => setShowAddSupplier(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3>Add New Supplier</h3><button className="close-btn" onClick={() => setShowAddSupplier(false)}>&times;</button></div>
            <form onSubmit={addSupplier}>
              <div className="form-group">
                <label>Supplier Name</label>
                <input className="form-input" placeholder="e.g. Global Paper Mart" value={supplierForm.name} onChange={e => setSupplierForm(f => ({ ...f, name: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label>Contact Details (Phone/Address)</label>
                <input className="form-input" placeholder="e.g. 9876543210 / Sathy" value={supplierForm.contact} onChange={e => setSupplierForm(f => ({ ...f, contact: e.target.value }))} />
              </div>
              <button type="submit" className="btn-success" style={{ width: '100%', justifyContent: 'center', marginTop: '1rem' }}>Save Supplier</button>
            </form>
          </div>
        </div>
      )}

      {/* Add Bill Modal */}
      {showAddBill && (
        <div className="modal-overlay" onClick={() => setShowAddBill(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3>Add Bill: {showAddBill.name}</h3><button className="close-btn" onClick={() => setShowAddBill(null)}>&times;</button></div>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>This will increase the outstanding balance for this supplier.</p>
            <form onSubmit={addBill}>
              <div className="form-group">
                <label>Bill Amount (₹)</label>
                <input className="form-input" type="number" step="0.01" placeholder="0.00" value={billForm.amount} onChange={e => setBillForm(f => ({ ...f, amount: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label>Description / Invoice No.</label>
                <input className="form-input" placeholder="e.g. Invoice #4421 - Paper Bundles" value={billForm.description} onChange={e => setBillForm(f => ({ ...f, description: e.target.value }))} required />
              </div>
              <button type="submit" className="btn-success" style={{ width: '100%', justifyContent: 'center', marginTop: '1rem' }}>Add to Balance</button>
            </form>
          </div>
        </div>
      )}

      {/* History Modal */}
      {showHistory && (
        <div className="modal-overlay" onClick={() => setShowHistory(null)}>
          <div className="modal-content" style={{ maxWidth: '700px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
                <div>
                    <h3 style={{ marginBottom: '0.2rem' }}>{showHistory.name} - History</h3>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>Current Balance: <strong>₹{(showHistory.balance || 0).toFixed(2)}</strong></p>
                </div>
                <button className="close-btn" onClick={() => setShowHistory(null)}>&times;</button>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
              <div>
                <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ef4444', marginBottom: '0.75rem' }}><ArrowUpCircle size={18} /> Bills (Increases Balance)</h4>
                <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  {historyData.bills.length === 0 ? <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>No bills found.</p> : historyData.bills.map(b => (
                    <div key={b.id} style={{ padding: '0.75rem', border: '1px solid #e2e8f0', borderRadius: '8px', marginBottom: '0.5rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                        <strong>₹{(b.amount || 0).toFixed(2)}</strong>
                        <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{new Date(b.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{b.description}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#10b981', marginBottom: '0.75rem' }}><ArrowDownCircle size={18} /> Payments (Decreases Balance)</h4>
                <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  {historyData.payments.length === 0 ? <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>No payments found.</p> : historyData.payments.map(p => (
                    <div key={p.id} style={{ padding: '0.75rem', border: '1px solid #e2e8f0', borderRadius: '8px', marginBottom: '0.5rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                        <strong style={{ color: '#10b981' }}>₹{(p.amount || 0).toFixed(2)}</strong>
                        <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{new Date(p.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{p.description}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
