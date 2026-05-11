import React, { useState, useEffect } from 'react';
import { IndianRupee, Plus, History, Trash2, TrendingUp } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

export default function QuickCashPage({ token }) {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAdd = async () => {
    if (!amount || parseFloat(amount) <= 0) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/small-income/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ amount: parseFloat(amount) })
      });
      if (res.ok) {
        setAmount('');
        alert('✅ Entry added successfully!');
      } else {
        throw new Error('Failed to add entry');
      }
    } catch (err) {
      console.error('Quick Cash Add Error:', err);
      alert('Failed to add amount. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const quickAmounts = [2, 5, 10, 15, 20, 50];

  return (
    <div style={{ maxWidth: '500px', margin: '0 auto' }}>
      <div className="page-header">
        <div>
          <h2>Quick Cash Entry</h2>
          <p>Instantly record small amounts without generating a bill</p>
        </div>
      </div>

      <div className="admin-card">
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

      <div style={{ textAlign: 'center', marginTop: '2rem', color: 'var(--text-muted)' }}>
        <p>Entry will reflect in the main Bill History.</p>
      </div>
    </div>
  );
}
