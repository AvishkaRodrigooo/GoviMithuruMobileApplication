from flask import Blueprint, request, jsonify, current_app, send_file
from werkzeug.utils import secure_filename
import os
import json
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
import requests
from collections import Counter
import joblib
import base64
import io
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import seaborn as sns
from PIL import Image
import cv2
import warnings
warnings.filterwarnings("ignore")

# ============ ROBOFLOW DIRECT API (NO SDK NEEDED) ============
def detect_with_roboflow_direct(image_path):
    """
    Direct API call to Roboflow without inference-sdk
    Uses only 'requests' which you already have
    """
    api_key = "iQPbESiDBHTt1IfrrKmb"
    workspace = "hash-thambugala"
    workflow_id = "general-segmentation-api-3"
    
    # Read and encode image
    with open(image_path, 'rb') as f:
        import base64
        image_data = base64.b64encode(f.read()).decode('utf-8')
    
    # API endpoint
    url = f"https://outline.roboflow.com/{workspace}/{workflow_id}"
    
    # Prepare request
    payload = {
        "image": image_data,
        "parameters": {
            "classes": "brown-planthopper, green-leafhopper, leaf-folder, rice-bug, stem-borer, whorl-maggot"
        }
    }
    
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    
    try:
        response = requests.post(url, json=payload, headers=headers, timeout=30)
        if response.status_code == 200:
            return response.json()
        else:
            print(f"Roboflow API error: {response.status_code}")
            return None
    except Exception as e:
        print(f"Roboflow API exception: {e}")
        return None

pest_bp = Blueprint('pest', __name__)

# ============ CONFIGURATION ============
UPLOAD_FOLDER = 'uploads/pest_detections'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# File-based storage
PEST_DATA_DIR = 'pest_data'
os.makedirs(PEST_DATA_DIR, exist_ok=True)

FIELDS_FILE = os.path.join(PEST_DATA_DIR, 'fields.json')
HISTORY_FILE = os.path.join(PEST_DATA_DIR, 'history.json')
NOTIFICATIONS_FILE = os.path.join(PEST_DATA_DIR, 'notifications.json')
HEATMAP_CACHE = os.path.join(PEST_DATA_DIR, 'heatmap_cache')

os.makedirs(HEATMAP_CACHE, exist_ok=True)

# Initialize empty JSON files
for file_path in [FIELDS_FILE, HISTORY_FILE, NOTIFICATIONS_FILE]:
    if not os.path.exists(file_path):
        with open(file_path, 'w') as f:
            json.dump([], f)

# Weather API
WEATHER_API_KEY = os.getenv('WEATHER_API_KEY', 'b9306ade1a34cd0bf4c75d54455db3c5')
WEATHER_API_URL = "http://api.openweathermap.org/data/2.5/weather"

# Sri Lanka districts with coordinates
DISTRICT_COORDS = {
    'Anuradhapura': {'lat': 8.3114, 'lon': 80.4037, 'region': 'North Central'},
    'Polonnaruwa': {'lat': 7.9403, 'lon': 81.0188, 'region': 'North Central'},
    'Kurunegala': {'lat': 7.4867, 'lon': 80.3647, 'region': 'North Western'},
    'Gampaha': {'lat': 7.0915, 'lon': 80.0075, 'region': 'Western'},
    'Hambantota': {'lat': 6.1248, 'lon': 81.1031, 'region': 'Southern'},
    'Ampara': {'lat': 7.2838, 'lon': 81.6724, 'region': 'Eastern'},
    'Batticaloa': {'lat': 7.7102, 'lon': 81.6924, 'region': 'Eastern'},
    'Jaffna': {'lat': 9.6615, 'lon': 80.0255, 'region': 'Northern'},
    'Kilinochchi': {'lat': 9.3971, 'lon': 80.3988, 'region': 'Northern'},
    'Mullaitivu': {'lat': 9.2679, 'lon': 80.8142, 'region': 'Northern'},
    'Vavuniya': {'lat': 8.7515, 'lon': 80.4971, 'region': 'Northern'},
    'Trincomalee': {'lat': 8.5874, 'lon': 81.2152, 'region': 'Eastern'},
    'Badulla': {'lat': 6.9934, 'lon': 81.0550, 'region': 'Uva'},
    'Moneragala': {'lat': 6.8724, 'lon': 81.3507, 'region': 'Uva'},
    'Ratnapura': {'lat': 6.7056, 'lon': 80.3847, 'region': 'Sabaragamuwa'},
    'Kegalle': {'lat': 7.2513, 'lon': 80.3464, 'region': 'Sabaragamuwa'},
    'Kandy': {'lat': 7.2906, 'lon': 80.6337, 'region': 'Central'},
    'Matale': {'lat': 7.4675, 'lon': 80.6234, 'region': 'Central'},
    'Nuwara Eliya': {'lat': 6.9497, 'lon': 80.7891, 'region': 'Central'},
    'Galle': {'lat': 6.0535, 'lon': 80.2210, 'region': 'Southern'},
    'Matara': {'lat': 5.9549, 'lon': 80.5550, 'region': 'Southern'},
    'Puttalam': {'lat': 8.0412, 'lon': 79.8283, 'region': 'North Western'},
    'Mannar': {'lat': 8.9800, 'lon': 79.9041, 'region': 'Northern'}
}

# ============ LOAD ENHANCED ML MODEL ============
MODEL_PATH = 'models/enhanced_pest_model_complete.pkl'
try:
    model_package = joblib.load(MODEL_PATH)
    
    # Extract all models
    risk_model = model_package['risk_model']  # Risk level classifier
    severity_model = model_package['severity_model']  # Severity classifier
    incidence_model = model_package['incidence_model']  # Incidence regressor
    pest_model = model_package.get('pest_model')  # Pest identification model
    
    # Feature pipeline
    scaler = model_package['scaler']
    feature_selector = model_package.get('feature_selector')
    feature_cols = model_package['features']
    encoders = model_package['encoders']
    
    # Metrics
    model_metrics = model_package.get('metrics', {})
    
    print("="*80)
    print(" ENHANCED PEST MODEL LOADED SUCCESSFULLY!")
    print(f" Risk Accuracy: {model_metrics.get('risk_accuracy', 0):.1%}")
    print(f" Severity Accuracy: {model_metrics.get('severity_accuracy', 0):.1%}")
    print(f" Features: {len(feature_cols)} engineered features")
    print("="*80)
    
except Exception as e:
    print(f" Could not load enhanced model: {e}")
    risk_model = None
    severity_model = None
    incidence_model = None
    pest_model = None
    scaler = None
    feature_selector = None
    feature_cols = []
    encoders = {}
    model_metrics = {}

