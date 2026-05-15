import React, { useState, useEffect } from 'react';
import { Plus, Package, Cpu } from 'lucide-react';
import { api } from '../services/api';

export default function AddCatalogPage() {
  const [tab, setTab] = useState('service');
  const [services, setServices] = useState([]);
  const [sForm, setSForm] = useState({ serviceName: '', category: '', salesToday: 0, revenue: 0 });
  const [iForm, setIForm] = useState({ itemName: '', stockQuantity: '', unitPrice: '' });
  const [msg, setMsg] = useState('');

  const showMsg = (m) => { setMsg(m); setTimeout(() => setMsg(''), 3000); };

  useEffect(() => {
    api.getDashboardData().then(d => setServices(d.serviceSales || [])).catch(() => {});
  }, []);

  const addService = async () => {
    if (!sForm.serviceName) return;
    try {
      await api.addService(sForm);
      showMsg('✅ Service added!'); 
      setSForm({ serviceName: '', category: '', salesToday: 0, revenue: 0 });
    } catch (err) {
      showMsg(`❌ ${err.message || 'Failed.'}`);
    }
  };

  const addProduct = async () => {
    if (!iForm.itemName || !iForm.stockQuantity || !iForm.unitPrice) return;
    try {
      await api.addInventoryItem({ itemName: iForm.itemName, stockQuantity: Number(iForm.stockQuantity), unitPrice: parseFloat(iForm.unitPrice) });
      showMsg('✅ Product added!'); 
      setIForm({ itemName: '', stockQuantity: '', unitPrice: '' });
    } catch (err) {
      showMsg(`❌ ${err.message || 'Failed.'}`);
    }
  };

  const tabStyle = (t) => ({
    padding: '0.6rem 1.5rem', borderRadius: '8px', border: 'none', cursor: 'pointer',
    fontWeight: 600, fontFamily: 'inherit',
    background: tab === t ? 'var(--primary-dark)' : 'transparent',
    color: tab === t ? 'white' : 'var(--text-muted)',
    transition: 'all 0.2s',
  });

  return (
    <div>
      <div className="page-header">
        <div><h2>Add Services &amp; Products</h2><p>Expand your service catalog and product inventory</p></div>
      </div>
      {msg && <div style={{ marginBottom: '1rem', padding: '0.75rem 1rem', borderRadius: '8px', background: msg.startsWith('✅') ? '#dbeafe' : '#fee2e2', color: msg.startsWith('✅') ? '#1e40af' : '#991b1b', fontWeight: 600 }}>{msg}</div>}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', background: 'white', padding: '0.4rem', borderRadius: '10px', width: 'fit-content', border: '1px solid #e7f9ee' }}>
        <button style={tabStyle('service')} onClick={() => setTab('service')}><Cpu size={15} style={{ marginRight: '0.4rem', verticalAlign: 'middle' }} />Add Service</button>
        <button style={tabStyle('product')} onClick={() => setTab('product')}><Package size={15} style={{ marginRight: '0.4rem', verticalAlign: 'middle' }} />Add Product</button>
      </div>

      {tab === 'service' && (
        <div style={{ maxWidth: '560px' }}>
          <div className="admin-card">
            <h3><Cpu size={18} /> New Service</h3>
            <div className="form-group">
              <label>Service Name</label>
              <input className="form-input" placeholder="e.g. Caste Certificate" value={sForm.serviceName} onChange={e => setSForm(f => ({ ...f, serviceName: e.target.value }))} />
            </div>
            <div className="form-group">
              <label>Category (e.g. Government E-Services, Printouts)</label>
              <input 
                className="form-input" 
                list="category-suggestions"
                placeholder="Enter or select category" 
                value={sForm.category} 
                onChange={e => setSForm(f => ({ ...f, category: e.target.value }))} 
              />
              <datalist id="category-suggestions">
                {[...new Set(services.map(s => s.serviceName))].map(cat => (
                  <option key={cat} value={cat} />
                ))}
              </datalist>
            </div>
            <button className="btn-success" onClick={addService}><Plus size={16} /> Add Service</button>
          </div>

          {services.length > 0 && (
            <div className="admin-table-wrap" style={{ marginTop: '1.5rem' }}>
              <table className="admin-table">
                <thead><tr><th>Service / Category</th><th>Sales Today</th></tr></thead>
                <tbody>
                  {services.map(s => (
                    <tr key={s.serviceName}><td><strong>{s.serviceName}</strong></td><td>{s.salesToday}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === 'product' && (
        <div style={{ maxWidth: '560px' }}>
          <div className="admin-card">
            <h3><Package size={18} /> New Product / Stock Item</h3>
            <div className="form-group">
              <label>Item Name</label>
              <input className="form-input" placeholder="e.g. A4 Paper Ream" value={iForm.itemName} onChange={e => setIForm(f => ({ ...f, itemName: e.target.value }))} />
            </div>
            <div className="responsive-grid-2">
              <div className="form-group">
                <label>Initial Quantity</label>
                <input className="form-input" type="number" min={0} value={iForm.stockQuantity} onChange={e => setIForm(f => ({ ...f, stockQuantity: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>Unit Price (₹)</label>
                <input className="form-input" type="number" min={0} value={iForm.unitPrice} onChange={e => setIForm(f => ({ ...f, unitPrice: e.target.value }))} />
              </div>
            </div>
            <button className="btn-success" onClick={addProduct}><Plus size={16} /> Add Product</button>
          </div>
        </div>
      )}
    </div>
  );
}



