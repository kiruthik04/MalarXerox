import React, { useState } from 'react';
import { Plus, Trash2, Printer, Receipt, Download } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import QRCode from 'qrcode';
import { generateBillPDF } from '../utils/pdfGenerator';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

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
  const [customService, setCustomService] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('PAID');
  const [lastBill, setLastBill] = useState(null);

  React.useEffect(() => {
    fetch(`${API_BASE}/api/dashboard/data`)
      .then(res => res.json())
      .then(data => {
        const servs = (data.serviceSales || []).map(s => s.serviceName);
        const invs = (data.inventory || []).map(i => i.itemName);
        const combined = [...servs, ...invs, "Others"];
        setAvailableServices(combined);
        if (combined.length > 0) setService(combined[0]);
      })
      .catch(err => console.error('Failed to load items', err));
  }, []);

  const addItem = () => {
    const finalService = service === 'Others' ? customService : service;
    if (!finalService || !price || qty < 1) return;

    setItems(prev => [...prev, {
      service: finalService, qty: Number(qty), price: parseFloat(price),
      total: Number(qty) * parseFloat(price)
    }]);

    setQty(1); setPrice('');
    if (service === 'Others') setCustomService('');
  };

  const removeItem = (i) => setItems(prev => prev.filter((_, idx) => idx !== i));
  const grandTotal = items.reduce((s, i) => s + i.total, 0);

  const saveBill = async () => {
    if (!items.length) return;
    if (paymentStatus === 'DEBT' && (!customerName || !phone)) {
      setMsg('⚠️ Customer Name and Phone are required for Debt bills!');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/api/billing/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ customerName, phone, items, grandTotal, status: paymentStatus }),
      });

      if (res.ok) {
        const data = await res.json();
        const billData = {
          billId: data.id,
          customerName, phone, items, grandTotal,
          createdAt: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
        };

        // Generate QR DataURL for PDF
        const upiLink = `upi://pay?pa=9865325212-1@okbizaxis&pn=${encodeURIComponent('Malar Xerox')}&am=${grandTotal.toFixed(2)}&cu=INR&mc=0000&mode=02`;
        const qrDataUrl = await QRCode.toDataURL(upiLink);
        const billWithQR = { ...billData, qrDataUrl };

        setLastBill(billWithQR);

        // Auto-download PDF
        const doc = generateBillPDF(billWithQR);
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

  const downloadLastBill = async () => {
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
        <div style={{ marginBottom: '1rem', padding: '0.75rem 1rem', borderRadius: '8px', fontWeight: 600, background: msg.startsWith('✅') ? '#dbeafe' : '#fee2e2', color: msg.startsWith('✅') ? '#1e40af' : '#991b1b' }}>
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

            <div className="form-group" style={{ marginTop: '1rem' }}>
              <label style={{ color: 'var(--primary-dark)', fontWeight: 700 }}>Payment Status</label>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid ' + (paymentStatus === 'PAID' ? 'var(--primary-dark)' : '#e2e8f0'), background: paymentStatus === 'PAID' ? '#f0f7ff' : 'transparent' }}>
                  <input type="radio" name="paymentStatus" value="PAID" checked={paymentStatus === 'PAID'} onChange={() => setPaymentStatus('PAID')} />
                  <span>Cash</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid ' + (paymentStatus === 'DEBT' ? '#ef4444' : '#e2e8f0'), background: paymentStatus === 'DEBT' ? '#fef2f2' : 'transparent' }}>
                  <input type="radio" name="paymentStatus" value="DEBT" checked={paymentStatus === 'DEBT'} onChange={() => setPaymentStatus('DEBT')} />
                  <span style={{ color: paymentStatus === 'DEBT' ? '#b91c1c' : 'inherit' }}>Credit</span>
                </label>
              </div>
            </div>
          </div>

          <div className="admin-card">
            <h3><Plus size={18} /> Add Item</h3>
            <div className="form-group">
              <label>Service / Product</label>
              <select className="form-select" value={service} onChange={e => setService(e.target.value)}>
                {availableServices.map(s => <option key={s}>{s}</option>)}
              </select>
              {service === 'Others' && (
                <input
                  className="form-input"
                  style={{ marginTop: '0.75rem' }}
                  placeholder="Enter manual service name..."
                  value={customService}
                  onChange={e => setCustomService(e.target.value)}
                />
              )}
            </div>
            <div className="responsive-grid-2">
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
        <div className="admin-card printable-bill">
          <div className="bill-header-print">
            <div className="bill-logo">Malar Xerox & Studio</div>
            <div className="bill-address">Sathy Rd, North Rangasamuthram, Sathyamangalam, TN 638402</div>
            <div className="bill-contact">Ph: 9865325212 | malarsathy@gmail.com</div>
          </div>

          <h3 className="no-print"><Printer size={18} /> Bill Summary</h3>
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

          {grandTotal > 0 && (
            <div className="qr-container">
              <div className="qr-wrapper">
                <QRCodeSVG
                  value={`upi://pay?pa=9865325212-1@okbizaxis&pn=${encodeURIComponent('Malar Xerox')}&am=${grandTotal.toFixed(2)}&cu=INR&mc=0000&mode=02`}
                  size={120}
                  level="H"
                  includeMargin={true}
                />
              </div>
              <p className="qr-text">Scan to Pay via GPay / UPI</p>
            </div>
          )}

          <div className="no-print">
            <button
              className="btn-success"
              style={{ width: '100%', marginTop: '1rem', justifyContent: 'center' }}
              onClick={saveBill}
              disabled={saving || !items.length}
            >
              {saving ? 'Saving...' : <><Download size={16} /> Save Bill & Download PDF</>}
            </button>
            <p style={{ fontSize: '0.75rem', textAlign: 'center', marginTop: '0.75rem', color: 'var(--text-muted)' }}>
              Or press <strong>Ctrl + P</strong> to print the bill directly.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

