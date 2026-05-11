import React, { useState, useEffect } from 'react';
import { Plus, RefreshCw } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

export default function InventoryPage({ token }) {
  const [inventory, setInventory] = useState([]);
  const [form, setForm] = useState({ itemName: '', stockQuantity: '', unitPrice: '' });
  const [msg, setMsg] = useState('');

  const load = () => {
    fetch(`${API_BASE}/api/stock`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(setInventory).catch(() => {});
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!form.itemName || !form.stockQuantity || !form.unitPrice) return;
    const res = await fetch('http://localhost:8080/api/stock', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ itemName: form.itemName, stockQuantity: Number(form.stockQuantity), unitPrice: parseFloat(form.unitPrice) }),
    });
    if (res.ok) { setMsg('✅ Item added!'); setForm({ itemName: '', stockQuantity: '', unitPrice: '' }); load(); }
    else setMsg('❌ Failed to add item.');
    setTimeout(() => setMsg(''), 3000);
  };

  const restock = async (item) => {
    const qty = prompt(`Enter new stock quantity for "${item.itemName}":`, item.stockQuantity);
    if (!qty) return;
    await fetch(`${API_BASE}/api/stock/${item.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ ...item, stockQuantity: Number(qty) }),
    });
    load();
  };

  return (
    <div>
      <div className="page-header">
        <div><h2>Inventory</h2><p>Manage your stock levels</p></div>
        <button className="btn-outline" onClick={load}><RefreshCw size={15} /> Refresh</button>
      </div>
      {msg && <div style={{ marginBottom: '1rem', padding: '0.75rem 1rem', borderRadius: '8px', background: msg.startsWith('✅') ? '#dbeafe' : '#fee2e2', color: msg.startsWith('✅') ? '#1e40af' : '#991b1b', fontWeight: 600 }}>{msg}</div>}

      <div className="admin-card" style={{ marginBottom: '1.5rem' }}>
        <h3><Plus size={18} /> Add New Stock Item</h3>
        <div className="responsive-grid" style={{ alignItems: 'end' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Item Name</label>
            <input className="form-input" placeholder="e.g. A4 Paper Ream" value={form.itemName} onChange={e => setForm(f => ({ ...f, itemName: e.target.value }))} />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Quantity</label>
            <input className="form-input" type="number" min={0} placeholder="0" value={form.stockQuantity} onChange={e => setForm(f => ({ ...f, stockQuantity: e.target.value }))} />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Unit Price (₹)</label>
            <input className="form-input" type="number" min={0} placeholder="0.00" value={form.unitPrice} onChange={e => setForm(f => ({ ...f, unitPrice: e.target.value }))} />
          </div>
          <button className="btn-success" onClick={save}><Plus size={16} /> Add</button>
        </div>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr><th>#</th><th>Item Name</th><th>Qty in Stock</th><th>Unit Price</th><th>Status</th><th>Action</th></tr>
          </thead>
          <tbody>
            {inventory.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>No inventory items found</td></tr>
            ) : inventory.map((item, i) => (
              <tr key={item.id}>
                <td style={{ color: 'var(--text-muted)' }}>{i + 1}</td>
                <td><strong>{item.itemName}</strong></td>
                <td>{item.stockQuantity} units</td>
                <td>₹{item.unitPrice}</td>
                <td>
                  <span className={`badge ${item.stockQuantity > 10 ? 'badge-green' : 'badge-red'}`}>
                    {item.stockQuantity === 0 ? 'Out of Stock' : item.stockQuantity <= 10 ? 'Low / Critical' : 'In Stock'}
                  </span>
                </td>
                <td>
                  <button className="btn-outline" style={{ fontSize: '0.82rem', padding: '0.35rem 0.75rem' }} onClick={() => restock(item)}>
                    Restock
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}



