import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, ActivityIndicator, RefreshControl
} from 'react-native';
import { TrendingUp, TrendingDown, Calendar } from 'lucide-react-native';
import { api } from '../services/api';

export default function DailyAccountingScreen() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const json = await api.getDashboardHistorical();
      setData(json);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to load.');
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

  const totals = data.reduce((acc, curr) => ({
    income: acc.income + (curr.income || 0),
    expense: acc.expense + (curr.expense || 0),
    profit: acc.profit + (curr.netProfit || 0),
  }), { income: 0, expense: 0, profit: 0 });

  if (loading) return <ActivityIndicator size="large" color="#155496" style={{ flex: 1, marginTop: 60 }} />;
  if (error) return <Text style={{ color: '#ef4444', padding: 20 }}>Error: {error}</Text>;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Summary Cards */}
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { borderTopColor: '#155496' }]}>
          <Text style={styles.statLabel}>Total Income</Text>
          <Text style={[styles.statValue, { color: '#155496' }]}>₹{totals.income.toFixed(2)}</Text>
        </View>
        <View style={[styles.statCard, { borderTopColor: '#ef4444' }]}>
          <Text style={styles.statLabel}>Total Expenses</Text>
          <Text style={[styles.statValue, { color: '#ef4444' }]}>₹{totals.expense.toFixed(2)}</Text>
        </View>
      </View>
      <View style={[styles.profitCard, { backgroundColor: totals.profit >= 0 ? '#f0fdf4' : '#fff5f5', borderColor: totals.profit >= 0 ? '#86efac' : '#fecaca' }]}>
        <Text style={styles.statLabel}>Net Profit / Loss</Text>
        <Text style={[styles.profitValue, { color: totals.profit >= 0 ? '#16a34a' : '#dc2626' }]}>
          ₹{totals.profit.toFixed(2)}
        </Text>
      </View>

      {/* Daily Rows */}
      <Text style={styles.sectionTitle}>Daily Breakdown</Text>
      {data.length === 0 ? (
        <Text style={styles.emptyText}>No accounting data available.</Text>
      ) : (
        data.map((day, idx) => (
          <View key={idx} style={styles.dayCard}>
            <View style={styles.dayHeader}>
              <View style={styles.dateRow}>
                <Calendar size={14} color="#94a3b8" />
                <Text style={styles.dateText}> {day.date ? new Date(day.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }) : '-'}</Text>
              </View>
              <View style={[styles.profitBadge, { backgroundColor: (day.netProfit || 0) >= 0 ? '#dcfce7' : '#fee2e2' }]}>
                <Text style={[styles.profitBadgeText, { color: (day.netProfit || 0) >= 0 ? '#16a34a' : '#dc2626' }]}>
                  {(day.netProfit || 0) >= 0 ? '+' : ''}₹{(day.netProfit || 0).toFixed(2)}
                </Text>
              </View>
            </View>
            <View style={styles.dayStats}>
              <View style={styles.dayStat}>
                <Text style={styles.dayStatLabel}>Opening</Text>
                <Text style={styles.dayStatValue}>₹{(day.openingBalance || 0).toFixed(2)}</Text>
              </View>
              <View style={styles.dayStat}>
                <TrendingUp size={12} color="#22c55e" />
                <Text style={[styles.dayStatValue, { color: '#16a34a' }]}>₹{(day.income || 0).toFixed(2)}</Text>
              </View>
              <View style={styles.dayStat}>
                <TrendingDown size={12} color="#ef4444" />
                <Text style={[styles.dayStatValue, { color: '#ef4444' }]}>₹{(day.expense || 0).toFixed(2)}</Text>
              </View>
              <View style={styles.dayStat}>
                <Text style={styles.dayStatLabel}>Cash</Text>
                <Text style={[styles.dayStatValue, { color: '#155496', fontWeight: 'bold' }]}>₹{(day.cashInHand || 0).toFixed(2)}</Text>
              </View>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 16, paddingBottom: 32 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  statCard: {
    flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 14,
    borderTopWidth: 3,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, elevation: 1,
  },
  statLabel: { fontSize: 12, color: '#64748b', fontWeight: '600', marginBottom: 4 },
  statValue: { fontSize: 18, fontWeight: 'bold' },
  profitCard: {
    borderRadius: 12, padding: 14, marginBottom: 16,
    borderWidth: 1, alignItems: 'center',
  },
  profitValue: { fontSize: 24, fontWeight: 'bold', marginTop: 2 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 },
  dayCard: {
    backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, elevation: 1,
  },
  dayHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  dateRow: { flexDirection: 'row', alignItems: 'center' },
  dateText: { fontSize: 14, fontWeight: '600', color: '#334155' },
  profitBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  profitBadgeText: { fontSize: 13, fontWeight: '700' },
  dayStats: { flexDirection: 'row', justifyContent: 'space-between' },
  dayStat: { alignItems: 'center', gap: 3 },
  dayStatLabel: { fontSize: 11, color: '#94a3b8', fontWeight: '600' },
  dayStatValue: { fontSize: 13, fontWeight: '600', color: '#1e293b' },
  emptyText: { textAlign: 'center', color: '#94a3b8', padding: 40 },
});