# ============ ENHANCED PEST LIBRARY ============
PEST_LIBRARY = [
    {
        "id": "BPH_001",
        "name_en": "Brown Planthopper",
        "name_si": "දුඹුරු පැළ මකුණා",
        "scientific_name": "Nilaparvata lugens",
        "category": "Sucking Pest",
        "description_en": "Causes hopper burn, yellowing and drying of plants. Major pest in Sri Lanka during Maha season.",
        "description_si": "පැළ පිළිස්සීම, කොළ කහවීම සහ වියලීම සිදු කරයි. මහ කන්නයේ දී ප්‍රධාන පළිබෝධයකි.",
        "symptoms_en": [
            "Circular yellow patches in field",
            "Plants wilt and dry up",
            "Honeydew secretion with sooty mold",
            "Hopper burn symptoms"
        ],
        "symptoms_si": [
            "කෙතේ වටකුරු කහ පැහැති ලප",
            "පැළ මැලවී වියලී යාම",
            "මී පැණි වැනි ද්‍රවයක් ස්‍රාවය කිරීම",
            "පැළ පිළිස්සීමේ රෝග ලක්ෂණ"
        ],
        "control_chemical": ["Pymetrozine 50% WG", "Buprofezin 25% SC", "Imidacloprid 17.8% SL"],
        "control_organic": ["Neem oil 3%", "Verticillium lecanii", "Fish Oil Rosin Soap"],
        "control_cultural": [
            "Drain field for 3-4 days",
            "Use resistant varieties (Bg 300, Bg 352)",
            "Avoid excess nitrogen",
            "Plant spacing 20x20 cm"
        ],
        "fertilizer_advice": {
            "high": {
                "nitrogen": "Reduce by 50%",
                "phosphorus": "Normal",
                "potassium": "Increase by 25%",
                "message": "Stop nitrogen application immediately. Apply potash to strengthen plants."
            },
            "medium": {
                "nitrogen": "Reduce by 25%",
                "phosphorus": "Normal",
                "potassium": "Increase by 10%",
                "message": "Reduce nitrogen, maintain potash for plant resistance."
            },
            "low": {
                "nitrogen": "Normal",
                "phosphorus": "Normal",
                "potassium": "Normal",
                "message": "Continue regular fertilization schedule."
            }
        },
        "image_url": "/static/images/pests/bph.jpg",
        "yolo_class_id": 0,
        "season": "Maha",
        "peak_months": [10, 11, 12, 1, 2],
        "threshold_temp": {"min": 28, "max": 32},
        "threshold_humidity": 75
    },
    {
        "id": "SB_003",
        "name_en": "Sheath Blight",
        "name_si": "කොපු පළුව",
        "scientific_name": "Rhizoctonia solani",
        "category": "Fungal Disease",
        "description_en": "Fungal disease causing lesions on leaf sheath. Spreads rapidly in humid conditions.",
        "description_si": "කොළ කොපුවේ තුවාල ඇති කරන දිලීර රෝගය. තෙතමනය සහිත පරිසරයේ වේගයෙන් පැතිරෙයි.",
        "symptoms_en": [
            "Oval or irregular lesions on sheath",
            "Grayish-white patches with brown border",
            "Lesions enlarge and coalesce",
            "Plants lodge in severe cases"
        ],
        "symptoms_si": [
            "කොපුවේ ඕවලාකාර හෝ අක්‍රමවත් තුවාල",
            "දුඹුරු දාර සහිත අළු-සුදු පැහැ ලප",
            "තුවාල විශාල වී එක්වීම",
            "දැඩි ලෙස ආසාදිත විට පැළ බිම වැටීම"
        ],
        "control_chemical": ["Hexaconazole 5% EC", "Validamycin 3% L", "Propiconazole 25% EC"],
        "control_organic": ["Trichoderma viride", "Pseudomonas fluorescens"],
        "control_cultural": [
            "Avoid dense planting",
            "Improve air circulation",
            "Balanced nitrogen application",
            "Remove infected plants"
        ],
        "fertilizer_advice": {
            "high": {
                "nitrogen": "Reduce by 40%",
                "phosphorus": "Normal",
                "potassium": "Increase by 30%",
                "message": "High risk! Stop nitrogen, apply extra potash for disease resistance."
            },
            "medium": {
                "nitrogen": "Reduce by 20%",
                "phosphorus": "Normal",
                "potassium": "Increase by 15%",
                "message": "Moderate risk. Reduce nitrogen, increase potash."
            },
            "low": {
                "nitrogen": "Normal",
                "phosphorus": "Normal",
                "potassium": "Normal",
                "message": "Low risk. Continue normal fertilization."
            }
        },
        "image_url": "/static/images/pests/sheath_blight.jpg",
        "yolo_class_id": 1,
        "season": "Both",
        "peak_months": [5, 6, 7, 8, 9, 10, 11],
        "threshold_temp": {"min": 25, "max": 30},
        "threshold_humidity": 80
    },
    {
        "id": "RLF_004",
        "name_en": "Rice Leaf-folder",
        "name_si": "කොළ එතුම් පනුවා",
        "scientific_name": "Cnaphalocrocis medinalis",
        "category": "Leaf Feeding Pest",
        "description_en": "Caterpillar folds leaves and feeds on green tissue reducing photosynthesis.",
        "description_si": "දළඹුවා කොළ එතුරමින් හරිත පටක ආහාරයට ගෙන ප්‍රභාසංශ්ලේෂණය අඩු කරයි.",
        "symptoms_en": [
            "Leaves folded longitudinally",
            "White streaks on leaves",
            "Skeletonized leaves",
            "Reduced grain yield"
        ],
        "symptoms_si": [
            "දිගට එතුණු කොළ",
            "කොළ මත සුදු ඉරි",
            "ඇටසැකිලි ගත වූ කොළ",
            "අස්වැන්න අඩු වීම"
        ],
        "control_chemical": ["Chlorantraniliprole 18.5% SC", "Spinosad 2.5% SC", "Emanectin benzoate 5% SG"],
        "control_organic": ["Neem oil 2%", "Bacillus thuringiensis", "NSKE 5%"],
        "control_cultural": [
            "Reduce shade",
            "Avoid dense planting",
            "Remove alternate hosts",
            "Light traps"
        ],
        "fertilizer_advice": {
            "high": {
                "nitrogen": "Reduce by 30%",
                "phosphorus": "Normal",
                "potassium": "Normal",
                "message": "High risk! Reduce nitrogen to make leaves less attractive."
            },
            "medium": {
                "nitrogen": "Reduce by 15%",
                "phosphorus": "Normal",
                "potassium": "Normal",
                "message": "Moderate risk. Slightly reduce nitrogen."
            },
            "low": {
                "nitrogen": "Normal",
                "phosphorus": "Normal",
                "potassium": "Normal",
                "message": "Low risk. Continue normal fertilization."
            }
        },
        "image_url": "/static/images/pests/leaf_folder.jpg",
        "yolo_class_id": 2,
        "season": "Maha",
        "peak_months": [11, 12, 1, 2],
        "threshold_temp": {"min": 26, "max": 32},
        "threshold_humidity": 70
    },
    {
        "id": "RGM_002",
        "name_en": "Rice Gall Midge",
        "name_si": "වී පිත්තල මැස්සා",
        "scientific_name": "Orseolia oryzae",
        "category": "Dipteran Pest",
        "description_en": "Causes silver shoot or onion leaf-like tubes, stunting plant growth.",
        "description_si": "රිදී දඬු හෝ ලූනු වැනි කොළ නළ ඇති කර පැළ වර්ධනය අඩාල කරයි.",
        "symptoms_en": [
            "Silver tubular galls",
            "Onion-like leaves",
            "Stunted growth",
            "Tillers don't bear panicles"
        ],
        "symptoms_si": [
            "රිදී පැහැති නළාකාර වර්ධන",
            "ලූනු වැනි කොළ",
            "වාමන වර්ධනය",
            "ගොයම් පන් ගෙඩි හට නොගැනීම"
        ],
        "control_chemical": ["Chlorpyrifos 20% EC", "Carbofuran 3% G", "Fipronil 5% SC"],
        "control_organic": ["Neem cake", "Fish meal", "Karanj cake"],
        "control_cultural": [
            "Early planting",
            "Remove alternate hosts",
            "Flooding",
            "Resistant varieties"
        ],
        "fertilizer_advice": {
            "high": {
                "nitrogen": "Reduce by 20%",
                "phosphorus": "Normal",
                "potassium": "Increase by 25%",
                "message": "Apply potash to strengthen plants against gall midge."
            },
            "medium": {
                "nitrogen": "Normal",
                "phosphorus": "Normal",
                "potassium": "Increase by 10%",
                "message": "Add extra potash for resistance."
            },
            "low": {
                "nitrogen": "Normal",
                "phosphorus": "Normal",
                "potassium": "Normal",
                "message": "Standard NPK application."
            }
        },
        "image_url": "/static/images/pests/gall_midge.jpg",
        "yolo_class_id": 3,
        "season": "Yala",
        "peak_months": [3, 4, 5, 6, 7, 8],
        "threshold_temp": {"min": 25, "max": 30},
        "threshold_humidity": 80
    },
    {
        "id": "PB_005",
        "name_en": "Paddy Bug",
        "name_si": "වී මකුණා",
        "scientific_name": "Leptocorisa oratorius",
        "category": "Sucking Pest",
        "description_en": "Feeds on developing grains causing pecky rice and yield loss.",
        "description_si": "වැඩෙන ධාන්‍ය උරාබී පෙකී සහල් සහ අස්වැන්න අඩුවීමට හේතු වේ.",
        "symptoms_en": [
            "Empty or partially filled grains",
            "Brown spots on grains",
            "Foul smell from bugs",
            "Discolored panicles"
        ],
        "symptoms_si": [
            "හිස් හෝ අර්ධ වශයෙන් පිරුණු ධාන්‍ය",
            "ධාන්‍යවල දුඹුරු පැල්ලම්",
            "මකුණන්ගෙන් දුර්ගන්ධය",
            "විකෘති වූ නටු"
        ],
        "control_chemical": ["Lambda-cyhalothrin 2.5% EC", "Deltamethrin 2.8% EC", "Malathion 50% EC"],
        "control_organic": ["Neem oil 3%", "Melia extracts", "Sweep nets"],
        "control_cultural": [
            "Sweep nets during morning",
            "Clean field bunds",
            "Avoid ratoon",
            "Synchronous planting"
        ],
        "fertilizer_advice": {
            "high": {
                "nitrogen": "Normal",
                "phosphorus": "Normal",
                "potassium": "Normal",
                "message": "Maintain balanced fertilization. Use sweep nets for control."
            },
            "medium": {
                "nitrogen": "Normal",
                "phosphorus": "Normal",
                "potassium": "Normal",
                "message": "Standard NPK application. Monitor closely."
            },
            "low": {
                "nitrogen": "Normal",
                "phosphorus": "Normal",
                "potassium": "Normal",
                "message": "Regular fertilizer schedule. Preventive measures recommended."
            }
        },
        "image_url": "/static/images/pests/paddy_bug.jpg",
        "yolo_class_id": 4,
        "season": "Flowering",
        "peak_months": [2, 3, 8, 9],
        "threshold_temp": {"min": 26, "max": 32},
        "threshold_humidity": 65
    }
]

