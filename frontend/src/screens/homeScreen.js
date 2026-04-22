<<<<<<< HEAD
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  Linking,
  Image,
  ImageBackground,
  SafeAreaView,
  StatusBar,
  Animated
} from 'react-native';
import { MaterialCommunityIcons, Ionicons, Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

const { width, height } = Dimensions.get('window');

const GOOGLE_NEWS_RSS = "https://news.google.com/rss/search?q=sri+lanka+agriculture+rice+paddy&hl=en-LK&gl=LK&ceid=LK:en";
const API_URL = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(GOOGLE_NEWS_RSS)}`;

export default function HomeScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState('home');
  const [newsData, setNewsData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Animations
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const translateYAnim = React.useRef(new Animated.Value(50)).current;
  const pulseAnim = React.useRef(new Animated.Value(1)).current;

  useEffect(() => {
    fetchRealNews();

    // Start Entrance Animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(translateYAnim, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: true,
      }),
    ]).start();

    // Start Looping Pulse Animation for Logo
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const fetchRealNews = async () => {
    try {
      const response = await fetch(API_URL);
      const data = await response.json();

      if (data.items) {
        const formattedNews = data.items.slice(0, 6).map((item, index) => {
           const fallbackImages = [
             'https://images.unsplash.com/photo-1592982537447-6f2324dc6825?auto=format&fit=crop&q=80&w=600',
             'https://images.unsplash.com/photo-1605000797499-95a51c5269ae?auto=format&fit=crop&q=80&w=600',
             'https://images.unsplash.com/photo-1586771107445-d3afef11d08b?auto=format&fit=crop&q=80&w=600',
             'https://images.unsplash.com/photo-1530836369250-ef71a3f5e481?auto=format&fit=crop&q=80&w=600',
           ];
           let extractedImg = null;
           const imgMatch = item.description?.match(/<img[^>]+src="([^">]+)"/);
           if (imgMatch && imgMatch[1]) extractedImg = imgMatch[1];
           
           return {
             id: index.toString(),
             title: item.title?.replace(/ - [^-]+$/, ''), 
             time: item.pubDate,
             source: item.author || item.title?.split(' - ').pop() || "Agri News",
             link: item.link,
             image: item.thumbnail || item.enclosure?.link || extractedImg || fallbackImages[index % fallbackImages.length],
             tag: item.title.toLowerCase().includes('price') ? 'Market' :
               item.title.toLowerCase().includes('weather') ? 'Weather' :
                 item.title.toLowerCase().includes('fertilizer') ? 'Subsidy' : 'Farming',
           }
        });
        setNewsData(formattedNews);
      }
    } catch (error) {
      console.error("Failed to fetch news:", error);
    } finally {
      setLoading(false);
    }
  };

  const videoData = [
    {
      id: 'v1',
      title: 'Smart Paddy Cultivation 2026',
      duration: '4:20',
      image: 'https://images.unsplash.com/photo-1589923188900-85dae523342b?auto=format&fit=crop&q=80&w=500',
      link: 'https://www.youtube.com/results?search_query=sri+lanka+paddy+farming' 
    },
    {
      id: 'v2',
      title: 'Making Organic Fertilizer at Home',
      duration: '6:15',
      image: 'https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&q=80&w=500',
      link: 'https://www.youtube.com/results?search_query=organic+fertilizer+farming+sri+lanka'
    },
    {
       id: 'v3',
       title: 'Eliminate Brown Plant Hoppers',
       duration: '10:05',
       image: 'https://images.unsplash.com/photo-1595804550186-e3d1acadd3dd?auto=format&fit=crop&q=80&w=500',
       link: 'https://www.youtube.com/results?search_query=pest+control+paddy'
    }
  ];

  const openLink = (url) => {
    if (url) Linking.openURL(url).catch(err => console.error("Error", err));
  };

  const navTo = (screen, tab) => {
    setActiveTab(tab);
    navigation?.navigate(screen);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    if (isNaN(diffInHours)) return 'Recent';
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return `${Math.floor(diffInHours / 24)}d ago`;
  };

  return (
    <View style={styles.mainWrapper}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 30 }}
      >
        {/* --- STUNNING HEADER SECTION --- */}
        <ImageBackground 
          source={{ uri: 'https://images.unsplash.com/photo-1622383563227-04401ab4e5ea?auto=format&fit=crop&w=1000&q=80' }}
          style={styles.headerImageBg}
        >
          <LinearGradient
            colors={['rgba(0, 30, 20, 0.65)', 'rgba(5, 150, 105, 0.4)', '#f8fafc']}
            locations={[0, 0.65, 1]}
            style={styles.headerGradientMask}
          >
            <SafeAreaView>
              <View style={styles.headerTop}>
                <View style={styles.logoSection}>
                  <View style={styles.logoCircle}>
                    <MaterialCommunityIcons name="leaf" size={24} color="#059669" />
                  </View>
                  <View>
                    <Text style={styles.appName}>AgroMind</Text>
                    <Text style={styles.appSubtitle}>Smart Agriculture</Text>
                  </View>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 15 }}>
                  <Pressable onPress={() => navigation?.navigate('Notifications')} style={styles.notificationBtn}>
                    <MaterialCommunityIcons name="bell-outline" size={24} color="#fff" />
                    <View style={styles.notificationBadge}>
                      <Text style={{color: '#fff', fontSize: 10, fontWeight: 'bold'}}>4</Text>
                    </View>
                  </Pressable>
                  <Pressable onPress={() => navigation?.navigate('Profile')}>
                     <Image 
                       source={{ uri: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80' }} 
                       style={styles.profileImg} 
                     />
                  </Pressable>
                </View>
              </View>

              <View style={styles.welcomeContainer}>
                <Text style={styles.welcomeGreeting}>Good Morning, Farmer! ☀️</Text>
                <Text style={styles.welcomeText}>Your crops are thriving. Let's make today productive.</Text>
                
                {/* Weather Glassmorphism element */}
                <BlurView intensity={40} tint="light" style={styles.weatherGlass}>
                  <Feather name="cloud-rain" size={20} color="#fff" />
                  <View style={{ marginLeft: 10 }}>
                    <Text style={styles.weatherTemp}>28°C • Light Rain</Text>
                    <Text style={styles.weatherLocation}>Kurunegala District</Text>
                  </View>
                </BlurView>
              </View>
            </SafeAreaView>
          </LinearGradient>
        </ImageBackground>

        <View style={styles.bodyContainer}>
          {/* Quick Stats - Floating Above */}
          <View style={styles.statsRow}>
             <View style={styles.floatingStatCard}>
               <View style={[styles.statIconWrap, { backgroundColor: '#e0e7ff' }]}>
                 <Ionicons name="analytics" size={22} color="#4f46e5" />
               </View>
               <Text style={styles.statValue}>98%</Text>
               <Text style={styles.statLabel}>AI Accuracy</Text>
             </View>
             <View style={styles.floatingStatCard}>
               <View style={[styles.statIconWrap, { backgroundColor: '#dcfce7' }]}>
                 <MaterialCommunityIcons name="sprout" size={22} color="#16a34a" />
               </View>
               <Text style={styles.statValue}>Healthy</Text>
               <Text style={styles.statLabel}>Crop Status</Text>
             </View>
             <View style={styles.floatingStatCard}>
               <View style={[styles.statIconWrap, { backgroundColor: '#ffedd5' }]}>
                 <MaterialCommunityIcons name="shield-check" size={22} color="#ea580c" />
               </View>
               <Text style={styles.statValue}>Safe</Text>
               <Text style={styles.statLabel}>Pest Level</Text>
             </View>
          </View>

          {/* AI Services - Large Elegant Horizontal Scroll */}
          <View style={[styles.sectionRow, { marginTop: 20 }]}>
            <Text style={styles.sectionTitle}>Smart Tools</Text>
            <View style={styles.badgeLabel}>
              <Text style={styles.badgeText}>AI Powered</Text>
            </View>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.hScrollPad, { paddingBottom: 15 }]}>
             <Pressable style={[styles.largeServiceCard, { backgroundColor: '#fef2f2' }]} onPress={() => navTo('Pest', 'pest')}>
               <ImageBackground source={{uri: 'https://images.unsplash.com/photo-1590682680695-43b964a3ae17?auto=format&fit=crop&w=300&q=80'}} style={styles.serviceImgBg} imageStyle={{ opacity: 0.25, borderRadius: 28 }} />
               <View style={[styles.serviceIconFrame, { backgroundColor: '#fee2e2' }]}>
                 <MaterialCommunityIcons name="bug" size={28} color="#dc2626" />
               </View>
               <Text style={styles.serviceTitle}>Pest{"\n"}Scanner</Text>
               <Text style={styles.serviceSubtitle}>Instant detection</Text>
             </Pressable>

             <Pressable style={[styles.largeServiceCard, { backgroundColor: '#ecfdf5' }]} onPress={() => navTo('weedsDashboard', 'weeds')}>
               <ImageBackground source={{uri: 'https://images.unsplash.com/photo-1557234195-bd9f290f0e4d?auto=format&fit=crop&w=300&q=80'}} style={styles.serviceImgBg} imageStyle={{ opacity: 0.25, borderRadius: 28 }} />
               <View style={[styles.serviceIconFrame, { backgroundColor: '#d1fae5' }]}>
                 <MaterialCommunityIcons name="leaf" size={28} color="#059669" />
               </View>
               <Text style={styles.serviceTitle}>Weeds{"\n"}Control</Text>
               <Text style={styles.serviceSubtitle}>Eradicate weeds</Text>
             </Pressable>

             <Pressable style={[styles.largeServiceCard, { backgroundColor: '#eff6ff' }]} onPress={() => navTo('Stage', 'harvest')}>
               <ImageBackground source={{uri: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?auto=format&fit=crop&w=300&q=80'}} style={styles.serviceImgBg} imageStyle={{ opacity: 0.15, borderRadius: 28 }} />
               <View style={[styles.serviceIconFrame, { backgroundColor: '#dbeafe' }]}>
                 <MaterialCommunityIcons name="warehouse" size={28} color="#2563eb" />
               </View>
               <Text style={styles.serviceTitle}>Harvest{"\n"}Advisory</Text>
               <Text style={styles.serviceSubtitle}>Smart storage</Text>
             </Pressable>
             
             <Pressable style={[styles.largeServiceCard, { backgroundColor: '#fffbeb' }]} onPress={() => navigation.navigate('Stagesplant')}>
               <ImageBackground source={{uri: 'https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?auto=format&fit=crop&w=300&q=80'}} style={styles.serviceImgBg} imageStyle={{ opacity: 0.15, borderRadius: 28 }} />
               <View style={[styles.serviceIconFrame, { backgroundColor: '#fef3c7' }]}>
                 <MaterialCommunityIcons name="sprout-outline" size={28} color="#d97706" />
               </View>
               <Text style={styles.serviceTitle}>Plant{"\n"}Stages</Text>
               <Text style={styles.serviceSubtitle}>Growth tracker</Text>
             </Pressable>
          </ScrollView>

          {/* Videos Section */}
          <View style={styles.sectionRow}>
            <Text style={styles.sectionTitle}>Featured Insights</Text>
            <Text style={styles.linkText}>View Collection</Text>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hScrollPad} snapToInterval={width * 0.70 + 16} decelerationRate="fast">
            {videoData.map((vid) => (
              <Pressable key={vid.id} style={styles.videoCard} onPress={() => openLink(vid.link)}>
                <ImageBackground source={{ uri: vid.image }} style={styles.videoThumbnail} imageStyle={styles.videoImgRounded}>
                  <View style={styles.playBtnCircle}>
                     <Ionicons name="play" size={22} color="#fff" style={{ marginLeft: 2 }} />
                  </View>
                  {/* Glassmorphic info strip */}
                  <BlurView intensity={70} tint="dark" style={styles.videoInfoStrip}>
                    <Text style={styles.videoTitle} numberOfLines={1}>{vid.title}</Text>
                    <View style={styles.durationBadge}>
                       <Text style={styles.durationTxt}>{vid.duration}</Text>
                    </View>
                  </BlurView>
                </ImageBackground>
              </Pressable>
            ))}
          </ScrollView>

          {/* Utility Box */}
          <View style={[styles.sectionRow, { marginTop: 10 }]}>
            <Text style={styles.sectionTitle}>Farm Logistics</Text>
            <View style={[styles.badgeLabel, { backgroundColor: '#f3e8ff' }]}>
              <Text style={[styles.badgeText, { color: '#7e22ce' }]}>Essentials</Text>
            </View>
          </View>
          <View style={styles.logisticsContainer}>
             <Pressable style={styles.logisticsCard} onPress={() => navTo('InputPlanner', 'planning')}>
                <LinearGradient colors={['#059669', '#10b981']} style={styles.logisticsGradient} start={{x:0, y:0}} end={{x:1, y:1}}>
                  <View style={styles.logisticsContent}>
                    <View style={styles.logisticsIconBg}>
                      <MaterialCommunityIcons name="flask-outline" size={24} color="#059669" />
                    </View>
                    <View style={styles.logisticsTextWrap}>
                      <Text style={styles.logisticsTitle}>Input Planner</Text>
                      <Text style={styles.logisticsSub}>Calculate seed & fertilizer needs</Text>
                    </View>
                    <MaterialCommunityIcons name="arrow-right" size={20} color="#fff" />
                  </View>
                </LinearGradient>
             </Pressable>

             <Pressable style={styles.logisticsCard} onPress={() => navigation?.navigate('CropRecommender')}>
                <LinearGradient colors={['#d97706', '#f59e0b']} style={styles.logisticsGradient} start={{x:0, y:0}} end={{x:1, y:1}}>
                  <View style={styles.logisticsContent}>
                    <View style={styles.logisticsIconBg}>
                      <MaterialCommunityIcons name="corn" size={24} color="#d97706" />
                    </View>
                    <View style={styles.logisticsTextWrap}>
                      <Text style={styles.logisticsTitle}>Recommendations</Text>
                      <Text style={styles.logisticsSub}>AI-driven crop yield optimization</Text>
                    </View>
                    <MaterialCommunityIcons name="arrow-right" size={20} color="#fff" />
                  </View>
                </LinearGradient>
             </Pressable>

             <Pressable style={styles.logisticsCard} onPress={() => navigation.navigate('WeatherForecast')}>
                <LinearGradient colors={['#2563eb', '#3b82f6']} style={styles.logisticsGradient} start={{x:0, y:0}} end={{x:1, y:1}}>
                  <View style={styles.logisticsContent}>
                    <View style={styles.logisticsIconBg}>
                      <MaterialCommunityIcons name="weather-hazy" size={24} color="#2563eb" />
                    </View>
                    <View style={styles.logisticsTextWrap}>
                      <Text style={styles.logisticsTitle}>Weather Report</Text>
                      <Text style={styles.logisticsSub}>Hyper-local farming forecast</Text>
                    </View>
                    <MaterialCommunityIcons name="arrow-right" size={20} color="#fff" />
                  </View>
                </LinearGradient>
             </Pressable>
          </View>

          {/* News Carousel */}
          <View style={[styles.sectionRow, { marginTop: 10 }]}>
            <Text style={styles.sectionTitle}>Agri News & Trends</Text>
            <Pressable onPress={fetchRealNews} style={styles.refreshBtn}>
              <MaterialCommunityIcons name="refresh" size={20} color="#10b981" />
            </Pressable>
          </View>

          {loading ? (
             <ActivityIndicator size="large" color="#10b981" style={{ marginVertical: 30 }} />
          ) : newsData.length === 0 ? (
             <Text style={styles.noNewsText}>Looks like the feed is empty right now.</Text>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hScrollPad} snapToInterval={width * 0.8 + 16} decelerationRate="fast">
              {newsData.map(item => (
                <Pressable key={item.id} style={styles.newsPremiumCard} onPress={() => openLink(item.link)}>
                  <Image source={{ uri: item.image }} style={styles.newsImage} />
                  <LinearGradient colors={['transparent', 'rgba(0,0,0,0.8)']} style={styles.newsGradientMask}>
                     <View style={styles.newsCardContent}>
                        <View style={styles.newsMetaRow}>
                           <View style={styles.newsBlurBadge}>
                             <Text style={styles.newsTagText}>{item.tag || 'News'}</Text>
                           </View>
                           <Text style={styles.newsTimeText}>{formatDate(item.time)}</Text>
                        </View>
                        <Text style={styles.newsHeadline} numberOfLines={2}>{item.title}</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 4 }}>
                          <MaterialCommunityIcons name="shield-check" size={14} color="#34d399" />
                          <Text style={styles.newsSourceText}>{item.source}</Text>
                        </View>
                     </View>
                  </LinearGradient>
                </Pressable>
              ))}
            </ScrollView>
          )}

          {/* App Details Section with Animation */}
          <Animated.View style={[styles.sectionRow, { marginTop: 30, opacity: fadeAnim, transform: [{ translateY: translateYAnim }] }]}>
            <Text style={styles.sectionTitle}>About AgroMind</Text>
          </Animated.View>
          <Animated.View style={{ paddingHorizontal: 24, marginBottom: 0, opacity: fadeAnim, transform: [{ translateY: translateYAnim }] }}>
            <LinearGradient 
              colors={['#0f172a', '#1e293b']} 
              style={{ borderRadius: 24, padding: 24, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 15, shadowOffset: { width:0, height: 8}, elevation: 5 }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                 <Animated.View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(16, 185, 129, 0.2)', alignItems: 'center', justifyContent: 'center', transform: [{ scale: pulseAnim }] }}>
                    <MaterialCommunityIcons name="leaf" size={24} color="#10b981" />
                 </Animated.View>
                 <View style={{ marginLeft: 12 }}>
                   <Text style={{ color: '#fff', fontSize: 18, fontWeight: '800' }}>AgroMind v1.0</Text>
                   <Text style={{ color: '#94a3b8', fontSize: 12, fontWeight: '600' }}>AI Paddy Farming Assistant</Text>
                 </View>
              </View>
              <Text style={{ color: '#cbd5e1', fontSize: 14, lineHeight: 22, marginBottom: 20 }}>
                Empowering Sri Lankan farmers with AI-driven insights for pest forecasting, weed detection, crop planning, and smart post-harvest solutions. Optimize your yield today!
              </Text>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderColor: '#334155', paddingTop: 16 }}>
                 <View style={{ alignItems: 'center' }}>
                   <MaterialCommunityIcons name="shield-check-outline" size={24} color="#38bdf8" />
                   <Text style={{ color: '#94a3b8', fontSize: 11, marginTop: 4, fontWeight:'500' }}>Secure Data</Text>
                 </View>
                 <View style={{ alignItems: 'center' }}>
                   <MaterialCommunityIcons name="lightning-bolt-outline" size={24} color="#facc15" />
                   <Text style={{ color: '#94a3b8', fontSize: 11, marginTop: 4, fontWeight:'500' }}>Real-time</Text>
                 </View>
                 <View style={{ alignItems: 'center' }}>
                   <MaterialCommunityIcons name="headset" size={24} color="#a78bfa" />
                   <Text style={{ color: '#94a3b8', fontSize: 11, marginTop: 4, fontWeight:'500' }}>24/7 Support</Text>
                 </View>
              </View>
            </LinearGradient>
          </Animated.View>
        </View>
      </ScrollView>


    </View>
  );
}

const styles = StyleSheet.create({
  mainWrapper: { flex: 1, backgroundColor: '#f8fafc' },
  content: { flex: 1 },
  
  headerImageBg: { width: '100%', minHeight: 330 },
  headerGradientMask: { flex: 1, paddingTop: 55, paddingBottom: 60 },
  
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, marginBottom: 20 },
  logoSection: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  logoCircle: { width: 42, height: 42, backgroundColor: '#fff', borderRadius: 21, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 4 },
  appName: { fontSize: 22, fontWeight: '800', color: '#fff', letterSpacing: 0.5 },
  appSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.8)', fontWeight: '600' },
  profileImg: { width: 44, height: 44, borderRadius: 22, borderWidth: 2, borderColor: '#fff' },
  notificationBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  notificationBadge: { position: 'absolute', top: -2, right: -2, backgroundColor: '#ef4444', width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#059669' },
  
  welcomeContainer: { paddingHorizontal: 24 },
  welcomeGreeting: { fontSize: 26, fontWeight: '800', color: '#fff', marginBottom: 6 },
  welcomeText: { fontSize: 15, color: 'rgba(255,255,255,0.9)', lineHeight: 22, marginBottom: 16 },
  
  weatherGlass: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 20, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.1)', alignSelf: 'flex-start', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  weatherTemp: { color: '#fff', fontSize: 15, fontWeight: '700' },
  weatherLocation: { color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: '500' },
  
  bodyContainer: { marginTop: -40 },
  
  statsRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 12, marginBottom: 16 },
  floatingStatCard: { flex: 1, backgroundColor: '#fff', borderRadius: 20, padding: 16, alignItems: 'center', shadowColor: '#94a3b8', shadowOpacity: 0.15, shadowRadius: 20, shadowOffset: { width: 0, height: 8 }, elevation: 6 },
  statIconWrap: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  statValue: { fontSize: 18, fontWeight: '800', color: '#0f172a' },
  statLabel: { fontSize: 11, color: '#64748b', fontWeight: '600', marginTop: 4, textAlign: 'center' },
  
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, marginBottom: 16, marginTop: 16 },
  sectionTitle: { fontSize: 20, fontWeight: '800', color: '#0f172a' },
  badgeLabel: { backgroundColor: '#dcfce7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeText: { color: '#059669', fontSize: 11, fontWeight: '700' },
  linkText: { fontSize: 14, fontWeight: '700', color: '#10b981' },
  
  hScrollPad: { paddingHorizontal: 24, gap: 16 },
  
  largeServiceCard: { width: 140, height: 180, borderRadius: 28, padding: 16, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, shadowOffset: {width:0, height: 4}, elevation: 4, justifyContent: 'flex-end', marginBottom: 5 },
  serviceImgBg: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  serviceIconFrame: { width: 52, height: 52, borderRadius: 20, alignItems: 'center', justifyContent: 'center', position: 'absolute', top: 16, left: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5 },
  serviceTitle: { fontSize: 18, fontWeight: '800', color: '#0f172a', lineHeight: 22, marginBottom: 4 },
  serviceSubtitle: { fontSize: 13, color: '#64748b', fontWeight: '500' },
  
  videoCard: { width: width * 0.70, height: 210, borderRadius: 28, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 15, shadowOffset: { width: 0, height: 10 }, elevation: 6 },
  videoThumbnail: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
  videoImgRounded: { borderRadius: 28 },
  playBtnCircle: { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)' },
  videoInfoStrip: { position: 'absolute', bottom: 0, width: '100%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  videoTitle: { flex: 1, color: '#fff', fontSize: 14, fontWeight: '700', marginRight: 10 },
  durationBadge: { backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  durationTxt: { color: '#fff', fontSize: 11, fontWeight: '700' },

  logisticsContainer: { paddingHorizontal: 24, gap: 12 },
  logisticsCard: { borderRadius: 20, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 15, shadowOffset: { width: 0, height: 6 }, elevation: 6 },
  logisticsGradient: { padding: 18 },
  logisticsContent: { flexDirection: 'row', alignItems: 'center' },
  logisticsIconBg: { width: 48, height: 48, backgroundColor: '#fff', borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  logisticsTextWrap: { flex: 1 },
  logisticsTitle: { fontSize: 16, fontWeight: '800', color: '#fff', marginBottom: 2 },
  logisticsSub: { fontSize: 13, color: 'rgba(255,255,255,0.85)', fontWeight: '600' },
  
  refreshBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#ecfdf5', alignItems: 'center', justifyContent: 'center' },

  newsPremiumCard: { width: width * 0.8, height: 240, borderRadius: 32, overflow: 'hidden', shadowColor: '#0f172a', shadowOpacity: 0.15, shadowRadius: 20, shadowOffset: { width: 0, height: 10 }, elevation: 8 },
  newsImage: { width: '100%', height: '100%', position: 'absolute' },
  newsGradientMask: { flex: 1, justifyContent: 'flex-end' },
  newsCardContent: { padding: 20 },
  newsMetaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  newsBlurBadge: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  newsTagText: { color: '#fff', fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  newsTimeText: { color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: '600' },
  newsHeadline: { color: '#fff', fontSize: 20, fontWeight: '800', lineHeight: 28, textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 4 },
  newsSourceText: { color: '#6ee7b7', fontSize: 12, fontWeight: '700' },
  noNewsText: { textAlign: 'center', color: '#94a3b8', marginVertical: 30, fontSize: 15, fontWeight: '500' },
});
=======
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
              <Text style={styles.appName}>AgroMind</Text>
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
          <Pressable style={[styles.featureCard, styles.featureLarge]} onPress={() => navTo('PestManagement', 'pest')}>
            <View style={[styles.featureIcon, { backgroundColor: '#fef3c7' }]}>
              <MaterialCommunityIcons name="bug" size={40} color="#f59e0b" />
            </View>
            <Text style={styles.featureTitle}>Pest Management</Text>
            <Text style={styles.featureDesc}>Identify and manage pests effectively</Text>
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
          <Pressable style={[styles.featureCard, styles.featureLarge]} onPress={() => navTo('PostHarvestOnboarding', 'harvest')}>
            <View style={[styles.featureIcon, { backgroundColor: '#dbeafe' }]}>
              <MaterialCommunityIcons name="warehouse" size={40} color="#3b82f6" />
            </View>
            <Text style={styles.featureTitle}>Harvest Advisory</Text>
            <Text style={styles.featureDesc}>Optimize storage time</Text>
          </Pressable>
          <Pressable style={[styles.featureCard, styles.featureLarge]} onPress={() => navigation.navigate('WeatherForecast')}>
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
            <ActivityIndicator size="large" color="#16a34a" style={{ marginTop: 20 }} />
          ) : newsData.length === 0 ? (
            <Text style={{ textAlign: 'center', color: '#9ca3af', marginTop: 10 }}>
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
            onPress={() => navTo(tab === 'home' ? 'Home' : tab === 'pest' ? 'Pest' : tab === 'harvest' ? 'PostHarvestOnboarding' : tab === 'weeds' ? 'weedsDashboard' : 'Pricing', tab)}
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
>>>>>>> ef667088a0ced3a4c98872182e6792f2068ef8bd
