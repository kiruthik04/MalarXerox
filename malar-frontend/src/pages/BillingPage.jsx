import React, { useState } from 'react';
import { Plus, Trash2, Printer, Receipt, Download } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import QRCode from 'qrcode';
import { generateBillPDF } from '../utils/pdfGenerator';
import { api } from '../services/api';

export default function BillingPage() {

  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [service, setService] = useState('');
  const [category, setCategory] = useState('Other');
  const [catalog, setCatalog] = useState([]); 
  const [categories, setCategories] = useState(['Other', 'Printouts', 'Government E-Services', 'Stationary']);
  const [qty, setQty] = useState(1);
  const [price, setPrice] = useState('');
  const [items, setItems] = useState([]);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('PAID');
  const [lastBill, setLastBill] = useState(null);
  const [generateBill, setGenerateBill] = useState(true);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const [services, stock] = await Promise.all([
          api.getServices(),
          api.getInventory()
        ]);
        
        const combined = [
          ...services.map(s => ({ name: s.serviceName, category: s.category || 'Other' })),
          ...stock.map(i => ({ name: i.itemName, category: 'Stationary', price: i.unitPrice }))
        ];
        
        setCatalog(combined);
        const uniqueCats = ['Other', ...new Set(combined.map(c => c.category).filter(Boolean))];
        setCategories(uniqueCats);
      } catch (err) {
        console.error('Failed to load items', err);
      }
    };
    fetchData();
  }, []);

  const handleNameChange = (val) => {
    setService(val);
    
    if (!val) return;

    // Find all items that start with or contain the current input
    const matches = catalog.filter(c => c.name.toLowerCase().includes(val.toLowerCase()));
    
    if (matches.length > 0) {
      // If all current matches belong to the same category, auto-select it
      const firstCat = matches[0].category;
      const allSameCat = matches.every(m => m.category === firstCat);
      
      if (allSameCat) {
        setCategory(firstCat);
      } else {
        // If multiple categories match, but one starts exactly with the input, prioritize it
        const priorityMatch = matches.find(m => m.name.toLowerCase().startsWith(val.toLowerCase()));
        if (priorityMatch) setCategory(priorityMatch.category);
      }

      // If it's an exact match, also set the price
      const exactMatch = matches.find(m => m.name === val);
      if (exactMatch && exactMatch.price) setPrice(exactMatch.price);
    }
  };

  const addItem = () => {
    if (!service || !price || qty < 1) return;

    setItems(prev => [...prev, {
      service: service,
      category: category,
      qty: Number(qty),
      price: parseFloat(price),
      total: Number(qty) * parseFloat(price)
    }]);

    setService(''); setQty(1); setPrice('');
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
      const data = await api.saveBill({ customerName, phone, items, grandTotal, status: paymentStatus });

      const billData = {
        billId: data.id,
        displayId: data.displayId,
        customerName, phone, items, grandTotal,
        createdAt: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      };

      // Generate QR DataURL for PDF
      const upiLink = `upi://pay?pa=9865325212-1@okbizaxis&pn=${encodeURIComponent('Malar Xerox')}&am=${grandTotal.toFixed(2)}&cu=INR&mc=0000&mode=02`;
      const qrDataUrl = await QRCode.toDataURL(upiLink);
      const billWithQR = { ...billData, qrDataUrl };

      setLastBill(billWithQR);

      // Conditional Auto-download PDF
      if (generateBill) {
        const doc = generateBillPDF(billWithQR);
        doc.save(`Bill_${data.displayId || data.id}_${customerName || 'Customer'}.pdf`);
        setMsg(`✅ Bill #${data.displayId || data.id} saved & PDF downloaded!`);
      } else {
        setMsg(`✅ Bill #${data.displayId || data.id} saved successfully!`);
      }
      setCustomerName(''); setPhone(''); setItems([]);
    } catch (e) {
      setMsg('❌ Server error: ' + e.message);
    }
    setSaving(false);
    setTimeout(() => setMsg(''), 4000);
  };

  const downloadLastBill = async () => {
    if (!lastBill) return;
    const doc = generateBillPDF(lastBill);
    doc.save(`Bill_${lastBill.displayId || lastBill.billId}_${lastBill.customerName || 'Customer'}.pdf`);
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
              <label>Category</label>
              <select className="form-select" value={category} onChange={e => setCategory(e.target.value)}>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Service / Product Name</label>
              <input 
                className="form-input" 
                list="catalog-options" 
                placeholder="Type name to search..." 
                value={service} 
                onChange={e => handleNameChange(e.target.value)} 
              />
              <datalist id="catalog-options">
                {catalog.map(item => <option key={item.name} value={item.name} />)}
              </datalist>
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
            <div className="bill-logo">Malar Xerox</div>
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
            {/* Bill Generation Toggle */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between', 
              marginBottom: '1rem', 
              padding: '0.75rem 1rem', 
              background: '#f8fafc', 
              borderRadius: '12px', 
              border: '1px solid #e2e8f0' 
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Receipt size={18} style={{ color: 'var(--primary-dark)' }} />
                <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)' }}>Generate PDF Receipt?</span>
              </div>
              <label className="switch">
                <input type="checkbox" checked={generateBill} onChange={e => setGenerateBill(e.target.checked)} />
                <span className="slider round"></span>
              </label>
            </div>

            <button
              className="btn-success"
              style={{ width: '100%', marginTop: '0.5rem', justifyContent: 'center', height: '48px' }}
              onClick={saveBill}
              disabled={saving || !items.length}
            >
              {saving ? 'Saving...' : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {generateBill ? <Download size={18} /> : <Receipt size={18} />}
                  <span>{generateBill ? 'Save Bill & Download PDF' : 'Save Bill (Database Only)'}</span>
                </div>
              )}
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



