import React, { useEffect, useState, useRef } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  ActivityIndicator, 
  TouchableOpacity, 
  RefreshControl,
  Linking,
  Platform,
  Alert
} from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import useUniversalLocation from "../../../utils/useUniversalLocation";
import { MaterialIcons, FontAwesome5, Ionicons, Entypo } from "@expo/vector-icons";

const AgricultureDepartmentScreen = () => {
  const {
    latitude,
    longitude,
    isLoading: locationLoading,
    error: locationError,
  } = useUniversalLocation("en");

  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [searchRadius, setSearchRadius] = useState(50); // Larger radius for departments
  const [selectedType, setSelectedType] = useState("all");
  
  // Sri Lanka Agriculture Department locations data
  const agricultureDepartments = [
    {
      id: '1',
      name: 'කෘෂිකර්ම දෙපාර්තමේන්තුව - කුරුණෑගල',
      type: 'District Office',
      category: 'Department',
      distance: 0,
      lat: 7.4865,
      lon: 80.3649,
      address: 'කුරුණෑගල, ශ්‍රී ලංකාව',
      phone: '037-2222681',
      email: 'kurunegala@agridept.gov.lk',
      services: ['ගොවි ලේඛන', 'උපදේශන', 'අනුමත කිරීම්'],
      hours: 'උදේ 8.30 - 4.30'
    },
    {
      id: '2',
      name: 'කෘෂිකර්ම දෙපාර්තමේන්තුව - රත්නපුර',
      type: 'District Office',
      category: 'Department',
      distance: 0,
      lat: 6.6828,
      lon: 80.4030,
      address: 'රත්නපුර, ශ්‍රී ලංකාව',
      phone: '045-2222682',
      email: 'ratnapura@agridept.gov.lk',
      services: ['පොල් වගාව', 'කොපි වගාව', 'උපදේශන'],
      hours: 'උදේ 8.30 - 4.30'
    },
    {
      id: '3',
      name: 'කෘෂිකර්ම දෙපාර්තමේන්තුව - අනුරාධපුර',
      type: 'District Office',
      category: 'Department',
      distance: 0,
      lat: 8.3114,
      lon: 80.4037,
      address: 'අනුරාධපුර, ශ්‍රී ලංකාව',
      phone: '025-2222683',
      email: 'anuradhapura@agridept.gov.lk',
      services: ['පළතුරු වගාව', 'සාරවත් බිම්', 'ජල පාලනය'],
      hours: 'උදේ 8.30 - 4.30'
    },
    {
      id: '4',
      name: 'කෘෂිකර්ම දෙපාර්තමේන්තුව - මහනුවර',
      type: 'District Office',
      category: 'Department',
      distance: 0,
      lat: 7.2906,
      lon: 80.6337,
      address: 'මහනුවර, ශ්‍රී ලංකාව',
      phone: '081-2222684',
      email: 'kandy@agridept.gov.lk',
      services: ['උසස් ගොවිතැන', 'ජලවිදුලිය', 'සකස් කිරීම'],
      hours: 'උදේ 8.30 - 4.30'
    },
    {
      id: '5',
      name: 'කෘෂිකර්ම දෙපාර්තමේන්තුව - ගම්පහ',
      type: 'District Office',
      category: 'Department',
      distance: 0,
      lat: 7.0917,
      lon: 79.9997,
      address: 'ගම්පහ, ශ්‍රී ලංකාව',
      phone: '033-2222685',
      email: 'gampaha@agridept.gov.lk',
      services: ['එළවලු වගාව', 'පළතුරු', 'රසායනික භාවිතය'],
      hours: 'උදේ 8.30 - 4.30'
    },
    {
      id: '6',
      name: 'කෘෂිකර්ම දෙපාර්තමේන්තුව - කොළඹ',
      type: 'Head Office',
      category: 'Department',
      distance: 0,
      lat: 6.9271,
      lon: 79.8612,
      address: 'කොළඹ 07, ශ්‍රී ලංකාව',
      phone: '011-2685588',
      email: 'info@agridept.gov.lk',
      services: ['ප්‍රතිපාදන', 'නියම', 'සංවර්ධන'],
      hours: 'උදේ 8.30 - 4.30'
    },
    {
      id: '7',
      name: 'කෘෂිකර්ම දෙපාර්තමේන්තුව - ගාල්ල',
      type: 'District Office',
      category: 'Department',
      distance: 0,
      lat: 6.0535,
      lon: 80.2210,
      address: 'ගාල්ල, ශ්‍රී ලංකාව',
      phone: '091-2222687',
      email: 'galle@agridept.gov.lk',
      services: ['කුළුබඩු', 'අර්තාපල්', 'බඩ ඉරිඟු'],
      hours: 'උදේ 8.30 - 4.30'
    },
    {
      id: '8',
      name: 'කෘෂිකර්ම දෙපාර්තමේන්තුව - මාතර',
      type: 'District Office',
      category: 'Department',
      distance: 0,
      lat: 5.9489,
      lon: 80.5351,
      address: 'මාතර, ශ්‍රී ලංකාව',
      phone: '041-2222688',
      email: 'matara@agridept.gov.lk',
      services: ['තේ වගාව', 'රබර්', 'විදේශ අපනයන'],
      hours: 'උදේ 8.30 - 4.30'
    },
    {
      id: '9',
      name: 'කෘෂිකර්ම පර්යේෂණ ආයතනය',
      type: 'Research Institute',
      category: 'Research',
      distance: 0,
      lat: 7.0292,
      lon: 80.1553,
      address: 'ගන්නොරුව, ශ්‍රී ලංකාව',
      phone: '011-2587365',
      email: 'research@agridept.gov.lk',
      services: ['පර්යේෂණ', 'පරීක්ෂණ', 'පුහුණුව'],
      hours: 'උදේ 8.00 - 4.00'
    },
    {
      id: '10',
      name: 'ගොවිජන සහය සේවා මධ්‍යස්ථානය - කුරුණෑගල',
      type: 'Extension Center',
      category: 'Extension',
      distance: 0,
      lat: 7.4845,
      lon: 80.3675,
      address: 'කුරුණෑගල නගරය, ශ්‍රී ලංකාව',
      phone: '037-2222690',
      email: 'extension@agridept.gov.lk',
      services: ['ගොවි පුහුණු', 'තාක්ෂණය', 'අලෙවිකරණය'],
      hours: 'උදේ 8.30 - 4.30'
    }
  ];

  const departmentTypes = [
    { id: "all", label: "සියල්ල" },
    { id: "District Office", label: "දිස්ත්‍රික් කාර්යාල" },
    { id: "Head Office", label: "මූලස්ථානය" },
    { id: "Research Institute", label: "පර්යේෂණ ආයතන" },
    { id: "Extension Center", label: "සහය මධ්‍යස්ථාන" }
  ];

  // Calculate distance
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return "N/A";
    
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    
    return distance.toFixed(1);
  };

  // Filter and calculate distances
  const getFilteredDepartments = () => {
    if (!latitude || !longitude) return agricultureDepartments;
    
    const filtered = agricultureDepartments.map(dept => ({
      ...dept,
      distance: calculateDistance(latitude, longitude, dept.lat, dept.lon)
    })).filter(dept => {
      // Filter by distance
      const distance = parseFloat(dept.distance);
      if (isNaN(distance)) return true;
      return distance <= searchRadius;
    }).filter(dept => {
      // Filter by type
      if (selectedType === "all") return true;
      return dept.type === selectedType;
    }).sort((a, b) => {
      // Sort by distance
      const distA = parseFloat(a.distance);
      const distB = parseFloat(b.distance);
      return distA - distB;
    });
    
    return filtered;
  };

  const loadDepartments = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const filteredDepts = getFilteredDepartments();
      setDepartments(filteredDepts);
      
      // Save to cache
      await AsyncStorage.setItem('deptCache', JSON.stringify({
        data: filteredDepts,
        timestamp: Date.now()
      }));
      
    } catch (err) {
      console.error("Error loading departments:", err);
      setError("දත්ත ලබා ගැනීමට නොහැකි විය");
      
      // Try to load from cache
      try {
        const cached = await AsyncStorage.getItem('deptCache');
        if (cached) {
          const { data } = JSON.parse(cached);
          setDepartments(data);
        }
      } catch (cacheErr) {
        console.error("Cache error:", cacheErr);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDepartments();
  };

  const openInMaps = (lat, lon, name) => {
    const url = Platform.select({
      ios: `maps://?q=${encodeURIComponent(name)}&ll=${lat},${lon}`,
      android: `geo:${lat},${lon}?q=${encodeURIComponent(name)}`,
      default: `https://maps.google.com/?q=${lat},${lon}`
    });
    
    Linking.openURL(url).catch(err => {
      const googleUrl = `https://maps.google.com/?q=${lat},${lon}&query=${encodeURIComponent(name)}`;
      Linking.openURL(googleUrl);
    });
  };

  const makePhoneCall = (phoneNumber) => {
    if (!phoneNumber) return;
    
    Alert.alert(
      "දුරකථන ඇමතුම",
      `${phoneNumber} අංකයට ඇමතීමට අවශ්‍යද?`,
      [
        { text: "අවලංගු කරන්න", style: "cancel" },
        { text: "ඇමතීම", onPress: () => Linking.openURL(`tel:${phoneNumber}`) }
      ]
    );
  };

  const openEmail = (email) => {
    if (!email) return;
    
    Linking.openURL(`mailto:${email}`).catch(() => {
      Alert.alert("දෝෂය", "ඊ-තැපැල් යෙදුම විවෘත කිරීමට නොහැකි විය");
    });
  };

  useEffect(() => {
    if (latitude && longitude) {
      loadDepartments();
    } else {
      // Load without location if available
      const departmentsWithoutDistance = agricultureDepartments.map(dept => ({
        ...dept,
        distance: "N/A"
      }));
      setDepartments(departmentsWithoutDistance);
    }
  }, [latitude, longitude, searchRadius, selectedType]);

  if (locationLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2d5016" />
        <Text style={styles.loadingText}>ස්ථානය හඳුනාගනිමින්...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <FontAwesome5 name="landmark" size={24} color="#2d5016" />
        <Text style={styles.headerTitle}>කෘෂිකර්ම දෙපාර්තමේන්තුව</Text>
        <Text style={styles.headerSubtitle}>ශ්‍රී ලංකාව</Text>
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        {/* Type Filter */}
        <View style={styles.filterContainer}>
          <Text style={styles.filterLabel}>මධ්‍යස්ථාන වර්ගය:</Text>
          <FlatList
            horizontal
            data={departmentTypes}
            keyExtractor={(item) => item.id}
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.typeBtn,
                  selectedType === item.id && styles.typeBtnActive
                ]}
                onPress={() => setSelectedType(item.id)}
              >
                <Text style={[
                  styles.typeBtnText,
                  selectedType === item.id && styles.typeBtnTextActive
                ]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            )}
            contentContainerStyle={styles.typeList}
          />
        </View>

        {/* Radius Control */}
        <View style={styles.radiusControl}>
          <Text style={styles.controlLabel}>සෙවුම් අරය:</Text>
          <View style={styles.radiusButtons}>
            {[25, 50, 100, 200].map(radius => (
              <TouchableOpacity
                key={radius}
                style={[
                  styles.radiusBtn,
                  searchRadius === radius && styles.radiusBtnActive
                ]}
                onPress={() => setSearchRadius(radius)}
              >
                <Text style={[
                  styles.radiusBtnText,
                  searchRadius === radius && styles.radiusBtnTextActive
                ]}>
                  {radius} km
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#2d5016" />
          <Text style={styles.loadingText}>මධ්‍යස්ථාන ලබා ගනිමින්...</Text>
        </View>
      ) : departments.length === 0 ? (
        <View style={styles.center}>
          <Entypo name="location" size={60} color="#9ca3af" />
          <Text style={styles.noResults}>මධ්‍යස්ථාන හමු නොවීය</Text>
          <Text style={styles.noResultsSub}>
            කරුණාකර සෙවුම් අරය වැඩි කරන්න
          </Text>
          
          <TouchableOpacity 
            style={styles.retryBtn}
            onPress={loadDepartments}
          >
            <MaterialIcons name="refresh" size={20} color="#fff" />
            <Text style={styles.retryBtnText}>නැවත උත්සාහ කරන්න</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={departments}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#2d5016"]}
              tintColor="#2d5016"
            />
          }
          ListHeaderComponent={
            <View style={styles.listHeader}>
              <Text style={styles.resultsCount}>
                සොයාගත් මධ්‍යස්ථාන: {departments.length}
              </Text>
              {latitude && longitude && (
                <Text style={styles.locationNote}>
                  ඔබගේ ස්ථානයෙන් දුර අනුව ලැයිස්තුගත කර ඇත
                </Text>
              )}
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.departmentCard}>
              <View style={styles.deptHeader}>
                <View style={styles.deptIcon}>
                  {item.type === "Head Office" ? (
                    <FontAwesome5 name="building" size={20} color="#2d5016" />
                  ) : item.type === "Research Institute" ? (
                    <FontAwesome5 name="flask" size={20} color="#2d5016" />
                  ) : (
                    <FontAwesome5 name="landmark" size={20} color="#2d5016" />
                  )}
                </View>
                <View style={styles.deptInfo}>
                  <Text style={styles.deptName}>{item.name}</Text>
                  <View style={styles.deptMeta}>
                    <Text style={styles.deptType}>{item.type}</Text>
                    {item.distance !== "N/A" && (
                      <Text style={styles.deptDistance}>• {item.distance} km</Text>
                    )}
                  </View>
                </View>
              </View>
              
              <View style={styles.deptDetails}>
                <View style={styles.detailRow}>
                  <MaterialIcons name="place" size={14} color="#6b7280" />
                  <Text style={styles.detailText}>{item.address}</Text>
                </View>
                
                {item.services && (
                  <View style={styles.servicesRow}>
                    <MaterialIcons name="list" size={14} color="#6b7280" />
                    <Text style={styles.servicesText}>
                      සේවා: {item.services.join(", ")}
                    </Text>
                  </View>
                )}
                
                {item.hours && (
                  <View style={styles.detailRow}>
                    <MaterialIcons name="access-time" size={14} color="#6b7280" />
                    <Text style={styles.detailText}>{item.hours}</Text>
                  </View>
                )}
                
                <View style={styles.actionRow}>
                  {item.phone && (
                    <TouchableOpacity 
                      style={styles.phoneBtn}
                      onPress={() => makePhoneCall(item.phone)}
                    >
                      <MaterialIcons name="phone" size={14} color="#fff" />
                      <Text style={styles.actionBtnText}>ඇමතුම</Text>
                    </TouchableOpacity>
                  )}
                  
                  {item.email && (
                    <TouchableOpacity 
                      style={styles.emailBtn}
                      onPress={() => openEmail(item.email)}
                    >
                      <MaterialIcons name="email" size={14} color="#fff" />
                      <Text style={styles.actionBtnText}>ඊ-තැපැල්</Text>
                    </TouchableOpacity>
                  )}
                  
                  <TouchableOpacity 
                    style={styles.directionsBtn}
                    onPress={() => openInMaps(item.lat, item.lon, item.name)}
                  >
                    <MaterialIcons name="directions" size={14} color="#fff" />
                    <Text style={styles.actionBtnText}>මාර්ගය</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
          ListFooterComponent={
            <View style={styles.footer}>
              <Text style={styles.footerNote}>
                * තොරතුරු: ශ්‍රී ලංකා කෘෂිකර්ම දෙපාර්තමේන්තුව
              </Text>
              <Text style={styles.footerTip}>
                💡 උපදෙස්: නිවසට සමීපම මධ්‍යස්ථානය සොයා ගෙන දුරකථන ඇමතුමකින් සේවා 
                වලංගු කර ගන්න. වැඩිදුර තොරතුරු: www.agridept.gov.lk
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa'
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    alignItems: 'center'
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#2d5016',
    marginTop: 10,
    textAlign: 'center'
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2
  },
  controls: {
    backgroundColor: '#fff',
    padding: 16,
    marginTop: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef'
  },
  filterContainer: {
    marginBottom: 16
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 10
  },
  typeList: {
    paddingBottom: 4
  },
  typeBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f3f4f6',
    marginRight: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb'
  },
  typeBtnActive: {
    backgroundColor: '#2d5016',
    borderColor: '#225015'
  },
  typeBtnText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500'
  },
  typeBtnTextActive: {
    color: '#fff'
  },
  radiusControl: {
    marginTop: 8
  },
  controlLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 10
  },
  radiusButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  radiusBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    marginHorizontal: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb'
  },
  radiusBtnActive: {
    backgroundColor: '#2d5016',
    borderColor: '#225015'
  },
  radiusBtnText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500'
  },
  radiusBtnTextActive: {
    color: '#fff'
  },
  loadingText: {
    fontSize: 16,
    color: '#4b5563',
    marginTop: 12,
    fontWeight: '500'
  },
  noResults: {
    fontSize: 20,
    color: '#4b5563',
    marginTop: 16,
    fontWeight: '600',
    textAlign: 'center'
  },
  noResultsSub: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 8,
    textAlign: 'center',
    marginBottom: 24
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2d5016',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8
  },
  retryBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  },
  listHeader: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef'
  },
  resultsCount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151'
  },
  locationNote: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4
  },
  departmentCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f1f5f9'
  },
  deptHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12
  },
  deptIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0fdf4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#dcfce7'
  },
  deptInfo: {
    flex: 1
  },
  deptName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4
  },
  deptMeta: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  deptType: {
    fontSize: 14,
    color: '#059669',
    fontWeight: '500'
  },
  deptDistance: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 8
  },
  deptDetails: {
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingTop: 12
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8
  },
  detailText: {
    fontSize: 14,
    color: '#4b5563',
    marginLeft: 8,
    flex: 1
  },
  servicesRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8
  },
  servicesText: {
    fontSize: 14,
    color: '#4b5563',
    marginLeft: 8,
    flex: 1,
    lineHeight: 20
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    gap: 8
  },
  phoneBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3b82f6',
    padding: 10,
    borderRadius: 6,
    gap: 6
  },
  emailBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10b981',
    padding: 10,
    borderRadius: 6,
    gap: 6
  },
  directionsBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2d5016',
    padding: 10,
    borderRadius: 6,
    gap: 6
  },
  actionBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600'
  },
  footer: {
    padding: 20,
    paddingTop: 30,
    alignItems: 'center'
  },
  footerNote: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
    marginBottom: 12
  },
  footerTip: {
    fontSize: 13,
    color: '#4b5563',
    textAlign: 'center',
    lineHeight: 18,
    backgroundColor: '#fef3c7',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fde68a'
  }
});

export default AgricultureDepartmentScreen;