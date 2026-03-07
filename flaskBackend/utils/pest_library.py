import json
import os

class PestLibrary:
    """Comprehensive pest information library with Sinhala translations"""
    
    def __init__(self):
        self.pests = self._load_pest_data()
        
    def _load_pest_data(self):
        """Load pest information"""
        return {
            'Brown Planthopper (BPH)': {
                'scientific_name': 'Nilaparvata lugens',
                'sinhala_name': 'දුඹුරු පැහැති කොළ මකුණා',
                'description': 'Small brown insects that cluster at the base of rice plants, causing hopperburn and wilting.',
                'sinhala_description': 'සහල් පැලෑටි පාමුල රැස්වන කුඩා දුඹුරු පැහැති කෘමීන්, ශාක මැලවීමට හේතු වේ.',
                'symptoms': [
                    'Yellowing of leaves',
                    'Stunted growth',
                    'Wilting',
                    'Hopperburn patches'
                ],
                'sinhala_symptoms': [
                    'කොළ කහ වීම',
                    'වර්ධනය අඩාල වීම',
                    'මැලවීම',
                    'දුඹුරු පැහැ ලප'
                ],
                'favorable_conditions': [
                    'High humidity (>70%)',
                    'High temperature (28-32°C)',
                    'Excess nitrogen fertilizer',
                    'Waterlogged fields'
                ],
                'management': [
                    'Use resistant varieties',
                    'Maintain proper spacing',
                    'Avoid excess nitrogen',
                    'Apply Buprofezin or Imidacloprid if needed',
                    'Drain fields periodically'
                ],
                'images': [
                    'bph_1.jpg',
                    'bph_2.jpg',
                    'bph_damage.jpg'
                ],
                'severity_threshold': {
                    'low': '<5 per hill',
                    'moderate': '5-10 per hill',
                    'high': '>10 per hill'
                }
            },
            'Sheath Blight': {
                'scientific_name': 'Rhizoctonia solani',
                'sinhala_name': 'කොපු පිළිස්සුම් රෝගය',
                'description': 'Fungal disease causing oval lesions on leaf sheaths, leading to premature death of leaves.',
                'sinhala_description': 'කොළ කොපු මත ඕවලාකාර තුවාල ඇති කරන දිලීර රෝගයක්, කොළ අකාලයේ මිය යාමට හේතු වේ.',
                'symptoms': [
                    'Oval lesions on leaf sheath',
                    'Greyish-white patches',
                    'Rapid spread in humid conditions',
                    'Premature leaf death'
                ],
                'sinhala_symptoms': [
                    'කොපුව මත ඕවලාකාර තුවාල',
                    'අළු-සුදු පැහැ ලප',
                    'තෙතමනය සහිත විට වේගයෙන් පැතිරීම',
                    'කොළ අකාලයේ මියයාම'
                ],
                'favorable_conditions': [
                    'Very high humidity (>85%)',
                    'Dense canopy',
                    'Continuous wetness',
                    'Poor drainage',
                    'High organic matter'
                ],
                'management': [
                    'Improve air circulation',
                    'Avoid dense planting',
                    'Reduce nitrogen application',
                    'Apply Potash',
                    'Use Hexaconazole or Validamycin'
                ],
                'images': [
                    'sheath_blight_1.jpg',
                    'sheath_blight_2.jpg'
                ]
            },
            'Rice Leaf-folder': {
                'scientific_name': 'Cnaphalocrocis medinalis',
                'sinhala_name': 'කොළ නලියා',
                'description': 'Larvae fold rice leaves and feed on green tissue, causing white streaks and reduced photosynthesis.',
                'sinhala_description': 'දළඹුවන් සහල් කොළ නවා ඒවායේ හරිත පටක ආහාරයට ගනී, සුදු ඉරි ඇති කර ප්‍රභාසංශ්ලේෂණය අඩු කරයි.',
                'symptoms': [
                    'Folded leaves',
                    'White streaks',
                    'Scraped leaf tissues',
                    'Reduced photosynthesis'
                ],
                'sinhala_symptoms': [
                    'නවන ලද කොළ',
                    'සුදු ඉරි',
                    'කොළ පටක උලු වීම',
                    'අඩු වූ ප්‍රභාසංශ්ලේෂණය'
                ],
                'favorable_conditions': [
                    'Moderate rainfall',
                    'Cloudy warm weather',
                    'High nitrogen',
                    'Well-drained soil'
                ],
                'management': [
                    'Encourage natural predators',
                    'Use light traps',
                    'Apply Chlorantraniliprole if high damage',
                    'Balanced fertilization'
                ]
            },
            'Paddy Bug': {
                'scientific_name': 'Leptocorisa oratorius',
                'sinhala_name': 'වී කුරුමිණියා',
                'description': 'Sucking pests that attack grains during flowering and grain filling stages, causing empty or discolored grains.',
                'sinhala_description': 'මල් පිපීමේ සහ ධාන්‍ය පිරවීමේ අවධියේදී ධාන්‍ය වලට පහර දෙන උරාබීම කෘමීන්, හිස් හෝ වර්ණවෙනස් වූ ධාන්‍ය ඇති කරයි.',
                'symptoms': [
                    'Empty or partially filled grains',
                    'Discolored grains',
                    'Dark spots on grains',
                    'Unpleasant odor in severe cases'
                ],
                'sinhala_symptoms': [
                    'හිස් හෝ අර්ධ පිරවූ ධාන්‍ය',
                    'වර්ණවෙනස් වූ ධාන්‍ය',
                    'ධාන්‍ය මත කළු පැහැ ලප',
                    'දරුණු විට අප්‍රසන්න ගන්ධය'
                ],
                'favorable_conditions': [
                    'Flowering stage',
                    'Adjacent weedy areas',
                    'Dry conditions after rain'
                ],
                'management': [
                    'Use sweep nets',
                    'Neem sprays',
                    'Maintain clean bunds',
                    'Avoid excess nitrogen'
                ]
            },
            'Rice Gall Midge': {
                'scientific_name': 'Orseolia oryzae',
                'sinhala_name': 'සහල් පිත්තල මැස්සා',
                'description': 'Maggets cause tube-like galls called "silver shoots" or "onion shoots", preventing panicle formation.',
                'sinhala_description': 'කීටයන් රිදී පැළ හෝ ලූනු පැළ ලෙස හඳුන්වන නළාකාර පිත්තල සාදයි, ධාන්‍ය ඵල නිපදවීම වළක්වයි.',
                'symptoms': [
                    'Tube-like galls',
                    'Silver shoots',
                    'Onion-like leaves',
                    'Stunted tillers'
                ],
                'sinhala_symptoms': [
                    'නළාකාර පිත්තල',
                    'රිදී පැහැ පැළ',
                    'ලූනු වැනි කොළ',
                    'වර්ධනය අඩාල වූ පැළ'
                ],
                'favorable_conditions': [
                    'Early tillering stage',
                    'High humidity',
                    'Moderate temperature',
                    'Close planting'
                ],
                'management': [
                    'Use resistant varieties',
                    'Remove weeds',
                    'Apply Carbofuran at planting if severe',
                    'Early planting'
                ]
            }
        }
    
    def get_pest_info(self, pest_name, language='en'):
        """Get pest information by name"""
        for key, info in self.pests.items():
            if pest_name.lower() in key.lower():
                if language == 'si':
                    return {
                        'name': info.get('sinhala_name', key),
                        'scientific_name': info['scientific_name'],
                        'description': info.get('sinhala_description', info['description']),
                        'symptoms': info.get('sinhala_symptoms', info['symptoms']),
                        'management': info['management'],
                        'favorable_conditions': info['favorable_conditions'],
                        'images': info.get('images', [])
                    }
                else:
                    return {
                        'name': key,
                        'scientific_name': info['scientific_name'],
                        'description': info['description'],
                        'symptoms': info['symptoms'],
                        'management': info['management'],
                        'favorable_conditions': info['favorable_conditions'],
                        'images': info.get('images', [])
                    }
        return None
    
    def search_pests(self, query, language='en'):
        """Search pests by name or symptom"""
        results = []
        query = query.lower()
        
        for key, info in self.pests.items():
            score = 0
            if query in key.lower():
                score += 10
            if 'sinhala_name' in info and query in info['sinhala_name'].lower():
                score += 10
            
            for symptom in info['symptoms']:
                if query in symptom.lower():
                    score += 5
            
            if language == 'si':
                for symptom in info.get('sinhala_symptoms', []):
                    if query in symptom.lower():
                        score += 5
            
            if score > 0:
                results.append({
                    'pest': key,
                    'name': info.get('sinhala_name', key) if language == 'si' else key,
                    'match_score': score,
                    'description': info.get('sinhala_description', info['description']) if language == 'si' else info['description']
                })
        
        return sorted(results, key=lambda x: x['match_score'], reverse=True)[:10]
    
    def get_all_pests(self, language='en'):
        """Get list of all pests"""
        pests = []
        for key, info in self.pests.items():
            pests.append({
                'id': key,
                'name': info.get('sinhala_name', key) if language == 'si' else key,
                'scientific_name': info['scientific_name']
            })
        return pests
    
    def get_prevention_tips(self, pest_name=None):
        """Get general prevention tips"""
        tips = [
            'Use certified disease-free seeds',
            'Maintain proper plant spacing',
            'Practice field sanitation',
            'Use balanced fertilization',
            'Implement crop rotation',
            'Monitor fields regularly',
            'Encourage natural enemies',
            'Avoid water stagnation',
            'Remove weed hosts',
            'Use resistant varieties'
        ]
        
        if pest_name:
            pest_info = self.get_pest_info(pest_name)
            if pest_info:
                return pest_info.get('management', tips)
        
        return tips

# Singleton instance
pest_library = PestLibrary()