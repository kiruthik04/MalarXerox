import React, { useState, useEffect } from 'react';
import { Clock, Plus, CheckCircle, Trash2, Phone, User, ClipboardList, AlertCircle } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

const PendingOrdersPage = ({ token }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newOrder, setNewOrder] = useState({ customerName: '', phone: '', orderDetails: '' });
  const [error, setError] = useState('');

  const fetchOrders = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/pending-orders`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (err) {
      console.error("Failed to fetch pending orders", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [token]);

  const handleAddOrder = async (e) => {
    e.preventDefault();
    setError('');
    if (!newOrder.customerName || !newOrder.orderDetails) {
      setError('Please fill in customer name and order details.');
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/pending-orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(newOrder)
      });

      if (res.ok) {
        setNewOrder({ customerName: '', phone: '', orderDetails: '' });
        setShowAddForm(false);
        fetchOrders();
      } else {
        setError('Failed to add order.');
      }
    } catch (err) {
      setError('Error connecting to server.');
    }
  };

  const handleComplete = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/api/pending-orders/${id}/complete`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) fetchOrders();
    } catch (err) {
      console.error("Failed to complete order", err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this reminder?")) return;
    try {
      const res = await fetch(`${API_BASE}/api/pending-orders/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) fetchOrders();
    } catch (err) {
      console.error("Failed to delete order", err);
    }
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h2>Pending Orders & Reminders</h2>
          <p>Track tasks and orders that need to be completed.</p>
        </div>
        <button className="btn-success" onClick={() => setShowAddForm(!showAddForm)}>
          <Plus size={18} /> {showAddForm ? 'Cancel' : 'New Reminder'}
        </button>
      </div>

      {showAddForm && (
        <div className="admin-card" style={{ marginBottom: '2rem', animation: 'slideDown 0.3s ease-out' }}>
          <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Clock size={20} color="var(--primary-dark)" /> Add New Reminder
          </h3>
          {error && <div style={{ padding: '0.75rem', background: '#fee2e2', color: '#991b1b', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.9rem' }}>{error}</div>}
          <form onSubmit={handleAddOrder} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div className="form-group">
              <label>Customer Name</label>
              <div style={{ position: 'relative' }}>
                <User size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input 
                  className="form-input" 
                  style={{ paddingLeft: '2.5rem' }}
                  placeholder="Who is this for?" 
                  value={newOrder.customerName} 
                  onChange={e => setNewOrder({...newOrder, customerName: e.target.value})} 
                />
              </div>
            </div>
            <div className="form-group">
              <label>Phone Number (Optional)</label>
              <div style={{ position: 'relative' }}>
                <Phone size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input 
                  className="form-input" 
                  style={{ paddingLeft: '2.5rem' }}
                  placeholder="Contact number" 
                  value={newOrder.phone} 
                  onChange={e => setNewOrder({...newOrder, phone: e.target.value})} 
                />
              </div>
            </div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label>Order / Task Details</label>
              <div style={{ position: 'relative' }}>
                <ClipboardList size={16} style={{ position: 'absolute', left: '12px', top: '14px', color: '#94a3b8' }} />
                <textarea 
                  className="form-input" 
                  style={{ paddingLeft: '2.5rem', minHeight: '80px', paddingTop: '10px' }}
                  placeholder="What needs to be done? (e.g. Spiral binding for 5 books, Passport photo edit...)" 
                  value={newOrder.orderDetails} 
                  onChange={e => setNewOrder({...newOrder, orderDetails: e.target.value})} 
                />
              </div>
            </div>
            <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" className="btn-success" style={{ padding: '0.75rem 2rem' }}>Save Reminder</button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}>Loading reminders...</div>
      ) : orders.length === 0 ? (
        <div className="admin-card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <div style={{ background: '#f0f7ff', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', color: 'var(--primary-dark)' }}>
            <CheckCircle size={32} />
          </div>
          <h3 style={{ marginBottom: '0.5rem' }}>No Pending Orders</h3>
          <p style={{ color: 'var(--text-muted)' }}>Everything is completed! Add a new reminder to track upcoming tasks.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
          {orders.map(order => (
            <div key={order.id} className="admin-card" style={{ borderLeft: '4px solid #f59e0b', display: 'flex', flexDirection: 'column', gap: '1rem', transition: 'transform 0.2s' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1.1rem', color: '#1e293b' }}>{order.customerName}</h4>
                  {order.phone && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', color: '#64748b', marginTop: '0.2rem' }}>
                      <Phone size={14} /> {order.phone}
                    </div>
                  )}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <Clock size={14} /> {new Date(order.createdAt).toLocaleDateString()}
                </div>
              </div>

              <div style={{ background: '#fffbeb', padding: '1rem', borderRadius: '8px', border: '1px solid #fef3c7', color: '#92400e', fontSize: '0.95rem', lineHeight: 1.5 }}>
                {order.orderDetails}
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: 'auto' }}>
                <button 
                  className="btn-success" 
                  style={{ flex: 1, justifyContent: 'center', background: '#10b981', fontSize: '0.85rem' }}
                  onClick={() => handleComplete(order.id)}
                >
                  <CheckCircle size={16} /> Mark Done
                </button>
                <button 
                  className="btn-outline" 
                  style={{ color: '#ef4444', borderColor: '#fee2e2' }}
                  onClick={() => handleDelete(order.id)}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PendingOrdersPage;



