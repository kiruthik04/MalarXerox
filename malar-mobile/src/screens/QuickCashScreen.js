import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, ScrollView
} from 'react-native';
import { IndianRupee, Plus } from 'lucide-react-native';
import { api } from '../services/api';

const QUICK_AMOUNTS = [2, 5, 10, 15, 20, 50, 100, 200, 500];

export default function QuickCashScreen() {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAdd = async () => {
    const parsed = parseFloat(amount);
    if (!amount || parsed <= 0) {
      Alert.alert('Invalid', 'Please enter a valid amount.');
      return;
    }
    setLoading(true);
    try {
      await api.addSmallIncome({ amount: parsed });
      setAmount('');
      Alert.alert('Success', '✅ Income entry added!');
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to add amount.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerCard}>
        <IndianRupee size={36} color="#155496" />
        <Text style={styles.headerTitle}>Quick Cash Entry</Text>
        <Text style={styles.headerSubtitle}>Record small amounts instantly without generating a bill</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Amount (₹)</Text>
        <TextInput
          style={styles.amountInput}
          placeholder="0.00"
          keyboardType="numeric"
          value={amount}
          onChangeText={setAmount}
          textAlign="center"
        />

        <Text style={styles.quickLabel}>Quick Select</Text>
        <View style={styles.quickGrid}>
          {QUICK_AMOUNTS.map(amt => (
            <TouchableOpacity
              key={amt}
              style={[styles.quickBtn, amount === amt.toString() && styles.quickBtnActive]}
              onPress={() => setAmount(amt.toString())}
            >
              <Text style={[styles.quickBtnText, amount === amt.toString() && styles.quickBtnTextActive]}>
                ₹{amt}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.addBtn, (!amount || loading) && styles.addBtnDisabled]}
          onPress={handleAdd}
          disabled={!amount || loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Plus size={20} color="#fff" />
              <Text style={styles.addBtnText}> Add Income</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <Text style={styles.footerNote}>Entry will reflect in the main Bill History.</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 16, paddingBottom: 40 },
  headerCard: {
    backgroundColor: '#f0f7ff', borderRadius: 16, padding: 24,
    alignItems: 'center', marginBottom: 16,
  },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#1e293b', marginTop: 10 },
  headerSubtitle: { fontSize: 13, color: '#64748b', marginTop: 4, textAlign: 'center' },
  card: {
    backgroundColor: '#fff', borderRadius: 16, padding: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 5, elevation: 2,
  },
  label: { fontSize: 14, fontWeight: '600', color: '#334155', marginBottom: 8 },
  amountInput: {
    borderWidth: 2, borderColor: '#155496', borderRadius: 12, padding: 16,
    fontSize: 32, fontWeight: 'bold', color: '#155496',
    backgroundColor: '#f0f7ff', marginBottom: 20, textAlign: 'center',
  },
  quickLabel: { fontSize: 13, fontWeight: '600', color: '#64748b', marginBottom: 10 },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 },
  quickBtn: {
    borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 8,
    paddingHorizontal: 14, paddingVertical: 8, backgroundColor: '#f8fafc',
  },
  quickBtnActive: { backgroundColor: '#155496', borderColor: '#155496' },
  quickBtnText: { fontSize: 14, fontWeight: '600', color: '#475569' },
  quickBtnTextActive: { color: '#fff' },
  addBtn: {
    backgroundColor: '#22c55e', borderRadius: 10, padding: 16,
    alignItems: 'center', flexDirection: 'row', justifyContent: 'center',
  },
  addBtnDisabled: { backgroundColor: '#86efac' },
  addBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 17 },
  footerNote: { textAlign: 'center', color: '#94a3b8', marginTop: 16, fontSize: 13 },
});
