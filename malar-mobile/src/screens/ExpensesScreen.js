import React, { useState, useEffect, useContext } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, ActivityIndicator, Alert, RefreshControl
} from 'react-native';
import { Plus, RefreshCw } from 'lucide-react-native';
import { api } from '../services/api';
import { AuthContext } from '../context/AuthContext';

const CATEGORIES = ['Supplies', 'Electricity', 'Rent', 'Internet', 'Salary', 'Maintenance', 'Other'];

export default function ExpensesScreen() {
  const { auth } = useContext(AuthContext);
  const [expenses, setExpenses] = useState([]);
  const [form, setForm] = useState({ description: '', amount: '', category: 'Supplies' });
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [msg, setMsg] = useState({ text: '', success: true });

  const load = async () => {
    try {
      const data = await api.getExpenses();
      setExpenses(data);
    } catch (err) {
      console.error('Failed to load expenses', err);
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
    if (!form.description || !form.amount) {
      Alert.alert('Required', 'Please fill in description and amount.');
      return;
    }
    setLoading(true);
    try {
      await api.addExpense({ ...form, amount: parseFloat(form.amount) });
      setForm({ description: '', amount: '', category: 'Supplies' });
      showMsg('Expense recorded!', true);
      await load();
    } catch (err) {
      showMsg(err.message || 'Failed to record expense.', false);
    } finally {
      setLoading(false);
    }
  };

  const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);

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

      {/* Add Expense Form */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>New Expense</Text>

        <Text style={styles.label}>Description</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. EB Bill - May"
          value={form.description}
          onChangeText={v => setForm(f => ({ ...f, description: v }))}
        />

        <Text style={styles.label}>Amount (₹)</Text>
        <TextInput
          style={styles.input}
          placeholder="0.00"
          keyboardType="numeric"
          value={form.amount}
          onChangeText={v => setForm(f => ({ ...f, amount: v }))}
        />

        <Text style={styles.label}>Category</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
          {CATEGORIES.map(cat => (
            <TouchableOpacity
              key={cat}
              onPress={() => setForm(f => ({ ...f, category: cat }))}
              style={[styles.catChip, form.category === cat && styles.catChipActive]}
            >
              <Text style={[styles.catChipText, form.category === cat && styles.catChipTextActive]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <TouchableOpacity style={styles.saveBtn} onPress={save} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : (
            <><Plus size={16} color="#fff" /><Text style={styles.saveBtnText}> Save Expense</Text></>
          )}
        </TouchableOpacity>
      </View>

      {/* Summary */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>Total Tracked Expenses</Text>
        <Text style={styles.summaryValue}>₹{totalExpenses.toFixed(2)}</Text>
      </View>

      {/* Expense List */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Expense History</Text>
        {expenses.length === 0 ? (
          <Text style={styles.emptyText}>No expenses recorded yet.</Text>
        ) : (
          expenses.map(e => (
            <View key={e.id} style={styles.expenseRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.expenseDesc}>{e.description}</Text>
                <Text style={styles.expenseMeta}>{e.category} • {e.createdAt ? new Date(e.createdAt).toLocaleDateString() : ''}</Text>
              </View>
              <Text style={styles.expenseAmount}>₹{(e.amount || 0).toFixed(2)}</Text>
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
  catChip: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1,
    borderColor: '#cbd5e1', marginRight: 8, backgroundColor: '#f8fafc',
  },
  catChipActive: { backgroundColor: '#155496', borderColor: '#155496' },
  catChipText: { fontSize: 13, color: '#475569' },
  catChipTextActive: { color: '#fff', fontWeight: '600' },
  saveBtn: {
    backgroundColor: '#22c55e', borderRadius: 8, padding: 13,
    alignItems: 'center', flexDirection: 'row', justifyContent: 'center',
  },
  saveBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  summaryCard: {
    backgroundColor: '#fff5f5', borderWidth: 1, borderColor: '#fecaca',
    borderRadius: 16, padding: 16, marginBottom: 12, alignItems: 'center',
  },
  summaryLabel: { fontSize: 13, color: '#64748b', fontWeight: '600' },
  summaryValue: { fontSize: 28, fontWeight: 'bold', color: '#ef4444', marginTop: 4 },
  expenseRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: '#f1f5f9',
  },
  expenseDesc: { fontSize: 14, fontWeight: '600', color: '#1e293b' },
  expenseMeta: { fontSize: 12, color: '#64748b', marginTop: 2 },
  expenseAmount: { fontSize: 15, fontWeight: 'bold', color: '#ef4444' },
  emptyText: { textAlign: 'center', color: '#94a3b8', padding: 20 },
});
