import React, { useState, useEffect } from 'react';
import { RefreshCw, Eye, FileText, User, Phone, Calendar, Download, Edit, Trash2, Plus, X } from 'lucide-react';
import QRCode from 'qrcode';
import { generateBillPDF } from '../utils/pdfGenerator';
import { api } from '../services/api';

export default function BillHistoryPage({ role }) {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBill, setSelectedBill] = useState(null);
  const [filterText, setFilterText] = useState('');
  const [searchColumn, setSearchColumn] = useState('all');
  const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'desc' });

  // Admin Editing State
  const [editingBill, setEditingBill] = useState(null);
  const [editingItems, setEditingItems] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [categories, setCategories] = useState(['Other', 'Printouts', 'Government E-Services', 'Stationary']);
  const [newService, setNewService] = useState('');
  const [newCategory, setNewCategory] = useState('Other');
  const [newQty, setNewQty] = useState(1);
  const [newPrice, setNewPrice] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  const [editMsg, setEditMsg] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const [billsData, cashData] = await Promise.all([
        api.getBillHistory(),
        api.getSmallIncomeHistory()
      ]);
      
      const unified = [
        ...billsData.map(b => ({ ...b, isQuickCash: false })),
        ...cashData.map(c => ({
          id: 'qc_' + c.id,
          displayId: 'CASH',
          customerName: 'Quick Cash',
          phone: '—',
          grandTotal: c.amount,
          createdAt: c.createdAt,
          itemsJson: '[]',
          isQuickCash: true
        }))
      ];
      
      setBills(unified);
    } catch (err) {
      console.error('Failed to load history', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (role === 'ADMIN') {
      Promise.all([api.getServices(), api.getInventory()])
        .then(([services, stock]) => {
          const combined = [
            ...services.map(s => ({ name: s.serviceName, category: s.category || 'Other' })),
            ...stock.map(i => ({ name: i.itemName, category: 'Stationary', price: i.unitPrice }))
          ];
          setCatalog(combined);
          const uniqueCats = ['Other', ...new Set(combined.map(c => c.category).filter(Boolean))];
          setCategories(uniqueCats);
        })
        .catch(err => console.error('Failed to load items catalog', err));
    }
  }, [role]);

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const filteredBills = bills.filter(b => {
    if (!filterText) return true;
    const search = filterText.toLowerCase();
    const id = (b.displayId || b.id.toString()).toLowerCase();
    
    if (searchColumn === 'customerName') return (b.customerName?.toLowerCase() || '').includes(search);
    if (searchColumn === 'phone') return (b.phone?.toLowerCase() || '').includes(search);
    if (searchColumn === 'displayId') return id.includes(search);
    
    return (
      (b.customerName?.toLowerCase() || '').includes(search) ||
      (b.phone?.toLowerCase() || '').includes(search) ||
      (id.includes(search))
    );
  });

  const sortedBills = [...filteredBills].sort((a, b) => {
    if (sortConfig.key === 'createdAt') {
      return sortConfig.direction === 'asc' 
        ? new Date(a.createdAt) - new Date(b.createdAt)
        : new Date(b.createdAt) - new Date(a.createdAt);
    }
    if (sortConfig.key === 'grandTotal') {
      return sortConfig.direction === 'asc' ? a.grandTotal - b.grandTotal : b.grandTotal - a.grandTotal;
    }
    if (sortConfig.key === 'customerName') {
      const nameA = a.customerName || '';
      const nameB = b.customerName || '';
      return sortConfig.direction === 'asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
    }
    return 0;
  });

  // Admin Handlers
  const handleDelete = async (billId, displayId, isQuickCash) => {
    const isQc = isQuickCash || (typeof billId === 'string' && billId.startsWith('qc_'));
    const actualId = isQc ? billId.replace('qc_', '') : billId;
    if (!window.confirm(`Are you sure you want to delete this ${isQc ? 'Quick Cash entry' : 'bill #' + (displayId || billId)}?${isQc ? '' : ' This will restore stock quantities to inventory and remove any associated customer debt.'}`)) {
      return;
    }
    try {
      if (isQc) {
        await api.deleteSmallIncome(actualId);
      } else {
        await api.deleteBill(actualId);
      }
      load();
    } catch (err) {
      alert('Failed to delete: ' + err.message);
    }
  };

  const startEdit = (bill) => {
    if (bill.isQuickCash) {
      setEditingBill({
        id: bill.id,
        isQuickCash: true,
        amount: bill.grandTotal
      });
      setEditMsg('');
      return;
    }
    setEditingBill({
      id: bill.id,
      displayId: bill.displayId,
      customerName: bill.customerName || '',
      phone: bill.phone || '',
      status: bill.status || 'PAID'
    });
    try {
      setEditingItems(JSON.parse(bill.itemsJson || '[]'));
    } catch {
      setEditingItems([]);
    }
    setEditMsg('');
  };

  const handleSaveQuickCashEdit = async () => {
    if (!editingBill.amount || isNaN(editingBill.amount) || parseFloat(editingBill.amount) <= 0) {
      setEditMsg('⚠️ Please enter a valid amount!');
      return;
    }
    setSavingEdit(true);
    try {
      const actualId = editingBill.id.replace('qc_', '');
      await api.updateSmallIncome(actualId, {
        amount: parseFloat(editingBill.amount)
      });
      setEditMsg('✅ Quick cash entry updated successfully!');
      setTimeout(() => {
        setEditingBill(null);
        load();
      }, 1000);
    } catch (err) {
      setEditMsg('❌ Failed to update entry: ' + err.message);
    } finally {
      setSavingEdit(false);
    }
  };

  const handleEditNameChange = (val) => {
    setNewService(val);
    if (!val) return;
    const matches = catalog.filter(c => c.name.toLowerCase().includes(val.toLowerCase()));
    if (matches.length > 0) {
      const firstCat = matches[0].category;
      const allSameCat = matches.every(m => m.category === firstCat);
      if (allSameCat) {
        setNewCategory(firstCat);
      } else {
        const priorityMatch = matches.find(m => m.name.toLowerCase().startsWith(val.toLowerCase()));
        if (priorityMatch) setNewCategory(priorityMatch.category);
      }
      const exactMatch = matches.find(m => m.name === val);
      if (exactMatch && exactMatch.price) setNewPrice(exactMatch.price);
    }
  };

  const addEditItem = () => {
    if (!newService || !newPrice || newQty < 1) return;
    setEditingItems(prev => [...prev, {
      service: newService,
      category: newCategory,
      qty: Number(newQty),
      price: parseFloat(newPrice),
      total: Number(newQty) * parseFloat(newPrice)
    }]);
    setNewService(''); setNewQty(1); setNewPrice('');
  };

  const removeEditItem = (idx) => {
    setEditingItems(prev => prev.filter((_, i) => i !== idx));
  };

  const updateItemQty = (idx, qtyVal) => {
    const val = Number(qtyVal);
    setEditingItems(prev => prev.map((item, i) => {
      if (i !== idx) return item;
      return {
        ...item,
        qty: val,
        total: val * item.price
      };
    }));
  };

  const updateItemPrice = (idx, priceVal) => {
    const val = parseFloat(priceVal) || 0;
    setEditingItems(prev => prev.map((item, i) => {
      if (i !== idx) return item;
      return {
        ...item,
        price: val,
        total: item.qty * val
      };
    }));
  };

  const handleSaveEdit = async () => {
    if (!editingItems.length) {
      setEditMsg('⚠️ Bill must have at least one item!');
      return;
    }
    if (editingBill.status === 'DEBT' && (!editingBill.customerName || !editingBill.phone)) {
      setEditMsg('⚠️ Customer Name and Phone are required for Credit bills!');
      return;
    }

    setSavingEdit(true);
    try {
      const grandTotal = editingItems.reduce((sum, item) => sum + item.total, 0);
      await api.updateBill(editingBill.id, {
        customerName: editingBill.customerName,
        phone: editingBill.phone,
        status: editingBill.status,
        items: editingItems,
        grandTotal
      });
      setEditMsg('✅ Bill updated successfully!');
      setTimeout(() => {
        setEditingBill(null);
        load();
      }, 1000);
    } catch (err) {
      setEditMsg('❌ Failed to update bill: ' + err.message);
    } finally {
      setSavingEdit(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div><h2>Bill History</h2><p>All past billing records</p></div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <select 
                className="form-select" 
                style={{ width: 'auto', marginBottom: 0, padding: '0.5rem' }}
                value={searchColumn}
                onChange={e => setSearchColumn(e.target.value)}
            >
                <option value="all">All Columns</option>
                <option value="customerName">Customer Name</option>
                <option value="phone">Phone Number</option>
                <option value="displayId">Bill ID</option>
            </select>
            <input 
                type="text" 
                className="form-input" 
                placeholder="Search..." 
                style={{ width: '200px', marginBottom: 0 }}
                value={filterText}
                onChange={e => setFilterText(e.target.value)}
            />
            <button className="btn-outline" onClick={load}><RefreshCw size={15} /> Refresh</button>
        </div>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
                <th>#</th>
                <th onClick={() => requestSort('displayId')} style={{ cursor: 'pointer' }}>
                    Bill ID {sortConfig.key === 'displayId' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th onClick={() => requestSort('customerName')} style={{ cursor: 'pointer' }}>
                    Customer {sortConfig.key === 'customerName' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th>Phone</th>
                <th>Items</th>
                <th onClick={() => requestSort('grandTotal')} style={{ cursor: 'pointer' }}>
                    Total {sortConfig.key === 'grandTotal' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th onClick={() => requestSort('createdAt')} style={{ cursor: 'pointer' }}>
                    Date {sortConfig.key === 'createdAt' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th>Status</th>
                <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={9} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Loading...</td></tr>
            ) : sortedBills.length === 0 ? (
              <tr><td colSpan={9} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>{filterText ? 'No matching bills found.' : 'No bills found.'}</td></tr>
            ) : sortedBills.map((bill, i) => (
              <tr key={bill.id}>
                <td style={{ color: 'var(--text-muted)' }}>{sortedBills.length - i}</td>
                <td>
                    <span className={`badge ${bill.isQuickCash ? 'badge-orange' : (bill.status === 'DEBT' ? 'badge-blue' : 'badge-green')}`} style={{ fontSize: '0.75rem' }}>
                        {bill.isQuickCash ? 'CASH' : `#${bill.displayId || bill.id}`}
                    </span>
                </td>
                <td><strong>{bill.customerName}</strong></td>
                <td>{bill.phone}</td>
                <td>
                  {bill.isQuickCash ? (
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Quick Cash Entry</span>
                  ) : (
                      (() => {
                        try {
                          const items = JSON.parse(bill.itemsJson || '[]');
                          return `${items.length} items`;
                        } catch { return '—'; }
                      })()
                  )}
                </td>
                <td><strong style={{ color: 'var(--primary-dark)' }}>₹{bill.grandTotal?.toFixed(2) ?? '—'}</strong></td>
                <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{bill.createdAt ? new Date(bill.createdAt).toLocaleString('en-IN') : '—'}</td>
                <td>
                  {bill.isQuickCash ? (
                    <span className="badge badge-green" style={{ fontSize: '0.75rem' }}>PAID</span>
                  ) : bill.status === 'DEBT' ? (
                    <span className="badge" style={{ background: '#fef3c7', color: '#92400e', fontSize: '0.75rem' }}>CREDIT</span>
                  ) : (
                    <span className="badge badge-green" style={{ fontSize: '0.75rem' }}>PAID</span>
                  )}
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    {bill.isQuickCash ? (
                        <button 
                          disabled
                          style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#94a3b8', padding: '0.4rem', borderRadius: '6px', cursor: 'not-allowed', display: 'flex' }}
                          title="Bill not available for Quick Cash"
                        >
                          <Eye size={16} />
                        </button>
                    ) : (
                        <button 
                          onClick={() => setSelectedBill(bill)}
                          style={{ background: '#f0f7ff', border: '1px solid #dbeafe', color: 'var(--primary-dark)', padding: '0.4rem', borderRadius: '6px', cursor: 'pointer', display: 'flex' }}
                          title="View Summary"
                        >
                          <Eye size={16} />
                        </button>
                    )}
                    {role === 'ADMIN' && (
                      <>
                        <button 
                          onClick={() => startEdit(bill)}
                          style={{ background: '#f0fdf4', border: '1px solid #dcfce7', color: '#166534', padding: '0.4rem', borderRadius: '6px', cursor: 'pointer', display: 'flex' }}
                          title={bill.isQuickCash ? "Edit Quick Cash" : "Edit Bill"}
                        >
                          <Edit size={16} />
                        </button>
                        <button 
                          onClick={() => handleDelete(bill.id, bill.displayId, bill.isQuickCash)}
                          style={{ background: '#fef2f2', border: '1px solid #fee2e2', color: '#991b1b', padding: '0.4rem', borderRadius: '6px', cursor: 'pointer', display: 'flex' }}
                          title={bill.isQuickCash ? "Delete Quick Cash" : "Delete Bill"}
                        >
                          <Trash2 size={16} />
                        </button>
                      </>
                    )}
                  </div>
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
                <div style={{ background: '#f0f7ff', color: 'var(--primary-dark)', padding: '0.6rem', borderRadius: '10px' }}>
                  <FileText size={20} />
                </div>
                <h3 style={{ margin: 0 }}>Bill Summary <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 400 }}>#{selectedBill.displayId || selectedBill.id}</span></h3>
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
                      displayId: selectedBill.displayId,
                      customerName: selectedBill.customerName,
                      phone: selectedBill.phone,
                      items: selectedBill.itemsJson,
                      grandTotal: selectedBill.grandTotal,
                      createdAt: selectedBill.createdAt,
                      qrDataUrl
                    });
                    doc.save(`Bill_${selectedBill.displayId || selectedBill.id}_${selectedBill.customerName || 'Customer'}.pdf`);
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

      {/* Edit Bill Modal */}
      {editingBill && (
        <div className="modal-overlay" onClick={() => setEditingBill(null)}>
          <div className="modal-content" style={{ maxWidth: editingBill.isQuickCash ? '400px' : '700px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ background: '#f0fdf4', color: '#166534', padding: '0.6rem', borderRadius: '10px' }}>
                  <Edit size={20} />
                </div>
                <h3 style={{ margin: 0 }}>
                  {editingBill.isQuickCash ? 'Edit Quick Cash' : 'Edit Bill'} 
                  {!editingBill.isQuickCash && (
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 400 }}> #{editingBill.displayId || editingBill.id}</span>
                  )}
                </h3>
              </div>
              <button className="close-btn" onClick={() => setEditingBill(null)}>&times;</button>
            </div>

            <div className="modal-body" style={{ padding: '0.5rem 0' }}>
              {editMsg && (
                <div style={{ marginBottom: '1rem', padding: '0.75rem 1rem', borderRadius: '8px', fontWeight: 600, background: editMsg.startsWith('✅') ? '#dbeafe' : '#fee2e2', color: editMsg.startsWith('✅') ? '#1e40af' : '#991b1b' }}>
                  {editMsg}
                </div>
              )}

              {editingBill.isQuickCash ? (
                <div>
                  <div className="form-group" style={{ padding: '0 0.5rem' }}>
                    <label>Amount (₹)</label>
                    <input 
                      type="number" 
                      className="form-input" 
                      step="0.01"
                      placeholder="0.00" 
                      value={editingBill.amount} 
                      onChange={e => setEditingBill(b => ({ ...b, amount: e.target.value }))}
                      required 
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', padding: '0 0.5rem' }}>
                    <button className="btn-outline" style={{ flex: 1 }} onClick={() => setEditingBill(null)}>Cancel</button>
                    <button className="btn-primary" style={{ flex: 2 }} onClick={handleSaveQuickCashEdit} disabled={savingEdit}>
                      {savingEdit ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Customer Info Form */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                    <div className="form-group">
                      <label>Customer Name</label>
                      <input 
                        className="form-input" 
                        value={editingBill.customerName} 
                        onChange={e => setEditingBill(b => ({ ...b, customerName: e.target.value }))} 
                      />
                    </div>
                    <div className="form-group">
                      <label>Phone Number</label>
                      <input 
                        className="form-input" 
                        value={editingBill.phone} 
                        onChange={e => setEditingBill(b => ({ ...b, phone: e.target.value }))} 
                      />
                    </div>
                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                      <label style={{ fontWeight: 700 }}>Payment Status</label>
                      <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid ' + (editingBill.status === 'PAID' ? 'var(--primary-dark)' : '#e2e8f0'), background: editingBill.status === 'PAID' ? '#f0f7ff' : 'transparent' }}>
                          <input type="radio" name="editPaymentStatus" value="PAID" checked={editingBill.status === 'PAID'} onChange={() => setEditingBill(b => ({ ...b, status: 'PAID' }))} />
                          <span>Cash / Paid</span>
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid ' + (editingBill.status === 'DEBT' ? '#ef4444' : '#e2e8f0'), background: editingBill.status === 'DEBT' ? '#fef2f2' : 'transparent' }}>
                          <input type="radio" name="editPaymentStatus" value="DEBT" checked={editingBill.status === 'DEBT'} onChange={() => setEditingBill(b => ({ ...b, status: 'DEBT' }))} />
                          <span style={{ color: editingBill.status === 'DEBT' ? '#b91c1c' : 'inherit' }}>Credit / Debt</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Items List */}
                  <h4 style={{ marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><FileText size={16} /> Bill Items</h4>
                  <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden', marginBottom: '1.5rem' }}>
                    <table style={{ width: '100%', fontSize: '0.85rem' }}>
                      <thead style={{ background: '#f1f5f9' }}>
                        <tr>
                          <th style={{ padding: '0.6rem', textAlign: 'left' }}>Item / Service</th>
                          <th style={{ padding: '0.6rem', width: '90px', textAlign: 'center' }}>Qty</th>
                          <th style={{ padding: '0.6rem', width: '110px', textAlign: 'right' }}>Unit Price (₹)</th>
                          <th style={{ padding: '0.6rem', width: '110px', textAlign: 'right' }}>Total (₹)</th>
                          <th style={{ padding: '0.6rem', width: '50px', textAlign: 'center' }}></th>
                        </tr>
                      </thead>
                      <tbody>
                        {editingItems.map((item, idx) => (
                          <tr key={idx}>
                            <td style={{ padding: '0.5rem', borderTop: '1px solid #f1f5f9' }}>
                              <div style={{ fontWeight: 600 }}>{item.service}</div>
                              <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{item.category}</div>
                            </td>
                            <td style={{ padding: '0.5rem', borderTop: '1px solid #f1f5f9', textAlign: 'center' }}>
                              <input 
                                type="number" 
                                className="form-input" 
                                min="1" 
                                style={{ width: '70px', padding: '0.25rem 0.5rem', margin: 0, textAlign: 'center' }} 
                                value={item.qty} 
                                onChange={e => updateItemQty(idx, e.target.value)} 
                              />
                            </td>
                            <td style={{ padding: '0.5rem', borderTop: '1px solid #f1f5f9', textAlign: 'right' }}>
                              <input 
                                type="number" 
                                className="form-input" 
                                min="0" 
                                step="0.01" 
                                style={{ width: '90px', padding: '0.25rem 0.5rem', margin: 0, textAlign: 'right' }} 
                                value={item.price} 
                                onChange={e => updateItemPrice(idx, e.target.value)} 
                              />
                            </td>
                            <td style={{ padding: '0.5rem', borderTop: '1px solid #f1f5f9', textAlign: 'right', fontWeight: 600 }}>
                              ₹{item.total.toFixed(2)}
                            </td>
                            <td style={{ padding: '0.5rem', borderTop: '1px solid #f1f5f9', textAlign: 'center' }}>
                              <button 
                                className="btn-danger" 
                                style={{ padding: '0.35rem', borderRadius: '4px' }} 
                                onClick={() => removeEditItem(idx)}
                              >
                                <Trash2 size={12} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr style={{ background: '#f8fafc' }}>
                          <td colSpan={3} style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 700 }}>Grand Total:</td>
                          <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 800, fontSize: '1.1rem', color: 'var(--primary-dark)' }}>
                            ₹{editingItems.reduce((sum, item) => sum + item.total, 0).toFixed(2)}
                          </td>
                          <td></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  {/* Add Item form */}
                  <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '1.5rem' }}>
                    <h5 style={{ margin: '0 0 0.75rem 0', display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Plus size={14} /> Add Service / Product to Bill</h5>
                    <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 2fr 1fr 1fr auto', gap: '0.75rem', alignItems: 'end' }}>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label style={{ fontSize: '0.75rem' }}>Category</label>
                        <select className="form-select" style={{ marginBottom: 0, padding: '0.4rem' }} value={newCategory} onChange={e => setNewCategory(e.target.value)}>
                          {categories.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label style={{ fontSize: '0.75rem' }}>Service / Product Name</label>
                        <input 
                          className="form-input" 
                          style={{ marginBottom: 0, padding: '0.4rem' }} 
                          list="edit-catalog-options" 
                          placeholder="Search..." 
                          value={newService} 
                          onChange={e => handleEditNameChange(e.target.value)} 
                        />
                        <datalist id="edit-catalog-options">
                          {catalog.map(item => <option key={item.name} value={item.name} />)}
                        </datalist>
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label style={{ fontSize: '0.75rem' }}>Qty</label>
                        <input className="form-input" type="number" min="1" style={{ marginBottom: 0, padding: '0.4rem' }} value={newQty} onChange={e => setNewQty(e.target.value)} />
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label style={{ fontSize: '0.75rem' }}>Price (₹)</label>
                        <input className="form-input" type="number" min="0" step="0.01" style={{ marginBottom: 0, padding: '0.4rem' }} placeholder="0.00" value={newPrice} onChange={e => setNewPrice(e.target.value)} />
                      </div>
                      <button className="btn-success" style={{ padding: '0.5rem 1rem', height: '38px' }} onClick={addEditItem}>
                        Add
                      </button>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                    <button className="btn-outline" onClick={() => setEditingBill(null)}>Cancel</button>
                    <button className="btn-primary" onClick={handleSaveEdit} disabled={savingEdit}>
                      {savingEdit ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
