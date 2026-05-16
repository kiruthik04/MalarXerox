import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, ActivityIndicator, RefreshControl
} from 'react-native';
import { Search, FileText, IndianRupee } from 'lucide-react-native';
import { api } from '../services/api';

export default function BillHistoryScreen() {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterText, setFilterText] = useState('');
  const [selectedBill, setSelectedBill] = useState(null);

  const load = async () => {
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
      ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setBills(unified);
    } catch (err) {
      console.error('Failed to load history', err);
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

  const filtered = bills.filter(b => {
    if (!filterText) return true;
    const s = filterText.toLowerCase();
    return (b.customerName?.toLowerCase() || '').includes(s) ||
      (b.phone?.toLowerCase() || '').includes(s) ||
      (b.displayId?.toString().toLowerCase() || '').includes(s);
  });

  const totalRevenue = filtered.reduce((sum, b) => sum + (b.grandTotal || 0), 0);

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total Revenue ({filtered.length} bills)</Text>
          <Text style={styles.summaryValue}>₹{totalRevenue.toFixed(2)}</Text>
        </View>

        {/* Search */}
        <View style={styles.searchRow}>
          <Search size={16} color="#94a3b8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Filter by name, phone, ID..."
            value={filterText}
            onChangeText={setFilterText}
          />
        </View>

        {/* Bill Detail Modal */}
        {selectedBill && (
          <View style={styles.detailCard}>
            <View style={styles.detailHeader}>
              <Text style={styles.detailTitle}>Bill #{selectedBill.displayId || selectedBill.id}</Text>
              <TouchableOpacity onPress={() => setSelectedBill(null)}>
                <Text style={styles.closeBtn}>✕ Close</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.detailName}>{selectedBill.customerName}</Text>
            <Text style={styles.detailMeta}>{selectedBill.phone} • {selectedBill.createdAt ? new Date(selectedBill.createdAt).toLocaleString() : ''}</Text>
            {!selectedBill.isQuickCash && (() => {
              try {
                const items = JSON.parse(selectedBill.itemsJson || '[]');
                return items.map((item, i) => (
                  <View key={i} style={styles.itemRow}>
                    <Text style={styles.itemName}>{item.serviceName || item.name}</Text>
                    <Text style={styles.itemPrice}>
                      {item.quantity > 1 ? `${item.quantity} × ₹${item.price} = ` : ''}₹{((item.quantity || 1) * (item.price || 0)).toFixed(2)}
                    </Text>
                  </View>
                ));
              } catch { return null; }
            })()}
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Grand Total</Text>
              <Text style={styles.totalValue}>₹{(selectedBill.grandTotal || 0).toFixed(2)}</Text>
            </View>
          </View>
        )}

        {/* Bill List */}
        {loading ? (
          <ActivityIndicator size="large" color="#155496" style={{ marginTop: 40 }} />
        ) : filtered.length === 0 ? (
          <Text style={styles.emptyText}>No bills found.</Text>
        ) : (
          filtered.map(b => (
            <TouchableOpacity key={b.id} style={styles.billCard} onPress={() => setSelectedBill(b)}>
              <View style={[styles.billIcon, { backgroundColor: b.isQuickCash ? '#fef3c7' : '#f0f7ff' }]}>
                {b.isQuickCash
                  ? <IndianRupee size={18} color="#f59e0b" />
                  : <FileText size={18} color="#155496" />}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.billName}>{b.customerName}</Text>
                <Text style={styles.billMeta}>
                  #{b.displayId || b.id} • {b.createdAt ? new Date(b.createdAt).toLocaleDateString() : ''}
                </Text>
              </View>
              <Text style={styles.billAmount}>₹{(b.grandTotal || 0).toFixed(2)}</Text>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 16, paddingBottom: 32 },
  summaryCard: {
    backgroundColor: '#f0f7ff', borderRadius: 16, padding: 16,
    marginBottom: 12, alignItems: 'center',
  },
  summaryLabel: { fontSize: 13, color: '#64748b', fontWeight: '600' },
  summaryValue: { fontSize: 28, fontWeight: 'bold', color: '#155496', marginTop: 4 },
  searchRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    borderRadius: 12, paddingHorizontal: 12, marginBottom: 12,
    borderWidth: 1, borderColor: '#e2e8f0',
  },
  searchInput: { flex: 1, padding: 10, fontSize: 15, color: '#0f172a' },
  detailCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12,
    borderWidth: 2, borderColor: '#155496',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, elevation: 3,
  },
  detailHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  detailTitle: { fontSize: 16, fontWeight: 'bold', color: '#155496' },
  closeBtn: { color: '#94a3b8', fontSize: 13, fontWeight: '600' },
  detailName: { fontSize: 17, fontWeight: 'bold', color: '#1e293b' },
  detailMeta: { fontSize: 12, color: '#64748b', marginBottom: 12 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  itemName: { fontSize: 13, color: '#334155', flex: 1 },
  itemPrice: { fontSize: 13, color: '#1e293b', fontWeight: '600' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, paddingTop: 10, borderTopWidth: 2, borderTopColor: '#155496' },
  totalLabel: { fontSize: 15, fontWeight: 'bold', color: '#1e293b' },
  totalValue: { fontSize: 18, fontWeight: 'bold', color: '#155496' },
  billCard: {
    backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 8,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, elevation: 1,
  },
  billIcon: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  billName: { fontSize: 14, fontWeight: '600', color: '#1e293b' },
  billMeta: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  billAmount: { fontSize: 15, fontWeight: 'bold', color: '#155496' },
  emptyText: { textAlign: 'center', color: '#94a3b8', padding: 40 },
});
