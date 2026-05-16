import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { Plus, Truck, ArrowUpCircle, ArrowDownCircle } from 'lucide-react-native';
import { api } from '../services/api';

export default function SuppliersScreen() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addBillFor, setAddBillFor] = useState(null);
  const [historyFor, setHistoryFor] = useState(null);
  const [historyData, setHistoryData] = useState({ bills: [], payments: [] });
  const [supplierForm, setSupplierForm] = useState({ name: '', contact: '' });
  const [billForm, setBillForm] = useState({ amount: '', description: '' });
  const [msg, setMsg] = useState({ text: '', success: true });

  const showMsg = (text, success = true) => { setMsg({ text, success }); setTimeout(() => setMsg({ text: '', success: true }), 3000); };

  const load = async () => {
    try { const data = await api.getSuppliers(); setSuppliers(Array.isArray(data) ? data : []); }
    catch (err) { console.error(err); setSuppliers([]); } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const addSupplier = async () => {
    if (!supplierForm.name) { Alert.alert('Required', 'Supplier name is required.'); return; }
    try {
      await api.addSupplier(supplierForm);
      showMsg('Supplier added!', true);
      setSupplierForm({ name: '', contact: '' }); setShowAddForm(false); load();
    } catch (err) { showMsg(err.message || 'Failed.', false); }
  };

  const addBill = async () => {
    if (!billForm.amount || !billForm.description) { Alert.alert('Required', 'Amount and description are required.'); return; }
    try {
      await api.addSupplierBill(addBillFor.id, { ...billForm, amount: parseFloat(billForm.amount) });
      showMsg('Bill added!', true);
      setBillForm({ amount: '', description: '' }); setAddBillFor(null); load();
    } catch (err) { showMsg(err.message || 'Failed.', false); }
  };

  const loadHistory = async (supplier) => {
    setHistoryFor(supplier);
    try { const data = await api.getSupplierHistory(supplier.id); setHistoryData(data); }
    catch (err) { console.error(err); }
  };

  if (loading) return <ActivityIndicator size="large" color="#155496" style={{ flex: 1, marginTop: 60 }} />;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} />}>
      {msg.text ? <View style={[styles.msgBox, { backgroundColor: msg.success ? '#dbeafe' : '#fee2e2' }]}><Text style={{ color: msg.success ? '#1e40af' : '#991b1b', fontWeight: '600' }}>{msg.text}</Text></View> : null}

      <TouchableOpacity style={[styles.addBtn, showAddForm && { backgroundColor: '#64748b' }]} onPress={() => setShowAddForm(!showAddForm)}>
        <Plus size={18} color="#fff" /><Text style={styles.addBtnText}>{showAddForm ? 'Cancel' : 'New Supplier'}</Text>
      </TouchableOpacity>

      {showAddForm && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Add New Supplier</Text>
          <Text style={styles.label}>Supplier Name</Text>
          <TextInput style={styles.input} placeholder="e.g. Global Paper Mart" value={supplierForm.name} onChangeText={v => setSupplierForm(f => ({ ...f, name: v }))} />
          <Text style={styles.label}>Contact (Phone/Address)</Text>
          <TextInput style={styles.input} placeholder="e.g. 9876543210 / Sathy" value={supplierForm.contact} onChangeText={v => setSupplierForm(f => ({ ...f, contact: v }))} />
          <TouchableOpacity style={styles.saveBtn} onPress={addSupplier}><Text style={styles.saveBtnText}>Save Supplier</Text></TouchableOpacity>
        </View>
      )}

      {addBillFor && (
        <View style={[styles.card, { borderWidth: 1, borderColor: '#ef4444' }]}>
          <Text style={styles.cardTitle}>Add Bill: {addBillFor.name}</Text>
          <Text style={styles.label}>Bill Amount (₹)</Text>
          <TextInput style={styles.input} placeholder="0.00" keyboardType="numeric" value={billForm.amount} onChangeText={v => setBillForm(f => ({ ...f, amount: v }))} />
          <Text style={styles.label}>Description / Invoice No.</Text>
          <TextInput style={styles.input} placeholder="e.g. Invoice #4421" value={billForm.description} onChangeText={v => setBillForm(f => ({ ...f, description: v }))} />
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity style={[styles.saveBtn, { flex: 1, backgroundColor: '#64748b' }]} onPress={() => setAddBillFor(null)}><Text style={styles.saveBtnText}>Cancel</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.saveBtn, { flex: 2 }]} onPress={addBill}><Text style={styles.saveBtnText}>Add to Balance</Text></TouchableOpacity>
          </View>
        </View>
      )}

      {historyFor && (
        <View style={styles.card}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
            <Text style={styles.cardTitle}>{historyFor.name} History</Text>
            <TouchableOpacity onPress={() => setHistoryFor(null)}><Text style={{ color: '#94a3b8', fontWeight: '600' }}>✕ Close</Text></TouchableOpacity>
          </View>
          <Text style={[styles.label, { color: '#ef4444' }]}>Bills (Increases Balance)</Text>
          {historyData.bills.length === 0 ? <Text style={styles.emptyText}>No bills.</Text> : historyData.bills.map(b => (
            <View key={b.id} style={styles.historyRow}>
              <Text style={styles.historyDesc}>{b.description}</Text>
              <Text style={[styles.historyAmt, { color: '#ef4444' }]}>₹{(b.amount || 0).toFixed(2)}</Text>
            </View>
          ))}
          <Text style={[styles.label, { color: '#10b981', marginTop: 12 }]}>Payments (Decreases Balance)</Text>
          {historyData.payments.length === 0 ? <Text style={styles.emptyText}>No payments.</Text> : historyData.payments.map(p => (
            <View key={p.id} style={styles.historyRow}>
              <Text style={styles.historyDesc}>{p.description}</Text>
              <Text style={[styles.historyAmt, { color: '#10b981' }]}>₹{(p.amount || 0).toFixed(2)}</Text>
            </View>
          ))}
        </View>
      )}

      {suppliers.length === 0 ? <Text style={styles.emptyText}>No suppliers found.</Text> : suppliers.map(s => (
        <View key={s.id} style={styles.supplierCard}>
          <View style={styles.supplierIcon}><Truck size={20} color="#0891b2" /></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.supplierName}>{s.name}</Text>
            <Text style={styles.supplierContact}>{s.contact || 'No contact'}</Text>
          </View>
          <View style={{ alignItems: 'flex-end', gap: 8 }}>
            <Text style={[styles.supplierBalance, { color: (s.balance || 0) > 0 ? '#ef4444' : '#10b981' }]}>₹{(s.balance || 0).toFixed(2)}</Text>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              <TouchableOpacity style={styles.actionBtn} onPress={() => setAddBillFor(s)}><Plus size={14} color="#155496" /></TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn} onPress={() => loadHistory(s)}><ArrowDownCircle size={14} color="#64748b" /></TouchableOpacity>
            </View>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 16, paddingBottom: 32 },
  msgBox: { padding: 12, borderRadius: 8, marginBottom: 12 },
  addBtn: { backgroundColor: '#22c55e', borderRadius: 10, padding: 13, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  addBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 15, marginLeft: 6 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, elevation: 2 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#1e293b', marginBottom: 14 },
  label: { fontSize: 13, fontWeight: '600', color: '#334155', marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 8, padding: 10, fontSize: 15, color: '#0f172a', backgroundColor: '#f8fafc', marginBottom: 14 },
  saveBtn: { backgroundColor: '#155496', borderRadius: 8, padding: 13, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  supplierCard: { backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, elevation: 1 },
  supplierIcon: { width: 42, height: 42, borderRadius: 10, backgroundColor: '#e0f2fe', justifyContent: 'center', alignItems: 'center' },
  supplierName: { fontSize: 15, fontWeight: 'bold', color: '#1e293b' },
  supplierContact: { fontSize: 12, color: '#64748b', marginTop: 2 },
  supplierBalance: { fontSize: 16, fontWeight: 'bold' },
  actionBtn: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, padding: 6, backgroundColor: '#fff' },
  historyRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  historyDesc: { fontSize: 13, color: '#334155', flex: 1 },
  historyAmt: { fontSize: 13, fontWeight: 'bold' },
  emptyText: { textAlign: 'center', color: '#94a3b8', padding: 16 },
});
