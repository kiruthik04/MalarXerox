import React, { useState, useEffect } from 'react';
import { RefreshCw, Eye, FileText, User, Phone, Calendar, IndianRupee, Download } from 'lucide-react';
import QRCode from 'qrcode';
import { generateBillPDF } from '../utils/pdfGenerator';

export default function BillHistoryPage({ token }) {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBill, setSelectedBill] = useState(null);

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
            <tr><th>#</th><th>Bill ID</th><th>Customer</th><th>Phone</th><th>Items</th><th>Total</th><th>Date</th><th>Action</th></tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Loading...</td></tr>
            ) : bills.filter(b => b.status === 'PAID').length === 0 ? (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No paid bills found.</td></tr>
            ) : bills.filter(b => b.status === 'PAID').map((bill, i) => (
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
                <td>
                  <button 
                    onClick={() => setSelectedBill(bill)}
                    style={{ background: '#f0fdf4', border: '1px solid #d1fae5', color: 'var(--primary-dark)', padding: '0.4rem', borderRadius: '6px', cursor: 'pointer', display: 'flex' }}
                    title="View Summary"
                  >
                    <Eye size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Bill Summary Modal */}
      {selectedBill && (
        <div className="modal-overlay" onClick={() => setSelectedBill(null)}>
          <div className="modal-content" style={{ maxWidth: '600px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ background: '#f0fdf4', color: 'var(--primary-dark)', padding: '0.6rem', borderRadius: '10px' }}>
                  <FileText size={20} />
                </div>
                <h3 style={{ margin: 0 }}>Bill Summary <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 400 }}>#{selectedBill.id}</span></h3>
              </div>
              <button className="close-btn" onClick={() => setSelectedBill(null)}>&times;</button>
            </div>
            
            <div className="modal-body" style={{ padding: '0.5rem 0' }}>
              {/* Customer Info Section */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', background: '#f8fafc', padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.25rem' }}>
                    <User size={12} /> CUSTOMER
                  </div>
                  <div style={{ fontWeight: 700 }}>{selectedBill.customerName || 'Walk-in Customer'}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.25rem' }}>
                    <Phone size={12} /> PHONE
                  </div>
                  <div style={{ fontWeight: 700 }}>{selectedBill.phone || 'N/A'}</div>
                </div>
                <div style={{ gridColumn: 'span 2', marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.25rem' }}>
                    <Calendar size={12} /> BILLING DATE & TIME
                  </div>
                  <div style={{ fontWeight: 600 }}>{new Date(selectedBill.createdAt).toLocaleString('en-IN', { dateStyle: 'long', timeStyle: 'short' })}</div>
                </div>
              </div>

              {/* Items Table */}
              <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
                <table style={{ width: '100%', fontSize: '0.9rem' }}>
                  <thead style={{ background: '#f1f5f9' }}>
                    <tr>
                      <th style={{ padding: '0.75rem', textAlign: 'left' }}>Item / Service</th>
                      <th style={{ padding: '0.75rem', textAlign: 'center' }}>Qty</th>
                      <th style={{ padding: '0.75rem', textAlign: 'right' }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      try {
                        const items = JSON.parse(selectedBill.itemsJson || '[]');
                        return items.map((item, idx) => (
                          <tr key={idx}>
                            <td style={{ padding: '0.75rem', borderTop: '1px solid #f1f5f9' }}>
                                <div style={{ fontWeight: 600 }}>{item.service}</div>
                                {item.price && <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>₹{item.price.toFixed(2)} per unit</div>}
                            </td>
                            <td style={{ padding: '0.75rem', borderTop: '1px solid #f1f5f9', textAlign: 'center' }}>{item.qty}</td>
                            <td style={{ padding: '0.75rem', borderTop: '1px solid #f1f5f9', textAlign: 'right', fontWeight: 600 }}>₹{item.total.toFixed(2)}</td>
                          </tr>
                        ));
                      } catch {
                        return <tr><td colSpan={3} style={{ textAlign: 'center', padding: '1rem' }}>Error loading items</td></tr>;
                      }
                    })()}
                  </tbody>
                  <tfoot>
                    <tr style={{ background: '#f8fafc' }}>
                      <td colSpan={2} style={{ padding: '1rem', textAlign: 'right', fontWeight: 700, fontSize: '1rem' }}>Grand Total:</td>
                      <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 800, fontSize: '1.2rem', color: 'var(--primary-dark)' }}>
                        ₹{selectedBill.grandTotal?.toFixed(2)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <button 
                  className="btn-outline" 
                  style={{ padding: '0.6rem 1.5rem' }} 
                  onClick={async () => {
                    const upiLink = `upi://pay?pa=9865325212-1@okbizaxis&pn=${encodeURIComponent('Malar Xerox')}&am=${selectedBill.grandTotal.toFixed(2)}&cu=INR&mc=0000&mode=02`;
                    const qrDataUrl = await QRCode.toDataURL(upiLink);
                    const doc = generateBillPDF({
                      billId: selectedBill.id,
                      customerName: selectedBill.customerName,
                      phone: selectedBill.phone,
                      items: selectedBill.itemsJson,
                      grandTotal: selectedBill.grandTotal,
                      createdAt: selectedBill.createdAt,
                      qrDataUrl
                    });
                    doc.save(`Bill_${String(selectedBill.id).padStart(5, '0')}_${selectedBill.customerName || 'Customer'}.pdf`);
                  }}
                >
                  <Download size={16} /> Download PDF
                </button>
                <button 
                  className="btn-success" 
                  style={{ padding: '0.6rem 1.5rem' }} 
                  onClick={() => setSelectedBill(null)}
                >
                  Close Summary
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
