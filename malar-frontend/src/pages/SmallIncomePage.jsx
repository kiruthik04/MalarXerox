import React, { useState, useEffect } from 'react';
import { IndianRupee, Plus, Edit, Trash2, X, RefreshCw } from 'lucide-react';
import { api } from '../services/api';

export default function QuickCashPage({ role }) {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [fetching, setFetching] = useState(false);

  // Editing state
  const [editingItem, setEditingItem] = useState(null);
  const [editAmount, setEditAmount] = useState('');
  const [updating, setUpdating] = useState(false);

  const loadHistory = async () => {
    setFetching(true);
    try {
      const data = await api.getSmallIncomeHistory();
      // Sort by newest first
      const sorted = [...data].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setHistory(sorted);
    } catch (err) {
      console.error('Failed to load history:', err);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleAdd = async () => {
    if (!amount || parseFloat(amount) <= 0) return;
    setLoading(true);
    try {
      await api.addSmallIncome({ amount: parseFloat(amount) });
      setAmount('');
      loadHistory();
    } catch (err) {
      console.error('Quick Cash Add Error:', err);
      alert(err.message || 'Failed to add amount.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this Quick Cash entry?')) return;
    try {
      await api.deleteSmallIncome(id);
      loadHistory();
    } catch (err) {
      alert('Failed to delete: ' + err.message);
    }
  };

  const startEdit = (item) => {
    setEditingItem(item);
    setEditAmount(item.amount.toString());
  };

  const handleUpdate = async () => {
    if (!editAmount || parseFloat(editAmount) <= 0) return;
    setUpdating(true);
    try {
      await api.updateSmallIncome(editingItem.id, { amount: parseFloat(editAmount) });
      setEditingItem(null);
      loadHistory();
    } catch (err) {
      alert('Failed to update: ' + err.message);
    } finally {
      setUpdating(false);
    }
  };

  const quickAmounts = [2, 5, 10, 15, 20, 50];

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Quick Cash Entry</h2>
          <p>Instantly record small amounts without generating a bill</p>
        </div>
        <button className="btn-outline" onClick={loadHistory} disabled={fetching}>
          <RefreshCw size={15} className={fetching ? 'spin' : ''} /> Refresh
        </button>
      </div>

      <div className="responsive-grid">
        {/* Left Column: Quick Entry Form */}
        <div className="admin-card" style={{ height: 'fit-content' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <IndianRupee size={20} /> Quick Entry
          </h3>
          
          <div className="form-group" style={{ marginTop: '1.5rem' }}>
            <label>Amount (₹)</label>
            <input 
              type="number" 
              className="form-input" 
              style={{ fontSize: '1.5rem', fontWeight: 700, textAlign: 'center', height: '60px' }}
              placeholder="0.00"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && handleAdd()}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', marginBottom: '1.5rem' }}>
            {quickAmounts.map(amt => (
              <button 
                key={amt} 
                className="btn-outline" 
                style={{ padding: '0.75rem', fontWeight: 700 }}
                onClick={() => setAmount(amt.toString())}
              >
                ₹{amt}
              </button>
            ))}
          </div>

          <button 
            className="btn-success" 
            style={{ width: '100%', padding: '1rem', fontSize: '1.1rem' }}
            disabled={loading || !amount}
            onClick={handleAdd}
          >
            <Plus size={20} /> Add Income
          </button>
        </div>

        {/* Right Column: History Table */}
        <div className="admin-card">
          <h3 style={{ marginBottom: '1rem' }}>Today's & Recent Small Incomes</h3>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Amount</th>
                  <th>Date & Time</th>
                  {role === 'ADMIN' && <th className="text-center">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {fetching && history.length === 0 ? (
                  <tr><td colSpan={role === 'ADMIN' ? 4 : 3} style={{ textAlign: 'center', padding: '2rem' }}>Loading history...</td></tr>
                ) : history.length === 0 ? (
                  <tr><td colSpan={role === 'ADMIN' ? 4 : 3} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No small income entries recorded yet.</td></tr>
                ) : history.map((item, idx) => (
                  <tr key={item.id}>
                    <td style={{ color: 'var(--text-muted)' }}>{history.length - idx}</td>
                    <td><strong style={{ color: '#16a34a' }}>₹{item.amount?.toFixed(2)}</strong></td>
                    <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      {new Date(item.createdAt).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                    {role === 'ADMIN' && (
                      <td className="text-center">
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                          <button 
                            className="btn-success" 
                            style={{ padding: '0.35rem', borderRadius: '4px', background: '#f0fdf4', border: '1px solid #dcfce7', color: '#166534', display: 'flex', cursor: 'pointer' }}
                            onClick={() => startEdit(item)}
                            title="Edit Amount"
                          >
                            <Edit size={14} />
                          </button>
                          <button 
                            className="btn-danger" 
                            style={{ padding: '0.35rem', borderRadius: '4px', background: '#fef2f2', border: '1px solid #fee2e2', color: '#991b1b', display: 'flex', cursor: 'pointer' }}
                            onClick={() => handleDelete(item.id)}
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Small Edit Modal */}
      {editingItem && (
        <div className="modal-overlay" onClick={() => setEditingItem(null)}>
          <div className="modal-content" style={{ maxWidth: '400px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Edit size={18} style={{ color: 'var(--primary-dark)' }} />
                <h3 style={{ margin: 0 }}>Edit Quick Cash Amount</h3>
              </div>
              <button className="close-btn" onClick={() => setEditingItem(null)}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Amount (₹)</label>
                <input 
                  type="number" 
                  className="form-input" 
                  step="0.01"
                  value={editAmount} 
                  onChange={e => setEditAmount(e.target.value)} 
                  autoFocus
                  required 
                />
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                <button className="btn-outline" style={{ flex: 1 }} onClick={() => setEditingItem(null)}>Cancel</button>
                <button className="btn-primary" style={{ flex: 2 }} onClick={handleUpdate} disabled={updating}>
                  {updating ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
