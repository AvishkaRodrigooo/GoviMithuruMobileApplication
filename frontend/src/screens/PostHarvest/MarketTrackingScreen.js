import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, 
  ActivityIndicator, RefreshControl, Modal, Linking, Alert, Image
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { db } from '../../firebase/firebaseConfig';

const RICE_VARIETIES = [
  'All', 'Samba', 'Nadu', 'Basmati', 'Red Rice', 'Kekulu', 
  'Suwandel', 'Rathu Heenati', 'Madathawalu', 'BG 300', 'BG 352',
  'BG 250', 'BG 366', 'BG 379-2', 'AT 306', 'AT 362', 'H 4'
];

const DISTRICTS = [
  'All Districts', 'Colombo', 'Anuradhapura', 'Polonnaruwa', 
  'Kurunegala', 'Ampara', 'Batticaloa', 'Hambantota', 'Kandy',
  'Gampaha', 'Kalutara', 'Matara', 'Galle', 'Ratnapura'
];

// Helper function to get dealer initials
const getDealerInitials = (name) => {
  if (!name) return 'D';
  const words = name.split(' ');
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

// Helper function to get random color for avatar
const getAvatarColor = (name) => {
  const colors = [
    '#ef4444', '#f59e0b', '#10b981', '#3b82f6', 
    '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'
  ];
  const index = name ? name.charCodeAt(0) % colors.length : 0;
  return colors[index];
};

export default function MarketTrackingScreen({ navigation }) {
  const [selectedVariety, setSelectedVariety] = useState('All');
  const [district, setDistrict] = useState('All Districts');
  const [dealerPrices, setDealerPrices] = useState([]);
  const [marketReports, setMarketReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [showVarietyModal, setShowVarietyModal] = useState(false);
  const [showDistrictModal, setShowDistrictModal] = useState(false);

  // Fetch Market Reports from Firestore
  useEffect(() => {
    const unsubscribe = db
      .collection('marketReports')
      .orderBy('uploadedAt', 'desc')
      .limit(5)
      .onSnapshot(
        snapshot => {
          const reports = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
          }));
          setMarketReports(reports);
        },
        error => {
          console.error('Error fetching market reports:', error);
        }
      );

    return () => unsubscribe();
  }, []);

  // Fetch Real Dealer Prices from Firestore
  const fetchDealerPrices = useCallback(async () => {
    try {
      setLoading(true);

      let query = db.collection('currentRicePrices');

      // Filter by variety if not "All"
      if (selectedVariety !== 'All') {
        query = query.where('variety', '==', selectedVariety);
      }

      // Filter by district if not "All Districts"
      if (district !== 'All Districts') {
        query = query.where('location', '==', district);
      }

      // Order by price and limit
      query = query.orderBy('pricePerKg', 'desc').limit(50);

      const snapshot = await query.get();

      const prices = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          dealerId: doc.id,
          dealerName: data.dealerName || 'Unknown Dealer',
          dealerImage: data.dealerImage || null,
          variety: data.variety || 'N/A',
          location: data.location || 'N/A',
          pricePerKg: data.pricePerKg || 0,
          minQuantity: data.minQuantity || 0,
          maxQuantity: data.maxQuantity || 'Unlimited',
          phone: data.phone || null,
          email: data.email || null,
          availability: data.availability || 'In Stock',
          lastUpdated: data.lastUpdated || data.updatedAt || new Date(),
          qualityGrade: data.qualityGrade || 'A',
          description: data.description || '',
          verified: data.verified || false,
        };
      });

      setDealerPrices(prices);
      setLastUpdated(new Date());
      setLoading(false);
      setRefreshing(false);
    } catch (error) {
      console.error('Error fetching dealer prices:', error);
      Alert.alert('Error', 'Failed to fetch dealer prices. Please try again.');
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedVariety, district]);

  useEffect(() => {
    fetchDealerPrices();
  }, [fetchDealerPrices]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDealerPrices();
  };

  const openPDF = (url) => {
    if (url) {
      Linking.openURL(url).catch(err => {
        console.error('Failed to open PDF:', err);
        Alert.alert('Error', 'Could not open the PDF file.');
      });
    }
  };

  const handleCallDealer = (phone) => {
    if (phone) {
      Linking.openURL(`tel:${phone}`).catch(err => {
        console.error('Failed to make call:', err);
        Alert.alert('Error', 'Could not initiate phone call.');
      });
    } else {
      Alert.alert('No Phone', 'Phone number not available for this dealer.');
    }
  };

  const handleEmailDealer = (email) => {
    if (email) {
      Linking.openURL(`mailto:${email}`).catch(err => {
        console.error('Failed to open email:', err);
        Alert.alert('Error', 'Could not open email client.');
      });
    } else {
      Alert.alert('No Email', 'Email not available for this dealer.');
    }
  };

  const stats = {
    avgPrice: dealerPrices.length > 0 
      ? Math.round(dealerPrices.reduce((sum, item) => sum + item.pricePerKg, 0) / dealerPrices.length)
      : 0,
    highestPrice: dealerPrices.length > 0 
      ? Math.max(...dealerPrices.map(item => item.pricePerKg))
      : 0,
    lowestPrice: dealerPrices.length > 0 
      ? Math.min(...dealerPrices.map(item => item.pricePerKg))
      : 0,
    totalDealers: dealerPrices.length
  };

  const DealerCard = ({ dealer }) => {
    const avatarColor = getAvatarColor(dealer.dealerName);
    const initials = getDealerInitials(dealer.dealerName);

    return (
      <View style={styles.dealerCard}>
        <View style={styles.dealerHeader}>
          {/* Dealer Avatar/Image */}
          <View style={styles.avatarContainer}>
            {dealer.dealerImage ? (
              <Image 
                source={{ uri: dealer.dealerImage }} 
                style={styles.dealerImage}
              />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: avatarColor }]}>
                <Text style={styles.avatarInitials}>{initials}</Text>
              </View>
            )}
            {dealer.verified && (
              <View style={styles.verifiedBadge}>
                <MaterialCommunityIcons name="check-decagram" size={16} color="#22c55e" />
              </View>
            )}
          </View>

          {/* Dealer Info */}
          <View style={styles.dealerInfo}>
            <View style={styles.dealerNameRow}>
              <Text style={styles.dealerName}>{dealer.dealerName}</Text>
              {dealer.verified && (
                <MaterialCommunityIcons name="check-circle" size={16} color="#22c55e" />
              )}
            </View>
            <View style={styles.dealerMetaRow}>
              <MaterialCommunityIcons name="map-marker" size={14} color="#64748b" />
              <Text style={styles.dealerLocation}>{dealer.location}</Text>
            </View>
          </View>

          {/* Availability Badge */}
          <View style={styles.availabilityBadge}>
            <View style={[styles.availabilityDot, { 
              backgroundColor: dealer.availability === 'In Stock' ? '#22c55e' : '#f59e0b' 
            }]} />
            <Text style={styles.availabilityText}>{dealer.availability}</Text>
          </View>
        </View>

        <View style={styles.dealerBody}>
          {/* Variety Row */}
          <View style={styles.varietyRow}>
            <MaterialCommunityIcons name="rice" size={18} color="#16a34a" />
            <Text style={styles.varietyText}>{dealer.variety}</Text>
            <View style={styles.gradeBadge}>
              <MaterialCommunityIcons name="star" size={12} color="#f59e0b" />
              <Text style={styles.gradeText}>Grade {dealer.qualityGrade}</Text>
            </View>
          </View>

          {/* Price Section */}
          <View style={styles.priceSection}>
            <View style={styles.priceContainer}>
              <Text style={styles.priceLabel}>Price per KG</Text>
              <Text style={styles.priceValue}>Rs. {dealer.pricePerKg}</Text>
            </View>
            <View style={styles.quantityContainer}>
              <Text style={styles.quantityLabel}>Min Order</Text>
              <Text style={styles.quantityValue}>{dealer.minQuantity} KG</Text>
            </View>
          </View>

          {/* Description */}
          {dealer.description ? (
            <View style={styles.descriptionContainer}>
              <Text style={styles.descriptionText} numberOfLines={2}>
                {dealer.description}
              </Text>
            </View>
          ) : null}

          {/* Action Buttons */}
          <View style={styles.dealerActions}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => handleCallDealer(dealer.phone)}
            >
              <MaterialCommunityIcons name="phone" size={18} color="#fff" />
              <Text style={styles.actionButtonText}>Call</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionButton, styles.actionButtonSecondary]}
              onPress={() => handleEmailDealer(dealer.email)}
            >
              <MaterialCommunityIcons name="email" size={18} color="#16a34a" />
              <Text style={[styles.actionButtonText, { color: '#16a34a' }]}>Email</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.actionButton, styles.actionButtonSecondary]}
              onPress={() => {
                Alert.alert(
                  dealer.dealerName,
                  `📍 Location: ${dealer.location}\n🌾 Variety: ${dealer.variety}\n💰 Price: Rs. ${dealer.pricePerKg}/kg\n📦 Min Order: ${dealer.minQuantity}kg\n⭐ Grade: ${dealer.qualityGrade}\n📋 Status: ${dealer.availability}\n\n${dealer.description || 'No description available'}`
                );
              }}
            >
              <MaterialCommunityIcons name="information" size={18} color="#16a34a" />
              <Text style={[styles.actionButtonText, { color: '#16a34a' }]}>Info</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.dealerFooter}>
          <MaterialCommunityIcons name="clock-outline" size={12} color="#94a3b8" />
          <Text style={styles.footerUpdateTime}>
            Updated: {dealer.lastUpdated?.toDate ? 
              dealer.lastUpdated.toDate().toLocaleDateString() : 
              'Recently'}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#16a34a', '#15803d']} style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.title}>🌾 Rice Market</Text>
            <Text style={styles.subtitle}>Live Dealer Prices</Text>
          </View>
          <TouchableOpacity style={styles.refreshBtn} onPress={onRefresh}>
            <MaterialCommunityIcons name="reload" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.updateContainer}>
          <View style={styles.liveIndicator}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>REAL-TIME PRICES</Text>
          </View>
          <Text style={styles.headerUpdateTime}>
            {lastUpdated.toLocaleTimeString()}
          </Text>
        </View>

        <View style={styles.filterRow}>
          <TouchableOpacity 
            style={styles.filterBtn} 
            onPress={() => setShowDistrictModal(true)}
          >
            <MaterialCommunityIcons name="map-marker" size={18} color="#fff" />
            <Text style={styles.filterBtnText} numberOfLines={1}>{district}</Text>
            <MaterialCommunityIcons name="chevron-down" size={18} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.filterBtn} 
            onPress={() => setShowVarietyModal(true)}
          >
            <MaterialCommunityIcons name="rice" size={18} color="#fff" />
            <Text style={styles.filterBtnText} numberOfLines={1}>{selectedVariety}</Text>
            <MaterialCommunityIcons name="chevron-down" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#16a34a" />
          <Text style={styles.loadingText}>Loading dealer prices...</Text>
        </View>
      ) : (
        <ScrollView 
          showsVerticalScrollIndicator={false} 
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh} 
              tintColor="#16a34a"
            />
          }
        >
          {/* MARKET REPORTS SECTION */}
          {marketReports.length > 0 && (
            <View style={styles.reportsSection}>
              <View style={styles.sectionHeader}>
                <MaterialCommunityIcons name="file-document" size={24} color="#16a34a" />
                <Text style={styles.sectionTitle}>Official Reports</Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {marketReports.map(report => (
                  <TouchableOpacity
                    key={report.id}
                    style={styles.reportCard}
                    onPress={() => openPDF(report.downloadURL)}
                  >
                    <View style={styles.pdfIcon}>
                      <MaterialCommunityIcons name="file-pdf-box" size={32} color="#ef4444" />
                    </View>
                    <Text style={styles.reportTitle} numberOfLines={2}>
                      {report.title}
                    </Text>
                    <Text style={styles.reportDate}>
                      {report.uploadedAt?.toDate ? 
                        report.uploadedAt.toDate().toLocaleDateString() : 
                        'Recent'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* STATS */}
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <MaterialCommunityIcons name="chart-line" size={24} color="#16a34a" />
              <Text style={styles.statValue}>{stats.avgPrice}</Text>
              <Text style={styles.statLabel}>Avg Price</Text>
            </View>
            <View style={styles.statCard}>
              <MaterialCommunityIcons name="trending-up" size={24} color="#22c55e" />
              <Text style={styles.statValue}>{stats.highestPrice}</Text>
              <Text style={styles.statLabel}>Highest</Text>
            </View>
            <View style={styles.statCard}>
              <MaterialCommunityIcons name="trending-down" size={24} color="#ef4444" />
              <Text style={styles.statValue}>{stats.lowestPrice}</Text>
              <Text style={styles.statLabel}>Lowest</Text>
            </View>
            <View style={styles.statCard}>
              <MaterialCommunityIcons name="account-group" size={24} color="#3b82f6" />
              <Text style={styles.statValue}>{stats.totalDealers}</Text>
              <Text style={styles.statLabel}>Dealers</Text>
            </View>
          </View>

          {/* DEALERS LIST */}
          <View style={styles.dealersSection}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="account-multiple" size={24} color="#16a34a" />
              <Text style={styles.sectionTitle}>
                {stats.totalDealers} Dealers Found
              </Text>
            </View>

            {dealerPrices.length > 0 ? (
              dealerPrices.map(dealer => (
                <DealerCard key={dealer.id} dealer={dealer} />
              ))
            ) : (
              <View style={styles.emptyState}>
                <MaterialCommunityIcons name="account-off" size={60} color="#cbd5e1" />
                <Text style={styles.emptyTitle}>No Dealers Found</Text>
                <Text style={styles.emptyText}>
                  Try adjusting your filters or check back later
                </Text>
                <TouchableOpacity 
                  style={styles.resetButton}
                  onPress={() => {
                    setSelectedVariety('All');
                    setDistrict('All Districts');
                  }}
                >
                  <Text style={styles.resetButtonText}>Reset Filters</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ScrollView>
      )}

      {/* VARIETY MODAL */}
      <Modal 
        visible={showVarietyModal} 
        transparent 
        animationType="slide" 
        onRequestClose={() => setShowVarietyModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Rice Variety</Text>
              <TouchableOpacity onPress={() => setShowVarietyModal(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScroll}>
              {RICE_VARIETIES.map(v => (
                <TouchableOpacity 
                  key={v} 
                  style={[
                    styles.modalItem,
                    selectedVariety === v && styles.modalItemSelected
                  ]} 
                  onPress={() => { 
                    setSelectedVariety(v); 
                    setShowVarietyModal(false); 
                  }}
                >
                  <Text style={[
                    styles.modalItemText,
                    selectedVariety === v && styles.modalItemTextSelected
                  ]}>
                    {v}
                  </Text>
                  {selectedVariety === v && (
                    <MaterialCommunityIcons name="check" size={20} color="#16a34a" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* DISTRICT MODAL */}
      <Modal 
        visible={showDistrictModal} 
        transparent 
        animationType="slide" 
        onRequestClose={() => setShowDistrictModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select District</Text>
              <TouchableOpacity onPress={() => setShowDistrictModal(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScroll}>
              {DISTRICTS.map(d => (
                <TouchableOpacity 
                  key={d} 
                  style={[
                    styles.modalItem,
                    district === d && styles.modalItemSelected
                  ]} 
                  onPress={() => { 
                    setDistrict(d); 
                    setShowDistrictModal(false); 
                  }}
                >
                  <Text style={[
                    styles.modalItemText,
                    district === d && styles.modalItemTextSelected
                  ]}>
                    {d}
                  </Text>
                  {district === d && (
                    <MaterialCommunityIcons name="check" size={20} color="#16a34a" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },
  header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 24 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  subtitle: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  refreshBtn: { padding: 8, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 12 },
  updateContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  liveIndicator: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#22c55e', marginRight: 6 },
  liveText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  headerUpdateTime: { fontSize: 12, color: 'rgba(255,255,255,0.7)' },
  filterRow: { flexDirection: 'row', gap: 10 },
  filterBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.2)', paddingVertical: 12, paddingHorizontal: 12, borderRadius: 12, gap: 6 },
  filterBtnText: { color: '#fff', fontSize: 13, fontWeight: '600', flex: 1, textAlign: 'center' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  loadingText: { marginTop: 16, color: '#1e293b', fontSize: 16, fontWeight: '600' },
  scrollContent: { padding: 20, paddingBottom: 40 },
  
  // Reports Section
  reportsSection: { marginBottom: 20 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 8 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b' },
  reportCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginRight: 12, width: 160, elevation: 2 },
  pdfIcon: { width: 50, height: 50, backgroundColor: '#fef2f2', borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  reportTitle: { fontSize: 13, fontWeight: '700', color: '#0f172a', marginBottom: 6 },
  reportDate: { fontSize: 11, color: '#64748b' },
  
  // Stats
  statsContainer: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  statCard: { flex: 1, backgroundColor: '#fff', padding: 12, borderRadius: 16, alignItems: 'center', elevation: 2 },
  statValue: { fontSize: 18, fontWeight: 'bold', color: '#1e293b', marginTop: 6 },
  statLabel: { fontSize: 10, color: '#64748b', marginTop: 4, textAlign: 'center' },
  
  // Dealers Section
  dealersSection: { marginBottom: 20 },
  dealerCard: { backgroundColor: '#fff', borderRadius: 20, padding: 16, marginBottom: 16, elevation: 3 },
  dealerHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 12 },
  
  // Avatar Styles
  avatarContainer: { position: 'relative' },
  dealerImage: { 
    width: 56, 
    height: 56, 
    borderRadius: 28,
    borderWidth: 2,
    borderColor: '#f0fdf4',
  },
  avatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  avatarInitials: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 2,
  },
  
  // Dealer Info
  dealerInfo: { flex: 1 },
  dealerNameRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 6 
  },
  dealerName: { fontSize: 16, fontWeight: '800', color: '#1e293b' },
  dealerMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  dealerLocation: { fontSize: 12, color: '#64748b' },
  
  // Availability
  availabilityBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, gap: 4 },
  availabilityDot: { width: 6, height: 6, borderRadius: 3 },
  availabilityText: { fontSize: 10, fontWeight: '600', color: '#475569' },
  
  // Dealer Body
  dealerBody: { paddingTop: 12, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  varietyRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  varietyText: { fontSize: 14, fontWeight: '600', color: '#16a34a', flex: 1 },
  gradeBadge: { 
    flexDirection: 'row', 
    alignItems: 'center',
    backgroundColor: '#fef3c7', 
    paddingHorizontal: 8, 
    paddingVertical: 3, 
    borderRadius: 6,
    gap: 3,
  },
  gradeText: { fontSize: 10, fontWeight: '700', color: '#92400e' },
  
  // Price Section
  priceSection: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  priceContainer: { flex: 1, backgroundColor: '#f0fdf4', padding: 12, borderRadius: 12 },
  priceLabel: { fontSize: 11, color: '#64748b', marginBottom: 4 },
  priceValue: { fontSize: 20, fontWeight: '900', color: '#16a34a' },
  quantityContainer: { flex: 1, backgroundColor: '#f8fafc', padding: 12, borderRadius: 12 },
  quantityLabel: { fontSize: 11, color: '#64748b', marginBottom: 4 },
  quantityValue: { fontSize: 16, fontWeight: '700', color: '#1e293b' },
  
  // Description
  descriptionContainer: { backgroundColor: '#f8fafc', padding: 10, borderRadius: 10, marginBottom: 12 },
  descriptionText: { fontSize: 12, color: '#475569', lineHeight: 18 },
  
  // Actions
  dealerActions: { flexDirection: 'row', gap: 8, marginTop: 8 },
  actionButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#16a34a', paddingVertical: 10, borderRadius: 10, gap: 6 },
  actionButtonSecondary: { backgroundColor: '#f0fdf4', borderWidth: 1, borderColor: '#16a34a' },
  actionButtonText: { fontSize: 13, fontWeight: '700', color: '#fff' },
  
  // Footer
  dealerFooter: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  footerUpdateTime: { fontSize: 11, color: '#94a3b8' },
  
  // Empty State
  emptyState: { alignItems: 'center', padding: 40, backgroundColor: '#fff', borderRadius: 20 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#1e293b', marginTop: 16 },
  emptyText: { fontSize: 14, color: '#64748b', textAlign: 'center', marginTop: 8 },
  resetButton: { backgroundColor: '#16a34a', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, marginTop: 20 },
  resetButtonText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  
  // Modals
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '80%', paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b' },
  modalScroll: { maxHeight: 400 },
  modalItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f8fafc' },
  modalItemSelected: { backgroundColor: '#f0fdf4' },
  modalItemText: { fontSize: 15, color: '#475569' },
  modalItemTextSelected: { color: '#16a34a', fontWeight: '600' },
});