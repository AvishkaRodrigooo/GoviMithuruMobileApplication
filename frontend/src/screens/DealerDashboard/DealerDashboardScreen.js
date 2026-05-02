import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, SafeAreaView, StatusBar,
  Switch, Modal, Image, Platform
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { auth, db, storage } from '../../firebase/firebaseConfig';

// ─── Constants ────────────────────────────────────────────────
const RICE_VARIETIES = ['Samba', 'Nadu', 'Basmati', 'Red Rice', 'Kekulu', 'Suwandel', 'Bg 300', 'At 306'];
const GRADES = ['A', 'B', 'C', 'ALL'];
const OTHER_CATEGORIES = ['Machines', 'Seeds', 'Fertilizer', 'Tools', 'Pest Control', 'Storage Equipment', 'Services'];
const GRADE_COLORS = { A: '#059669', B: '#d97706', C: '#dc2626', ALL: '#6366f1' };

// ─── Helpers ──────────────────────────────────────────────────
const today = () => new Date().toISOString().split('T')[0];
const futureDate = (days) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
};

export default function DealerDashboardScreen({ navigation }) {
  const [loading, setLoading] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [dealerData, setDealerData] = useState(null);
  const [activeTab, setActiveTab] = useState('orders'); // orders first!

  // ── Profile fields ───────────────────────────────────────────
  const [contactNumber, setContactNumber] = useState('');
  const [locationName, setLocationName] = useState('');
  const [markerCoords, setMarkerCoords] = useState(null);
  const [hasTransport, setHasTransport] = useState(false);
  const [transportCostPerKm, setTransportCostPerKm] = useState('');
  const [transportMinCharge, setTransportMinCharge] = useState('');
  const [gradesOffered, setGradesOffered] = useState(['A']);
  const [profileSaved, setProfileSaved] = useState(false);

  // ── Rice Deal form ───────────────────────────────────────────
  const [selectedVariety, setSelectedVariety] = useState(RICE_VARIETIES[0]);
  const [selectedGrade, setSelectedGrade] = useState('A');
  const [ricePrice, setRicePrice] = useState('');
  const [minQty, setMinQty] = useState('');
  const [maxQty, setMaxQty] = useState('');
  const [validUntil, setValidUntil] = useState(futureDate(30));

  // ── Other Item form ──────────────────────────────────────────
  const [itemName, setItemName] = useState('');
  const [itemPrice, setItemPrice] = useState('');
  const [itemUnit, setItemUnit] = useState('per piece');
  const [itemCategory, setItemCategory] = useState(OTHER_CATEGORIES[0]);
  const [itemDescription, setItemDescription] = useState('');
  const [itemPhotos, setItemPhotos] = useState([]);
  const [itemUploading, setItemUploading] = useState(false);

  // ── My Deals ─────────────────────────────────────────────────
  const [myDeals, setMyDeals] = useState([]);
  const [dealFilter, setDealFilter] = useState('all');

  // ── Farmer Orders ─────────────────────────────────────────────
  const [farmerOrders, setFarmerOrders] = useState([]);
  const [unreadOrderCount, setUnreadOrderCount] = useState(0);
  const [orderFilter, setOrderFilter] = useState('all'); // all | pending | accepted | rejected
  const [updatingOrderId, setUpdatingOrderId] = useState(null);

  // ── Stats ────────────────────────────────────────────────────
  const [stats, setStats] = useState({ totalDeals: 0, activeDeals: 0, completedDeals: 0 });

  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    fetchDealerProfile();
    fetchMyDeals();
    const unsub = subscribeToOrders();
    return () => unsub && unsub();
  }, []);

  const fetchDealerProfile = async () => {
    try {
      const uid = auth.currentUser?.uid;
      const doc = await db.collection('dealers').doc(uid).get();
      if (doc.exists) {
        const d = doc.data();
        setDealerData(d);
        if (d.contactNumber) setContactNumber(d.contactNumber);
        if (d.locationName) setLocationName(d.locationName);
        if (d.latitude && d.longitude) setMarkerCoords({ latitude: d.latitude, longitude: d.longitude });
        if (d.hasTransport !== undefined) setHasTransport(d.hasTransport);
        if (d.transportCostPerKm) setTransportCostPerKm(String(d.transportCostPerKm));
        if (d.transportMinCharge) setTransportMinCharge(String(d.transportMinCharge));
        if (d.gradesOffered) setGradesOffered(d.gradesOffered);
        setProfileSaved(true);
      } else {
        const userDoc = await db.collection('users').doc(uid).get();
        if (userDoc.exists) setDealerData(userDoc.data());
      }
    } catch (e) {
      console.error('fetchDealerProfile:', e);
    }
  };

  const fetchMyDeals = async () => {
    const uid = auth.currentUser?.uid;
    try {
      const snapshot = await db.collection('marketPrices').where('dealerId', '==', uid).get();
      const deals = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      deals.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
      setMyDeals(deals);
      const active = deals.filter(d => d.status === 'active').length;
      const completed = deals.filter(d => d.status === 'completed').length;
      setStats({ totalDeals: deals.length, activeDeals: active, completedDeals: completed });
    } catch (e) {
      console.error('fetchMyDeals:', e);
    }
  };

  // ── Real-time listener for farmer orders ─────────────────────
  const subscribeToOrders = () => {
    const uid = auth.currentUser?.uid;
    if (!uid) return null;
    try {
      return db.collection('farmerOrders')
        .where('dealerId', '==', uid)
        .orderBy('completedAt', 'desc')
        .onSnapshot(
          snapshot => {
            const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setFarmerOrders(orders);
            const unread = orders.filter(o => o.isNew === true).length;
            setUnreadOrderCount(unread);
            // Show alert notification if new order arrives
            if (unread > 0) {
              const newest = orders.find(o => o.isNew === true);
              if (newest) {
                Alert.alert(
                  '🔔 New Farmer Order!',
                  `${newest.farmerName || 'A farmer'} wants to sell ${newest.quantitySoldKg} kg of ${newest.riceVariety} (Grade ${newest.grade})\n\nTotal: Rs. ${newest.totalAmount?.toLocaleString()}`,
                  [
                    { text: 'View Orders', onPress: () => setActiveTab('orders') },
                    { text: 'Later', style: 'cancel' },
                  ]
                );
              }
            }
          },
          err => console.log('Order listener error (rules may be needed):', err.message)
        );
    } catch (e) {
      return null;
    }
  };

  // ── Mark order as read / acknowledge ─────────────────────────
  const acknowledgeOrder = async (orderId) => {
    try {
      await db.collection('farmerOrders').doc(orderId).update({ isNew: false });
    } catch (_) {}
  };

  // ── Update order status (accept / reject) ────────────────────
  const updateOrderStatus = async (orderId, newStatus) => {
    setUpdatingOrderId(orderId);
    try {
      await db.collection('farmerOrders').doc(orderId).update({
        status: newStatus,
        isNew: false,
        updatedAt: new Date().toISOString(),
      });
    } catch (e) {
      Alert.alert('Error', 'Could not update order status.');
    } finally {
      setUpdatingOrderId(null);
    }
  };

  // ─── Profile Save ─────────────────────────────────────────────
  const handleSaveProfile = async () => {
    if (!contactNumber || contactNumber.length < 9) {
      return Alert.alert('Contact Required', 'Enter a valid mobile number.');
    }
    if (!locationName.trim()) {
      return Alert.alert('Location Required', 'Enter your city or town name.');
    }
    if (!markerCoords) {
      return Alert.alert('Map Pin Required', 'Tap on the map to set your business location.');
    }
    if (gradesOffered.length === 0) {
      return Alert.alert('Grade Required', 'Select at least one grade you accept.');
    }

    setProfileSaving(true);
    try {
      const uid = auth.currentUser?.uid;
      const profile = {
        dealerId: uid,
        dealerName: dealerData?.fullName || dealerData?.name || 'Rice Dealer',
        contactNumber,
        locationName,
        latitude: markerCoords.latitude,
        longitude: markerCoords.longitude,
        hasTransport,
        transportCostPerKm: hasTransport ? parseFloat(transportCostPerKm) || 0 : 0,
        transportMinCharge: hasTransport ? parseFloat(transportMinCharge) || 0 : 0,
        gradesOffered,
        updatedAt: new Date().toISOString(),
      };
      await db.collection('dealers').doc(uid).set(profile, { merge: true });
      setProfileSaved(true);
      setDealerData(prev => ({ ...prev, ...profile }));
      Alert.alert('✅ Profile Saved', 'Your dealer profile is updated and visible to farmers.');
    } catch (e) {
      Alert.alert('Error', 'Could not save profile.');
    } finally {
      setProfileSaving(false);
    }
  };

  // ─── Toggle grade offered ─────────────────────────────────────
  const toggleGrade = (grade) => {
    if (grade === 'ALL') {
      setGradesOffered(['ALL']);
      return;
    }
    setGradesOffered(prev => {
      const without = prev.filter(g => g !== 'ALL');
      if (without.includes(grade)) {
        const next = without.filter(g => g !== grade);
        return next.length ? next : ['A'];
      }
      return [...without, grade];
    });
  };

  // ─── Rice Deal Publish ────────────────────────────────────────
  const handlePublishRiceDeal = async () => {
    if (!profileSaved) {
      return Alert.alert('Profile Needed', 'Please save your dealer profile first (Profile tab).');
    }
    if (!ricePrice || isNaN(ricePrice) || parseFloat(ricePrice) <= 0) {
      return Alert.alert('Invalid Price', 'Enter a valid price per kg.');
    }
    if (!minQty || isNaN(minQty)) {
      return Alert.alert('Minimum Qty', 'Enter minimum quantity in kg (e.g. 100).');
    }
    if (maxQty && parseFloat(maxQty) < parseFloat(minQty)) {
      return Alert.alert('Quantity Error', 'Maximum quantity must be greater than minimum.');
    }

    setLoading(true);
    try {
      const uid = auth.currentUser?.uid;
      const dealData = {
        dealerId: uid,
        dealerName: dealerData?.fullName || dealerData?.name || 'Rice Dealer',
        contactNumber,
        locationName,
        location: locationName,
        latitude: markerCoords?.latitude,
        longitude: markerCoords?.longitude,
        hasTransport,
        transportCostPerKm: hasTransport ? parseFloat(transportCostPerKm) || 0 : 0,
        transportMinCharge: hasTransport ? parseFloat(transportMinCharge) || 0 : 0,
        gradesOffered,
        variety: selectedVariety,
        grade: selectedGrade,
        price: parseFloat(ricePrice),
        pricePerKg: parseFloat(ricePrice),
        minQuantityKg: parseFloat(minQty),
        maxQuantityKg: maxQty ? parseFloat(maxQty) : null,
        filledQuantityKg: 0,
        validUntil,
        type: 'rice',
        status: 'active',
        updatedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };

      await db.collection('marketPrices').add(dealData);
      Alert.alert('✅ Deal Published!', `Your ${selectedVariety} Grade ${selectedGrade} deal is now live.`);
      setRicePrice('');
      setMinQty('');
      setMaxQty('');
      setValidUntil(futureDate(30));
      fetchMyDeals();
      setActiveTab('deals');
    } catch (e) {
      Alert.alert('Error', 'Could not publish deal.');
    } finally {
      setLoading(false);
    }
  };

  // ─── Pick Photo ───────────────────────────────────────────────
  const pickPhoto = async () => {
    if (itemPhotos.length >= 5) return Alert.alert('Limit', 'Maximum 5 photos per item.');
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return Alert.alert('Permission needed', 'Allow photo library access.');
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsMultipleSelection: false,
    });
    if (!result.canceled && result.assets?.[0]) {
      setItemPhotos(prev => [...prev, result.assets[0].uri]);
    }
  };

  const removePhoto = (index) => {
    setItemPhotos(prev => prev.filter((_, i) => i !== index));
  };

  // ─── Upload photos to Firebase Storage ───────────────────────
  const uploadPhotos = async (uid, dealId) => {
    const urls = [];
    for (const uri of itemPhotos) {
      const res = await fetch(uri);
      const blob = await res.blob();
      const ref = storage.ref(`dealerItems/${uid}/${dealId}/${Date.now()}.jpg`);
      await ref.put(blob);
      const url = await ref.getDownloadURL();
      urls.push(url);
    }
    return urls;
  };

  // ─── Post Other Item ──────────────────────────────────────────
  const handlePostOtherItem = async () => {
    if (!profileSaved) {
      return Alert.alert('Profile Needed', 'Save your dealer profile first.');
    }
    if (!itemName.trim()) return Alert.alert('Item Name', 'Enter the item name.');
    if (!itemPrice || isNaN(itemPrice)) return Alert.alert('Price', 'Enter a valid price.');

    setLoading(true);
    setItemUploading(true);
    try {
      const uid = auth.currentUser?.uid;
      const docRef = db.collection('marketPrices').doc();
      let photoUrls = [];
      if (itemPhotos.length > 0) {
        try {
          photoUrls = await uploadPhotos(uid, docRef.id);
        } catch (uploadErr) {
          console.warn('Photo upload failed, continuing without photos:', uploadErr);
        }
      }

      const itemData = {
        dealerId: uid,
        dealerName: dealerData?.fullName || dealerData?.name || 'Agro Dealer',
        contactNumber,
        locationName,
        location: locationName,
        latitude: markerCoords?.latitude,
        longitude: markerCoords?.longitude,
        title: itemName.trim(),
        price: parseFloat(itemPrice),
        unit: itemUnit,
        category: itemCategory,
        description: itemDescription.trim(),
        photos: photoUrls,
        type: 'other',
        status: 'active',
        inStock: true,
        updatedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };

      await docRef.set(itemData);
      Alert.alert('✅ Item Posted!', `${itemName} is now listed in the marketplace.`);
      setItemName('');
      setItemPrice('');
      setItemDescription('');
      setItemPhotos([]);
      setItemUnit('per piece');
      fetchMyDeals();
      setActiveTab('deals');
    } catch (e) {
      Alert.alert('Error', 'Could not post item.');
    } finally {
      setLoading(false);
      setItemUploading(false);
    }
  };

  // ─── Toggle Deal Status ───────────────────────────────────────
  const toggleDealStatus = async (deal) => {
    const newStatus = deal.status === 'active' ? 'paused' : 'active';
    try {
      await db.collection('marketPrices').doc(deal.id).update({ status: newStatus });
      setMyDeals(prev => prev.map(d => d.id === deal.id ? { ...d, status: newStatus } : d));
    } catch (e) {
      Alert.alert('Error', 'Could not update deal status.');
    }
  };

  // ─── Delete Deal ──────────────────────────────────────────────
  const handleDeleteDeal = (id) => {
    Alert.alert('Remove Posting', 'This will hide your offer from farmers permanently.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove', style: 'destructive',
        onPress: async () => {
          try {
            await db.collection('marketPrices').doc(id).delete();
            fetchMyDeals();
          } catch (e) {
            Alert.alert('Error', 'Could not delete posting.');
          }
        }
      }
    ]);
  };

  // ─── Filtered deals for My Deals tab ─────────────────────────
  const filteredDeals = myDeals.filter(d => {
    if (dealFilter === 'all') return true;
    if (dealFilter === 'rice') return d.type === 'rice';
    if (dealFilter === 'other') return d.type === 'other';
    if (dealFilter === 'active') return d.status === 'active';
    if (dealFilter === 'paused') return d.status === 'paused';
    return true;
  });

  const handleLogout = async () => {
    await auth.signOut();
    navigation.replace('SignIn');
  };

  // ─────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={s.root}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <LinearGradient colors={['#064e3b', '#022c22']} style={s.header}>
        <View style={s.headerTop}>
          <View>
            <Text style={s.welcome}>DEALER MANAGEMENT</Text>
            <Text style={s.dealerNameText}>{dealerData?.fullName || dealerData?.name || 'Rice Dealer'}</Text>
          </View>
          <View style={s.headerRight}>
            {profileSaved && (
              <View style={s.profileBadge}>
                <MaterialCommunityIcons name="check-circle" size={12} color="#34d399" />
                <Text style={s.profileBadgeText}>Profile Live</Text>
              </View>
            )}
            <TouchableOpacity style={s.logoutBtn} onPress={handleLogout}>
              <MaterialCommunityIcons name="logout" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats Row */}
        <View style={s.statsRow}>
          <View style={s.statChip}>
            <Text style={s.statNum}>{stats.totalDeals}</Text>
            <Text style={s.statLbl}>Total</Text>
          </View>
          <View style={s.statChip}>
            <Text style={[s.statNum, { color: '#34d399' }]}>{stats.activeDeals}</Text>
            <Text style={s.statLbl}>Active</Text>
          </View>
          <View style={s.statChip}>
            <Text style={[s.statNum, { color: '#94a3b8' }]}>{stats.completedDeals}</Text>
            <Text style={s.statLbl}>Completed</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Tabs */}
      <View style={s.tabBar}>
        {[
          { key: 'orders', icon: 'bell-ring', label: 'Orders' },
          { key: 'rice',    icon: 'rice',             label: 'Rice' },
          { key: 'other',   icon: 'package-variant',  label: 'Items' },
          { key: 'deals',   icon: 'clipboard-list',   label: 'My Deals' },
          { key: 'profile', icon: 'account-cog',      label: 'Profile' },
        ].map(t => (
          <TouchableOpacity
            key={t.key}
            onPress={() => setActiveTab(t.key)}
            style={[s.tabItem, activeTab === t.key && s.tabItemActive]}
          >
            <View style={{ position: 'relative' }}>
              <MaterialCommunityIcons
                name={t.icon}
                size={18}
                color={activeTab === t.key ? '#fff' : '#64748b'}
              />
              {t.key === 'orders' && unreadOrderCount > 0 && (
                <View style={s.tabBadge}>
                  <Text style={s.tabBadgeText}>{unreadOrderCount}</Text>
                </View>
              )}
            </View>
            <Text style={[s.tabText, activeTab === t.key && s.tabTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">

        {/* ══ ORDERS TAB – FARMER ORDERS ════════════════════════ */}
        {activeTab === 'orders' && (
          <>
            {/* Order filter bar */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.filterScroll}>
              {[
                { key: 'all',      label: 'All Orders' },
                { key: 'pending',  label: '⏳  Pending' },
                { key: 'accepted', label: '✅  Accepted' },
                { key: 'rejected', label: '❌  Rejected' },
              ].map(f => (
                <TouchableOpacity
                  key={f.key}
                  style={[s.filterPill, orderFilter === f.key && s.filterPillActive]}
                  onPress={() => setOrderFilter(f.key)}
                >
                  <Text style={[s.filterPillText, orderFilter === f.key && s.filterPillTextActive]}>
                    {f.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {farmerOrders.filter(o => orderFilter === 'all' || o.status === orderFilter).length === 0 ? (
              <View style={s.emptyDeals}>
                <MaterialCommunityIcons name="inbox-outline" size={56} color="#cbd5e1" />
                <Text style={s.emptyTitle}>No farmer orders yet</Text>
                <Text style={s.emptyText}>
                  When a farmer completes a deal with you, it will appear here with a notification.
                </Text>
              </View>
            ) : (
              farmerOrders
                .filter(o => orderFilter === 'all' || o.status === orderFilter)
                .map(order => {
                  const isUpdating = updatingOrderId === order.id;
                  return (
                    <View
                      key={order.id}
                      style={[s.orderCard, order.isNew && s.orderCardNew]}
                    >
                      {/* NEW badge */}
                      {order.isNew && (
                        <View style={s.newOrderBadge}>
                          <MaterialCommunityIcons name="bell-ring" size={11} color="#fff" />
                          <Text style={s.newOrderBadgeText}>NEW</Text>
                        </View>
                      )}

                      {/* Order header */}
                      <View style={s.orderHeader}>
                        <View style={s.orderAvatarBox}>
                          <MaterialCommunityIcons name="account-cowboy-hat" size={22} color="#059669" />
                        </View>
                        <View style={{ flex: 1, marginLeft: 10 }}>
                          <Text style={s.orderFarmerName}>{order.farmerName || 'Farmer'}</Text>
                          <Text style={s.orderMeta}>
                            {new Date(order.completedAt).toLocaleDateString('en-LK', {
                              day: 'numeric', month: 'short', year: 'numeric',
                              hour: '2-digit', minute: '2-digit',
                            })}
                          </Text>
                        </View>
                        {/* Status badge */}
                        <View style={[
                          s.orderStatusBadge,
                          order.status === 'accepted' ? s.statusAccepted :
                          order.status === 'rejected' ? s.statusRejected :
                          s.statusPending,
                        ]}>
                          <Text style={s.orderStatusText}>
                            {order.status === 'accepted' ? '✅ Accepted' :
                             order.status === 'rejected' ? '❌ Rejected' : '⏳ Pending'}
                          </Text>
                        </View>
                      </View>

                      {/* Deal details */}
                      <View style={s.orderDetails}>
                        <View style={s.orderDetailRow}>
                          <MaterialCommunityIcons name="rice" size={13} color="#059669" />
                          <Text style={s.orderDetailLabel}>Variety</Text>
                          <Text style={s.orderDetailValue}>{order.riceVariety} — Grade {order.grade}</Text>
                        </View>
                        <View style={s.orderDetailRow}>
                          <MaterialCommunityIcons name="weight-kilogram" size={13} color="#6366f1" />
                          <Text style={s.orderDetailLabel}>Quantity</Text>
                          <Text style={s.orderDetailValue}>{order.quantitySoldKg} kg</Text>
                        </View>
                        <View style={s.orderDetailRow}>
                          <MaterialCommunityIcons name="currency-inr" size={13} color="#d97706" />
                          <Text style={s.orderDetailLabel}>Price/kg</Text>
                          <Text style={s.orderDetailValue}>Rs. {order.pricePerKg}</Text>
                        </View>
                        {order.transportUsed && (
                          <View style={s.orderDetailRow}>
                            <MaterialCommunityIcons name="truck-delivery" size={13} color="#059669" />
                            <Text style={s.orderDetailLabel}>Transport</Text>
                            <Text style={s.orderDetailValue}>Rs. {order.transportCost?.toFixed(0)}</Text>
                          </View>
                        )}
                        <View style={[s.orderDetailRow, { borderTopWidth: 1, borderTopColor: '#e2e8f0', paddingTop: 10, marginTop: 4 }]}>
                          <MaterialCommunityIcons name="cash-multiple" size={14} color="#059669" />
                          <Text style={[s.orderDetailLabel, { fontWeight: '900', color: '#1e293b' }]}>TOTAL</Text>
                          <Text style={[s.orderDetailValue, { fontSize: 18, fontWeight: '900', color: '#059669' }]}>
                            Rs. {order.totalAmount?.toLocaleString()}
                          </Text>
                        </View>
                      </View>

                      {/* Action buttons for pending orders */}
                      {order.status === 'pending' && (
                        <View style={s.orderActions}>
                          <TouchableOpacity
                            style={s.rejectBtn}
                            onPress={() => updateOrderStatus(order.id, 'rejected')}
                            disabled={isUpdating}
                          >
                            {isUpdating
                              ? <ActivityIndicator size="small" color="#ef4444" />
                              : <>
                                <MaterialCommunityIcons name="close-circle" size={16} color="#ef4444" />
                                <Text style={s.rejectBtnText}>Decline</Text>
                              </>
                            }
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={s.acceptBtn}
                            onPress={() => {
                              acknowledgeOrder(order.id);
                              updateOrderStatus(order.id, 'accepted');
                            }}
                            disabled={isUpdating}
                          >
                            {isUpdating
                              ? <ActivityIndicator size="small" color="#fff" />
                              : <>
                                <MaterialCommunityIcons name="check-circle" size={16} color="#fff" />
                                <Text style={s.acceptBtnText}>Accept Order</Text>
                              </>
                            }
                          </TouchableOpacity>
                        </View>
                      )}
                      {order.status !== 'pending' && order.isNew && (
                        <TouchableOpacity
                          style={s.markReadBtn}
                          onPress={() => acknowledgeOrder(order.id)}
                        >
                          <Text style={s.markReadText}>Mark as Read</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  );
                })
            )}
          </>
        )}

        {/* ══ PROFILE TAB ════════════════════════════════════════ */}
        {activeTab === 'profile' && (
          <>
            <View style={s.sectionCard}>
              <Text style={s.cardTitle}>📞 Contact & Location</Text>
              <Text style={s.cardSub}>This information is shown to every farmer browsing your deals.</Text>

              <View style={s.field}>
                <Text style={s.label}>Public Contact Number *</Text>
                <View style={s.inputBox}>
                  <MaterialCommunityIcons name="phone" size={18} color="#64748b" />
                  <TextInput
                    style={s.input} placeholder="07X XXX XXXX"
                    keyboardType="phone-pad" value={contactNumber}
                    onChangeText={setContactNumber} placeholderTextColor="#94a3b8"
                  />
                </View>
              </View>

              <View style={s.field}>
                <Text style={s.label}>City / Town Name *</Text>
                <View style={s.inputBox}>
                  <MaterialCommunityIcons name="map-marker" size={18} color="#64748b" />
                  <TextInput
                    style={s.input} placeholder="e.g. Anuradhapura"
                    value={locationName} onChangeText={setLocationName}
                    placeholderTextColor="#94a3b8"
                  />
                </View>
              </View>

              <View style={s.field}>
                <Text style={s.label}>Business Location — Tap map to pin *</Text>
                <View style={s.mapContainer}>
                  <MapView
                    style={s.map}
                    initialRegion={{
                      latitude: markerCoords?.latitude || 7.8731,
                      longitude: markerCoords?.longitude || 80.7718,
                      latitudeDelta: 0.5, longitudeDelta: 0.5,
                    }}
                    onPress={(e) => setMarkerCoords(e.nativeEvent.coordinate)}
                  >
                    {markerCoords && (
                      <Marker coordinate={markerCoords} title="My Business" pinColor="#059669" />
                    )}
                  </MapView>
                </View>
                {!markerCoords
                  ? <Text style={s.errorText}>⚠️ Tap map to pin your exact location</Text>
                  : <Text style={s.successText}>✅ Location pinned — {markerCoords.latitude.toFixed(4)}, {markerCoords.longitude.toFixed(4)}</Text>
                }
              </View>
            </View>

            {/* Grades Offered */}
            <View style={s.sectionCard}>
              <Text style={s.cardTitle}>🏷️ Grades You Accept</Text>
              <Text style={s.cardSub}>Farmers will filter by grade. Select all grades you buy.</Text>
              <View style={s.gradeRow}>
                {GRADES.map(g => {
                  const active = gradesOffered.includes(g);
                  return (
                    <TouchableOpacity
                      key={g}
                      style={[s.gradeChip, active && { backgroundColor: GRADE_COLORS[g], borderColor: GRADE_COLORS[g] }]}
                      onPress={() => toggleGrade(g)}
                    >
                      <Text style={[s.gradeChipText, active && { color: '#fff' }]}>Grade {g}</Text>
                      {active && <MaterialCommunityIcons name="check" size={14} color="#fff" style={{ marginLeft: 4 }} />}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Transport */}
            <View style={s.sectionCard}>
              <Text style={s.cardTitle}>🚛 Transport Service</Text>
              <View style={s.switchRow}>
                <View style={{ flex: 1 }}>
                  <Text style={s.switchLabel}>I provide transport to farmers</Text>
                  <Text style={s.switchSub}>Farmers can see estimated delivery cost to their farm</Text>
                </View>
                <Switch
                  value={hasTransport} onValueChange={setHasTransport}
                  trackColor={{ false: '#cbd5e1', true: '#34d399' }}
                  thumbColor={hasTransport ? '#059669' : '#f4f3f4'}
                />
              </View>

              {hasTransport && (
                <View style={s.transportGrid}>
                  <View style={[s.field, { flex: 1, marginRight: 8 }]}>
                    <Text style={s.label}>Cost per km (Rs.)</Text>
                    <View style={s.inputBox}>
                      <TextInput
                        style={s.input} placeholder="100" keyboardType="numeric"
                        value={transportCostPerKm} onChangeText={setTransportCostPerKm}
                        placeholderTextColor="#94a3b8"
                      />
                    </View>
                  </View>
                  <View style={[s.field, { flex: 1, marginLeft: 8 }]}>
                    <Text style={s.label}>Min charge (Rs.)</Text>
                    <View style={s.inputBox}>
                      <TextInput
                        style={s.input} placeholder="500" keyboardType="numeric"
                        value={transportMinCharge} onChangeText={setTransportMinCharge}
                        placeholderTextColor="#94a3b8"
                      />
                    </View>
                  </View>
                </View>
              )}
            </View>

            <TouchableOpacity style={s.primaryBtn} onPress={handleSaveProfile} disabled={profileSaving}>
              {profileSaving
                ? <ActivityIndicator color="#fff" />
                : <>
                  <MaterialCommunityIcons name="content-save-check" size={20} color="#fff" />
                  <Text style={s.primaryBtnText}>SAVE PROFILE & GO LIVE</Text>
                </>
              }
            </TouchableOpacity>
          </>
        )}

        {/* ══ RICE DEAL TAB ══════════════════════════════════════ */}
        {activeTab === 'rice' && (
          <>
            {!profileSaved && (
              <TouchableOpacity style={s.warningBanner} onPress={() => setActiveTab('profile')}>
                <MaterialCommunityIcons name="alert-circle" size={18} color="#d97706" />
                <Text style={s.warningText}>Complete your Profile first → Tap here</Text>
              </TouchableOpacity>
            )}

            <View style={s.sectionCard}>
              <Text style={s.cardTitle}>🌾 Post Paddy Buying Deal</Text>

              <View style={s.field}>
                <Text style={s.label}>Rice Variety</Text>
                <View style={s.chipGrid}>
                  {RICE_VARIETIES.map(v => (
                    <TouchableOpacity
                      key={v}
                      style={[s.chip, selectedVariety === v && s.activeChip]}
                      onPress={() => setSelectedVariety(v)}
                    >
                      <Text style={[s.chipText, selectedVariety === v && s.activeChipText]}>{v}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Grade — FIXED: was missing UI completely */}
              <View style={s.field}>
                <Text style={s.label}>Grade Required from Farmer</Text>
                <View style={s.gradeRow}>
                  {GRADES.map(g => {
                    const active = selectedGrade === g;
                    return (
                      <TouchableOpacity
                        key={g}
                        style={[s.gradeChip, active && { backgroundColor: GRADE_COLORS[g], borderColor: GRADE_COLORS[g] }]}
                        onPress={() => setSelectedGrade(g)}
                      >
                        <Text style={[s.gradeChipText, active && { color: '#fff' }]}>
                          {g === 'ALL' ? 'All Grades' : `Grade ${g}`}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <View style={s.field}>
                <Text style={s.label}>Buying Price — Rs. per KG</Text>
                <TextInput
                  style={s.bigPriceInput} placeholder="0.00" keyboardType="numeric"
                  value={ricePrice} onChangeText={setRicePrice} placeholderTextColor="#94a3b8"
                />
              </View>

              {/* Quantity range */}
              <View style={s.field}>
                <Text style={s.label}>Quantity Range (kg)</Text>
                <View style={s.qtyRow}>
                  <View style={[s.inputBox, { flex: 1, marginRight: 8 }]}>
                    <Text style={s.qtyPrefix}>Min</Text>
                    <TextInput
                      style={s.input} placeholder="100 kg" keyboardType="numeric"
                      value={minQty} onChangeText={setMinQty} placeholderTextColor="#94a3b8"
                    />
                  </View>
                  <View style={[s.inputBox, { flex: 1, marginLeft: 8 }]}>
                    <Text style={s.qtyPrefix}>Max</Text>
                    <TextInput
                      style={s.input} placeholder="5000 kg (opt.)" keyboardType="numeric"
                      value={maxQty} onChangeText={setMaxQty} placeholderTextColor="#94a3b8"
                    />
                  </View>
                </View>
              </View>

              {/* Valid until */}
              <View style={s.field}>
                <Text style={s.label}>Deal Valid Until (YYYY-MM-DD)</Text>
                <View style={s.inputBox}>
                  <MaterialCommunityIcons name="calendar" size={18} color="#64748b" />
                  <TextInput
                    style={s.input} placeholder="2026-05-01"
                    value={validUntil} onChangeText={setValidUntil}
                    placeholderTextColor="#94a3b8"
                  />
                </View>
                <Text style={s.hintText}>Deal auto-expires on this date. Default is 30 days from today.</Text>
              </View>

              {/* Preview card */}
              {ricePrice ? (
                <View style={s.previewCard}>
                  <Text style={s.previewTitle}>Preview — How farmers will see this deal</Text>
                  <View style={s.previewRow}>
                    <View>
                      <Text style={s.previewVariety}>{selectedVariety} — Grade {selectedGrade}</Text>
                      <Text style={s.previewQty}>{minQty || '—'} kg – {maxQty || '∞'} kg</Text>
                    </View>
                    <Text style={s.previewPrice}>Rs.{ricePrice}/kg</Text>
                  </View>
                  {hasTransport && (
                    <View style={s.previewTransportBadge}>
                      <MaterialCommunityIcons name="truck-delivery" size={12} color="#059669" />
                      <Text style={s.previewTransportText}>Transport available</Text>
                    </View>
                  )}
                </View>
              ) : null}

              <TouchableOpacity style={s.primaryBtn} onPress={handlePublishRiceDeal} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" />
                  : <>
                    <MaterialCommunityIcons name="storefront" size={20} color="#fff" />
                    <Text style={s.primaryBtnText}>PUBLISH RICE DEAL</Text>
                  </>
                }
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* ══ OTHER ITEMS TAB ════════════════════════════════════ */}
        {activeTab === 'other' && (
          <>
            {!profileSaved && (
              <TouchableOpacity style={s.warningBanner} onPress={() => setActiveTab('profile')}>
                <MaterialCommunityIcons name="alert-circle" size={18} color="#d97706" />
                <Text style={s.warningText}>Complete your Profile first → Tap here</Text>
              </TouchableOpacity>
            )}

            <View style={s.sectionCard}>
              <Text style={s.cardTitle}>📦 List Agricultural Item for Sale</Text>

              {/* Category */}
              <View style={s.field}>
                <Text style={s.label}>Category</Text>
                <View style={s.chipGrid}>
                  {OTHER_CATEGORIES.map(c => (
                    <TouchableOpacity
                      key={c}
                      style={[s.chip, itemCategory === c && s.activeChip]}
                      onPress={() => setItemCategory(c)}
                    >
                      <Text style={[s.chipText, itemCategory === c && s.activeChipText]}>{c}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Photos */}
              <View style={s.field}>
                <Text style={s.label}>Product Photos (up to 5)</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={s.photoRow}>
                    {itemPhotos.map((uri, idx) => (
                      <View key={idx} style={s.photoThumb}>
                        <Image source={{ uri }} style={s.thumbImg} />
                        <TouchableOpacity style={s.removePhotoBtn} onPress={() => removePhoto(idx)}>
                          <MaterialCommunityIcons name="close-circle" size={20} color="#ef4444" />
                        </TouchableOpacity>
                      </View>
                    ))}
                    {itemPhotos.length < 5 && (
                      <TouchableOpacity style={s.addPhotoBtn} onPress={pickPhoto}>
                        <MaterialCommunityIcons name="camera-plus" size={28} color="#94a3b8" />
                        <Text style={s.addPhotoText}>Add Photo</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </ScrollView>
              </View>

              <View style={s.field}>
                <Text style={s.label}>Item Name *</Text>
                <TextInput
                  style={s.textInput} placeholder="e.g. Exhaust Fan 12 inch"
                  value={itemName} onChangeText={setItemName} placeholderTextColor="#94a3b8"
                />
              </View>

              <View style={s.field}>
                <Text style={s.label}>Description</Text>
                <TextInput
                  style={[s.textInput, { height: 80, textAlignVertical: 'top' }]}
                  placeholder="Describe condition, brand, specifications..."
                  multiline value={itemDescription} onChangeText={setItemDescription}
                  placeholderTextColor="#94a3b8"
                />
              </View>

              <View style={s.qtyRow}>
                <View style={[s.field, { flex: 1.5, marginRight: 8 }]}>
                  <Text style={s.label}>Price (Rs.) *</Text>
                  <TextInput
                    style={s.bigPriceInput} placeholder="0.00" keyboardType="numeric"
                    value={itemPrice} onChangeText={setItemPrice} placeholderTextColor="#94a3b8"
                  />
                </View>
                <View style={[s.field, { flex: 1, marginLeft: 8 }]}>
                  <Text style={s.label}>Unit</Text>
                  <View style={s.chipGrid}>
                    {['per piece', 'per bag', 'per set', 'per kg'].map(u => (
                      <TouchableOpacity
                        key={u}
                        style={[s.chip, { marginBottom: 4 }, itemUnit === u && s.activeChip]}
                        onPress={() => setItemUnit(u)}
                      >
                        <Text style={[s.chipText, itemUnit === u && s.activeChipText]}>{u}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>

              <TouchableOpacity style={s.primaryBtn} onPress={handlePostOtherItem} disabled={loading || itemUploading}>
                {loading || itemUploading
                  ? <>
                    <ActivityIndicator color="#fff" />
                    <Text style={s.primaryBtnText}>{itemUploading ? 'Uploading photos...' : 'Posting...'}</Text>
                  </>
                  : <>
                    <MaterialCommunityIcons name="upload" size={20} color="#fff" />
                    <Text style={s.primaryBtnText}>POST ITEM FOR SALE</Text>
                  </>
                }
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* ══ MY DEALS TAB ═══════════════════════════════════════ */}
        {activeTab === 'deals' && (
          <>
            {/* Filter bar */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.filterScroll}>
              {[
                { key: 'all', label: 'All' },
                { key: 'active', label: '🟢 Active' },
                { key: 'paused', label: '⏸ Paused' },
                { key: 'rice', label: '🌾 Rice' },
                { key: 'other', label: '📦 Items' },
              ].map(f => (
                <TouchableOpacity
                  key={f.key}
                  style={[s.filterPill, dealFilter === f.key && s.filterPillActive]}
                  onPress={() => setDealFilter(f.key)}
                >
                  <Text style={[s.filterPillText, dealFilter === f.key && s.filterPillTextActive]}>
                    {f.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {filteredDeals.length === 0 ? (
              <View style={s.emptyDeals}>
                <MaterialCommunityIcons name="clipboard-text-outline" size={48} color="#94a3b8" />
                <Text style={s.emptyTitle}>No deals yet</Text>
                <Text style={s.emptyText}>Post a rice deal or item to appear in the market.</Text>
                <TouchableOpacity style={s.emptyBtn} onPress={() => setActiveTab('rice')}>
                  <Text style={s.emptyBtnText}>Post a Rice Deal</Text>
                </TouchableOpacity>
              </View>
            ) : (
              filteredDeals.map(deal => (
                <View key={deal.id} style={s.dealCard}>
                  {/* Type badge */}
                  <View style={[s.dealTypeBadge, deal.type === 'rice' ? s.riceBadge : s.otherBadge]}>
                    <MaterialCommunityIcons
                      name={deal.type === 'rice' ? 'rice' : 'package-variant'}
                      size={12} color="#fff"
                    />
                    <Text style={s.dealTypeBadgeText}>{deal.type === 'rice' ? 'RICE' : 'ITEM'}</Text>
                  </View>

                  <View style={{ flex: 1, marginRight: 12 }}>
                    <Text style={s.dealTitle}>
                      {deal.type === 'rice'
                        ? `${deal.variety} — Grade ${deal.grade}`
                        : deal.title}
                    </Text>
                    <Text style={s.dealPrice}>
                      Rs. {deal.price} {deal.type === 'rice' ? '/kg' : deal.unit ? `/ ${deal.unit}` : ''}
                    </Text>
                    {deal.type === 'rice' && deal.minQuantityKg && (
                      <Text style={s.dealMeta}>
                        {deal.minQuantityKg} kg – {deal.maxQuantityKg || '∞'} kg
                        {deal.filledQuantityKg ? ` · ${deal.filledQuantityKg} kg filled` : ''}
                      </Text>
                    )}
                    {deal.validUntil && (
                      <Text style={s.dealMeta}>Valid until {deal.validUntil}</Text>
                    )}
                  </View>

                  <View style={s.dealActions}>
                    {/* Status toggle */}
                    <TouchableOpacity
                      style={[s.statusToggle, deal.status === 'active' ? s.statusActive : s.statusPaused]}
                      onPress={() => toggleDealStatus(deal)}
                    >
                      <Text style={s.statusToggleText}>
                        {deal.status === 'active' ? 'LIVE' : 'PAUSED'}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={s.deleteBtn} onPress={() => handleDeleteDeal(deal.id)}>
                      <MaterialCommunityIcons name="delete-outline" size={22} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f1f5f9' },
  header: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 30, borderBottomLeftRadius: 32, borderBottomRightRadius: 32 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  headerRight: { alignItems: 'flex-end', gap: 8 },
  welcome: { color: '#34d399', fontSize: 11, fontWeight: '800', letterSpacing: 1.5 },
  dealerNameText: { color: '#fff', fontSize: 22, fontWeight: '800', marginTop: 4 },
  profileBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(52,211,153,0.15)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, gap: 4 },
  profileBadgeText: { color: '#34d399', fontSize: 10, fontWeight: '700' },
  logoutBtn: { backgroundColor: 'rgba(255,255,255,0.15)', padding: 10, borderRadius: 12 },
  statsRow: { flexDirection: 'row', gap: 12 },
  statChip: { flex: 1, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 14, padding: 12, alignItems: 'center' },
  statNum: { color: '#fff', fontSize: 20, fontWeight: '900' },
  statLbl: { color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: '700', marginTop: 2 },

  tabBar: { flexDirection: 'row', paddingHorizontal: 16, marginTop: -18, zIndex: 10, gap: 6 },
  tabItem: { flex: 1, backgroundColor: '#fff', paddingVertical: 10, alignItems: 'center', borderRadius: 14, elevation: 4, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, gap: 3 },
  tabItemActive: { backgroundColor: '#059669' },
  tabText: { color: '#64748b', fontSize: 10, fontWeight: '800' },
  tabTextActive: { color: '#fff' },

  content: { padding: 16, paddingTop: 24 },

  sectionCard: { backgroundColor: '#fff', borderRadius: 24, padding: 20, marginBottom: 16, elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10 },
  cardTitle: { color: '#1e293b', fontSize: 16, fontWeight: '800', marginBottom: 4 },
  cardSub: { color: '#94a3b8', fontSize: 12, marginBottom: 18 },

  field: { marginBottom: 18 },
  label: { color: '#475569', fontSize: 10, fontWeight: '800', letterSpacing: 0.8, marginBottom: 8, textTransform: 'uppercase' },
  hintText: { color: '#94a3b8', fontSize: 10, marginTop: 4 },
  errorText: { color: '#ef4444', fontSize: 11, fontWeight: '600', marginTop: 4 },
  successText: { color: '#059669', fontSize: 11, fontWeight: '600', marginTop: 4 },

  inputBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', borderRadius: 14, paddingHorizontal: 14, height: 50, borderWidth: 1, borderColor: '#e2e8f0' },
  input: { flex: 1, marginLeft: 8, color: '#1e293b', fontSize: 15, fontWeight: '600' },
  textInput: { backgroundColor: '#f8fafc', borderRadius: 14, padding: 14, fontSize: 15, fontWeight: '600', color: '#1e293b', borderWidth: 1, borderColor: '#e2e8f0' },
  bigPriceInput: { backgroundColor: '#f0fdf4', borderRadius: 14, padding: 16, fontSize: 26, fontWeight: '900', color: '#059669', textAlign: 'center' },

  mapContainer: { height: 200, borderRadius: 18, overflow: 'hidden', marginVertical: 8 },
  map: { flex: 1 },

  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  switchLabel: { color: '#1e293b', fontSize: 14, fontWeight: '700' },
  switchSub: { color: '#94a3b8', fontSize: 11, marginTop: 2 },
  transportGrid: { flexDirection: 'row', marginTop: 16 },

  gradeRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  gradeChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, borderWidth: 2, borderColor: '#e2e8f0', backgroundColor: '#f8fafc', flexDirection: 'row', alignItems: 'center' },
  gradeChipText: { color: '#475569', fontSize: 13, fontWeight: '700' },

  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: '#e2e8f0' },
  activeChip: { backgroundColor: '#059669', borderColor: '#059669' },
  chipText: { color: '#64748b', fontSize: 12, fontWeight: '700' },
  activeChipText: { color: '#fff' },

  qtyRow: { flexDirection: 'row' },
  qtyPrefix: { color: '#94a3b8', fontSize: 12, fontWeight: '700', marginRight: 4 },

  previewCard: { backgroundColor: '#f0fdf4', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#bbf7d0' },
  previewTitle: { color: '#064e3b', fontSize: 10, fontWeight: '800', letterSpacing: 0.5, marginBottom: 10 },
  previewRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  previewVariety: { color: '#1e293b', fontSize: 15, fontWeight: '800' },
  previewQty: { color: '#64748b', fontSize: 12, marginTop: 2 },
  previewPrice: { color: '#059669', fontSize: 22, fontWeight: '900' },
  previewTransportBadge: { flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 4 },
  previewTransportText: { color: '#059669', fontSize: 11, fontWeight: '700' },

  // Photos
  photoRow: { flexDirection: 'row', gap: 10, paddingVertical: 4 },
  photoThumb: { width: 80, height: 80, borderRadius: 12, overflow: 'visible', position: 'relative' },
  thumbImg: { width: 80, height: 80, borderRadius: 12 },
  removePhotoBtn: { position: 'absolute', top: -8, right: -8, backgroundColor: '#fff', borderRadius: 10 },
  addPhotoBtn: { width: 80, height: 80, borderRadius: 12, borderWidth: 2, borderColor: '#e2e8f0', borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' },
  addPhotoText: { color: '#94a3b8', fontSize: 10, fontWeight: '700', marginTop: 4 },

  primaryBtn: { backgroundColor: '#059669', paddingVertical: 18, borderRadius: 18, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 10, elevation: 4, shadowColor: '#059669', shadowOpacity: 0.3, shadowRadius: 8 },
  primaryBtnText: { color: '#fff', fontWeight: '900', fontSize: 14, letterSpacing: 1 },

  warningBanner: { backgroundColor: '#fffbeb', borderRadius: 14, padding: 14, marginBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: '#fde68a' },
  warningText: { color: '#d97706', fontSize: 13, fontWeight: '700', flex: 1 },

  filterScroll: { marginBottom: 12 },
  filterPill: { paddingHorizontal: 16, paddingVertical: 9, borderRadius: 20, backgroundColor: '#fff', marginRight: 8, borderWidth: 1, borderColor: '#e2e8f0' },
  filterPillActive: { backgroundColor: '#059669', borderColor: '#059669' },
  filterPillText: { color: '#64748b', fontSize: 12, fontWeight: '700' },
  filterPillTextActive: { color: '#fff' },

  dealCard: { backgroundColor: '#fff', borderRadius: 20, padding: 18, marginBottom: 12, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, flexDirection: 'row', alignItems: 'center' },
  dealTypeBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, flexDirection: 'row', alignItems: 'center', gap: 4, marginRight: 12, alignSelf: 'flex-start' },
  riceBadge: { backgroundColor: '#059669' },
  otherBadge: { backgroundColor: '#6366f1' },
  dealTypeBadgeText: { color: '#fff', fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },
  dealTitle: { color: '#1e293b', fontSize: 15, fontWeight: '700' },
  dealPrice: { color: '#059669', fontSize: 14, fontWeight: '800', marginTop: 3 },
  dealMeta: { color: '#94a3b8', fontSize: 11, marginTop: 2 },
  dealActions: { alignItems: 'center', gap: 8 },
  statusToggle: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  statusActive: { backgroundColor: '#f0fdf4' },
  statusPaused: { backgroundColor: '#fef9c3' },
  statusToggleText: { fontSize: 10, fontWeight: '900' },
  deleteBtn: { padding: 6 },

  emptyDeals: { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 24 },
  emptyTitle: { color: '#1e293b', fontSize: 18, fontWeight: '800', marginTop: 16 },
  emptyText: { color: '#94a3b8', fontSize: 13, textAlign: 'center', marginTop: 8 },
  emptyBtn: { marginTop: 20, backgroundColor: '#059669', paddingHorizontal: 24, paddingVertical: 14, borderRadius: 14 },
  emptyBtnText: { color: '#fff', fontWeight: '800', fontSize: 13 },

  // Tab notification badge
  tabBadge: { position: 'absolute', top: -5, right: -8, backgroundColor: '#ef4444', borderRadius: 8, minWidth: 16, height: 16, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 3 },
  tabBadgeText: { color: '#fff', fontSize: 9, fontWeight: '900' },

  // Order cards
  orderCard: { backgroundColor: '#fff', borderRadius: 22, padding: 18, marginBottom: 14, elevation: 3, shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 10, position: 'relative', overflow: 'hidden', borderWidth: 1, borderColor: '#e2e8f0' },
  orderCardNew: { borderColor: '#fbbf24', borderWidth: 2, shadowColor: '#f59e0b', shadowOpacity: 0.2 },
  newOrderBadge: { position: 'absolute', top: 14, right: 14, flexDirection: 'row', alignItems: 'center', backgroundColor: '#f59e0b', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, gap: 4 },
  newOrderBadgeText: { color: '#fff', fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },

  orderHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  orderAvatarBox: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#f0fdf4', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#bbf7d0' },
  orderFarmerName: { color: '#1e293b', fontSize: 15, fontWeight: '800' },
  orderMeta: { color: '#94a3b8', fontSize: 11, marginTop: 2 },

  orderStatusBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  statusPending: { backgroundColor: '#fffbeb' },
  statusAccepted: { backgroundColor: '#f0fdf4' },
  statusRejected: { backgroundColor: '#fef2f2' },
  orderStatusText: { fontSize: 11, fontWeight: '800' },

  orderDetails: { backgroundColor: '#f8fafc', borderRadius: 16, padding: 14, marginBottom: 14 },
  orderDetailRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  orderDetailLabel: { color: '#64748b', fontSize: 12, fontWeight: '700', width: 80 },
  orderDetailValue: { color: '#1e293b', fontSize: 13, fontWeight: '700', flex: 1, textAlign: 'right' },

  orderActions: { flexDirection: 'row', gap: 10 },
  rejectBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 13, borderRadius: 14, borderWidth: 2, borderColor: '#fecaca', backgroundColor: '#fef2f2', gap: 6 },
  rejectBtnText: { color: '#ef4444', fontSize: 13, fontWeight: '800' },
  acceptBtn: { flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 13, borderRadius: 14, backgroundColor: '#059669', gap: 6, elevation: 3, shadowColor: '#059669', shadowOpacity: 0.3, shadowRadius: 8 },
  acceptBtnText: { color: '#fff', fontSize: 13, fontWeight: '900' },
  markReadBtn: { alignSelf: 'center', paddingVertical: 8, paddingHorizontal: 16 },
  markReadText: { color: '#94a3b8', fontSize: 12, fontWeight: '700' },
});