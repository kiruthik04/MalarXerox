import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, ActivityIndicator, Alert, RefreshControl
} from 'react-native';
import { Clock, Plus, CheckCircle, Trash2, Phone, User, ClipboardList } from 'lucide-react-native';
import { api } from '../services/api';

export default function RemindersScreen() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ customerName: '', phone: '', orderDetails: '' });

  const load = async () => {
    try {
      const data = await api.getPendingOrders();
      setOrders(data);
    } catch (err) {
      console.error('Failed to fetch pending orders', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const handleAdd = async () => {
    if (!form.customerName || !form.orderDetails) {
      Alert.alert('Required', 'Please fill in customer name and order details.');
      return;
    }
    try {
      await api.addPendingOrder(form);
      setForm({ customerName: '', phone: '', orderDetails: '' });
      setShowForm(false);
      await load();
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to add order.');
    }
  };

  const handleComplete = (id) => {
    Alert.alert('Mark Done', 'Mark this order as completed?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Mark Done', onPress: async () => {
          try {
            await api.completePendingOrder(id);
            await load();
          } catch (err) {
            Alert.alert('Error', 'Failed to complete order.');
          }
        }
      }
    ]);
  };

  const handleDelete = (id) => {
    Alert.alert('Delete', 'Delete this reminder?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await api.deletePendingOrder(id);
            await load();
          } catch (err) {
            Alert.alert('Error', 'Failed to delete.');
          }
        }
      }
    ]);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <TouchableOpacity
        style={[styles.newBtn, showForm && styles.cancelBtn]}
        onPress={() => setShowForm(!showForm)}
      >
        <Plus size={18} color="#fff" />
        <Text style={styles.newBtnText}>{showForm ? 'Cancel' : 'New Reminder'}</Text>
      </TouchableOpacity>

      {showForm && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Add New Reminder</Text>
          <Text style={styles.label}>Customer Name</Text>
          <TextInput style={styles.input} placeholder="Who is this for?"
            value={form.customerName} onChangeText={v => setForm(f => ({ ...f, customerName: v }))} />

          <Text style={styles.label}>Phone (Optional)</Text>
          <TextInput style={styles.input} placeholder="Contact number" keyboardType="phone-pad"
            value={form.phone} onChangeText={v => setForm(f => ({ ...f, phone: v }))} />

          <Text style={styles.label}>Order / Task Details</Text>
          <TextInput style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
            placeholder="e.g. Spiral binding for 5 books..." multiline
            value={form.orderDetails} onChangeText={v => setForm(f => ({ ...f, orderDetails: v }))} />

          <TouchableOpacity style={styles.saveBtn} onPress={handleAdd}>
            <Text style={styles.saveBtnText}>Save Reminder</Text>
          </TouchableOpacity>
        </View>
      )}

      {loading ? (
        <ActivityIndicator size="large" color="#155496" style={{ marginTop: 40 }} />
      ) : orders.length === 0 ? (
        <View style={styles.emptyCard}>
          <CheckCircle size={48} color="#22c55e" />
          <Text style={styles.emptyTitle}>No Pending Orders!</Text>
          <Text style={styles.emptyText}>Everything is completed. Add a reminder to track upcoming tasks.</Text>
        </View>
      ) : (
        orders.map(order => (
          <View key={order.id} style={styles.orderCard}>
            <View style={styles.orderHeader}>
              <View>
                <Text style={styles.orderName}>{order.customerName}</Text>
                {order.phone ? (
                  <View style={styles.phoneRow}>
                    <Phone size={12} color="#64748b" />
                    <Text style={styles.orderPhone}> {order.phone}</Text>
                  </View>
                ) : null}
              </View>
              <View style={styles.dateRow}>
                <Clock size={13} color="#94a3b8" />
                <Text style={styles.orderDate}> {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : ''}</Text>
              </View>
            </View>

            <View style={styles.detailsBox}>
              <Text style={styles.detailsText}>{order.orderDetails}</Text>
            </View>

            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.doneBtn} onPress={() => handleComplete(order.id)}>
                <CheckCircle size={16} color="#fff" />
                <Text style={styles.doneBtnText}> Mark Done</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(order.id)}>
                <Trash2 size={16} color="#ef4444" />
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 16, paddingBottom: 40 },
  newBtn: {
    backgroundColor: '#22c55e', borderRadius: 10, padding: 13,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 16,
  },
  cancelBtn: { backgroundColor: '#64748b' },
  newBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 15, marginLeft: 6 },
  card: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16,
    marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 5, elevation: 2,
  },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#1e293b', marginBottom: 14 },
  label: { fontSize: 13, fontWeight: '600', color: '#334155', marginBottom: 6 },
  input: {
    borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 8,
    padding: 10, fontSize: 15, color: '#0f172a', backgroundColor: '#f8fafc', marginBottom: 14,
  },
  saveBtn: { backgroundColor: '#155496', borderRadius: 8, padding: 13, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  emptyCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 40, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, elevation: 2,
  },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', color: '#1e293b', marginTop: 12 },
  emptyText: { fontSize: 13, color: '#64748b', textAlign: 'center', marginTop: 6 },
  orderCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12,
    borderLeftWidth: 4, borderLeftColor: '#f59e0b',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, elevation: 2,
  },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  orderName: { fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
  phoneRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  orderPhone: { fontSize: 12, color: '#64748b' },
  dateRow: { flexDirection: 'row', alignItems: 'center' },
  orderDate: { fontSize: 12, color: '#94a3b8' },
  detailsBox: { backgroundColor: '#fffbeb', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#fef3c7', marginBottom: 12 },
  detailsText: { color: '#92400e', fontSize: 14, lineHeight: 20 },
  actionRow: { flexDirection: 'row', gap: 10 },
  doneBtn: {
    flex: 1, backgroundColor: '#10b981', borderRadius: 8, padding: 10,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
  },
  doneBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  deleteBtn: {
    borderWidth: 1, borderColor: '#fee2e2', borderRadius: 8, padding: 10, justifyContent: 'center', alignItems: 'center',
  },
});
