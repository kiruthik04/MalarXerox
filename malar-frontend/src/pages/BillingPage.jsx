import React, { useState } from 'react';
import { Plus, Trash2, Printer, Receipt, Download } from 'lucide-react';
import { generateBillPDF } from '../utils/pdfGenerator';

export default function BillingPage({ token }) {

  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [service, setService] = useState('');
  const [availableServices, setAvailableServices] = useState([]);
  const [qty, setQty] = useState(1);
  const [price, setPrice] = useState('');
  const [items, setItems] = useState([]);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [lastBill, setLastBill] = useState(null);

  React.useEffect(() => {
    fetch('http://localhost:8080/api/dashboard/data')
      .then(res => res.json())
      .then(data => {
        const servs = (data.serviceSales || []).map(s => s.serviceName);
        const invs = (data.inventory || []).map(i => i.itemName);
        const combined = [...servs, ...invs];
        setAvailableServices(combined);
        if (combined.length > 0) setService(combined[0]);
      })
      .catch(err => console.error('Failed to load items', err));
  }, []);

  const addItem = () => {
    if (!service || !price || qty < 1) return;
    setItems(prev => [...prev, {
      service, qty: Number(qty), price: parseFloat(price),
      total: Number(qty) * parseFloat(price)
    }]);
    setQty(1); setPrice('');
  };

  const removeItem = (i) => setItems(prev => prev.filter((_, idx) => idx !== i));
  const grandTotal = items.reduce((s, i) => s + i.total, 0);

  const saveBill = async () => {
    if (!items.length) return;
    setSaving(true);
    try {
      const res = await fetch('http://localhost:8080/api/billing/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ customerName, phone, items, grandTotal }),
      });

      if (res.ok) {
        const data = await res.json();
        const billData = {
          billId: data.id,
          customerName, phone, items, grandTotal,
          createdAt: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
        };
        setLastBill(billData);

        // Auto-download PDF
        const doc = generateBillPDF(billData);
        doc.save(`Bill_${String(data.id).padStart(5, '0')}_${customerName || 'Customer'}.pdf`);

        setMsg('✅ Bill saved & PDF downloaded!');
        setCustomerName(''); setPhone(''); setItems([]);
      } else {
        setMsg('❌ Failed to save bill.');
      }
    } catch (e) {
      setMsg('❌ Server error: ' + e.message);
    }
    setSaving(false);
    setTimeout(() => setMsg(''), 4000);
  };

  const downloadLastBill = () => {
    if (!lastBill) return;
    const doc = generateBillPDF(lastBill);
    doc.save(`Bill_${String(lastBill.billId).padStart(5, '0')}_${lastBill.customerName || 'Customer'}.pdf`);
  };

  return (
    <div>
      <div className="page-header">
        <div><h2>New Bill</h2><p>Create a billing record and generate PDF receipt</p></div>
        {lastBill && (
          <button className="btn-outline" onClick={downloadLastBill}>
            <Download size={15} /> Re-download Last Bill
          </button>
        )}
      </div>

      {msg && (
        <div style={{ marginBottom: '1rem', padding: '0.75rem 1rem', borderRadius: '8px', fontWeight: 600, background: msg.startsWith('✅') ? '#dcfce7' : '#fee2e2', color: msg.startsWith('✅') ? '#166534' : '#991b1b' }}>
          {msg}
        </div>
      )}

      <div className="billing-grid">
        {/* ── Left: Customer + Add Item ── */}
        <div>
          <div className="admin-card" style={{ marginBottom: '1.25rem' }}>
            <h3><Receipt size={18} /> Customer Info</h3>
            <div className="form-group">
              <label>Customer Name</label>
              <input className="form-input" placeholder="Name (optional)" value={customerName} onChange={e => setCustomerName(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Phone Number</label>
              <input className="form-input" placeholder="Phone (optional)" value={phone} onChange={e => setPhone(e.target.value)} />
            </div>
          </div>

          <div className="admin-card">
            <h3><Plus size={18} /> Add Item</h3>
            <div className="form-group">
              <label>Service / Product</label>
              <select className="form-select" value={service} onChange={e => setService(e.target.value)}>
                {availableServices.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label>Quantity</label>
                <input className="form-input" type="number" min={1} value={qty} onChange={e => setQty(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Unit Price (₹)</label>
                <input className="form-input" type="number" min={0} placeholder="0.00" value={price} onChange={e => setPrice(e.target.value)} />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
              <button className="btn-success" style={{ padding: '0.6rem 1.5rem' }} onClick={addItem}>
                <Plus size={16} /> Add to Bill
              </button>
            </div>
          </div>
        </div>

        {/* ── Right: Bill Summary ── */}
        <div className="admin-card">
          <h3><Printer size={18} /> Bill Summary</h3>
          {items.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
              <Receipt size={40} style={{ marginBottom: '1rem', opacity: 0.3 }} />
              <p>No items added yet.<br />Select a service and click "Add to Bill".</p>
            </div>
          ) : (
            <div className="bill-items">
              <table>
                <thead>
                  <tr><th>Service</th><th>Qty</th><th>Price</th><th>Total</th><th></th></tr>
                </thead>
                <tbody>
                  {items.map((it, i) => (
                    <tr key={i}>
                      <td>{it.service}</td>
                      <td style={{ textAlign: 'center' }}>{it.qty}</td>
                      <td>₹{it.price.toFixed(2)}</td>
                      <td><strong>₹{it.total.toFixed(2)}</strong></td>
                      <td>
                        <button className="btn-danger" onClick={() => removeItem(i)} title="Remove">
                          <Trash2 size={12} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="bill-total">
            <span>Grand Total</span>
            <span>₹{grandTotal.toFixed(2)}</span>
          </div>

          <button
            className="btn-success"
            style={{ width: '100%', marginTop: '1rem', justifyContent: 'center' }}
            onClick={saveBill}
            disabled={saving || !items.length}
          >
            {saving ? 'Saving...' : <><Download size={16} /> Save Bill & Download PDF</>}
          </button>
        </div>
      </div>
    </div>
  );
}
