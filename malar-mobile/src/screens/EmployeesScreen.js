import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { UserPlus, Trash2, Shield, User } from 'lucide-react-native';
import { api } from '../services/api';

export default function EmployeesScreen() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ username: '', password: '' });
  const [msg, setMsg] = useState({ text: '', success: true });

  const showMsg = (text, success = true) => { setMsg({ text, success }); setTimeout(() => setMsg({ text: '', success: true }), 3000); };

  const load = async () => {
    try { const data = await api.getUsers(); setUsers(data); }
    catch (err) { console.error('Failed to load users:', err); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleAdd = async () => {
    if (!form.username || !form.password) { Alert.alert('Required', 'Username and password are required.'); return; }
    try {
      await api.registerUser(form);
      showMsg('Employee created!', true);
      setForm({ username: '', password: '' }); setShowForm(false); load();
    } catch (err) { showMsg(err.message || 'Failed to create employee', false); }
  };

  const handleDelete = (id, username) => {
    Alert.alert('Delete User', `Delete "${username}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try { await api.deleteUser(id); showMsg('User deleted', true); load(); }
          catch (err) { showMsg(err.message || 'Connection error', false); }
        }
      }
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} />}>
      {msg.text ? <View style={[styles.msgBox, { backgroundColor: msg.success ? '#dbeafe' : '#fee2e2' }]}><Text style={{ color: msg.success ? '#1e40af' : '#991b1b', fontWeight: '600' }}>{msg.text}</Text></View> : null}

      <TouchableOpacity style={[styles.addBtn, showForm && { backgroundColor: '#64748b' }]} onPress={() => setShowForm(!showForm)}>
        <UserPlus size={18} color="#fff" /><Text style={styles.addBtnText}>{showForm ? 'Cancel' : 'Add Employee'}</Text>
      </TouchableOpacity>

      {showForm && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>New Employee</Text>
          <Text style={styles.note}>The new user will have EMPLOYEE role with restricted access.</Text>
          <Text style={styles.label}>Username</Text>
          <TextInput style={styles.input} placeholder="e.g. karthi_staff" autoCapitalize="none"
            value={form.username} onChangeText={v => setForm(f => ({ ...f, username: v }))} />
          <Text style={styles.label}>Password</Text>
          <TextInput style={styles.input} placeholder="Temporary password" secureTextEntry
            value={form.password} onChangeText={v => setForm(f => ({ ...f, password: v }))} />
          <TouchableOpacity style={styles.saveBtn} onPress={handleAdd}><Text style={styles.saveBtnText}>Create Employee</Text></TouchableOpacity>
        </View>
      )}

      {loading ? <ActivityIndicator size="large" color="#155496" style={{ marginTop: 30 }} /> : users.length === 0 ? (
        <Text style={styles.emptyText}>No employees found.</Text>
      ) : (
        users.map(user => (
          <View key={user.id} style={styles.userCard}>
            <View style={[styles.avatar, { backgroundColor: user.role === 'ADMIN' ? '#fef9c3' : '#f0f7ff' }]}>
              {user.role === 'ADMIN' ? <Shield size={20} color="#854d0e" /> : <User size={20} color="#155496" />}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.userName}>{user.username}</Text>
              <View style={[styles.roleBadge, { backgroundColor: user.role === 'ADMIN' ? '#fef9c3' : '#dcfce7' }]}>
                <Text style={[styles.roleText, { color: user.role === 'ADMIN' ? '#854d0e' : '#166534' }]}>{user.role}</Text>
              </View>
            </View>
            {user.role !== 'ADMIN' && (
              <TouchableOpacity onPress={() => handleDelete(user.id, user.username)} style={styles.deleteBtn}>
                <Trash2 size={18} color="#ef4444" />
              </TouchableOpacity>
            )}
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 16, paddingBottom: 32 },
  msgBox: { padding: 12, borderRadius: 8, marginBottom: 12 },
  addBtn: { backgroundColor: '#155496', borderRadius: 10, padding: 13, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  addBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 15, marginLeft: 8 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, elevation: 2 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#1e293b', marginBottom: 4 },
  note: { fontSize: 12, color: '#64748b', marginBottom: 14, fontStyle: 'italic' },
  label: { fontSize: 13, fontWeight: '600', color: '#334155', marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 8, padding: 10, fontSize: 15, color: '#0f172a', backgroundColor: '#f8fafc', marginBottom: 14 },
  saveBtn: { backgroundColor: '#22c55e', borderRadius: 8, padding: 13, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  userCard: { backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, elevation: 1 },
  avatar: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  userName: { fontSize: 15, fontWeight: 'bold', color: '#1e293b', marginBottom: 4 },
  roleBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20, alignSelf: 'flex-start' },
  roleText: { fontSize: 11, fontWeight: '700' },
  deleteBtn: { padding: 8, borderRadius: 8, backgroundColor: '#fee2e2' },
  emptyText: { textAlign: 'center', color: '#94a3b8', padding: 40 },
});
