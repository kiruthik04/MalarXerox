import React, { useState, useEffect, useContext, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView, Platform
} from 'react-native';
import { Plus, Trash2, FileText, Search, CheckCircle, X } from 'lucide-react-native';
import { api } from '../services/api';
import { AuthContext } from '../context/AuthContext';

export default function NewBillScreen({ navigation }) {
  const { auth } = useContext(AuthContext);
  const [services, setServices] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [billItems, setBillItems] = useState([]);
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(false);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [tab, setTab] = useState('services');
  const [billSaved, setBillSaved] = useState(null);

  // Selected item panel state
  const [selectedItem, setSelectedItem] = useState(null); // { name, defaultPrice, isManual }
  const [manualName, setManualName] = useState('');
  const [itemPrice, setItemPrice] = useState('');
  const [itemQty, setItemQty] = useState('1');
  const priceRef = useRef(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [dash, inv] = await Promise.all([
          api.getDashboardData(),
          api.getInventory(),
        ]);
        setServices(dash.serviceSales || []);
        setInventory(Array.isArray(inv) ? inv : []);
      } catch (err) {
        console.error('Failed to load catalog', err);
      } finally {
        setCatalogLoading(false);
      }
    };
    load();
  }, []);

  const openItemPanel = (name, defaultPrice, isManual = false) => {
    setSelectedItem({ name, defaultPrice, isManual });
    setManualName('');
    setItemPrice(defaultPrice > 0 ? defaultPrice.toString() : '');
    setItemQty('1');
    setTimeout(() => priceRef.current?.focus(), 100);
  };

  const closeItemPanel = () => {
    setSelectedItem(null);
    setManualName('');
    setItemPrice('');
    setItemQty('1');
  };

  const confirmAddItem = () => {
    const price = parseFloat(itemPrice);
    const qty = parseInt(itemQty) || 1;
    const itemName = selectedItem.isManual ? manualName : selectedItem.name;

    if (selectedItem.isManual && !manualName) {
      Alert.alert('Required', 'Please enter item name.');
      return;
    }
    if (!itemPrice || isNaN(price) || price <= 0) {
      Alert.alert('Invalid Price', 'Please enter a valid price greater than 0.');
      return;
    }

    const existing = billItems.findIndex(i => i.serviceName === itemName);
    if (existing >= 0) {
      const updated = [...billItems];
      updated[existing].quantity += qty;
      updated[existing].price = price;
      setBillItems(updated);
    } else {
      setBillItems(prev => [...prev, { serviceName: itemName, price, quantity: qty }]);
    }
    closeItemPanel();
  };

  const removeItem = (idx) => setBillItems(prev => prev.filter((_, i) => i !== idx));

  const changeQty = (idx, delta) => {
    const updated = [...billItems];
    updated[idx].quantity = Math.max(1, updated[idx].quantity + delta);
    setBillItems(updated);
  };

  const grandTotal = billItems.reduce((sum, i) => sum + i.price * i.quantity, 0);

  const saveBill = async () => {
    if (billItems.length === 0) {
      Alert.alert('Empty Bill', 'Please add at least one item to the bill.');
      return;
    }
    setLoading(true);
    try {
      const result = await api.saveBill({
        customerName: customerName || 'Walk-in Customer',
        phone: phone || '',
        items: billItems,
        grandTotal,
        status: 'PAID',
      });
      setBillSaved(result);
      setBillItems([]);
      setCustomerName('');
      setPhone('');
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to save bill.');
    } finally {
      setLoading(false);
    }
  };

  const filteredServices = services.filter(s =>
    s.serviceName?.toLowerCase().includes(searchText.toLowerCase())
  );
  const filteredInventory = inventory.filter(i =>
    i.itemName?.toLowerCase().includes(searchText.toLowerCase())
  );

  // ── Success Screen ──────────────────────────────────────────────────────────
  if (billSaved) {
    return (
      <View style={styles.successContainer}>
        <View style={styles.successCard}>
          <CheckCircle size={64} color="#22c55e" />
          <Text style={styles.successTitle}>Bill Saved!</Text>
          <Text style={styles.successId}>Bill #{billSaved.displayId || billSaved.id}</Text>
          <Text style={styles.successCustomer}>{billSaved.customerName}</Text>
          <Text style={styles.successAmount}>₹{(billSaved.grandTotal || grandTotal).toFixed(2)}</Text>
          <TouchableOpacity style={styles.newBillBtn} onPress={() => setBillSaved(null)}>
            <Plus size={18} color="#fff" />
            <Text style={styles.newBillBtnText}> New Bill</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.historyBtn} onPress={() => navigation.navigate('Bill History')}>
            <Text style={styles.historyBtnText}>View Bill History →</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── Main Screen ─────────────────────────────────────────────────────────────
  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

      {/* Customer Info */}
      <View style={styles.customerCard}>
        <TextInput style={styles.input} placeholder="Customer Name (optional)"
          value={customerName} onChangeText={setCustomerName} />
        <TextInput style={[styles.input, { marginBottom: 0 }]} placeholder="Phone (optional)"
          keyboardType="phone-pad" value={phone} onChangeText={setPhone} />
      </View>

      {/* Cart */}
      {billItems.length > 0 && (
        <View style={styles.cartCard}>
          {billItems.map((item, idx) => (
            <View key={idx} style={styles.cartRow}>
              <Text style={styles.cartName} numberOfLines={1}>{item.serviceName}</Text>
              <View style={styles.qtyRow}>
                <TouchableOpacity style={styles.qtyBtn} onPress={() => changeQty(idx, -1)}>
                  <Text style={styles.qtyBtnText}>−</Text>
                </TouchableOpacity>
                <Text style={styles.qty}>{item.quantity}</Text>
                <TouchableOpacity style={styles.qtyBtn} onPress={() => changeQty(idx, 1)}>
                  <Text style={styles.qtyBtnText}>+</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.cartPrice}>₹{(item.price * item.quantity).toFixed(2)}</Text>
              <TouchableOpacity onPress={() => removeItem(idx)}>
                <Trash2 size={16} color="#ef4444" />
              </TouchableOpacity>
            </View>
          ))}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Grand Total</Text>
            <Text style={styles.totalValue}>₹{grandTotal.toFixed(2)}</Text>
          </View>
          <TouchableOpacity style={styles.saveBtn} onPress={saveBill} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : (
              <><FileText size={18} color="#fff" /><Text style={styles.saveBtnText}> Save Bill</Text></>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Search + Tabs */}
      <View style={styles.searchRow}>
        <Search size={16} color="#94a3b8" />
        <TextInput style={styles.searchInput} placeholder="Search services or products..."
          value={searchText} onChangeText={setSearchText} />
      </View>
      <View style={styles.tabRow}>
        <TouchableOpacity style={[styles.tab, tab === 'services' && styles.tabActive]} onPress={() => setTab('services')}>
          <Text style={[styles.tabText, tab === 'services' && styles.tabTextActive]}>Services</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, tab === 'inventory' && styles.tabActive]} onPress={() => setTab('inventory')}>
          <Text style={[styles.tabText, tab === 'inventory' && styles.tabTextActive]}>Products</Text>
        </TouchableOpacity>
      </View>

      {/* Catalog List */}
      {catalogLoading ? (
        <ActivityIndicator size="large" color="#155496" style={{ marginTop: 30 }} />
      ) : (
        <ScrollView style={{ flex: 1 }}>
          <TouchableOpacity 
            style={[styles.catalogItem, { backgroundColor: '#f0fdf4', borderBottomColor: '#dcfce7' }]}
            onPress={() => openItemPanel('', 0, true)}
          >
            <View style={[styles.addIconBtn, { backgroundColor: '#22c55e' }]}>
              <Plus size={16} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.catalogName, { color: '#166534' }]}>Add Manual / Custom Item</Text>
              <Text style={styles.catalogSub}>Enter item name and price manually</Text>
            </View>
          </TouchableOpacity>

          {tab === 'services' && (
            filteredServices.length === 0
              ? <Text style={styles.emptyText}>No services found.</Text>
              : filteredServices.map((s, i) => (
                <TouchableOpacity key={i} style={styles.catalogItem}
                  onPress={() => openItemPanel(s.serviceName, s.price || 0)}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.catalogName}>{s.serviceName}</Text>
                    {s.category ? <Text style={styles.catalogSub}>{s.category}</Text> : null}
                  </View>
                  <Text style={styles.catalogSub}>{s.salesToday > 0 ? `${s.salesToday} today` : ''}</Text>
                  <View style={styles.addIconBtn}><Plus size={16} color="#155496" /></View>
                </TouchableOpacity>
              ))
          )}
          {tab === 'inventory' && (
            filteredInventory.length === 0
              ? <Text style={styles.emptyText}>No products found.</Text>
              : filteredInventory.map((item, i) => (
                <TouchableOpacity key={i} style={styles.catalogItem}
                  onPress={() => openItemPanel(item.itemName, item.unitPrice || 0)}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.catalogName}>{item.itemName}</Text>
                    <Text style={styles.catalogSub}>Stock: {item.stockQuantity}</Text>
                  </View>
                  <Text style={styles.catalogPrice}>₹{(item.unitPrice || 0).toFixed(2)}</Text>
                  <View style={styles.addIconBtn}><Plus size={16} color="#155496" /></View>
                </TouchableOpacity>
              ))
          )}
        </ScrollView>
      )}

      {/* ── Add Item Panel (slides up when item tapped) ── */}
      {selectedItem && (
        <View style={styles.panelOverlay}>
          <TouchableOpacity style={styles.panelBackdrop} onPress={closeItemPanel} />
          <View style={styles.panel}>
            <View style={styles.panelHeader}>
              <Text style={styles.panelTitle} numberOfLines={1}>
                {selectedItem.isManual ? 'Add Manual Item' : selectedItem.name}
              </Text>
              <TouchableOpacity onPress={closeItemPanel}><X size={20} color="#64748b" /></TouchableOpacity>
            </View>

            {selectedItem.isManual && (
              <>
                <Text style={styles.panelLabel}>Item Name <Text style={{ color: '#ef4444' }}>*</Text></Text>
                <TextInput
                  style={[styles.input, { marginBottom: 16 }]}
                  placeholder="e.g. Custom Binding"
                  value={manualName}
                  onChangeText={setManualName}
                />
              </>
            )}

            <Text style={styles.panelLabel}>Price (₹) <Text style={{ color: '#ef4444' }}>*</Text></Text>
            <TextInput
              ref={priceRef}
              style={styles.panelInput}
              placeholder="0"
              keyboardType="numeric"
              value={itemPrice}
              onChangeText={setItemPrice}
            />

            <Text style={styles.panelLabel}>Quantity</Text>
            <View style={styles.qtyRow}>
              <TouchableOpacity style={styles.qtyBtnLg} onPress={() => setItemQty(q => Math.max(1, parseInt(q || 1) - 1).toString())}>
                <Text style={styles.qtyBtnText}>−</Text>
              </TouchableOpacity>
              <TextInput
                style={styles.qtyInputLg}
                keyboardType="numeric"
                value={itemQty}
                onChangeText={setItemQty}
              />
              <TouchableOpacity style={styles.qtyBtnLg} onPress={() => setItemQty(q => (parseInt(q || 1) + 1).toString())}>
                <Text style={styles.qtyBtnText}>+</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.panelAddBtn} onPress={confirmAddItem}>
              <Plus size={18} color="#fff" />
              <Text style={styles.panelAddBtnText}> Add to Bill</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  customerCard: { backgroundColor: '#fff', padding: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  input: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, padding: 10, fontSize: 14, color: '#0f172a', marginBottom: 8, backgroundColor: '#f8fafc' },
  cartCard: { backgroundColor: '#fff', padding: 12, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  cartRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, gap: 8 },
  cartName: { flex: 1, fontSize: 13, color: '#334155', fontWeight: '600' },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  qtyBtn: { width: 26, height: 26, backgroundColor: '#f1f5f9', borderRadius: 6, justifyContent: 'center', alignItems: 'center' },
  qtyBtnText: { fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
  qty: { fontSize: 14, fontWeight: 'bold', color: '#1e293b', minWidth: 20, textAlign: 'center' },
  cartPrice: { fontSize: 14, fontWeight: 'bold', color: '#155496', minWidth: 60, textAlign: 'right' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 2, borderTopColor: '#155496', paddingTop: 8, marginTop: 6 },
  totalLabel: { fontSize: 15, fontWeight: 'bold', color: '#1e293b' },
  totalValue: { fontSize: 20, fontWeight: 'bold', color: '#155496' },
  saveBtn: { backgroundColor: '#155496', borderRadius: 10, padding: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 10 },
  saveBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  searchRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  searchInput: { flex: 1, padding: 10, fontSize: 14, color: '#0f172a' },
  tabRow: { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  tab: { flex: 1, padding: 12, alignItems: 'center' },
  tabActive: { borderBottomWidth: 3, borderBottomColor: '#155496' },
  tabText: { fontSize: 14, fontWeight: '600', color: '#94a3b8' },
  tabTextActive: { color: '#155496' },
  catalogItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 14, borderBottomWidth: 1, borderBottomColor: '#f8fafc', gap: 10 },
  catalogName: { fontSize: 14, fontWeight: '600', color: '#1e293b' },
  catalogSub: { fontSize: 11, color: '#94a3b8', marginTop: 2 },
  catalogPrice: { fontSize: 13, fontWeight: 'bold', color: '#64748b' },
  addIconBtn: { width: 32, height: 32, backgroundColor: '#f0f7ff', borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  emptyText: { textAlign: 'center', color: '#94a3b8', padding: 40 },
  // Panel overlay
  panelOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'flex-end' },
  panelBackdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.35)' },
  panel: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 36 },
  panelHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  panelTitle: { fontSize: 17, fontWeight: 'bold', color: '#1e293b', flex: 1, marginRight: 10 },
  panelLabel: { fontSize: 13, fontWeight: '600', color: '#334155', marginBottom: 6 },
  panelInput: {
    borderWidth: 2, borderColor: '#155496', borderRadius: 10, padding: 13,
    fontSize: 22, fontWeight: 'bold', color: '#155496', textAlign: 'center',
    backgroundColor: '#f0f7ff', marginBottom: 16,
  },
  qtyBtnLg: { width: 44, height: 44, backgroundColor: '#f1f5f9', borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  qtyInputLg: { flex: 1, textAlign: 'center', fontSize: 22, fontWeight: 'bold', color: '#1e293b', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, padding: 8 },
  panelSubtotal: { fontSize: 14, color: '#64748b', textAlign: 'center', marginTop: 10, fontWeight: '600' },
  panelAddBtn: { backgroundColor: '#155496', borderRadius: 12, padding: 14, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 14 },
  panelAddBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  // Success
  successContainer: { flex: 1, backgroundColor: '#f8fafc', justifyContent: 'center', padding: 24 },
  successCard: { backgroundColor: '#fff', borderRadius: 20, padding: 32, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, elevation: 5 },
  successTitle: { fontSize: 26, fontWeight: 'bold', color: '#1e293b', marginTop: 14 },
  successId: { fontSize: 14, color: '#94a3b8', marginTop: 4 },
  successCustomer: { fontSize: 18, fontWeight: '600', color: '#334155', marginTop: 8 },
  successAmount: { fontSize: 36, fontWeight: 'bold', color: '#155496', marginTop: 4 },
  newBillBtn: { backgroundColor: '#155496', borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'center', marginTop: 24, paddingHorizontal: 28 },
  newBillBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  historyBtn: { marginTop: 12, padding: 8 },
  historyBtnText: { color: '#64748b', fontSize: 14 },
});
