import React, { useState, useEffect, useContext } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, ActivityIndicator, Alert, RefreshControl
} from 'react-native';
import { Plus, CheckCircle, Clock, Trash2, Search } from 'lucide-react-native';
import { api } from '../services/api';
import { AuthContext } from '../context/AuthContext';

export default function DebtsScreen() {
  const { auth } = useContext(AuthContext);
  const [debts, setDebts] = useState([]);
  const [form, setForm] = useState({ customerName: '', phone: '', amount: '', reason: '' });
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [msg, setMsg] = useState({ text: '', success: true });

  const load = async () => {
    try {
      const data = await api.getDebts();
      setDebts(data);
    } catch (err) {
      console.error('Failed to load debts', err);
    }
  };

  useEffect(() => { load(); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const showMsg = (text, success = true) => {
    setMsg({ text, success });
    setTimeout(() => setMsg({ text: '', success: true }), 3000);
  };

  const save = async () => {
    if (!form.customerName || !form.amount) {
      Alert.alert('Required', 'Customer name and amount are required.');
      return;
    }
    setLoading(true);
    try {
      await api.addDebt({ ...form, amount: parseFloat(form.amount) });
      setForm({ customerName: '', phone: '', amount: '', reason: '' });
      showMsg('Debt recorded!', true);
      await load();
    } catch (err) {
      showMsg(err.message || 'Failed.', false);
    } finally {
      setLoading(false);
    }
  };

  const settle = (id, name) => {
    Alert.alert('Settle Debt', `Mark ${name}'s debt as paid?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Mark Paid', style: 'default',
        onPress: async () => {
          try {
            await api.settleDebt(id, {});
            showMsg('Debt settled!', true);
            await load();
          } catch (err) {
            showMsg('Failed to settle debt.', false);
          }
        }
      }
    ]);
  };

  const remove = (id) => {
    Alert.alert('Delete Record', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            await api.deleteDebt(id);
            await load();
          } catch (err) {
            showMsg('Failed to delete.', false);
          }
        }
      }
    ]);
  };

  const filteredDebts = debts.filter(d =>
    d.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.phone?.includes(searchTerm)
  );
  const pendingTotal = debts.filter(d => !d.settled).reduce((sum, d) => sum + (d.amount || 0), 0);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {msg.text ? (
        <View style={[styles.msgBox, { backgroundColor: msg.success ? '#dbeafe' : '#fee2e2' }]}>
          <Text style={{ color: msg.success ? '#1e40af' : '#991b1b', fontWeight: '600' }}>{msg.text}</Text>
        </View>
      ) : null}

      {/* Summary */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>Total Pending Debts</Text>
        <Text style={styles.summaryValue}>₹{pendingTotal.toFixed(2)}</Text>
      </View>

      {/* Add Debt Form */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Record New Debt</Text>

        <Text style={styles.label}>Customer Name</Text>
        <TextInput style={styles.input} placeholder="e.g. Ramesh" value={form.customerName}
          onChangeText={v => setForm(f => ({ ...f, customerName: v }))} />

        <Text style={styles.label}>Phone (Optional)</Text>
        <TextInput style={styles.input} placeholder="e.g. 98456XXXXX" keyboardType="phone-pad"
          value={form.phone} onChangeText={v => setForm(f => ({ ...f, phone: v }))} />

        <Text style={styles.label}>Amount (₹)</Text>
        <TextInput style={styles.input} placeholder="0.00" keyboardType="numeric"
          value={form.amount} onChangeText={v => setForm(f => ({ ...f, amount: v }))} />

        <Text style={styles.label}>Reason / Note</Text>
        <TextInput style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
          placeholder="e.g. Balance for wedding album" multiline
          value={form.reason} onChangeText={v => setForm(f => ({ ...f, reason: v }))} />

        <TouchableOpacity style={styles.saveBtn} onPress={save} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : (
            <><Plus size={16} color="#fff" /><Text style={styles.saveBtnText}> Add to List</Text></>
          )}
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
        <Search size={16} color="#94a3b8" />
        <TextInput
          style={styles.searchInput}
          placeholder="Filter by customer..."
          value={searchTerm}
          onChangeText={setSearchTerm}
        />
      </View>

      {/* Debt List */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Debt Records</Text>
        {filteredDebts.length === 0 ? (
          <Text style={styles.emptyText}>No records found.</Text>
        ) : (
          filteredDebts.map(d => (
            <View key={d.id} style={[styles.debtRow, d.settled && { opacity: 0.6 }]}>
              <View style={{ flex: 1 }}>
                <Text style={styles.debtName}>{d.customerName}</Text>
                <Text style={styles.debtMeta}>{d.phone || 'No phone'} • {d.createdAt ? new Date(d.createdAt).toLocaleDateString() : ''}</Text>
                {d.reason ? <Text style={styles.debtReason}>{d.reason}</Text> : null}
              </View>
              <View style={{ alignItems: 'flex-end', gap: 6 }}>
                <Text style={[styles.debtAmount, { color: d.settled ? '#94a3b8' : '#ef4444' }]}>
                  ₹{(d.amount || 0).toFixed(2)}
                </Text>
                <View style={[styles.badge, { backgroundColor: d.settled ? '#dcfce7' : '#fef3c7' }]}>
                  {d.settled
                    ? <CheckCircle size={11} color="#16a34a" />
                    : <Clock size={11} color="#92400e" />}
                  <Text style={{ fontSize: 11, fontWeight: '600', color: d.settled ? '#16a34a' : '#92400e', marginLeft: 3 }}>
                    {d.settled ? 'Paid' : 'Pending'}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
                  {!d.settled && (
                    <TouchableOpacity style={styles.settleBtn} onPress={() => settle(d.id, d.customerName)}>
                      <Text style={styles.settleBtnText}>Mark Paid</Text>
                    </TouchableOpacity>
                  )}
                  {auth.role === 'ADMIN' && (
                    <TouchableOpacity onPress={() => remove(d.id)}>
                      <Trash2 size={16} color="#ef4444" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 16, paddingBottom: 32 },
  msgBox: { padding: 12, borderRadius: 8, marginBottom: 12 },
  summaryCard: {
    backgroundColor: '#fff5f5', borderWidth: 1, borderColor: '#fecaca',
    borderRadius: 16, padding: 16, marginBottom: 12, alignItems: 'center',
  },
  summaryLabel: { fontSize: 13, color: '#64748b', fontWeight: '600' },
  summaryValue: { fontSize: 28, fontWeight: 'bold', color: '#ef4444', marginTop: 4 },
  card: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16,
    marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 5, elevation: 2,
  },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#1e293b', marginBottom: 14 },
  label: { fontSize: 13, fontWeight: '600', color: '#334155', marginBottom: 6 },
  input: {
    borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 8,
    padding: 10, fontSize: 15, color: '#0f172a', backgroundColor: '#f8fafc', marginBottom: 14,
  },
  saveBtn: {
    backgroundColor: '#22c55e', borderRadius: 8, padding: 13,
    alignItems: 'center', flexDirection: 'row', justifyContent: 'center',
  },
  saveBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  searchRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    borderRadius: 12, paddingHorizontal: 12, marginBottom: 12,
    borderWidth: 1, borderColor: '#e2e8f0',
  },
  searchInput: { flex: 1, padding: 10, fontSize: 15, color: '#0f172a' },
  debtRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9',
  },
  debtName: { fontSize: 14, fontWeight: '700', color: '#1e293b' },
  debtMeta: { fontSize: 11, color: '#94a3b8', marginTop: 2 },
  debtReason: { fontSize: 12, color: '#64748b', marginTop: 3, fontStyle: 'italic' },
  debtAmount: { fontSize: 16, fontWeight: 'bold' },
  badge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  settleBtn: { backgroundColor: '#22c55e', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  settleBtnText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  emptyText: { textAlign: 'center', color: '#94a3b8', padding: 20 },
});
