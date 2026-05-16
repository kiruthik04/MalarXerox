import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { Plus, Package, Cpu } from 'lucide-react-native';
import { api } from '../services/api';

export default function InventoryScreen() {
  const [tab, setTab] = useState('service');
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [sForm, setSForm] = useState({ serviceName: '', category: '' });
  const [iForm, setIForm] = useState({ itemName: '', stockQuantity: '', unitPrice: '' });
  const [msg, setMsg] = useState({ text: '', success: true });

  const showMsg = (text, success = true) => { setMsg({ text, success }); setTimeout(() => setMsg({ text: '', success: true }), 3000); };

  const load = async () => {
    try { const d = await api.getDashboardData(); setServices(d.serviceSales || []); } catch { }
  };

  useEffect(() => { load(); }, []);

  const addService = async () => {
    if (!sForm.serviceName) { Alert.alert('Required', 'Service name is required.'); return; }
    setLoading(true);
    try { await api.addService(sForm); showMsg('Service added!', true); setSForm({ serviceName: '', category: '' }); await load(); }
    catch (err) { showMsg(err.message || 'Failed.', false); } finally { setLoading(false); }
  };

  const addProduct = async () => {
    if (!iForm.itemName || !iForm.stockQuantity || !iForm.unitPrice) { Alert.alert('Required', 'All fields are required.'); return; }
    setLoading(true);
    try {
      await api.addInventoryItem({ itemName: iForm.itemName, stockQuantity: Number(iForm.stockQuantity), unitPrice: parseFloat(iForm.unitPrice) });
      showMsg('Product added!', true); setIForm({ itemName: '', stockQuantity: '', unitPrice: '' });
    } catch (err) { showMsg(err.message || 'Failed.', false); } finally { setLoading(false); }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} />}>
      {msg.text ? <View style={[styles.msgBox, { backgroundColor: msg.success ? '#dbeafe' : '#fee2e2' }]}><Text style={{ color: msg.success ? '#1e40af' : '#991b1b', fontWeight: '600' }}>{msg.text}</Text></View> : null}
      <View style={styles.tabRow}>
        <TouchableOpacity style={[styles.tab, tab === 'service' && styles.tabActive]} onPress={() => setTab('service')}>
          <Cpu size={15} color={tab === 'service' ? '#fff' : '#64748b'} /><Text style={[styles.tabText, tab === 'service' && styles.tabTextActive]}> Services</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, tab === 'product' && styles.tabActive]} onPress={() => setTab('product')}>
          <Package size={15} color={tab === 'product' ? '#fff' : '#64748b'} /><Text style={[styles.tabText, tab === 'product' && styles.tabTextActive]}> Products</Text>
        </TouchableOpacity>
      </View>
      {tab === 'service' && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Add New Service</Text>
          <Text style={styles.label}>Service Name</Text>
          <TextInput style={styles.input} placeholder="e.g. Caste Certificate" value={sForm.serviceName} onChangeText={v => setSForm(f => ({ ...f, serviceName: v }))} />
          <Text style={styles.label}>Category</Text>
          <TextInput style={styles.input} placeholder="e.g. Government E-Services" value={sForm.category} onChangeText={v => setSForm(f => ({ ...f, category: v }))} />
          <TouchableOpacity style={styles.saveBtn} onPress={addService} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <><Plus size={16} color="#fff" /><Text style={styles.saveBtnText}> Add Service</Text></>}
          </TouchableOpacity>
          <Text style={[styles.label, { marginTop: 20 }]}>Current Services</Text>
          {services.length === 0 ? <Text style={styles.emptyText}>No services yet.</Text> : services.map((s, i) => (
            <View key={i} style={styles.serviceRow}><Text style={styles.serviceName}>{s.serviceName}</Text><Text style={styles.serviceSales}>{s.salesToday} today</Text></View>
          ))}
        </View>
      )}
      {tab === 'product' && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Add New Product</Text>
          <Text style={styles.label}>Item Name</Text>
          <TextInput style={styles.input} placeholder="e.g. A4 Paper Ream" value={iForm.itemName} onChangeText={v => setIForm(f => ({ ...f, itemName: v }))} />
          <Text style={styles.label}>Initial Quantity</Text>
          <TextInput style={styles.input} placeholder="0" keyboardType="numeric" value={iForm.stockQuantity} onChangeText={v => setIForm(f => ({ ...f, stockQuantity: v }))} />
          <Text style={styles.label}>Unit Price (₹)</Text>
          <TextInput style={styles.input} placeholder="0.00" keyboardType="numeric" value={iForm.unitPrice} onChangeText={v => setIForm(f => ({ ...f, unitPrice: v }))} />
          <TouchableOpacity style={styles.saveBtn} onPress={addProduct} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <><Plus size={16} color="#fff" /><Text style={styles.saveBtnText}> Add Product</Text></>}
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 16, paddingBottom: 32 },
  msgBox: { padding: 12, borderRadius: 8, marginBottom: 12 },
  tabRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  tab: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: 12, borderRadius: 10, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0' },
  tabActive: { backgroundColor: '#155496', borderColor: '#155496' },
  tabText: { fontSize: 14, fontWeight: '600', color: '#64748b' },
  tabTextActive: { color: '#fff' },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, elevation: 2 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#1e293b', marginBottom: 14 },
  label: { fontSize: 13, fontWeight: '600', color: '#334155', marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 8, padding: 10, fontSize: 15, color: '#0f172a', backgroundColor: '#f8fafc', marginBottom: 14 },
  saveBtn: { backgroundColor: '#22c55e', borderRadius: 8, padding: 13, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' },
  saveBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  serviceRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  serviceName: { fontSize: 14, fontWeight: '600', color: '#1e293b' },
  serviceSales: { fontSize: 12, color: '#155496', fontWeight: '700' },
  emptyText: { textAlign: 'center', color: '#94a3b8', padding: 20 },
});
