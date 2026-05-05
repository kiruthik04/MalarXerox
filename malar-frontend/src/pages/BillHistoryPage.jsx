import React, { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';

export default function BillHistoryPage({ token }) {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    fetch('http://localhost:8080/api/billing/history', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => { setBills(data); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  return (
    <div>
      <div className="page-header">
        <div><h2>Bill History</h2><p>All past billing records</p></div>
        <button className="btn-outline" onClick={load}><RefreshCw size={15} /> Refresh</button>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr><th>#</th><th>Bill ID</th><th>Customer</th><th>Phone</th><th>Items</th><th>Total</th><th>Date</th></tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Loading...</td></tr>
            ) : bills.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No bills found. Start by creating a new bill.</td></tr>
            ) : bills.map((bill, i) => (
              <tr key={bill.id}>
                <td style={{ color: 'var(--text-muted)' }}>{i + 1}</td>
                <td><span className="badge badge-green">#{bill.id}</span></td>
                <td><strong>{bill.customerName || '—'}</strong></td>
                <td>{bill.phone || '—'}</td>
                <td>
                  {(() => {
                    try {
                      const items = JSON.parse(bill.itemsJson || '[]');
                      return `${items.length} items`;
                    } catch {
                      return '—';
                    }
                  })()}
                </td>
                <td><strong style={{ color: 'var(--primary-dark)' }}>₹{bill.grandTotal?.toFixed(2) ?? '—'}</strong></td>
                <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{bill.createdAt ? new Date(bill.createdAt).toLocaleString('en-IN') : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