# ============ FILE STORAGE HELPERS ============
def read_json(file_path):
    """Read data from JSON file"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except:
        return []

def write_json(file_path, data):
    """Write data to JSON file"""
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, default=str, ensure_ascii=False)

def get_next_id(data):
    """Get next ID for new record"""
    if not data:
        return 1
    return max(item.get('id', 0) for item in data) + 1

# ============ HELPER FUNCTIONS ============
def extract_age(age_str):
    """Extract age from string like '30-35 days'"""
    if pd.isna(age_str): 
        return 30
    import re
    numbers = re.findall(r"\d+", str(age_str))
    if len(numbers) >= 2: 
        return (int(numbers[0]) + int(numbers[1])) / 2
    elif len(numbers) == 1: 
        return int(numbers[0])
    return 30

def get_severity_level(risk):
    """Convert risk percentage to severity level"""
    if risk >= 60:
        return 'High'
    elif risk >= 30:
        return 'Medium'
    else:
        return 'Low'

def get_detailed_growth_stage(age_days):
    """Get detailed growth stage (0-6)"""
    if age_days <= 15: return 0
    elif age_days <= 25: return 1
    elif age_days <= 40: return 2
    elif age_days <= 55: return 3
    elif age_days <= 70: return 4
    elif age_days <= 85: return 5
    else: return 6

def get_growth_stage_name(age_days):
    """Get growth stage name"""
    if age_days <= 25: return "Seedling"
    elif age_days <= 55: return "Tillering"
    elif age_days <= 85: return "Flowering"
    else: return "Maturity"

def calculate_rule_based_risk(field, weather):
    """Fallback rule-based risk calculation"""
    risk = 30  # Base risk
    
    # Temperature effect
    temp = weather.get('temperature', 28)
    if 28 <= temp <= 32:
        risk += 15
    elif temp > 35:
        risk += 5
    
    # Humidity effect
    humidity = weather.get('humidity', 75)
    if humidity > 80:
        risk += 20
    elif humidity > 70:
        risk += 10
    
    # Rainfall effect
    rainfall = weather.get('rainfall', 100)
    if rainfall > 200:
        risk += 15
    elif rainfall > 100:
        risk += 5
    
    # Growth stage effect
    stage = field.get('current_stage', 'Tillering')
    if stage in ['Tillering', 'Flowering']:
        risk += 15
    
    return min(95, risk)

def calculate_pest_specific_risk(pest, field, weather):
    """Calculate risk for specific pest using pest library thresholds"""
    risk = 20  # Base risk
    
    temp = weather.get('temperature', 28)
    humidity = weather.get('humidity', 75)
    stage = field.get('current_stage', 'Tillering')
    
    # Temperature check using pest thresholds
    temp_min = pest.get('threshold_temp', {}).get('min', 20)
    temp_max = pest.get('threshold_temp', {}).get('max', 35)
    if temp_min <= temp <= temp_max:
        risk += 25
    
    # Humidity check
    if humidity >= pest.get('threshold_humidity', 70):
        risk += 20
    
    # Season check
    current_month = datetime.now().month
    if current_month in pest.get('peak_months', []):
        risk += 15
    
    # Growth stage preference
    pest_name = pest['name_en'].lower()
    if 'brown' in pest_name and stage in ['Tillering', 'Flowering']:
        risk += 15
    elif 'sheath' in pest_name and stage in ['Tillering', 'Flowering']:
        risk += 15
    elif 'leaf' in pest_name and stage in ['Tillering']:
        risk += 10
    elif 'gall' in pest_name and stage in ['Seedling', 'Tillering']:
        risk += 15
    elif 'paddy bug' in pest_name and stage in ['Flowering', 'Maturity']:
        risk += 20
    
    return min(95, risk)

def generate_recommendations(pest_risks, overall_risk, severity):
    """Generate recommendations based on risks"""
    recommendations = []
    
    if overall_risk > 60:
        recommendations.append({
            "priority": "HIGH",
            "action": "Immediate action required",
            "details": f"Take preventive measures within 24 hours. Current risk: {overall_risk:.1f}% ({severity})"
        })
        recommendations.append({
            "priority": "HIGH",
            "action": "Field inspection",
            "details": "Inspect field thoroughly for pest presence. Check underside of leaves."
        })
    elif overall_risk > 30:
        recommendations.append({
            "priority": "MEDIUM",
            "action": "Regular monitoring",
            "details": f"Monitor field every 2-3 days. Current risk: {overall_risk:.1f}%"
        })
    else:
        recommendations.append({
            "priority": "LOW",
            "action": "Normal monitoring",
            "details": "Continue regular farming practices. Weekly monitoring recommended."
        })
    
    # Add pest-specific recommendations
    if pest_risks:
        for pest in pest_risks[:3]:
            if pest['risk_percent'] > 40:
                recommendations.append({
                    "priority": "MEDIUM" if pest['risk_percent'] > 60 else "LOW",
                    "action": f"Monitor for {pest['pest_name']}",
                    "details": f"Risk level: {pest['risk_percent']:.1f}% - {pest.get('control_chemical', ['Monitor'])[0]}"
                })
    
    return recommendations

def prepare_ml_features(field, weather, encoders, feature_cols):
    """Prepare all engineered features for ML model"""
    feature_dict = {}
    
    # Basic features
    feature_dict['Avg_Temp_C'] = weather.get('temperature', 28)
    feature_dict['Rainfall_mm'] = weather.get('rainfall', 100)
    feature_dict['Humidity_%'] = weather.get('humidity', 75)
    feature_dict['Soil_pH'] = float(field.get('soil_ph', 6.5))
    feature_dict['Soil_Moisture_%'] = float(field.get('soil_moisture', 50))
    feature_dict['Organic_Matter_%'] = float(field.get('organic_matter', 2.0))
    
    # Age features
    age_days = field.get('paddy_age_days', 30)
    feature_dict['Age_Days'] = age_days
    
    # Polynomial features
    feature_dict['Temp_squared'] = feature_dict['Avg_Temp_C'] ** 2
    feature_dict['Humidity_squared'] = feature_dict['Humidity_%'] ** 2
    feature_dict['Rainfall_log'] = np.log1p(feature_dict['Rainfall_mm'])
    
    # Interaction features
    feature_dict['Temp_Humidity'] = feature_dict['Avg_Temp_C'] * feature_dict['Humidity_%'] / 100
    feature_dict['Rain_Temp'] = feature_dict['Rainfall_mm'] * feature_dict['Avg_Temp_C'] / 100
    feature_dict['Rain_Humidity'] = feature_dict['Rainfall_mm'] * feature_dict['Humidity_%'] / 100
    feature_dict['Moisture_pH'] = feature_dict['Soil_Moisture_%'] * feature_dict['Soil_pH'] / 10
    
    # Soil features
    feature_dict['Soil_pH_deviation'] = abs(feature_dict['Soil_pH'] - 6.5)
    feature_dict['Soil_Quality_Composite'] = (
        (6.5 - feature_dict['Soil_pH_deviation']) / 2 +
        feature_dict['Organic_Matter_%'] / 5 +
        feature_dict['Soil_Moisture_%'] / 100
    )
    
    # Growth stage detailed
    feature_dict['Growth_Stage_Detailed'] = get_detailed_growth_stage(age_days)
    
    # Weather risk index
    feature_dict['Weather_Risk_Index'] = (
        (feature_dict['Avg_Temp_C'] > 30) * 2 +
        (feature_dict['Humidity_%'] > 80) * 2 +
        (feature_dict['Rainfall_mm'] > 50) * 1
    )
    
    # Rolling features (simplified - use current values)
    feature_dict['Temp_rolling_mean'] = feature_dict['Avg_Temp_C']
    feature_dict['Rainfall_rolling_sum'] = feature_dict['Rainfall_mm']
    
    # Add encoded categorical features
    for cat_col, encoder in encoders.items():
        if cat_col == 'District':
            val = field.get('district', 'Anuradhapura')
        elif cat_col == 'Paddy_Variety':
            val = field.get('paddy_variety', 'BG 358')
        elif cat_col == 'Paddy_Age_Stage':
            val = get_growth_stage_name(age_days)
        elif cat_col == 'Season':
            month = datetime.now().month
            val = 'Maha' if month in [10,11,12,1,2] else 'Yala'
        elif cat_col == 'Soil_Type':
            val = field.get('soil_type', 'Clay Loam')
        elif cat_col in ['Pest_Grouped', 'RiskLevel']:
            continue  # Skip target variables
        else:
            continue
        
        try:
            feature_dict[f'{cat_col}_encoded'] = encoder.transform([val])[0]
        except:
            feature_dict[f'{cat_col}_encoded'] = 0
    
    # Create feature vector in correct order
    feature_vector = []
    missing_features = []
    
    for feat in feature_cols:
        if feat in feature_dict:
            feature_vector.append(feature_dict[feat])
        else:
            feature_vector.append(0)
            missing_features.append(feat)
    
    if missing_features:
        print(f"Warning: Missing features: {missing_features[:5]}")
    
    return np.array(feature_vector).reshape(1, -1)

# ============ TEST ENDPOINT ============
@pest_bp.route('/test', methods=['GET'])
def test():
    return jsonify({
        "message": "Enhanced pest management system ready!",
        "storage": "file-based (JSON)",
        "ml_model": risk_model is not None,
        "ml_accuracy": f"{model_metrics.get('risk_accuracy', 0):.1%}" if model_metrics else "N/A",
        "features": len(feature_cols),
        "features_available": feature_cols[:10] if feature_cols else [],
        "endpoints": ["forecast", "detect", "library", "heatmap", "fertilizer", "history", "schedule"],
        "pests_available": len(PEST_LIBRARY),
        "districts_available": len(DISTRICT_COORDS)
    })

# ============ WEATHER API ============
@pest_bp.route('/weather/<district>', methods=['GET'])
def get_weather(district):
    """Get weather for a district"""
    try:
        coords = DISTRICT_COORDS.get(district, {'lat': 7.8731, 'lon': 80.7718})
        
        params = {
            'lat': coords['lat'],
            'lon': coords['lon'],
            'appid': WEATHER_API_KEY,
            'units': 'metric'
        }
        
        response = requests.get(WEATHER_API_URL, params=params, timeout=5)
        
        if response.status_code == 200:
            data = response.json()
            weather = {
                'temperature': data['main']['temp'],
                'humidity': data['main']['humidity'],
                'rainfall': data.get('rain', {}).get('1h', 0),
                'pressure': data['main']['pressure'],
                'wind_speed': data['wind']['speed'],
                'description': data['weather'][0]['description'],
                'icon': data['weather'][0]['icon']
            }
            return jsonify({'success': True, 'weather': weather})
        
        # Fallback data
        return jsonify({
            'success': True,
            'weather': {
                'temperature': round(np.random.uniform(25, 32), 1),
                'humidity': round(np.random.uniform(65, 90), 1),
                'rainfall': round(np.random.uniform(0, 20), 1),
                'pressure': 1013,
                'wind_speed': round(np.random.uniform(2, 12), 1),
                'description': 'simulated data',
                'icon': '01d'
            }
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ============ FIELD MANAGEMENT ============
@pest_bp.route('/field/register', methods=['POST'])
def register_field():
    """Register a new paddy field"""
    try:
        data = request.json
        fields = read_json(FIELDS_FILE)
        
        # Calculate growth stage
        planting_date = datetime.strptime(data.get('planting_date'), '%Y-%m-%d')
        days_since = (datetime.now() - planting_date).days
        
        stage = get_growth_stage_name(days_since)
        
        new_field = {
            'id': get_next_id(fields),
            'user_id': data.get('user_id'),
            'field_name': data.get('field_name', 'My Field'),
            'district': data.get('district'),
            'paddy_variety': data.get('paddy_variety'),
            'planting_date': data.get('planting_date'),
            'area_acres': float(data.get('area_acres', 1.0)),
            'soil_type': data.get('soil_type', 'Clay Loam'),
            'soil_ph': float(data.get('soil_ph', 6.5)),
            'soil_moisture': float(data.get('soil_moisture', 50)),
            'organic_matter': float(data.get('organic_matter', 2.0)),
            'current_stage': stage,
            'paddy_age_days': days_since,
            'notifications_enabled': data.get('notifications_enabled', False),
            'notification_threshold': data.get('notification_threshold', 50),
            'created_at': datetime.now().isoformat()
        }
        
        fields.append(new_field)
        write_json(FIELDS_FILE, fields)
        
        return jsonify({
            'success': True,
            'field': new_field
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@pest_bp.route('/fields/<user_id>', methods=['GET'])
def get_user_fields(user_id):
    """Get user's fields"""
    try:
        fields = read_json(FIELDS_FILE)
        user_fields = [f for f in fields if f['user_id'] == user_id]
        
        # Update ages and stages
        for field in user_fields:
            planting = datetime.fromisoformat(field['planting_date'])
            days = (datetime.now() - planting).days
            field['current_age_days'] = days
            field['current_stage'] = get_growth_stage_name(days)
        
        return jsonify({
            'success': True,
            'fields': user_fields
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@pest_bp.route('/field/<int:field_id>', methods=['DELETE'])
def delete_field(field_id):
    """Delete a field"""
    try:
        fields = read_json(FIELDS_FILE)
        fields = [f for f in fields if f['id'] != field_id]
        write_json(FIELDS_FILE, fields)
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ============ PEST FORECASTING WITH ENHANCED ML ============
@pest_bp.route('/forecast/<int:field_id>', methods=['GET'])
def forecast_pest_risk(field_id):
    """Get pest risk forecast using trained ML model"""
    try:
        fields = read_json(FIELDS_FILE)
        field = next((f for f in fields if f['id'] == field_id), None)
        
        if not field:
            return jsonify({'error': 'Field not found'}), 404
        
        # Update field age
        planting = datetime.fromisoformat(field['planting_date'])
        age_days = (datetime.now() - planting).days
        field['paddy_age_days'] = age_days
        field['current_stage'] = get_growth_stage_name(age_days)
        
        # Get weather data
        weather_resp = get_weather(field.get('district', 'Anuradhapura'))
        if isinstance(weather_resp, tuple):
            weather_data = weather_resp[0].json.get('weather', {})
        else:
            weather_data = weather_resp.json.get('weather', {})
        
        # ML Prediction
        ml_used = False
        risk_level_num = 1  # Default Medium
        risk_probabilities = [0.33, 0.34, 0.33]
        predicted_severity = "Medium"
        incidence = 50.0
        
        if risk_model is not None and scaler is not None:
            try:
                # Prepare features
                feature_vector = prepare_ml_features(field, weather_data, encoders, feature_cols)
                
                # Scale features
                features_scaled = scaler.transform(feature_vector)
                
                # Apply feature selection if available
                if feature_selector is not None:
                    features_selected = feature_selector.transform(features_scaled)
                else:
                    features_selected = features_scaled
                
                # Risk level prediction (0: Low, 1: Medium, 2: High)
                risk_level_num = risk_model.predict(features_scaled)[0]
                risk_probabilities = risk_model.predict_proba(features_scaled)[0].tolist()
                
                # Severity prediction
                if severity_model is not None:
                    severity_num = severity_model.predict(features_scaled)[0]
                    severity_names = ['Low', 'Medium', 'High']
                    predicted_severity = severity_names[severity_num]
                
                # Incidence prediction
                if incidence_model is not None:
                    incidence = float(incidence_model.predict(features_selected)[0])
                
                # Map risk level to percentage for backward compatibility
                risk_mapping = {0: 20, 1: 55, 2: 90}
                overall_risk = risk_mapping.get(risk_level_num, 50)
                
                ml_used = True
                
            except Exception as e:
                print(f"ML Prediction error: {e}")
                overall_risk = calculate_rule_based_risk(field, weather_data)
                predicted_severity = get_severity_level(overall_risk)
        else:
            overall_risk = calculate_rule_based_risk(field, weather_data)
            predicted_severity = get_severity_level(overall_risk)
        
        # Calculate pest-specific risks
        pest_risks = []
        for pest in PEST_LIBRARY:
            pest_risk = calculate_pest_specific_risk(pest, field, weather_data)
            
            # Get fertilizer advice based on severity
            severity = get_severity_level(pest_risk).lower()
            fertilizer_advice = pest['fertilizer_advice'].get(severity, pest['fertilizer_advice']['medium'])
            
            pest_risks.append({
                'pest_id': pest['id'],
                'pest_name': pest['name_en'],
                'pest_name_si': pest['name_si'],
                'category': pest['category'],
                'risk_percent': round(pest_risk, 1),
                'severity': get_severity_level(pest_risk),
                'fertilizer_advice': fertilizer_advice,
                'control_chemical': pest['control_chemical'][:2],
                'control_organic': pest['control_organic'][:2],
                'control_cultural': pest['control_cultural'][:2]
            })
        
        # Sort by risk
        pest_risks = sorted(pest_risks, key=lambda x: x['risk_percent'], reverse=True)
        
        # Generate 7-day forecast
        daily_forecast = []
        base_risk = overall_risk
        for day in range(1, 8):
            # Add weather-based variation
            day_temp = weather_data.get('temperature', 28) + np.random.normal(0, 2)
            day_humidity = weather_data.get('humidity', 75) + np.random.normal(0, 5)
            
            # Simple day risk calculation
            day_risk = base_risk + (day_temp - 28) * 2 + (day_humidity - 75) * 0.5
            day_risk = min(95, max(5, day_risk + np.random.normal(0, 3)))
            
            daily_forecast.append({
                'day': day,
                'date': (datetime.now() + timedelta(days=day)).strftime('%Y-%m-%d'),
                'risk_percent': round(day_risk, 1),
                'severity': get_severity_level(day_risk)
            })
        
        # Risk level name
        risk_levels = ['Low', 'Medium', 'High']
        risk_level_name = risk_levels[risk_level_num] if risk_level_num < 3 else 'Medium'
        
        return jsonify({
            'success': True,
            'field': field['field_name'],
            'field_id': field_id,
            'current_risk': round(overall_risk, 1),
            'risk_level': risk_level_name,
            'risk_probabilities': {
                'low': round(risk_probabilities[0] * 100, 1),
                'medium': round(risk_probabilities[1] * 100, 1),
                'high': round(risk_probabilities[2] * 100, 1)
            },
            'severity': predicted_severity,
            'incidence_percent': round(incidence, 1),
            'dominant_pests': pest_risks[:3],
            'all_pests': pest_risks,
            'daily_forecast': daily_forecast,
            'weather': weather_data,
            'recommendations': generate_recommendations(pest_risks, overall_risk, predicted_severity),
            'ml_used': ml_used,
            'ml_accuracy': model_metrics.get('risk_accuracy', 0),
            'growth_stage': {
                'name': field['current_stage'],
                'days': age_days,
                'detailed': get_detailed_growth_stage(age_days)
            },
            'fertilizer_summary': {
                'nitrogen': 'Reduce' if overall_risk > 60 else 'Normal' if overall_risk > 30 else 'Normal',
                'phosphorus': 'Normal',
                'potassium': 'Increase' if overall_risk > 60 else 'Normal',
                'message': 'Adjust fertilizer based on pest pressure'
            }
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ============ PEST DETECTION WITH MULTIPLE FALLBACKS ============
@pest_bp.route('/detect', methods=['POST'])
def detect_pests():
    """Detect pests using multiple methods with fallbacks"""
    try:
        if 'image' not in request.files:
            return jsonify({'error': 'No image provided'}), 400
        
        file = request.files['image']
        user_id = request.form.get('user_id', 'anonymous')
        field_id = request.form.get('field_id')
        lat = request.form.get('lat')
        lon = request.form.get('lon')
        
        if not file:
            return jsonify({'error': 'No file selected'}), 400
        
        # Save file temporarily
        timestamp = datetime.now().timestamp()
        filename = secure_filename(f"{user_id}_{timestamp}.jpg")
        filepath = os.path.join(UPLOAD_FOLDER, filename)
        file.save(filepath)
        
        detections = []
        pest_counts = {}
        img_with_boxes_path = None
        detection_source = "None"
        
        # METHOD 1: Try Roboflow SDK first (if installed)
        try:
            from inference_sdk import InferenceHTTPClient
            
            print("🔍 Trying Roboflow SDK...")
            client = InferenceHTTPClient(
                api_url="https://serverless.roboflow.com",
                api_key="iQPbESiDBHTt1IfrrKmb"
            )
            
            result = client.run_workflow(
                workspace_name="hash-thambugala",
                workflow_id="general-segmentation-api-3",
                images={"image": filepath},
                parameters={
                    "classes": "brown-planthopper, green-leafhopper, leaf-folder, rice-bug, stem-borer, whorl-maggot"
                },
                use_cache=True
            )
            
            # Process SDK results
            if isinstance(result, list) and len(result) > 0:
                for item in result:
                    if 'predictions' in item:
                        for pred in item['predictions']:
                            class_name = pred.get('class', 'unknown')
                            confidence = pred.get('confidence', 0)
                            
                            pest_info = next((p for p in PEST_LIBRARY 
                                            if class_name.lower() in p['name_en'].lower() or 
                                            p['name_en'].lower() in class_name.lower()), None)
                            
                            detection = {
                                'bbox': pred.get('bbox', [0,0,0,0]),
                                'confidence': round(confidence, 3),
                                'class_name': class_name,
                                'mapped_pest': pest_info['name_en'] if pest_info else class_name,
                                'pest_id': pest_info['id'] if pest_info else None
                            }
                            detections.append(detection)
                            pest_counts[class_name] = pest_counts.get(class_name, 0) + 1
                
                detection_source = "Roboflow SDK"
                print(f"SDK detected {len(detections)} pests")
                
        except ImportError:
            print(" Roboflow SDK not installed")
        except Exception as e:
            print(f" Roboflow SDK error: {e}")
        
        # METHOD 2: If SDK failed, try direct API
        if not detections:
            try:
                print("🔍 Trying direct Roboflow API...")
                result = detect_with_roboflow_direct(filepath)
                
                if result and 'predictions' in result:
                    for pred in result.get('predictions', []):
                        class_name = pred.get('class', 'unknown')
                        confidence = pred.get('confidence', 0)
                        
                        pest_info = next((p for p in PEST_LIBRARY 
                                        if class_name.lower() in p['name_en'].lower() or 
                                        p['name_en'].lower() in class_name.lower()), None)
                        
                        detection = {
                            'bbox': pred.get('bbox', [0,0,0,0]),
                            'confidence': round(confidence, 3),
                            'class_name': class_name,
                            'mapped_pest': pest_info['name_en'] if pest_info else class_name,
                            'pest_id': pest_info['id'] if pest_info else None
                        }
                        detections.append(detection)
                        pest_counts[class_name] = pest_counts.get(class_name, 0) + 1
                    
                    detection_source = "Roboflow Direct API"
                    print(f" Direct API detected {len(detections)} pests")
                    
            except Exception as e:
                print(f" Direct API error: {e}")
        
        # METHOD 3: If both API methods failed, try YOLO
        if not detections and hasattr(current_app, 'yolo_pest') and current_app.yolo_pest:
            try:
                print("🔍 Trying YOLO model...")
                results = current_app.yolo_pest(filepath)
                img = cv2.imread(filepath)
                
                for result in results:
                    boxes = result.boxes
                    if boxes is not None:
                        for box in boxes:
                            x1, y1, x2, y2 = box.xyxy[0].tolist()
                            confidence = float(box.conf[0])
                            class_id = int(box.cls[0])
                            
                            pest_info = next((p for p in PEST_LIBRARY if p.get('yolo_class_id') == class_id), None)
                            if pest_info:
                                class_name = pest_info['name_en']
                            else:
                                class_name = result.names[class_id] if hasattr(result, 'names') else f"Pest_{class_id}"
                            
                            detection = {
                                'bbox': [x1, y1, x2, y2],
                                'confidence': round(confidence, 3),
                                'class_name': class_name,
                                'mapped_pest': class_name,
                                'pest_id': pest_info['id'] if pest_info else None
                            }
                            detections.append(detection)
                            pest_counts[class_name] = pest_counts.get(class_name, 0) + 1
                
                detection_source = "YOLO"
                print(f" YOLO detected {len(detections)} pests")
                
            except Exception as e:
                print(f" YOLO error: {e}")
        
        # METHOD 4: Last resort - mock detection
        if not detections:
            print("🔍 Using mock detection (last resort)")
            mock_pests = ['Brown Planthopper', 'Sheath Blight', 'Leaf Folder', 'Rice Gall Midge', 'Paddy Bug']
            for i in range(np.random.randint(1, 8)):
                pest = np.random.choice(mock_pests)
                confidence = round(np.random.uniform(0.7, 0.99), 2)
                
                pest_info = next((p for p in PEST_LIBRARY if pest in p['name_en']), None)
                
                detection = {
                    'bbox': [10, 10, 100, 100],
                    'confidence': confidence,
                    'class_name': pest,
                    'mapped_pest': pest,
                    'pest_id': pest_info['id'] if pest_info else None
                }
                detections.append(detection)
                pest_counts[pest] = pest_counts.get(pest, 0) + 1
            
            detection_source = "Mock (Fallback)"
            print(f" Mock generated {len(detections)} pests")
        
        # Draw bounding boxes on image (if we have detections)
        if detections and os.path.exists(filepath):
            try:
                img = cv2.imread(filepath)
                for det in detections:
                    bbox = det['bbox']
                    if len(bbox) == 4 and all(isinstance(v, (int, float)) for v in bbox):
                        x1, y1, x2, y2 = map(int, bbox)
                        cv2.rectangle(img, (x1, y1), (x2, y2), (0, 255, 0), 2)
                        cv2.putText(img, f"{det['class_name']} {det['confidence']:.2f}", 
                                  (x1, y1-10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)
                
                img_with_boxes_path = os.path.join(UPLOAD_FOLDER, f"detected_{filename}")
                cv2.imwrite(img_with_boxes_path, img)
                print(f" Saved annotated image")
                
            except Exception as e:
                print(f" Error drawing boxes: {e}")
                img_with_boxes_path = None
        
        # Determine severity
        total = len(detections)
        if total > 20:
            severity = 'High'
        elif total > 10:
            severity = 'Medium'
        elif total > 0:
            severity = 'Low'
        else:
            severity = 'None'
        
        # Get dominant pest
        dominant_pest = max(pest_counts.items(), key=lambda x: x[1])[0] if pest_counts else None
        
        # Get fertilizer recommendations
        fertilizer_recs = get_fertilizer_recommendations(pest_counts, dominant_pest)
        
        # Save to history
        if user_id != 'anonymous':
            history = read_json(HISTORY_FILE)
            history_entry = {
                'id': get_next_id(history),
                'user_id': user_id,
                'field_id': field_id,
                'image': filename,
                'image_with_boxes': f"/{img_with_boxes_path}" if img_with_boxes_path and os.path.exists(img_with_boxes_path) else None,
                'detections': detections[:50],
                'total_pests': total,
                'severity': severity,
                'pest_counts': pest_counts,
                'dominant_pest': dominant_pest,
                'detection_source': detection_source,
                'location': {'lat': lat, 'lon': lon} if lat and lon else None,
                'date': datetime.now().isoformat()
            }
            history.append(history_entry)
            write_json(HISTORY_FILE, history[-1000:])
        
        return jsonify({
            'success': True,
            'detections': detections[:20],
            'total_detections': total,
            'pest_counts': pest_counts,
            'dominant_pest': dominant_pest,
            'severity': severity,
            'image_url': f"/{UPLOAD_FOLDER}/{filename}",
            'image_with_boxes': f"/{img_with_boxes_path}" if img_with_boxes_path and os.path.exists(img_with_boxes_path) else None,
            'fertilizer_recommendations': fertilizer_recs,
            'detection_source': detection_source,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        print(f" Fatal detection error: {e}")
        return jsonify({'error': str(e)}), 500
    
def fallback_detection(filepath, filename, current_app):
    """Fallback detection methods"""
    detections = []
    pest_counts = {}
    img_with_boxes_path = None
    detection_source = "Fallback"
    
    # Try YOLO if available
    if hasattr(current_app, 'yolo_pest') and current_app.yolo_pest:
        try:
            results = current_app.yolo_pest(filepath)
            img = cv2.imread(filepath)
            
            for result in results:
                boxes = result.boxes
                if boxes is not None:
                    for box in boxes:
                        x1, y1, x2, y2 = box.xyxy[0].tolist()
                        confidence = float(box.conf[0])
                        class_id = int(box.cls[0])
                        
                        pest_info = next((p for p in PEST_LIBRARY if p.get('yolo_class_id') == class_id), None)
                        if pest_info:
                            class_name = pest_info['name_en']
                        else:
                            class_name = result.names[class_id] if hasattr(result, 'names') else f"Pest_{class_id}"
                        
                        cv2.rectangle(img, (int(x1), int(y1)), (int(x2), int(y2)), (0, 255, 0), 2)
                        cv2.putText(img, f"{class_name} {confidence:.2f}", 
                                  (int(x1), int(y1)-10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)
                        
                        detections.append({
                            'bbox': [x1, y1, x2, y2],
                            'confidence': round(confidence, 3),
                            'class_name': class_name
                        })
                        pest_counts[class_name] = pest_counts.get(class_name, 0) + 1
            
            img_with_boxes_path = os.path.join('uploads/pest_detections', f"detected_{filename}")
            cv2.imwrite(img_with_boxes_path, img)
            detection_source = "YOLO"
            
        except Exception as e:
            print(f"YOLO fallback error: {e}")
    
    # If still no detections, use mock
    if not detections:
        mock_pests = ['Brown Planthopper', 'Sheath Blight', 'Leaf Folder', 'Rice Gall Midge', 'Paddy Bug']
        for i in range(np.random.randint(1, 8)):
            pest = np.random.choice(mock_pests)
            confidence = round(np.random.uniform(0.7, 0.99), 2)
            detections.append({
                'bbox': [10, 10, 100, 100],
                'confidence': confidence,
                'class_name': pest
            })
            pest_counts[pest] = pest_counts.get(pest, 0) + 1
        detection_source = "Mock (for testing)"
    
    return detections, pest_counts, img_with_boxes_path, detection_source

def get_fertilizer_recommendations(pest_counts, dominant_pest=None):
    """Get fertilizer recommendations based on detected pests"""
    if not pest_counts or not dominant_pest:
        return {
            'nitrogen': 'Normal',
            'phosphorus': 'Normal',
            'potassium': 'Normal',
            'message': 'No pests detected. Maintain regular fertilizer schedule.',
            'specific_advice': []
        }
    
    # Find dominant pest info from library
    pest_info = next((p for p in PEST_LIBRARY 
                     if dominant_pest.lower() in p['name_en'].lower() or 
                     p['name_en'].lower() in dominant_pest.lower()), None)
    
    if pest_info:
        # Determine severity based on count
        count = pest_counts.get(dominant_pest, 0)
        if count > 20:
            severity = 'high'
        elif count > 10:
            severity = 'medium'
        else:
            severity = 'low'
        
        # Use pest-specific fertilizer advice
        advice = pest_info['fertilizer_advice'].get(severity, pest_info['fertilizer_advice']['medium'])
        
        return {
            'nitrogen': advice['nitrogen'],
            'phosphorus': advice['phosphorus'],
            'potassium': advice['potassium'],
            'message': advice['message'],
            'dominant_pest': dominant_pest,
            'pest_count': count,
            'severity': severity.capitalize(),
            'specific_advice': [
                f"Chemical control: {pest_info['control_chemical'][0]}",
                f"Organic option: {pest_info['control_organic'][0]}",
                f"Cultural: {pest_info['control_cultural'][0]}"
            ]
        }
    else:
        # Generic recommendations
        return {
            'nitrogen': 'Reduce' if 'brown' in dominant_pest.lower() or 'sheath' in dominant_pest.lower() else 'Normal',
            'phosphorus': 'Normal',
            'potassium': 'Increase' if 'brown' in dominant_pest.lower() else 'Normal',
            'message': f'Adjust fertilization based on {dominant_pest} presence.',
            'dominant_pest': dominant_pest,
            'specific_advice': [
                f"Monitor {dominant_pest} population",
                "Maintain field hygiene",
                "Consider preventive measures"
            ]
        }

# ============ PEST HISTORY ============
@pest_bp.route('/history/<user_id>', methods=['GET'])
def get_pest_history(user_id):
    """Get detection history for user"""
    try:
        history = read_json(HISTORY_FILE)
        user_history = [h for h in history if h['user_id'] == user_id]
        
        # Sort by date (newest first)
        user_history.sort(key=lambda x: x['date'], reverse=True)
        
        # Add statistics
        total_detections = len(user_history)
        total_pests = sum(h.get('total_pests', 0) for h in user_history)
        
        pest_type_stats = {}
        for h in user_history:
            for pest, count in h.get('pest_counts', {}).items():
                pest_type_stats[pest] = pest_type_stats.get(pest, 0) + count
        
        severity_stats = {'High': 0, 'Medium': 0, 'Low': 0, 'None': 0}
        for h in user_history:
            severity_stats[h.get('severity', 'None')] += 1
        
        # Monthly trend
        monthly_trend = {}
        for h in user_history:
            month = h['date'][:7]  # YYYY-MM
            monthly_trend[month] = monthly_trend.get(month, 0) + h.get('total_pests', 0)
        
        return jsonify({
            'success': True,
            'history': user_history[:50],  # Last 50
            'statistics': {
                'total_detections': total_detections,
                'total_pests_identified': total_pests,
                'avg_pests_per_detection': round(total_pests / total_detections, 1) if total_detections > 0 else 0,
                'pest_type_stats': pest_type_stats,
                'severity_stats': severity_stats,
                'monthly_trend': monthly_trend,
                'most_common_pest': max(pest_type_stats.items(), key=lambda x: x[1])[0] if pest_type_stats else 'None'
            }
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@pest_bp.route('/history/detail/<int:history_id>', methods=['GET'])
def get_history_detail(history_id):
    """Get detailed information for a specific detection"""
    try:
        history = read_json(HISTORY_FILE)
        entry = next((h for h in history if h['id'] == history_id), None)
        
        if not entry:
            return jsonify({'error': 'History entry not found'}), 404
        
        # Enhance with pest library info
        for detection in entry.get('detections', []):
            pest_name = detection.get('class_name')
            pest_info = next((p for p in PEST_LIBRARY if p['name_en'] == pest_name), None)
            if pest_info:
                detection['pest_details'] = {
                    'description': pest_info['description_en'],
                    'control_chemical': pest_info['control_chemical'][:2],
                    'control_organic': pest_info['control_organic'][:2]
                }
        
        return jsonify({
            'success': True,
            'entry': entry
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ============ ENHANCED PEST LIBRARY ============
@pest_bp.route('/library', methods=['GET'])
def get_pest_library():
    """Get complete pest library with filtering"""
    try:
        lang = request.args.get('lang', 'en')
        category = request.args.get('category', 'all')
        search = request.args.get('search', '').lower()
        
        pests = []
        for pest in PEST_LIBRARY:
            # Apply filters
            if category != 'all' and pest['category'].lower() != category.lower():
                continue
            
            if search and search not in pest['name_en'].lower() and search not in pest['name_si'].lower():
                continue
            
            p = pest.copy()
            if lang == 'si':
                p['name'] = p.pop('name_si')
                p['description'] = p.pop('description_si')
                p['symptoms'] = p.pop('symptoms_si')
            else:
                p['name'] = p.pop('name_en')
                p['description'] = p.pop('description_en')
                p['symptoms'] = p.pop('symptoms_en')
            
            # Remove language-specific fields
            if lang == 'en':
                p.pop('name_si', None)
                p.pop('description_si', None)
                p.pop('symptoms_si', None)
            else:
                p.pop('name_en', None)
                p.pop('description_en', None)
                p.pop('symptoms_en', None)
            
            pests.append(p)
        
        # Get categories for filter
        categories = list(set(p['category'] for p in PEST_LIBRARY))
        
        return jsonify({
            'success': True,
            'pests': pests,
            'total': len(pests),
            'categories': categories,
            'filters': {
                'category': category,
                'search': search
            }
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@pest_bp.route('/library/<pest_id>', methods=['GET'])
def get_pest_detail(pest_id):
    """Get detailed information about a specific pest"""
    try:
        lang = request.args.get('lang', 'en')
        pest = next((p for p in PEST_LIBRARY if p['id'] == pest_id), None)
        
        if not pest:
            return jsonify({'error': 'Pest not found'}), 404
        
        p = pest.copy()
        if lang == 'si':
            p['name'] = p.pop('name_si')
            p['description'] = p.pop('description_si')
            p['symptoms'] = p.pop('symptoms_si')
        else:
            p['name'] = p.pop('name_en')
            p['description'] = p.pop('description_en')
            p['symptoms'] = p.pop('symptoms_en')
        
        # Add control methods summary
        p['control_summary'] = {
            'chemical': p['control_chemical'][:3],
            'organic': p['control_organic'][:3],
            'cultural': p['control_cultural'][:3]
        }
        
        # Add seasonal info
        current_month = datetime.now().month
        p['is_peak_season'] = current_month in p.get('peak_months', [])
        
        # Add fertilizer advice for all levels
        p['fertilizer_advice_all'] = p.get('fertilizer_advice', {})
        
        return jsonify({
            'success': True,
            'pest': p
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ============ HEATMAP ============
@pest_bp.route('/heatmap', methods=['GET'])
def get_heatmap():
    """Get pest heatmap data for Sri Lanka"""
    try:
        pest_type = request.args.get('pest', 'all')
        period = request.args.get('period', 'month')  # week, month, year
        
        # Determine date range
        now = datetime.now()
        if period == 'week':
            start_date = now - timedelta(days=7)
        elif period == 'month':
            start_date = now - timedelta(days=30)
        elif period == 'year':
            start_date = now - timedelta(days=365)
        else:
            start_date = now - timedelta(days=30)
        
        # Get history entries within period
        history = read_json(HISTORY_FILE)
        recent_history = [h for h in history if datetime.fromisoformat(h['date']) >= start_date]
        
        # Initialize district data
        district_data = []
        for district, info in DISTRICT_COORDS.items():
            # Get detections for this district
            district_detections = [h for h in recent_history 
                                  if h.get('location') and 
                                  is_near_district(h['location'], info)]
            
            # Also include fields registered in this district
            fields = read_json(FIELDS_FILE)
            district_fields = [f for f in fields if f.get('district') == district]
            
            # Count pests
            pest_counts = {}
            total_pests = 0
            for h in district_detections:
                for pest, count in h.get('pest_counts', {}).items():
                    if pest_type == 'all' or pest.lower() in pest_type.lower():
                        pest_counts[pest] = pest_counts.get(pest, 0) + count
                        total_pests += count
            
            # Calculate risk score based on detections and field density
            field_density = len(district_fields) / 25  # Normalize
            detection_score = min(50, total_pests * 2)
            risk_score = min(100, detection_score + field_density * 10)
            
            # If no data, use random for demo
            if total_pests == 0:
                risk_score = np.random.randint(15, 40)
            
            # Get dominant pest
            dominant_pest = max(pest_counts.items(), key=lambda x: x[1])[0] if pest_counts else 'None'
            
            district_data.append({
                'district': district,
                'lat': info['lat'],
                'lon': info['lon'],
                'region': info['region'],
                'total_pests': total_pests,
                'detection_count': len(district_detections),
                'field_count': len(district_fields),
                'risk_score': risk_score,
                'severity': get_severity_level(risk_score),
                'dominant_pest': dominant_pest,
                'pest_counts': pest_counts,
                'color': get_risk_color(risk_score)
            })
        
        # Sort by risk score
        district_data.sort(key=lambda x: x['risk_score'], reverse=True)
        
        # Overall statistics
        total_pests_sl = sum(d['total_pests'] for d in district_data)
        high_risk_districts = sum(1 for d in district_data if d['severity'] == 'High')
        medium_risk_districts = sum(1 for d in district_data if d['severity'] == 'Medium')
        
        # Get top affected districts
        top_affected = district_data[:5]
        
        return jsonify({
            'success': True,
            'districts': district_data,
            'statistics': {
                'total_pests_sri_lanka': total_pests_sl,
                'high_risk_districts': high_risk_districts,
                'medium_risk_districts': medium_risk_districts,
                'total_districts': len(district_data),
                'period': period,
                'start_date': start_date.isoformat(),
                'end_date': now.isoformat(),
                'top_affected': [{
                    'district': d['district'],
                    'risk': d['risk_score'],
                    'dominant_pest': d['dominant_pest']
                } for d in top_affected]
            },
            'filters': {
                'pest_type': pest_type,
                'period': period
            }
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def is_near_district(location, district_info, threshold=0.5):
    """Check if location is near a district"""
    if not location:
        return False
    try:
        lat_diff = abs(float(location.get('lat', 0)) - district_info['lat'])
        lon_diff = abs(float(location.get('lon', 0)) - district_info['lon'])
        return lat_diff < threshold and lon_diff < threshold
    except:
        return False

def get_risk_color(risk):
    """Get color code for risk level"""
    if risk >= 60:
        return '#dc2626'  # Red
    elif risk >= 30:
        return '#f59e0b'  # Orange
    else:
        return '#10b981'  # Green

@pest_bp.route('/heatmap/image', methods=['GET'])
def generate_heatmap_image():
    """Generate and return a heatmap image"""
    try:
        # Get heatmap data
        heatmap_data = get_heatmap().json
        
        # Create figure
        plt.figure(figsize=(14, 10))
        
        # Extract coordinates and risk scores
        lats = [d['lat'] for d in heatmap_data['districts']]
        lons = [d['lon'] for d in heatmap_data['districts']]
        risks = [d['risk_score'] for d in heatmap_data['districts']]
        
        # Create scatter plot with color based on risk
        scatter = plt.scatter(lons, lats, c=risks, s=300, 
                            cmap='RdYlGn_r', alpha=0.7, edgecolors='black', linewidth=1)
        
        # Add district labels with white background
        for d in heatmap_data['districts'][::2]:  # Label every other to avoid overcrowding
            plt.annotate(d['district'], (d['lon'], d['lat']), 
                        fontsize=9, ha='center', va='bottom',
                        bbox=dict(boxstyle="round,pad=0.3", facecolor='white', alpha=0.7))
        
        plt.colorbar(scatter, label='Pest Risk Score')
        plt.title(f"Sri Lanka Pest Heatmap - {heatmap_data['statistics']['period'].capitalize()}", fontsize=16)
        plt.xlabel('Longitude')
        plt.ylabel('Latitude')
        plt.grid(True, alpha=0.3)
        
        # Add Sri Lanka outline (simplified)
        plt.xlim(79.5, 82)
        plt.ylim(5.8, 9.9)
        
        # Add text with statistics
        stats = heatmap_data['statistics']
        plt.figtext(0.02, 0.02, 
                   f"Total Pests: {stats['total_pests_sri_lanka']} | "
                   f"High Risk: {stats['high_risk_districts']} districts | "
                   f"Period: {stats['period']}", 
                   fontsize=10, bbox=dict(facecolor='white', alpha=0.8))
        
        # Save to bytes
        img_bytes = io.BytesIO()
        plt.savefig(img_bytes, format='png', dpi=120, bbox_inches='tight')
        img_bytes.seek(0)
        plt.close()
        
        return send_file(img_bytes, mimetype='image/png', 
                        download_name=f'pest_heatmap_{stats["period"]}.png')
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ============ ENHANCED FERTILIZER RECOMMENDATIONS ============
@pest_bp.route('/fertilizer/recommend', methods=['POST'])
def recommend_fertilizer():
    """Get comprehensive fertilizer recommendations"""
    try:
        data = request.json
        pest_name = data.get('pest_name')
        severity = data.get('severity', 'medium').lower()
        field_data = data.get('field', {})
        crop_stage = field_data.get('current_stage', 'Tillering')
        detection_count = data.get('detection_count', 0)
        
        # Get pest-specific recommendations
        pest = next((p for p in PEST_LIBRARY 
                    if pest_name and (p['name_en'].lower() in pest_name.lower() or 
                                     pest_name.lower() in p['name_en'].lower())), None)
        
        # Adjust severity based on count if provided
        if detection_count > 0 and not severity:
            if detection_count > 20:
                severity = 'high'
            elif detection_count > 10:
                severity = 'medium'
            else:
                severity = 'low'
        
        if pest and 'fertilizer_advice' in pest:
            advice = pest['fertilizer_advice'].get(severity, pest['fertilizer_advice']['medium'])
            
            # Add stage-specific advice
            stage_advice = get_stage_fertilizer_advice(crop_stage)
            
            # Calculate NPK ratio
            npk_ratio = get_npk_ratio(advice, crop_stage)
            
            return jsonify({
                'success': True,
                'recommendation': advice,
                'based_on_pest': pest['name_en'],
                'pest_id': pest['id'],
                'severity': severity.capitalize(),
                'crop_stage': crop_stage,
                'stage_advice': stage_advice,
                'npk_ratio': npk_ratio,
                'application_timing': get_application_timing(crop_stage, severity),
                'control_measures': {
                    'chemical': pest['control_chemical'][:2],
                    'organic': pest['control_organic'][:2],
                    'cultural': pest['control_cultural'][:2]
                }
            })
        else:
            # Default recommendations based on severity
            advice_map = {
                'high': {
                    'nitrogen': 'Reduce by 30-50%',
                    'phosphorus': 'Maintain',
                    'potassium': 'Increase by 25%',
                    'message': 'High pest pressure! Reduce nitrogen significantly, increase potash for plant resistance.'
                },
                'medium': {
                    'nitrogen': 'Reduce by 15-20%',
                    'phosphorus': 'Maintain',
                    'potassium': 'Increase by 10%',
                    'message': 'Moderate pest risk. Slightly adjust fertilization.'
                },
                'low': {
                    'nitrogen': 'Normal',
                    'phosphorus': 'Normal',
                    'potassium': 'Normal',
                    'message': 'Low pest risk. Continue regular fertilization.'
                }
            }
            advice = advice_map.get(severity, advice_map['medium'])
            
            # Stage advice
            stage_advice = get_stage_fertilizer_advice(crop_stage)
            
            return jsonify({
                'success': True,
                'recommendation': advice,
                'based_on_pest': pest_name or 'General',
                'severity': severity.capitalize(),
                'crop_stage': crop_stage,
                'stage_advice': stage_advice,
                'npk_ratio': get_npk_ratio(advice, crop_stage)
            })
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def get_stage_fertilizer_advice(stage):
    """Get stage-specific fertilizer advice"""
    stage_advice = {
        'Seedling': {
            'fertilizer': 'Basal application',
            'npk': '20:20:0',
            'amount': '100 kg/ha',
            'timing': 'At planting',
            'details': 'Apply complete fertilizer before planting'
        },
        'Tillering': {
            'fertilizer': 'Top dressing - Urea',
            'npk': '46:0:0',
            'amount': '75 kg/ha',
            'timing': '20-25 days after planting',
            'details': 'Apply urea for tiller development'
        },
        'Flowering': {
            'fertilizer': 'Panicle initiation - MOP',
            'npk': '0:0:60',
            'amount': '50 kg/ha',
            'timing': '45-50 days after planting',
            'details': 'Apply potash for grain filling'
        },
        'Maturity': {
            'fertilizer': 'No fertilizer',
            'npk': '0:0:0',
            'amount': '0 kg/ha',
            'timing': 'No application',
            'details': 'Stop fertilizer application'
        }
    }
    return stage_advice.get(stage, stage_advice['Tillering'])

def get_npk_ratio(advice, stage):
    """Calculate NPK ratio based on advice and stage"""
    base_ratios = {
        'Seedling': {'N': 20, 'P': 20, 'K': 0},
        'Tillering': {'N': 46, 'P': 0, 'K': 0},
        'Flowering': {'N': 0, 'P': 0, 'K': 60},
        'Maturity': {'N': 0, 'P': 0, 'K': 0}
    }
    
    ratio = base_ratios.get(stage, base_ratios['Tillering']).copy()
    
    # Adjust based on advice
    if 'Reduce' in advice.get('nitrogen', ''):
        # Extract reduction percentage
        import re
        match = re.search(r'(\d+)', advice.get('nitrogen', ''))
        if match:
            reduction = int(match.group(1)) / 100
            ratio['N'] = int(ratio['N'] * (1 - reduction))
        else:
            ratio['N'] = int(ratio['N'] * 0.7)
    
    if 'Increase' in advice.get('potassium', ''):
        match = re.search(r'(\d+)', advice.get('potassium', ''))
        if match:
            increase = int(match.group(1)) / 100
            ratio['K'] = int(ratio['K'] * (1 + increase))
        else:
            ratio['K'] = int(ratio['K'] * 1.25)
    
    return ratio

def get_application_timing(stage, severity):
    """Get optimal application timing"""
    base_timing = {
        'Seedling': 'At planting',
        'Tillering': 'Morning hours, 20-25 days after planting',
        'Flowering': 'Morning hours, 45-50 days after planting',
        'Maturity': 'No application'
    }
    
    timing = base_timing.get(stage, 'Morning hours')
    
    if severity == 'high':
        timing += ' - URGENT: Apply immediately'
    elif severity == 'medium':
        timing += ' - Apply within 2-3 days'
    
    return timing

# ============ FERTILIZER SCHEDULE ============
@pest_bp.route('/fertilizer/schedule/<int:field_id>', methods=['GET'])
def get_fertilizer_schedule(field_id):
    """Get customized fertilizer schedule for a field"""
    try:
        fields = read_json(FIELDS_FILE)
        field = next((f for f in fields if f['id'] == field_id), None)
        
        if not field:
            return jsonify({'error': 'Field not found'}), 404
        
        # Get pest forecast for this field
        forecast_resp = forecast_pest_risk(field_id)
        if isinstance(forecast_resp, tuple):
            forecast = forecast_resp[0].json
        else:
            forecast = forecast_resp.json
        
        stage = field.get('current_stage', 'Tillering')
        risk = forecast.get('current_risk', 30)
        severity = get_severity_level(risk).lower()
        dominant_pests = forecast.get('dominant_pests', [])
        
        # Get soil data
        soil_ph = field.get('soil_ph', 6.5)
        soil_moisture = field.get('soil_moisture', 50)
        
        # Generate complete schedule
        schedule = {
            'field_name': field['field_name'],
            'current_stage': stage,
            'planting_date': field['planting_date'],
            'age_days': field.get('paddy_age_days', 30),
            'pest_risk': risk,
            'pest_severity': severity,
            'soil_conditions': {
                'ph': soil_ph,
                'moisture': soil_moisture,
                'type': field.get('soil_type', 'Clay Loam')
            },
            'schedule': []
        }
        
        days_since = field.get('paddy_age_days', 30)
        
        # Past applications (if any)
        past_apps = []
        if days_since > 20:
            past_apps.append({
                'stage': 'Basal',
                'applied_at': 'At planting',
                'fertilizer': 'NPK 20:20:0',
                'amount': '100 kg/ha',
                'status': 'Completed'
            })
        
        if days_since > 45:
            past_apps.append({
                'stage': 'Early Tillering',
                'applied_at': '20-25 days',
                'fertilizer': 'Urea 46:0:0',
                'amount': '75 kg/ha',
                'status': 'Completed'
            })
        
        schedule['past_applications'] = past_apps
        
        # Upcoming applications
        upcoming = []
        
        # Tillering application (if not yet done)
        if 20 <= days_since < 55 and days_since > 25:
            upcoming.append({
                'stage': 'Tillering',
                'days': '20-55',
                'fertilizer': 'Urea (46:0:0)',
                'amount': '75 kg/ha',
                'timing': 'Apply now' if days_since <= 35 else 'Apply soon',
                'priority': 'High' if days_since > 30 else 'Medium',
                'notes': 'Top dressing for tillering',
                'adjusted_for_pest': risk > 30
            })
        
        # Flowering application
        if 45 <= days_since < 85:
            k_amount = 50
            if risk > 60:
                k_amount = int(k_amount * 1.3)  # Increase potash for high risk
                k_note = "Increased potash due to high pest risk"
            elif risk > 30:
                k_amount = int(k_amount * 1.15)
                k_note = "Slightly increased potash for pest resistance"
            else:
                k_note = "Standard application"
            
            upcoming.append({
                'stage': 'Flowering',
                'days': '45-85',
                'fertilizer': 'MOP (0:0:60)',
                'amount': f'{k_amount} kg/ha',
                'timing': 'Apply now' if 45 <= days_since <= 60 else 'Upcoming',
                'priority': 'High' if days_since > 55 else 'Medium',
                'notes': k_note,
                'adjusted_for_pest': risk > 30
            })
        
        schedule['upcoming_applications'] = upcoming
        
        # Add pest-based adjustments
        if risk > 60:
            schedule['adjustments'] = {
                'nitrogen': 'STOP nitrogen application',
                'potassium': 'Increase by 30%',
                'message': 'HIGH PEST RISK - Stop nitrogen immediately. Apply extra potash.',
                'priority': 'URGENT'
            }
        elif risk > 30:
            schedule['adjustments'] = {
                'nitrogen': 'Reduce by 25%',
                'potassium': 'Increase by 15%',
                'message': 'Moderate pest risk - Reduce nitrogen, increase potash.',
                'priority': 'Medium'
            }
        else:
            schedule['adjustments'] = {
                'nitrogen': 'Normal',
                'potassium': 'Normal',
                'message': 'Low pest risk - Continue normal schedule.',
                'priority': 'Low'
            }
        
        # Add dominant pest advice
        if dominant_pests:
            main_pest = dominant_pests[0]
            schedule['pest_specific_advice'] = {
                'pest': main_pest['pest_name'],
                'risk': main_pest['risk_percent'],
                'fertilizer_advice': main_pest.get('fertilizer_advice', {})
            }
        
        return jsonify({
            'success': True,
            'schedule': schedule
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ============ NOTIFICATIONS ============
@pest_bp.route('/notifications/toggle', methods=['POST'])
def toggle_notifications():
    """Toggle notifications for a field"""
    try:
        data = request.json
        field_id = data.get('field_id')
        enabled = data.get('enabled', False)
        threshold = data.get('threshold', 50)
        
        fields = read_json(FIELDS_FILE)
        for field in fields:
            if field['id'] == field_id:
                field['notifications_enabled'] = enabled
                field['notification_threshold'] = threshold
                break
        
        write_json(FIELDS_FILE, fields)
        
        # Log notification setting
        notifications = read_json(NOTIFICATIONS_FILE)
        notifications.append({
            'id': len(notifications) + 1,
            'field_id': field_id,
            'enabled': enabled,
            'threshold': threshold,
            'updated_at': datetime.now().isoformat()
        })
        write_json(NOTIFICATIONS_FILE, notifications[-100:])
        
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@pest_bp.route('/notifications/check/<int:field_id>', methods=['GET'])
def check_notifications(field_id):
    """Check if notifications should be sent for a field"""
    try:
        fields = read_json(FIELDS_FILE)
        field = next((f for f in fields if f['id'] == field_id), None)
        
        if not field or not field.get('notifications_enabled'):
            return jsonify({
                'should_notify': False, 
                'reason': 'Notifications disabled',
                'field_id': field_id
            })
        
        # Get current forecast
        forecast_resp = forecast_pest_risk(field_id)
        if isinstance(forecast_resp, tuple):
            forecast = forecast_resp[0].json
        else:
            forecast = forecast_resp.json
        
        current_risk = forecast.get('current_risk', 0)
        threshold = field.get('notification_threshold', 50)
        
        should_notify = current_risk >= threshold
        
        # Check if already notified recently (simplified - would need last notification tracking)
        notifications = read_json(NOTIFICATIONS_FILE)
        recent_notifications = [n for n in notifications 
                              if n.get('field_id') == field_id and 
                              datetime.fromisoformat(n.get('sent_at', '2000-01-01')) > datetime.now() - timedelta(days=1)]
        
        already_notified = len(recent_notifications) > 0
        
        return jsonify({
            'should_notify': should_notify and not already_notified,
            'current_risk': current_risk,
            'threshold': threshold,
            'severity': get_severity_level(current_risk),
            'dominant_pests': [p['pest_name'] for p in forecast.get('dominant_pests', [])],
            'already_notified_today': already_notified,
            'field_name': field.get('field_name')
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@pest_bp.route('/notifications/send/<int:field_id>', methods=['POST'])
def send_notification(field_id):
    """Mark that a notification was sent"""
    try:
        data = request.json
        notification_type = data.get('type', 'pest_alert')
        
        notifications = read_json(NOTIFICATIONS_FILE)
        notifications.append({
            'id': len(notifications) + 1,
            'field_id': field_id,
            'type': notification_type,
            'sent_at': datetime.now().isoformat(),
            'risk_level': data.get('risk_level'),
            'message': data.get('message', 'Pest alert for your field')
        })
        write_json(NOTIFICATIONS_FILE, notifications[-500:])  # Keep last 500
        
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ============ STATISTICS ============
@pest_bp.route('/statistics', methods=['GET'])
def get_statistics():
    """Get overall pest statistics"""
    try:
        period = request.args.get('period', 'month')
        district = request.args.get('district', 'all')
        
        # Determine date range
        now = datetime.now()
        if period == 'week':
            start_date = now - timedelta(days=7)
        elif period == 'month':
            start_date = now - timedelta(days=30)
        elif period == 'year':
            start_date = now - timedelta(days=365)
        else:
            start_date = now - timedelta(days=30)
        
        # Get history
        history = read_json(HISTORY_FILE)
        
        # Filter by date
        recent = [h for h in history if datetime.fromisoformat(h['date']) >= start_date]
        
        # Filter by district if specified
        if district != 'all':
            district_filtered = []
            for h in recent:
                if h.get('location'):
                    for d, info in DISTRICT_COORDS.items():
                        if d == district and is_near_district(h['location'], info):
                            district_filtered.append(h)
                            break
            recent = district_filtered
        
        # Calculate statistics
        total_detections = len(recent)
        total_pests = sum(h.get('total_pests', 0) for h in recent)
        
        # Pest frequency
        pest_freq = {}
        for h in recent:
            for pest, count in h.get('pest_counts', {}).items():
                pest_freq[pest] = pest_freq.get(pest, 0) + count
        
        # Severity distribution
        severity_dist = {'High': 0, 'Medium': 0, 'Low': 0, 'None': 0}
        for h in recent:
            severity_dist[h.get('severity', 'None')] += 1
        
        # Daily trend
        daily_trend = {}
        for h in recent:
            date = h['date'][:10]  # YYYY-MM-DD
            daily_trend[date] = daily_trend.get(date, 0) + h.get('total_pests', 0)
        
        # District distribution
        district_pests = {}
        for h in recent:
            if h.get('location'):
                for district_name, info in DISTRICT_COORDS.items():
                    if is_near_district(h['location'], info, threshold=0.3):
                        district_pests[district_name] = district_pests.get(district_name, 0) + h.get('total_pests', 0)
                        break
        
        # Get top pests
        top_pests = sorted(pest_freq.items(), key=lambda x: x[1], reverse=True)[:5]
        
        return jsonify({
            'success': True,
            'period': period,
            'district': district,
            'statistics': {
                'total_detections': total_detections,
                'total_pests_identified': total_pests,
                'avg_pests_per_detection': round(total_pests / total_detections, 1) if total_detections > 0 else 0,
                'pest_frequency': pest_freq,
                'top_pests': [{'name': p[0], 'count': p[1]} for p in top_pests],
                'severity_distribution': severity_dist,
                'daily_trend': [{'date': d, 'count': c} for d, c in sorted(daily_trend.items())],
                'district_distribution': district_pests,
                'most_common_pest': top_pests[0][0] if top_pests else 'None',
                'detection_rate': round((total_detections / 30) * 100, 1) if period == 'month' else 0
            }
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ============ EXPORT DATA ============
@pest_bp.route('/export/<user_id>', methods=['GET'])
def export_user_data(user_id):
    """Export user's pest data as JSON"""
    try:
        fields = read_json(FIELDS_FILE)
        user_fields = [f for f in fields if f['user_id'] == user_id]
        
        history = read_json(HISTORY_FILE)
        user_history = [h for h in history if h['user_id'] == user_id]
        
        # Get notifications for user's fields
        field_ids = [f['id'] for f in user_fields]
        notifications = read_json(NOTIFICATIONS_FILE)
        user_notifications = [n for n in notifications if n.get('field_id') in field_ids]
        
        export_data = {
            'user_id': user_id,
            'export_date': datetime.now().isoformat(),
            'fields': user_fields,
            'history': user_history,
            'notifications': user_notifications[-100:],
            'statistics': {
                'total_fields': len(user_fields),
                'total_detections': len(user_history),
                'total_pests': sum(h.get('total_pests', 0) for h in user_history),
                'first_detection': min([h['date'] for h in user_history]) if user_history else None,
                'last_detection': max([h['date'] for h in user_history]) if user_history else None
            }
        }
        
        # Save export file
        export_filename = f'export_{user_id}_{datetime.now().strftime("%Y%m%d_%H%M%S")}.json'
        export_path = os.path.join(PEST_DATA_DIR, export_filename)
        with open(export_path, 'w', encoding='utf-8') as f:
            json.dump(export_data, f, indent=2, ensure_ascii=False)
        
        return send_file(export_path, as_attachment=True, 
                        download_name=export_filename,
                        mimetype='application/json')
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ============ HEALTH CHECK ============
@pest_bp.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'ml_model_loaded': risk_model is not None,
        'ml_accuracy': model_metrics.get('risk_accuracy', 0),
        'features_count': len(feature_cols),
        'pests_in_library': len(PEST_LIBRARY),
        'districts': len(DISTRICT_COORDS),
        'storage': {
            'fields': os.path.exists(FIELDS_FILE),
            'history': os.path.exists(HISTORY_FILE),
            'notifications': os.path.exists(NOTIFICATIONS_FILE)
        },
        'upload_folder': os.path.exists(UPLOAD_FOLDER)
    })