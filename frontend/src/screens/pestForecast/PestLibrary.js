import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Image,
  Dimensions,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { pestLibraryApi } from '../../services/api';

const { width } = Dimensions.get('window');

// Remote image URLs for each pest
const pestImageURLs = {
  'bph': 'https://doa.gov.lk/wp-content/uploads/2020/06/RRDI_BPH_1.jpg',
  'leaf_folder': 'https://pestsofbhutan.nppc.gov.bt/wp-content/uploads/2017/03/Caseworm-1440x1440.jpg',
  'stem_borer': 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRJXi3tfsexrD4JkXjyCBJw04FNmavRIEGGxg&s',
  'paddy_bug': 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSds4yDTLUxAOuV_q2vzqvoNVCYMkRyRswmYQ&s',
  'gall_midge': 'https://ipm.ucanr.edu/PMG/IMAGES/D/I-DP-DGLE-AD.003.jpg',
};

// Alternative: Use placeholder images for better reliability
const DEFAULT_PEST_IMAGE = 'https://via.placeholder.com/300/16a34a/ffffff?text=Pest';

export default function PestLibrary({ navigation }) {
  const [pests, setPests] = useState([]);
  const [filteredPests, setFilteredPests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPest, setSelectedPest] = useState(null);
  const [language, setLanguage] = useState('en');
  const [imageErrors, setImageErrors] = useState({});

  useEffect(() => {
    loadPests();
  }, [language]);

  const loadPests = async () => {
    try {
      setLoading(true);
      const response = await pestLibraryApi.getAllPests(language);
      console.log('Loaded pests:', response);
      if (response.success) {
        setPests(response.data);
        setFilteredPests(response.data);
      }
    } catch (error) {
      console.error('Failed to load pests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (text) => {
    setSearchQuery(text);
    const filtered = pests.filter(pest => 
      pest.name.toLowerCase().includes(text.toLowerCase()) ||
      (pest.scientific_name && pest.scientific_name.toLowerCase().includes(text.toLowerCase()))
    );
    setFilteredPests(filtered);
  };

  const getPestImageUrl = (pestId, pestName) => {
    // Try by ID first
    if (pestImageURLs[pestId]) {
      return pestImageURLs[pestId];
    }
    // Try by name
    if (pestImageURLs[pestName?.toLowerCase().replace(/\s+/g, '_')]) {
      return pestImageURLs[pestName.toLowerCase().replace(/\s+/g, '_')];
    }
    // Return default
    return DEFAULT_PEST_IMAGE;
  };

  const handleImageError = (pestId) => {
    setImageErrors(prev => ({ ...prev, [pestId]: true }));
  };

  const loadPestDetails = async (pestId, pestName) => {
    try {
      let response = await pestLibraryApi.getPestInfoById?.(pestId, language);
      if (!response?.success) {
        response = await pestLibraryApi.getPestInfo(pestName, language);
      }
      if (response?.success) {
        setSelectedPest({ ...response.data, id: pestId });
      } else {
        setSelectedPest({ ...getMockPestData(pestName, language), id: pestId });
      }
    } catch (error) {
      console.error('Failed to load pest details:', error);
      setSelectedPest({ ...getMockPestData(pestName, language), id: pestId });
    }
  };

  const getMockPestData = (pestName, lang) => {
    const mockData = {
      'Brown Planthopper (BPH)': {
        en: {
          name: 'Brown Planthopper (BPH)',
          scientific_name: 'Nilaparvata lugens',
          description: 'Small brown insects that cluster at the base of rice plants, causing hopperburn and wilting.',
          symptoms: ['Yellowing of leaves', 'Stunted growth', 'Wilting', 'Hopperburn patches'],
          management: ['Use resistant varieties', 'Maintain proper spacing', 'Avoid excess nitrogen', 'Apply Buprofezin or Imidacloprid'],
          favorable_conditions: ['High humidity (>70%)', 'High temperature (28-32°C)', 'Excess nitrogen fertilizer']
        },
        si: {
          name: 'දුඹුරු පැහැති කොළ මකුණා',
          scientific_name: 'Nilaparvata lugens',
          description: 'කුඩා දුඹුරු පැහැති කෘමීන් වී ශාකයේ පාදමේ රැස් වී, දඬු ගිනි ගැනීම සහ මැලවීම සිදු කරයි.',
          symptoms: ['කොළ කහ පැහැ ගැන්වීම', 'වර්ධනය අඩාල වීම', 'මැලවීම', 'දඬු ගිනි ගැනීමේ පැල්ලම්'],
          management: ['ප්‍රතිරෝධී ප්‍රභේද භාවිතා කරන්න', 'නිසි පරතරය පවත්වා ගන්න', 'අධික නයිට්‍රජන් වළක්වන්න', 'බුප්‍රොෆෙසින් හෝ ඉමිඩාක්ලොප්‍රිඩ් යොදන්න'],
          favorable_conditions: ['අධික ආර්ද්‍රතාව (>70%)', 'අධික උෂ්ණත්වය (28-32°C)', 'අධික නයිට්‍රජන් පොහොර']
        }
      },
      'Rice Leaf-folder': {
        en: {
          name: 'Rice Leaf-folder',
          scientific_name: 'Cnaphalocrocis medinalis',
          description: 'Larvae fold rice leaves and feed on green tissue, causing white streaks.',
          symptoms: ['Folded leaves', 'White streaks', 'Scraped leaf tissues'],
          management: ['Encourage natural predators', 'Use light traps', 'Apply Chlorantraniliprole'],
          favorable_conditions: ['Moderate rainfall', 'Cloudy warm weather', 'High nitrogen']
        },
        si: {
          name: 'වී කොළ ගඩොල්',
          scientific_name: 'Cnaphalocrocis medinalis',
          description: 'ද්‍රෝණි වී කොළ නවා ඇතුළත කොළ පටක ආහාරයට ගෙන සුදු ඉරි ඇති කරයි.',
          symptoms: ['නවන ලද කොළ', 'සුදු ඉරි', 'සීරීම් ලකුණු සහිත කොළ පටක'],
          management: ['ස්වභාවික විලෝපිකයන් දිරිගන්වන්න', 'ආලෝක උගුල් භාවිතා කරන්න', 'ක්ලෝරන්ට්‍රනිලිප්‍රෝල් යොදන්න'],
          favorable_conditions: ['මධ්‍යස්ථ වර්ෂාපතනය', 'වළාකුළු සහිත උණුසුම් කාලගුණය', 'අධික නයිට්‍රජන්']
        }
      },
      'Stem Borer': {
        en: {
          name: 'Stem Borer',
          scientific_name: 'Scirpophaga incertulas',
          description: 'Larvae bore into rice stems causing "dead hearts" and "white heads".',
          symptoms: ['Dead heart in vegetative stage', 'White heads in reproductive stage', 'Bored holes in stems'],
          management: ['Use resistant varieties', 'Remove egg masses', 'Apply Cartap hydrochloride'],
          favorable_conditions: ['High humidity', 'Dense planting', 'Continuous flooding']
        },
        si: {
          name: 'කඳ කටුව',
          scientific_name: 'Scirpophaga incertulas',
          description: 'ද්‍රෝණි වී කඳන් තුළට විනිවිද ගොස් "මැරුණු හදවත්" සහ "සුදු හිස්" ඇති කරයි.',
          symptoms: ['ශාකමය අවධියේදී මැරුණු හදවත්', 'ප්‍රජනන අවධියේදී සුදු හිස්', 'කඳන්හි සිදුරු'],
          management: ['ප්‍රතිරෝධී ප්‍රභේද භාවිතා කරන්න', 'බිත්තර පොකුරු ඉවත් කරන්න', 'කාටප් හයිඩ්‍රොක්ලෝරයිඩ් යොදන්න'],
          favorable_conditions: ['අධික ආර්ද්‍රතාව', 'ඝන රෝපණ', 'අඛණ්ඩ ජලය රැඳීම']
        }
      },
      'Paddy Bug': {
        en: {
          name: 'Paddy Bug',
          scientific_name: 'Leptocorisa oratorius',
          description: 'Sucking pests that attack grains causing empty or discolored grains.',
          symptoms: ['Empty grains', 'Discolored grains', 'Dark spots on grains'],
          management: ['Use sweep nets', 'Neem sprays', 'Maintain clean bunds'],
          favorable_conditions: ['Flowering stage', 'Adjacent weedy areas', 'Dry conditions']
        },
        si: {
          name: 'වී කුරුමිණියා',
          scientific_name: 'Leptocorisa oratorius',
          description: 'ධාන්‍ය වලට පහර දෙන උරා බොන පළිබෝධකයන් හිස් හෝ විකෘති වූ ධාන්‍ය ඇති කරයි.',
          symptoms: ['හිස් ධාන්‍ය', 'විකෘති වූ ධාන්‍ය', 'ධාන්‍ය මත තද පැහැ ලප'],
          management: ['දැල් භාවිතා කරන්න', 'නීම් ඉසින භාවිතා කරන්න', 'පිරිසිදු බැමි පවත්වා ගන්න'],
          favorable_conditions: ['මල් හටගැනීමේ අවධිය', 'යාබද වල් ප්‍රදේශ', 'වියළි තත්වයන්']
        }
      },
      'Rice Gall Midge': {
        en: {
          name: 'Rice Gall Midge',
          scientific_name: 'Orseolia oryzae',
          description: 'Causes tube-like galls called "silver shoots" preventing panicle formation.',
          symptoms: ['Tube-like galls', 'Silver shoots', 'Onion-like leaves'],
          management: ['Use resistant varieties', 'Remove weeds', 'Apply Carbofuran at planting'],
          favorable_conditions: ['Early tillering stage', 'High humidity', 'Close planting']
        },
        si: {
          name: 'වී ගැල් මිජ්',
          scientific_name: 'Orseolia oryzae',
          description: '"රිදී රිකිලි" ලෙස හැඳින්වෙන නල ආකාර ගෝල ඇති කර පුෂ්ප මංජරිය සෑදීම වළක්වයි.',
          symptoms: ['නල ආකාර ගෝල', 'රිදී රිකිලි', 'ලූනු වැනි කොළ'],
          management: ['ප්‍රතිරෝධී ප්‍රභේද භාවිතා කරන්න', 'වල් ඉවත් කරන්න', 'රෝපණයේදී කාබෝෆියුරාන් යොදන්න'],
          favorable_conditions: ['මුල් කොළ වැකීමේ අවධිය', 'අධික ආර්ද්‍රතාව', 'සමීප රෝපණ']
        }
      }
    };

    for (const [key, value] of Object.entries(mockData)) {
      if (pestName.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(pestName.toLowerCase())) {
        return value[lang] || value['en'];
      }
    }
    return mockData['Brown Planthopper (BPH)'][lang] || mockData['Brown Planthopper (BPH)']['en'];
  };

  // Render pest detail with image
  if (selectedPest) {
    const imageUrl = getPestImageUrl(selectedPest.id, selectedPest.name);
    const hasImageError = imageErrors[selectedPest.id];

    return (
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setSelectedPest(null)}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Pest Details</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.detailCard}>
          {/* Pest Image Section */}
          <View style={styles.imageContainer}>
            {!hasImageError ? (
              <Image 
                source={{ uri: imageUrl }}
                style={styles.pestImage}
                resizeMode="cover"
                onError={() => handleImageError(selectedPest.id)}
              />
            ) : (
              <View style={[styles.pestImage, styles.imagePlaceholder]}>
                <MaterialCommunityIcons name="bug" size={50} color="#9ca3af" />
              </View>
            )}
          </View>

          <View style={styles.detailHeader}>
            <View style={[styles.detailIcon, { backgroundColor: '#fef3c7' }]}>
              <MaterialCommunityIcons name="bug" size={32} color="#f59e0b" />
            </View>
            <View>
              <Text style={styles.detailName}>{selectedPest.name}</Text>
              <Text style={styles.detailScientific}>{selectedPest.scientific_name}</Text>
            </View>
          </View>

          <View style={styles.detailSection}>
            <Text style={styles.detailSectionTitle}>Description</Text>
            <Text style={styles.detailText}>{selectedPest.description}</Text>
          </View>

          <View style={styles.detailSection}>
            <Text style={styles.detailSectionTitle}>Symptoms</Text>
            {selectedPest.symptoms?.map((symptom, index) => (
              <View key={index} style={styles.bulletPoint}>
                <Text style={styles.bullet}>•</Text>
                <Text style={styles.bulletText}>{symptom}</Text>
              </View>
            ))}
          </View>

          <View style={styles.detailSection}>
            <Text style={styles.detailSectionTitle}>Favorable Conditions</Text>
            {selectedPest.favorable_conditions?.map((condition, index) => (
              <View key={index} style={styles.bulletPoint}>
                <Text style={styles.bullet}>•</Text>
                <Text style={styles.bulletText}>{condition}</Text>
              </View>
            ))}
          </View>

          <View style={styles.detailSection}>
            <Text style={styles.detailSectionTitle}>Management</Text>
            {selectedPest.management?.map((item, index) => (
              <View key={index} style={styles.bulletPoint}>
                <Text style={styles.bullet}>•</Text>
                <Text style={styles.bulletText}>{item}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    );
  }

  // Render pest list with images
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pest Library</Text>
        <TouchableOpacity onPress={() => {
          const newLang = language === 'en' ? 'si' : 'en';
          setLanguage(newLang);
          loadPests();
        }}>
          <MaterialCommunityIcons 
            name="translate" 
            size={24} 
            color="#16a34a" 
          />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <MaterialCommunityIcons name="magnify" size={20} color="#9ca3af" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search pests..."
          value={searchQuery}
          onChangeText={handleSearch}
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => handleSearch('')}>
            <MaterialCommunityIcons name="close" size={20} color="#9ca3af" />
          </TouchableOpacity>
        ) : null}
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#16a34a" />
        </View>
      ) : (
        <ScrollView style={styles.list}>
          {filteredPests.map((pest, index) => {
            const imageUrl = getPestImageUrl(pest.id, pest.name);
            const hasError = imageErrors[pest.id];
            
            return (
              <TouchableOpacity
                key={index}
                style={styles.pestCard}
                onPress={() => loadPestDetails(pest.id, pest.name)}
              >
                <View style={styles.pestImageContainer}>
                  {!hasError ? (
                    <Image 
                      source={{ uri: imageUrl }}
                      style={styles.pestThumbnail}
                      resizeMode="cover"
                      onError={() => handleImageError(pest.id)}
                    />
                  ) : (
                    <View style={[styles.pestThumbnail, styles.thumbnailPlaceholder]}>
                      <MaterialCommunityIcons name="bug" size={30} color="#9ca3af" />
                    </View>
                  )}
                </View>
                <View style={styles.pestInfo}>
                  <Text style={styles.pestName}>{pest.name}</Text>
                  <Text style={styles.pestScientific}>{pest.scientific_name}</Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={20} color="#9ca3af" />
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#fff',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginVertical: 10,
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: '#111827',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    padding: 20,
  },
  pestCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  pestImageContainer: {
    marginRight: 15,
  },
  pestThumbnail: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  thumbnailPlaceholder: {
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pestInfo: {
    flex: 1,
  },
  pestName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  pestScientific: {
    fontSize: 13,
    color: '#6b7280',
    fontStyle: 'italic',
  },
  detailCard: {
    backgroundColor: '#fff',
    margin: 20,
    padding: 20,
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  pestImage: {
    width: width - 80,
    height: 200,
    borderRadius: 16,
  },
  imagePlaceholder: {
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  detailIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  detailName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  detailScientific: {
    fontSize: 14,
    color: '#6b7280',
    fontStyle: 'italic',
  },
  detailSection: {
    marginTop: 20,
  },
  detailSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  detailText: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  bulletPoint: {
    flexDirection: 'row',
    marginBottom: 8,
    paddingLeft: 8,
  },
  bullet: {
    fontSize: 14,
    color: '#16a34a',
    marginRight: 10,
  },
  bulletText: {
    fontSize: 14,
    color: '#6b7280',
    flex: 1,
    lineHeight: 20,
  },
});