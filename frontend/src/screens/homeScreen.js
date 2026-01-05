import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  Pressable, 
  StyleSheet, 
  ScrollView, 
  Dimensions, 
  ActivityIndicator, 
  Linking, // To open the news in browser
  Image 
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

// We use a free "RSS to JSON" converter to read Google News
const GOOGLE_NEWS_RSS = "https://news.google.com/rss/search?q=sri+lanka+agriculture+rice+paddy&hl=en-LK&gl=LK&ceid=LK:en";
const API_URL = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(GOOGLE_NEWS_RSS)}`;

export default function HomeScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState('home');
  const [newsData, setNewsData] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- FETCH REAL NEWS FROM INTERNET ---
  useEffect(() => {
    fetchRealNews();
  }, []);

  const fetchRealNews = async () => {
    try {
      const response = await fetch(API_URL);
      const data = await response.json();
      
      if (data.items) {
        // Transform the data to match our UI
        const formattedNews = data.items.slice(0, 10).map((item, index) => ({
          id: index.toString(),
          title: item.title,
          time: item.pubDate,
          source: item.author || "Google News",
          link: item.link,
          // Assign tags based on keywords in the title
          tag: item.title.toLowerCase().includes('price') ? 'Price' : 
               item.title.toLowerCase().includes('weather') ? 'Weather' : 
               item.title.toLowerCase().includes('fertilizer') ? 'Subsidy' : 'General',
          tagColor: item.title.toLowerCase().includes('price') ? '#dc2626' : // Red
                    item.title.toLowerCase().includes('weather') ? '#2563eb' : // Blue
                    item.title.toLowerCase().includes('fertilizer') ? '#16a34a' : '#8b5cf6', // Green/Purple
          icon: item.title.toLowerCase().includes('price') ? 'cash-multiple' :
                item.title.toLowerCase().includes('weather') ? 'weather-pouring' :
                'newspaper-variant'
        }));
        setNewsData(formattedNews);
      }
    } catch (error) {
      console.error("Failed to fetch news:", error);
    } finally {
      setLoading(false);
    }
  };

  const openNewsLink = (url) => {
    if (url) {
      Linking.openURL(url).catch(err => console.error("Couldn't load page", err));
    }
  };

  const navTo = (screen, tab) => {
    setActiveTab(tab);
    navigation?.navigate(screen);
  };

  // Helper to make the date look nice
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours} hrs ago`;
    return `${Math.floor(diffInHours / 24)} days ago`;
  };

  return (
    <View style={styles.mainWrapper}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.logoSection}>
            <View style={styles.logoCircle}>
              <MaterialCommunityIcons name="sprout" size={28} color="#fff" />
            </View>
            <View>
              <Text style={styles.appName}>GoviMithuru</Text>
              <Text style={styles.appSubtitle}>Smart Farming Assistant</Text>
            </View>
          </View>
          <Pressable style={styles.profileBtn} onPress={() => navigation?.navigate('Profile')}>
            <MaterialCommunityIcons name="account-circle" size={36} color="#fff" />
          </Pressable>
        </View>

        <View style={styles.welcomeCard}>
          <Text style={styles.welcomeTitle}>Welcome Back, Farmer! 🌾</Text>
          <Text style={styles.welcomeText}>
            Your AI-powered platform for intelligent paddy cultivation
          </Text>
        </View>
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Quick Stats */}
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: '#10b981' }]}>
            <MaterialCommunityIcons name="sprout-outline" size={32} color="#fff" />
            <Text style={styles.statNumber}>2.5K</Text>
            <Text style={styles.statLabel}>Active Farms</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#3b82f6' }]}>
            <MaterialCommunityIcons name="chart-line" size={32} color="#fff" />
            <Text style={styles.statNumber}>98%</Text>
            <Text style={styles.statLabel}>Accuracy</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#f59e0b' }]}>
            <MaterialCommunityIcons name="shield-check" size={32} color="#fff" />
            <Text style={styles.statNumber}>15%</Text>
            <Text style={styles.statLabel}>Loss Reduced</Text>
          </View>
        </View>

        {/* AI Features */}
        <Text style={styles.sectionTitle}>AI-Powered Solutions</Text>
        <View style={styles.featuresGrid}>
          <Pressable style={[styles.featureCard, styles.featureLarge]} onPress={() => navTo('Pest', 'pest')}>
            <View style={[styles.featureIcon, { backgroundColor: '#fef3c7' }]}>
              <MaterialCommunityIcons name="bug" size={40} color="#f59e0b" />
            </View>
            <Text style={styles.featureTitle}>Pest Detection</Text>
            <Text style={styles.featureDesc}>Identify pests instantly</Text>
          </Pressable>
          <Pressable style={[styles.featureCard, styles.featureLarge]} onPress={() => navTo('weedsDashboard', 'weeds')}>
            <View style={[styles.featureIcon, { backgroundColor: '#d1fae5' }]}>
              <MaterialCommunityIcons name="leaf" size={40} color="#10b981" />
            </View>
            <Text style={styles.featureTitle}>Weeds Controller</Text>
            <Text style={styles.featureDesc}>Smart weeds management</Text>
          </Pressable>
        </View>

        <View style={styles.featuresGrid}>
          <Pressable style={[styles.featureCard, styles.featureLarge]} onPress={() => navTo('Stage', 'harvest')}>
            <View style={[styles.featureIcon, { backgroundColor: '#dbeafe' }]}>
              <MaterialCommunityIcons name="warehouse" size={40} color="#3b82f6" />
            </View>
            <Text style={styles.featureTitle}>Harvest Advisory</Text>
            <Text style={styles.featureDesc}>Optimize storage time</Text>
          </Pressable>
          <Pressable style={[styles.featureCard, styles.featureLarge]}  onPress={() => navigation.navigate('WeatherForecast')}>
            <View style={[styles.featureIcon, { backgroundColor: '#fee2e2' }]}>
              <MaterialCommunityIcons name="weather-partly-cloudy" size={40} color="#3a6193ff" /> 
            
            </View>
            <Text style={styles.featureTitle}>Weather Forecast</Text>
            <Text style={styles.featureDesc}>weather prediction</Text>
          </Pressable>
        </View>


        {/*Crop Establishment Features */}
        <Text style={styles.sectionTitle}>Crop Establishment 🌱</Text>
        <View style={styles.featuresGrid}>
          <Pressable style={[styles.featureCard, styles.featureLarge]} onPress={() => navTo('InputPlanner', 'planning')}>
            <View style={[styles.featureIcon, { backgroundColor: '#fef7cd' }]}>
              <MaterialCommunityIcons name="calculator" size={40} color="#d97706" />
            </View>
            <Text style={styles.featureTitle}>Input Planner</Text>
            <Text style={styles.featureDesc}>Calculate seeds & fertilizer</Text>
          </Pressable>
          <Pressable style={[styles.featureCard, styles.featureLarge]} onPress={() => navigation?.navigate('CropRecommender')}>
            <View style={[styles.featureIcon, { backgroundColor: '#e0f2fe' }]}>
              <MaterialCommunityIcons name="seed" size={40} color="#0369a1" />
            </View>
            <Text style={styles.featureTitle}>Crop Recommender</Text>
            <Text style={styles.featureDesc}>Best varieties for your soil</Text>
          </Pressable>
        </View>
        

        {/* --- LIVE NEWS SECTION --- */}
        <View style={styles.newsHeaderRow}>
          <Text style={styles.sectionTitle}>Live Agri Updates 📡</Text>
          <Pressable onPress={fetchRealNews}>
            <MaterialCommunityIcons name="refresh" size={20} color="#16a34a" />
          </Pressable>
        </View>

        <View style={styles.newsContainer}>
          {loading ? (
            <ActivityIndicator size="large" color="#16a34a" style={{marginTop: 20}} />
          ) : newsData.length === 0 ? (
            <Text style={{textAlign: 'center', color: '#9ca3af', marginTop: 10}}>
              No internet connection or news available.
            </Text>
          ) : (
            newsData.map((item) => (
              <Pressable 
                key={item.id} 
                style={styles.newsCard}
                onPress={() => openNewsLink(item.link)} // Make it clickable!
              >
                <View style={[styles.newsIconBox, { backgroundColor: item.tagColor + '20' }]}> 
                  <MaterialCommunityIcons name={item.icon} size={24} color={item.tagColor} />
                </View>
                
                <View style={styles.newsContent}>
                  <View style={styles.newsTopRow}>
                    <View style={[styles.tagBadge, { backgroundColor: item.tagColor }]}>
                      <Text style={styles.tagText}>{item.tag}</Text>
                    </View>
                    <Text style={styles.newsTime}>{formatDate(item.time)}</Text>
                  </View>
                  
                  <Text style={styles.newsTitle} numberOfLines={3}>{item.title}</Text>
                  
                  <View style={styles.newsFooter}>
                    <MaterialCommunityIcons name="web" size={14} color="#9ca3af" />
                    <Text style={styles.newsSource} numberOfLines={1}>
                      Tap to read more
                    </Text>
                  </View>
                </View>
              </Pressable>
            ))
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom Nav */}
      <View style={styles.bottomNav}>
        {['home', 'pest', 'harvest', 'weeds', 'pricing'].map((tab) => (
          <Pressable 
            key={tab} 
            style={styles.navItem} 
            onPress={() => navTo(tab === 'home' ? 'Home' : tab === 'pest' ? 'Pest' : tab === 'harvest' ? 'Stage' : tab === 'weeds' ? 'weedsDashboard' : 'Pricing', tab)}
          >
            <View style={[styles.navIconWrapper, activeTab === tab && styles.navIconActive]}>
              <MaterialCommunityIcons 
                name={tab === 'home' ? 'home' : tab === 'pest' ? 'bug' : tab === 'harvest' ? 'warehouse' : tab === 'weeds' ? 'leaf' : 'currency-usd'} 
                size={24} 
                color={activeTab === tab ? '#fff' : '#9ca3af'} 
              />
            </View>
            <Text style={[styles.navText, activeTab === tab && styles.navTextActive]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

// STYLES
const styles = StyleSheet.create({
  mainWrapper: { flex: 1, backgroundColor: '#f9fafb' },
  header: { backgroundColor: '#16a34a', paddingTop: 50, paddingHorizontal: 20, paddingBottom: 30, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  logoSection: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  logoCircle: { width: 50, height: 50, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 25, alignItems: 'center', justifyContent: 'center' },
  appName: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  appSubtitle: { fontSize: 12, color: 'rgba(255,255,255,0.8)' },
  profileBtn: { width: 46, height: 46, borderRadius: 23, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  welcomeCard: { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  welcomeTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff', marginBottom: 6 },
  welcomeText: { fontSize: 13, color: 'rgba(255,255,255,0.9)', lineHeight: 18 },
  content: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 20 },
  statsGrid: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  statCard: { flex: 1, padding: 16, borderRadius: 16, alignItems: 'center', elevation: 3 },
  statNumber: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginTop: 8 },
  statLabel: { fontSize: 11, color: 'rgba(255,255,255,0.9)', marginTop: 4, textAlign: 'center' },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#111827', marginBottom: 16 },
  featuresGrid: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  featureCard: { backgroundColor: '#fff', borderRadius: 20, padding: 18, elevation: 4 },
  featureLarge: { flex: 1 },
  featureIcon: { width: 60, height: 60, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  featureTitle: { fontSize: 15, fontWeight: 'bold', color: '#111827' },
  featureDesc: { fontSize: 11, color: '#6b7280', marginTop: 4 },
  
  // News Styles
  newsHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, marginBottom: 16 },
  newsContainer: { gap: 12 },
  newsCard: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 16, padding: 12, elevation: 2, alignItems: 'center' },
  newsIconBox: { width: 50, height: 50, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  newsContent: { flex: 1 },
  newsTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  tagBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  tagText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  newsTime: { fontSize: 11, color: '#9ca3af' },
  newsTitle: { fontSize: 14, fontWeight: '600', color: '#1f2937', lineHeight: 20, marginBottom: 6 },
  newsFooter: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  newsSource: { fontSize: 12, color: '#6b7280', fontWeight: '500' },

  // Nav
  bottomNav: { position: 'absolute', bottom: 0, width: width, height: 75, backgroundColor: '#fff', flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#e5e7eb', paddingBottom: 10, elevation: 10 },
  navItem: { alignItems: 'center', justifyContent: 'center', paddingVertical: 8 },
  navIconWrapper: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  navIconActive: { backgroundColor: '#16a34a' },
  navText: { fontSize: 11, color: '#9ca3af', marginTop: 4, fontWeight: '500' },
  navTextActive: { color: '#16a34a', fontWeight: '700' },
});