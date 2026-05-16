import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { api } from '../services/api';
import { AuthContext } from '../context/AuthContext';
import * as SecureStore from 'expo-secure-store';
import { Wallet, TrendingUp, TrendingDown, Coins, LogOut, FileText, Users } from 'lucide-react-native';

export default function DashboardScreen({ navigation }) {
  const { auth, setAuth } = useContext(AuthContext);
  const [stats, setStats] = useState({});
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const data = await api.getDashboardData();
      setStats(data.stats || {});
    } catch (err) {
      console.error('Failed to load dashboard', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Logout', 
        style: 'destructive',
        onPress: async () => {
          await SecureStore.deleteItemAsync('malar_auth');
          setAuth({ token: null, username: null, role: null });
        }
      }
    ]);
  };

  const StatCard = ({ title, value, icon, color }) => (
    <View style={styles.statCard}>
      <View style={[styles.iconContainer, { backgroundColor: `${color}15` }]}>
        {icon}
      </View>
      <View style={styles.statTextContainer}>
        <Text style={styles.statTitle} numberOfLines={1} adjustsFontSizeToFit>{title}</Text>
        <Text style={[styles.statValue, { color }]} numberOfLines={1} adjustsFontSizeToFit>{value || '₹0.00'}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.welcomeSection}>
          <View>
            <Text style={styles.greeting}>Hello, {auth.username}</Text>
            <Text style={styles.subtitle}>Here's today's overview</Text>
          </View>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
            <LogOut size={20} color="#ef4444" />
          </TouchableOpacity>
        </View>

        <View style={styles.grid}>
          <StatCard 
            title="Opening Balance" 
            value={stats.openingBalance} 
            color="#6366f1" 
            icon={<Wallet size={24} color="#6366f1" />} 
          />
          <StatCard 
            title="Daily Income" 
            value={stats.dailyIncome} 
            color="#155496" 
            icon={<TrendingUp size={24} color="#155496" />} 
          />
          <StatCard 
            title="Daily Expenses" 
            value={stats.dailyExpenses} 
            color="#ef4444" 
            icon={<TrendingDown size={24} color="#ef4444" />} 
          />
          <StatCard 
            title="Cash in Hand" 
            value={stats.cashInHand} 
            color="#10b981" 
            icon={<Coins size={24} color="#10b981" />} 
          />
        </View>

        {stats.totalPendingDebt && stats.totalPendingDebt !== '₹0.00' && (
          <TouchableOpacity style={styles.alertCard} onPress={() => navigation.navigate('Debts')}>
            <Text style={styles.alertTitle}>⚠ Pending Debt Alert</Text>
            <Text style={styles.alertMessage}>You have {stats.totalPendingDebt} in unsettled customer debts. Tap to view →</Text>
          </TouchableOpacity>
        )}

        <View style={styles.actionsContainer}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionGrid}>
            <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('More', { screen: 'New Bill' })}>
              <FileText size={24} color="#155496" />
              <Text style={styles.actionText}>New Bill</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('More', { screen: 'Quick Cash' })}>
              <Coins size={24} color="#22c55e" />
              <Text style={styles.actionText}>Quick Cash</Text>
            </TouchableOpacity>
          </View>
          <View style={[styles.actionGrid, { marginTop: 10 }]}>
            <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('More', { screen: 'Reminders' })}>
              <FileText size={24} color="#f59e0b" />
              <Text style={styles.actionText}>Reminders</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContent: {
    padding: 16,
  },
  welcomeSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 2,
  },
  logoutBtn: {
    padding: 8,
    backgroundColor: '#fee2e2',
    borderRadius: 8,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
    marginBottom: 4,
  },
  iconContainer: {
    padding: 8,
    borderRadius: 12,
    marginRight: 8,
  },
  statTextContainer: {
    flex: 1,
  },
  statTitle: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
  },
  statValue: {
    fontSize: 15,
    fontWeight: 'bold',
    marginTop: 2,
  },
  alertCard: {
    marginTop: 20,
    backgroundColor: '#fff5f5',
    borderWidth: 1,
    borderColor: '#fee2e2',
    padding: 16,
    borderRadius: 12,
  },
  alertTitle: {
    color: '#b91c1c',
    fontWeight: 'bold',
    fontSize: 16,
  },
  alertMessage: {
    color: '#ef4444',
    marginTop: 4,
  },
  actionsContainer: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 12,
  },
  actionGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  actionBtn: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  actionText: {
    marginTop: 8,
    fontWeight: '600',
    color: '#334155',
  }
});
