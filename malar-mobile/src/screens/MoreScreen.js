import React, { useContext } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import {
  IndianRupee, Clock, BookOpen, PackageOpen,
  Users, TrendingUp, LogOut, ChevronRight, Truck, FileText
} from 'lucide-react-native';
import { AuthContext } from '../context/AuthContext';
import * as SecureStore from 'expo-secure-store';

const MenuItem = ({ icon, label, color, onPress }) => (
  <TouchableOpacity style={styles.menuItem} onPress={onPress}>
    <View style={[styles.menuIcon, { backgroundColor: `${color}18` }]}>
      {React.cloneElement(icon, { size: 22, color })}
    </View>
    <Text style={styles.menuLabel}>{label}</Text>
    <ChevronRight size={18} color="#cbd5e1" />
  </TouchableOpacity>
);

export default function MoreScreen({ navigation }) {
  const { auth, setAuth } = useContext(AuthContext);

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout', style: 'destructive',
        onPress: async () => {
          await SecureStore.deleteItemAsync('malar_auth');
          setAuth({ token: null, username: null, role: null });
        }
      }
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* User Card */}
      <View style={styles.userCard}>
        <View style={styles.userAvatar}>
          <Text style={styles.userAvatarText}>{(auth.username || 'U')[0].toUpperCase()}</Text>
        </View>
        <View>
          <Text style={styles.userName}>{auth.username}</Text>
          <View style={[styles.roleBadge, { backgroundColor: auth.role === 'ADMIN' ? '#fef9c3' : '#dcfce7' }]}>
            <Text style={[styles.roleText, { color: auth.role === 'ADMIN' ? '#854d0e' : '#166534' }]}>
              {auth.role}
            </Text>
          </View>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Features</Text>
        <View style={styles.menuCard}>
          <MenuItem icon={<FileText />} label="New Bill" color="#155496"
            onPress={() => navigation.navigate('New Bill')} />
          <MenuItem icon={<IndianRupee />} label="Quick Cash" color="#22c55e"
            onPress={() => navigation.navigate('Quick Cash')} />
          <MenuItem icon={<Clock />} label="Reminders" color="#f59e0b"
            onPress={() => navigation.navigate('Reminders')} />
          <MenuItem icon={<FileText />} label="Bill History" color="#8b5cf6"
            onPress={() => navigation.navigate('Bill History')} />
          <MenuItem icon={<TrendingUp />} label="Daily Accounting" color="#10b981"
            onPress={() => navigation.navigate('Daily Accounting')} />
        </View>
      </View>

      {/* Inventory & Management */}
      {auth.role === 'ADMIN' && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Management</Text>
          <View style={styles.menuCard}>
            <MenuItem icon={<PackageOpen />} label="Inventory" color="#6366f1"
              onPress={() => navigation.navigate('Inventory')} />
            <MenuItem icon={<Truck />} label="Suppliers" color="#0891b2"
              onPress={() => navigation.navigate('Suppliers')} />
            <MenuItem icon={<Users />} label="Employees" color="#ec4899"
              onPress={() => navigation.navigate('Employees')} />
          </View>
        </View>
      )}

      {/* Logout */}
      <View style={styles.section}>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <LogOut size={18} color="#ef4444" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 16, paddingBottom: 40 },
  userCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 20,
    flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 5, elevation: 2,
  },
  userAvatar: {
    width: 50, height: 50, borderRadius: 25,
    backgroundColor: '#155496', justifyContent: 'center', alignItems: 'center',
  },
  userAvatarText: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
  userName: { fontSize: 18, fontWeight: 'bold', color: '#1e293b' },
  roleBadge: { paddingHorizontal: 10, paddingVertical: 2, borderRadius: 20, marginTop: 4, alignSelf: 'flex-start' },
  roleText: { fontSize: 12, fontWeight: '700' },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8, paddingHorizontal: 4 },
  menuCard: {
    backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 5, elevation: 2,
  },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', padding: 16,
    borderBottomWidth: 1, borderBottomColor: '#f1f5f9',
  },
  menuIcon: { width: 38, height: 38, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  menuLabel: { flex: 1, fontSize: 15, fontWeight: '600', color: '#334155' },
  logoutBtn: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    borderWidth: 1, borderColor: '#fee2e2',
  },
  logoutText: { fontSize: 16, fontWeight: '700', color: '#ef4444' },
});
