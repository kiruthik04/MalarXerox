import React, { useState, useEffect } from 'react';
import { Plus, RefreshCw, UserPlus, Trash2, Shield, User } from 'lucide-react';
import { api } from '../services/api';

export default function EmployeeManagementPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddUser, setShowAddUser] = useState(false);
  const [userForm, setUserForm] = useState({ username: '', password: '' });
  const [msg, setMsg] = useState('');

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await api.getUsers();
      setUsers(data);
    } catch (err) {
      console.error('Failed to load users:', err);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      await api.registerUser(userForm);
      setMsg('✅ Employee created successfully!');
      setUserForm({ username: '', password: '' });
      setShowAddUser(false);
      loadUsers();
    } catch (err) {
      setMsg(`❌ ${err.message || 'Failed to create employee'}`);
    }
    setTimeout(() => setMsg(''), 3000);
  };

  const handleDeleteUser = async (id, username) => {
    if (!window.confirm(`Are you sure you want to delete user "${username}"?`)) return;
    
    try {
      await api.deleteUser(id);
      setMsg('✅ User deleted');
      loadUsers();
    } catch (err) {
      setMsg(`❌ ${err.message || 'Connection error'}`);
    }
    setTimeout(() => setMsg(''), 3000);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Employee Management</h2>
          <p>Create and manage system access for your staff</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn-outline" onClick={loadUsers} disabled={loading}>
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          <button className="btn-success" onClick={() => setShowAddUser(true)}>
            <UserPlus size={15} /> Add Employee
          </button>
        </div>
      </div>

      {msg && (
        <div style={{ 
          marginBottom: '1rem', 
          padding: '0.75rem 1rem', 
          borderRadius: '8px', 
          background: msg.startsWith('✅') ? '#dbeafe' : '#fee2e2', 
          color: msg.startsWith('✅') ? '#1e40af' : '#991b1b', 
          fontWeight: 600,
          animation: 'slideDownFade 0.3s ease-out'
        }}>
          {msg}
        </div>
      )}

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Role</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && users.length === 0 ? (
              <tr><td colSpan={3} style={{ textAlign: 'center', padding: '3rem' }}>Loading users...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={3} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>No employees found. Add your first employee to get started.</td></tr>
            ) : users.map(user => (
              <tr key={user.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ background: '#f0f7ff', color: 'var(--primary-dark)', padding: '0.5rem', borderRadius: '8px' }}>
                      <User size={18} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, color: '#1e293b' }}>{user.username}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ID: #{user.id}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <span className={`badge ${user.role === 'ADMIN' ? 'badge-blue' : 'badge-green'}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                    {user.role === 'ADMIN' ? <Shield size={12} /> : <User size={12} />}
                    {user.role}
                  </span>
                </td>
                <td style={{ textAlign: 'right' }}>
                  {user.role !== 'ADMIN' && (
                    <button 
                      className="btn-outline" 
                      style={{ color: '#ef4444', borderColor: '#fee2e2', background: 'transparent', padding: '0.4rem' }}
                      onClick={() => handleDeleteUser(user.id, user.username)}
                      title="Delete User"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showAddUser && (
        <div className="modal-overlay" onClick={() => setShowAddUser(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h3>Add New Employee</h3>
              <button className="close-btn" onClick={() => setShowAddUser(false)}>&times;</button>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
              The new user will be created with <strong>EMPLOYEE</strong> role and restricted access.
            </p>
            <form onSubmit={handleAddUser}>
              <div className="form-group">
                <label>Username</label>
                <div style={{ position: 'relative' }}>
                  <input 
                    className="form-input" 
                    placeholder="e.g. karthi_staff" 
                    value={userForm.username} 
                    onChange={e => setUserForm(f => ({ ...f, username: e.target.value }))} 
                    required 
                    autoFocus
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Password</label>
                <input 
                  className="form-input" 
                  type="password"
                  placeholder="Enter temporary password" 
                  value={userForm.password} 
                  onChange={e => setUserForm(f => ({ ...f, password: e.target.value }))} 
                  required 
                />
              </div>
              <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
                <button type="button" className="btn-outline" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setShowAddUser(false)}>Cancel</button>
                <button type="submit" className="btn-success" style={{ flex: 2, justifyContent: 'center' }}>Create User</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
