from flask import Blueprint, request, jsonify, current_app
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import json
import joblib
import os
from sklearn.preprocessing import StandardScaler
import warnings
warnings.filterwarnings('ignore')

# Create blueprint ONCE
pest_bp = Blueprint('pest', __name__)

# In-memory store for user notification preferences
user_preferences = {}

# ============================================================
# LOAD MODELS ONCE AT STARTUP
# ============================================================
MODEL_DIR = "model"
models = {}
scalers = {}
encoders = {}
features = []

# Check if model directory exists
if not os.path.exists(MODEL_DIR):
    MODEL_DIR = "models"

print(f"\n{'='*60}")
print(f"📂 Looking for models in: {MODEL_DIR}")
print(f"{'='*60}")

try:
    model_files = {
        'pest': f"{MODEL_DIR}/pest_model.pkl",
        'severity': f"{MODEL_DIR}/severity_model.pkl", 
        'incidence': f"{MODEL_DIR}/incidence_model.pkl",
        'ensemble': f"{MODEL_DIR}/incidence_ensemble_model.pkl",
        'scaler': f"{MODEL_DIR}/feature_scaler.pkl",
        'features': f"{MODEL_DIR}/features.pkl"
    }
    
    existing_files = []
    for name, path in model_files.items():
        if os.path.exists(path):
            existing_files.append(name)
            print(f"✅ Found: {path}")
        else:
            print(f"❌ Missing: {path}")
    
    if len(existing_files) >= 3:
        if os.path.exists(model_files['pest']):
            models['pest'] = joblib.load(model_files['pest'])
            print("✅ Pest model loaded")
        if os.path.exists(model_files['severity']):
            models['severity'] = joblib.load(model_files['severity'])
            print("✅ Severity model loaded")
        if os.path.exists(model_files['incidence']):
            models['incidence'] = joblib.load(model_files['incidence'])
            print("✅ Incidence model loaded")
        if os.path.exists(model_files['scaler']):
            scalers['feature'] = joblib.load(model_files['scaler'])
            print("✅ Feature scaler loaded")
        if os.path.exists(model_files['features']):
            features = joblib.load(model_files['features'])
            print(f"✅ Features loaded: {len(features)} features")
        
        # Load encoders
        encoder_files = ["District_encoder.pkl", "Season_encoder.pkl", "Paddy_Variety_encoder.pkl", "Pest_encoder.pkl"]
        for enc_file in encoder_files:
            enc_path = f"{MODEL_DIR}/{enc_file}"
            if os.path.exists(enc_path):
                col_name = enc_file.replace("_encoder.pkl", "")
                encoders[col_name] = joblib.load(enc_path)
                print(f"✅ Loaded encoder: {col_name}")
        
        print(f"\n✅ Models loaded successfully! Using ML predictions")
    else:
        print(f"\n⚠️ Not enough models found. Using rule-based fallback predictions")
        
except Exception as e:
    print(f"❌ Error loading models: {e}")
    print("⚠️ Using rule-based fallback predictions")


# ============================================================
# IMPROVED HELPER FUNCTIONS
# ============================================================

def encode_value(encoder_name, value):
    """Encode a value using loaded encoder"""
    if encoder_name in encoders:
        try:
            return int(encoders[encoder_name].transform([str(value)])[0])
        except:
            return 0
    return 0

def get_growth_stage_code(age):
    """Get growth stage code from age"""
    if age <= 25:
        return 0
    elif age <= 50:
        return 1
    elif age <= 70:
        return 2
    elif age <= 90:
        return 3
    else:
        return 4

def get_current_season():
    """Determine current season based on month"""
    month = datetime.now().month
    if 5 <= month <= 9:
        return 'Yala'
    else:
        return 'Maha'

def get_risk_level(incidence):
    """Convert incidence percentage to risk level"""
    if incidence >= 40:
        return 'Very High'
    elif incidence >= 30:
        return 'High'
    elif incidence >= 20:
        return 'Moderate'
    elif incidence >= 10:
        return 'Low'
    else:
        return 'Very Low'

def get_risk_display(risk_level, language):
    """Get risk level display text"""
    if language == 'si':
        risk_map = {
            'Very High': 'ඉතා ඉහළ',
            'High': 'ඉහළ',
            'Moderate': 'මධ්‍යස්ථ',
            'Low': 'අඩු',
            'Very Low': 'ඉතා අඩු'
        }
        return risk_map.get(risk_level, risk_level)
    return risk_level

def get_severity_from_probability(prob):
    """Determine severity based on probability"""
    if prob > 0.7:
        return 'High'
    elif prob > 0.4:
        return 'Moderate'
    else:
        return 'Low'

# IMPROVED: Dynamic weather based on district and season
def get_mock_weather(district):
    """Get dynamic weather data for a district"""
    weather_patterns = {
        'Anuradhapura': {'base_temp': 29.5, 'base_rain': 7.2, 'base_humidity': 78, 'soil_moisture': 75, 'soil_ph': 6.5, 'organic_matter': 2.0},
        'Polonnaruwa': {'base_temp': 30.1, 'base_rain': 6.8, 'base_humidity': 75, 'soil_moisture': 73, 'soil_ph': 6.4, 'organic_matter': 1.9},
        'Hambantota': {'base_temp': 31.2, 'base_rain': 3.5, 'base_humidity': 70, 'soil_moisture': 68, 'soil_ph': 6.7, 'organic_matter': 1.8},
        'Kurunegala': {'base_temp': 28.8, 'base_rain': 8.5, 'base_humidity': 80, 'soil_moisture': 78, 'soil_ph': 6.3, 'organic_matter': 2.1},
        'Kandy': {'base_temp': 24.5, 'base_rain': 10.2, 'base_humidity': 85, 'soil_moisture': 82, 'soil_ph': 6.0, 'organic_matter': 2.3},
        'Badulla': {'base_temp': 23.8, 'base_rain': 9.5, 'base_humidity': 82, 'soil_moisture': 79, 'soil_ph': 6.1, 'organic_matter': 2.2},
        'Colombo': {'base_temp': 28.5, 'base_rain': 12.0, 'base_humidity': 83, 'soil_moisture': 80, 'soil_ph': 6.2, 'organic_matter': 2.0},
    }
    
    default = {'base_temp': 28.0, 'base_rain': 7.0, 'base_humidity': 78, 'soil_moisture': 75, 'soil_ph': 6.5, 'organic_matter': 2.0}
    pattern = weather_patterns.get(district, default)
    
    # Add seasonal variation
    season = get_current_season()
    if season == 'Yala':
        temp_adjust = 1.5
        rain_adjust = -2
    else:
        temp_adjust = -0.5
        rain_adjust = 3
    
    return {
        'temp': round(pattern['base_temp'] + temp_adjust + np.random.uniform(-1, 1), 1),
        'rain': round(max(0, pattern['base_rain'] + rain_adjust + np.random.uniform(-2, 2)), 1),
        'humidity': round(min(100, pattern['base_humidity'] + np.random.uniform(-5, 5)), 1),
        'description': 'Partly cloudy' if np.random.random() > 0.3 else 'Light rain',
        'pressure': 1013 + np.random.randint(-5, 5),
        'wind_speed': round(2.5 + np.random.uniform(-1, 1), 1),
        'wind_deg': np.random.randint(0, 360),
        'clouds': np.random.randint(20, 80),
        'soil_moisture': pattern['soil_moisture'] + np.random.randint(-10, 10),
        'soil_ph': round(pattern['soil_ph'] + np.random.uniform(-0.3, 0.3), 1),
        'organic_matter': round(pattern['organic_matter'] + np.random.uniform(-0.2, 0.2), 1)
    }

def get_weather_for_district(district):
    """Get weather data for a district"""
    return get_mock_weather(district)

def get_weather_forecast_for_district(district, days=7):
    """Get weather forecast for a district"""
    forecast = []
    base_weather = get_mock_weather(district)
    
    for i in range(days):
        day_weather = base_weather.copy()
        day_weather['temp'] += np.random.uniform(-2, 2)
        day_weather['rain'] = max(0, base_weather['rain'] + np.random.uniform(-3, 5))
        day_weather['humidity'] = min(100, base_weather['humidity'] + np.random.uniform(-5, 5))
        forecast.append(day_weather)
    
    return forecast

def prepare_features(district, paddy_variety, paddy_age, weather):
    """Prepare feature vector for prediction"""
    
    district_encoded = encode_value('District', district)
    variety_encoded = encode_value('Paddy_Variety', paddy_variety)
    
    season = get_current_season()
    season_encoded = encode_value('Season', season)
    
    growth_stage = get_growth_stage_code(paddy_age)
    
    temp_humidity = weather['temp'] * weather['humidity'] / 100
    rain_moisture = weather['rain'] * weather.get('soil_moisture', 75) / 100
    ph_organic = weather.get('soil_ph', 6.5) * weather.get('organic_matter', 2.0)
    
    weather_severity = (
        (weather['temp'] - 27) / 3 +  
        (weather['humidity'] - 75) / 15 +
        (weather['rain'] - 5) / 5
    )
    
    soil_quality = (
        -abs(weather.get('soil_ph', 6.5) - 6.5) +  
        weather.get('organic_matter', 2.0) / 5 +
        weather.get('soil_moisture', 75) / 100
    )
    
    features_dict = {
        'Avg_Temp_C': weather['temp'],
        'Rainfall_mm': weather['rain'],
        'Humidity_%': weather['humidity'],
        'Soil_pH': weather.get('soil_ph', 6.5),
        'Soil_Moisture_%': weather.get('soil_moisture', 75),
        'Organic_Matter_%': weather.get('organic_matter', 2.0),
        'District_encoded': district_encoded,
        'Season_encoded': season_encoded,
        'Paddy_Variety_encoded': variety_encoded,
        'Paddy_Age_Days': paddy_age,
        'Temp_Humidity_Interaction': temp_humidity,
        'Rain_Moisture_Interaction': rain_moisture,
        'pH_Organic_Interaction': ph_organic,
        'Growth_Stage': growth_stage,
        'Weather_Severity_Score': weather_severity,
        'Soil_Quality_Score': soil_quality
    }
    
    feature_array = [features_dict[k] for k in features_dict.keys()]
    
    if 'feature' in scalers and scalers['feature'] is not None:
        try:
            feature_array = scalers['feature'].transform([feature_array])[0]
        except:
            pass
    
    return feature_array

def get_weather_impact(features):
    """Generate weather impact statements"""
    impacts = []
    
    if len(features) > 0 and features[0] > 32:
        impacts.append("High temperature increases pest activity")
    if len(features) > 2 and features[2] > 80:
        impacts.append("High humidity favors fungal growth")
    if len(features) > 1 and features[1] > 20:
        impacts.append("Heavy rainfall may reduce pest population")
    if len(features) > 3 and features[3] < 5.5:
        impacts.append("Acidic soil may stress plants")
    
    if not impacts:
        impacts.append("Normal weather conditions")
    
    return impacts

def get_fertilizer_recommendation(pest, severity, incidence):
    """Get fertilizer and pesticide recommendations"""
    
    recommendations = {
        'Brown Planthopper (BPH)': {
            'Low': 'Apply Buprofezin 25 SC @ 600 ml/ha. Monitor field regularly.',
            'Moderate': 'Apply Pymetrozine 50 WG @ 300 g/ha. Reduce nitrogen fertilizer.',
            'High': 'Apply Dinotefuran 20 SG @ 250 g/ha. Consider early harvesting.'
        },
        'Rice Leaf-folder': {
            'Low': 'Monitor and remove affected leaves. Apply need-based pesticides.',
            'Moderate': 'Apply Chlorantraniliprole 18.5 SC @ 150 ml/ha.',
            'High': 'Apply Flubendiamide 39.35 SC @ 125 ml/ha. Immediate action required.'
        },
        'Stem Borer': {
            'Low': 'Install pheromone traps @ 12/ha. Monitor egg masses.',
            'Moderate': 'Apply Cartap hydrochloride 4G @ 25 kg/ha.',
            'High': 'Apply Chlorpyrifos 20 EC @ 2 L/ha. Destroy affected tillers.'
        },
        'Rice Gall Midge': {
            'Low': 'Use resistant varieties. Remove weed hosts.',
            'Moderate': 'Apply Carbofuran granules at planting. Early planting recommended.',
            'High': 'Immediate action: Remove affected tillers. Apply systemic insecticides.'
        },
        'Paddy Bug': {
            'Low': 'Use sweep nets for monitoring. Maintain clean bunds.',
            'Moderate': 'Apply neem-based sprays. Maintain balanced fertilizer.',
            'High': 'Apply recommended insecticides. Early harvesting if severe.'
        },
        'default': {
            'Low': 'Continue regular monitoring. Maintain field hygiene.',
            'Moderate': 'Apply need-based pesticides. Consult agricultural officer.',
            'High': 'Immediate action required. Apply recommended pesticides.'
        }
    }
    
    pest_rec = recommendations.get(pest, recommendations['default'])
    action = pest_rec.get(severity, pest_rec['Moderate'])
    
    return {
        'recommendation': action,
        'immediate_action': f"Monitor field every 3 days. {'Immediate action needed!' if severity == 'High' else 'Continue observation.'}",
        'preventive': 'Maintain field hygiene, proper water management, and balanced fertilization.',
        'organic_option': 'Consider neem-based products (3 ml/L) or Trichoderma application.',
        'application_timing': 'Apply in the morning when bees are less active.',
        'weather_advice': ['Avoid spraying before rain', 'Apply when wind speed < 10 km/h']
    }

# IMPROVED: Dynamic rule-based prediction with variety of pests
def get_rule_based_prediction(features, district="", paddy_variety="", paddy_age=30):
    """Fallback rule-based prediction with dynamic pest selection"""
    
    temp = features[0] if len(features) > 0 else 28
    rain = features[1] if len(features) > 1 else 5
    humidity = features[2] if len(features) > 2 else 75
    age = paddy_age if paddy_age else (features[9] if len(features) > 9 else 45)
    
    risk_score = 0
    
    # Temperature impact
    if temp > 31:
        risk_score += 35
    elif temp > 29:
        risk_score += 25
    elif temp > 27:
        risk_score += 15
    elif temp > 25:
        risk_score += 5
    
    # Humidity impact
    if humidity > 85:
        risk_score += 35
    elif humidity > 75:
        risk_score += 25
    elif humidity > 65:
        risk_score += 15
    
    # Rainfall impact
    if 8 <= rain <= 20:
        risk_score += 20
    elif rain > 20:
        risk_score -= 15
    elif rain > 3:
        risk_score += 10
    
    # Age impact - different stages have different vulnerabilities
    if 25 <= age <= 45:
        risk_score += 25  # Vegetative stage
    elif 45 <= age <= 65:
        risk_score += 30  # Reproductive stage (most vulnerable)
    elif 65 <= age <= 85:
        risk_score += 20  # Flowering stage
    elif age > 85:
        risk_score += 10  # Maturity stage
    
    # District-based risk adjustment
    high_risk_districts = ['Anuradhapura', 'Polonnaruwa', 'Hambantota', 'Kurunegala']
    if district in high_risk_districts:
        risk_score += 15
    
    # Variety-based resistance
    resistant_varieties = ['BG94-1', 'BG300', 'BG352', 'At306']
    if paddy_variety in resistant_varieties:
        risk_score -= 10
    
    # Determine risk level
    if risk_score >= 70:
        risk_level = 'Very High'
        incidence = 45 + np.random.uniform(-5, 10)
    elif risk_score >= 55:
        risk_level = 'High'
        incidence = 32 + np.random.uniform(-5, 8)
    elif risk_score >= 35:
        risk_level = 'Moderate'
        incidence = 20 + np.random.uniform(-5, 8)
    elif risk_score >= 15:
        risk_level = 'Low'
        incidence = 10 + np.random.uniform(-5, 6)
    else:
        risk_level = 'Very Low'
        incidence = 4 + np.random.uniform(-2, 4)
    
    incidence = max(1, min(85, incidence))
    
    # DYNAMIC PEST SELECTION based on multiple factors (not just Gall Midge)
    pests = []
    
    # Temperature-based pests
    if temp > 29:
        pests.append('Brown Planthopper (BPH)')
        pests.append('Paddy Bug')
    elif temp < 26:
        pests.append('Sheath Blight')
        pests.append('Rice Blast')
    
    # Humidity-based pests
    if humidity > 80:
        if 'Brown Planthopper (BPH)' not in pests:
            pests.append('Brown Planthopper (BPH)')
        pests.append('Rice Leaf-folder')
    elif humidity > 70:
        pests.append('Rice Leaf-folder')
    
    # Age-based pests
    if 25 <= age <= 45:
        pests.append('Stem Borer')
    elif 45 <= age <= 65:
        pests.append('Rice Gall Midge')
        pests.append('Stem Borer')
    elif age > 65:
        pests.append('Paddy Bug')
    
    # Rainfall-based pests
    if rain > 15:
        pests.append('Sheath Blight')
    elif rain < 5:
        pests.append('Brown Planthopper (BPH)')
    
    # District-specific common pests
    if district == 'Anuradhapura':
        pests.append('Brown Planthopper (BPH)')
    elif district == 'Polonnaruwa':
        pests.append('Rice Gall Midge')
    elif district == 'Hambantota':
        pests.append('Paddy Bug')
    elif district == 'Kurunegala':
        pests.append('Rice Leaf-folder')
    
    # Remove duplicates
    pests = list(dict.fromkeys(pests))
    
    # Select primary pest (first one)
    primary_pest = pests[0] if pests else 'Brown Planthopper (BPH)'
    
    # Create secondary pests list
    secondary_pests = pests[1:3] if len(pests) > 1 else []
    
    # Determine severity based on risk
    if risk_level in ['Very High', 'High']:
        severity = 'High'
    elif risk_level == 'Moderate':
        severity = 'Moderate'
    else:
        severity = 'Low'
    
    # Top pests for display
    top_pests = [{'pest': primary_pest, 'probability': min(95, 60 + risk_score/3), 
                  'severity': severity, 'risk_factor': 'Primary'}]
    
    for sec_pest in secondary_pests:
        top_pests.append({'pest': sec_pest, 'probability': 25 + np.random.uniform(-5, 15),
                         'severity': 'Moderate', 'risk_factor': 'Secondary'})
    
    # Add default if needed
    if len(top_pests) < 2:
        default_pests = ['Rice Leaf-folder', 'Stem Borer', 'Paddy Bug']
        for dp in default_pests:
            if dp != primary_pest:
                top_pests.append({'pest': dp, 'probability': 15 + np.random.uniform(-5, 10),
                                 'severity': 'Low', 'risk_factor': 'Secondary'})
                break
    
    return {
        'predicted_pest': primary_pest,
        'severity': severity,
        'incidence_percent': round(float(incidence), 1),
        'risk_level': risk_level,
        'risk_score': round(float(risk_score), 1),
        'confidence': round(70 + np.random.uniform(-10, 15), 1),
        'top_pests': top_pests[:3],
        'weather_impact': get_weather_impact(features)
    }

def make_prediction(features, district="", paddy_variety="", paddy_age=30):
    """Make prediction using loaded models"""
    
    features_2d = [features] if isinstance(features[0], (int, float)) else features
    
    if models.get('pest') and models.get('pest') is not None:
        try:
            pest_pred = models['pest'].predict(features_2d)[0]
            severity_pred = models['severity'].predict(features_2d)[0] if models.get('severity') else 1
            incidence_pred_transformed = models['incidence'].predict(features_2d)[0] if models.get('incidence') else 2.0
            incidence_percent = np.expm1(incidence_pred_transformed) if incidence_pred_transformed < 10 else incidence_pred_transformed
            
            if 'Pest' in encoders and encoders['Pest'] is not None:
                pest_name = encoders['Pest'].inverse_transform([int(pest_pred)])[0]
            else:
                pest_name = f"Pest_{pest_pred}"
            
            if hasattr(models['pest'], 'predict_proba'):
                pest_proba = models['pest'].predict_proba(features_2d)[0]
                confidence = float(np.max(pest_proba) * 100)
                
                top_indices = np.argsort(pest_proba)[-3:][::-1]
                top_pests = []
                for idx in top_indices:
                    if 'Pest' in encoders and encoders['Pest'] is not None:
                        pest = encoders['Pest'].inverse_transform([int(idx)])[0]
                    else:
                        pest = f"Pest_{idx}"
                    top_pests.append({
                        'pest': pest,
                        'probability': float(pest_proba[idx] * 100),
                        'severity': get_severity_from_probability(pest_proba[idx]),
                        'risk_factor': 'Primary' if idx == pest_pred else 'Secondary'
                    })
            else:
                confidence = 85.0
                top_pests = [{'pest': pest_name, 'probability': 85.0, 'severity': 'Moderate', 'risk_factor': 'Primary'}]
            
            severity_map = {0: 'Low', 1: 'Moderate', 2: 'High'}
            severity = severity_map.get(int(severity_pred) if not isinstance(severity_pred, (list, np.ndarray)) else severity_pred[0], 'Low')
            
            risk_level = get_risk_level(incidence_percent)
            
            return {
                'predicted_pest': pest_name,
                'severity': severity,
                'incidence_percent': float(min(incidence_percent, 100)),
                'risk_level': risk_level,
                'risk_score': float(min(incidence_percent * 2, 100)),
                'confidence': confidence,
                'top_pests': top_pests,
                'weather_impact': get_weather_impact(features)
            }
        except Exception as e:
            print(f"ML prediction error: {e}, using fallback")
            return get_rule_based_prediction(features, district, paddy_variety, paddy_age)
    else:
        return get_rule_based_prediction(features, district, paddy_variety, paddy_age)


# ============================================================
# API ENDPOINTS
# ============================================================

@pest_bp.route('/predict', methods=['POST'])
def predict_pest():
    """Main prediction endpoint for React Native app"""
    try:
        data = request.json
        
        district = data.get('district')
        paddy_type = data.get('paddy_type')
        paddy_age = float(data.get('paddy_age', 30))
        language = data.get('language', 'en')
        
        if not all([district, paddy_type, paddy_age]):
            return jsonify({
                'status': 'error',
                'error': 'Missing required fields'
            }), 400
        
        weather_data = get_weather_for_district(district)
        features_dict = prepare_features(district, paddy_type, paddy_age, weather_data)
        prediction_result = make_prediction(features_dict, district, paddy_type, paddy_age)
        
        fertilizer_rec = get_fertilizer_recommendation(
            prediction_result['predicted_pest'],
            prediction_result['severity'],
            prediction_result['incidence_percent']
        )
        
        response = {
            'status': 'success',
            'prediction': prediction_result,
            'fertilizer_recommendation': fertilizer_rec,
            'current_weather': weather_data,
            'season': get_current_season(),
            'language': language,
            'prediction_source': 'ML Model' if models else 'Rule-Based'
        }
        
        return jsonify(response)
        
    except Exception as e:
        print(f"Prediction error: {e}")
        return jsonify({
            'status': 'error',
            'error': str(e)
        }), 500


@pest_bp.route('/forecast', methods=['POST'])
def get_7day_forecast():
    """Get 7-day pest forecast for React Native app"""
    try:
        data = request.json
        
        district = data.get('district')
        paddy_type = data.get('paddy_type')
        paddy_age = float(data.get('paddy_age', 30))
        language = data.get('language', 'en')
        
        weather_forecast = get_weather_forecast_for_district(district, days=7)
        
        predictions = []
        current_age = paddy_age
        
        for day in range(1, 8):
            day_weather = weather_forecast[day-1] if day <= len(weather_forecast) else weather_forecast[-1]
            
            features_dict = prepare_features(district, paddy_type, current_age + day, day_weather)
            day_prediction = make_prediction(features_dict, district, paddy_type, current_age + day)
            
            predictions.append({
                'day': day,
                'risk_level': day_prediction['risk_level'],
                'risk_level_display': get_risk_display(day_prediction['risk_level'], language),
                'predicted_pest': day_prediction['predicted_pest'],
                'incidence_percent': day_prediction['incidence_percent'],
                'date': (datetime.now() + timedelta(days=day)).strftime('%Y-%m-%d'),
                'weather': day_weather
            })
        
        return jsonify({
            'status': 'success',
            'predictions': predictions
        })
        
    except Exception as e:
        print(f"Forecast error: {e}")
        return jsonify({
            'status': 'error',
            'error': str(e)
        }), 500


@pest_bp.route('/districts', methods=['GET'])
def get_districts():
    """Get list of districts for dropdown"""
    districts = [
        "Anuradhapura", "Polonnaruwa", "Hambantota", "Kurunegala",
        "Kandy", "Badulla", "Colombo", "Gampaha", "Kalutara",
        "Matale", "Nuwara Eliya", "Galle", "Matara", "Ratnapura",
        "Kegalle", "Puttalam", "Trincomalee", "Batticaloa",
        "Ampara", "Jaffna", "Kilinochchi", "Mannar", "Vavuniya",
        "Mullaitivu", "Moneragala"
    ]
    return jsonify({'districts': sorted(districts)})


@pest_bp.route('/varieties', methods=['GET'])
def get_varieties():
    """Get list of paddy varieties"""
    varieties = [
        "BG300", "BG352", "BG358", "BG360", "BG94-1",
        "At362", "At303", "At306", "At307", "At308",
        "Bw267-3", "Bw272-6b", "Bw274", "Ld253", "Ld355"
    ]
    return jsonify({'varieties': sorted(varieties)})


@pest_bp.route('/weather/<district>', methods=['GET'])
def get_weather(district):
    """Get current weather for a district"""
    try:
        weather = get_weather_for_district(district)
        return jsonify({
            'status': 'success',
            'weather': weather,
            'source': 'Weather Data'
        })
    except Exception as e:
        return jsonify({
            'status': 'success',
            'weather': get_mock_weather(district),
            'source': 'Weather Data (Mock)'
        })


@pest_bp.route('/model/status', methods=['GET'])
def get_model_status():
    """Check if ML models are loaded"""
    return jsonify({
        'ml_models_loaded': bool(models and len(models) > 0),
        'models': list(models.keys()) if models else []
    })



# ============================================================
# IMPROVED HEATMAP ENDPOINTS - Different data per pest
# ============================================================

# Pest-specific heatmap data
PEST_HEATMAP_DATA = {
    'all': [
        {'district': 'Anuradhapura', 'latitude': 8.3114, 'longitude': 80.4037, 'incidence': 75, 'count': 120},
        {'district': 'Polonnaruwa', 'latitude': 7.9403, 'longitude': 81.0188, 'incidence': 68, 'count': 98},
        {'district': 'Hambantota', 'latitude': 6.1241, 'longitude': 81.1185, 'incidence': 52, 'count': 76},
        {'district': 'Kurunegala', 'latitude': 7.4867, 'longitude': 80.3647, 'incidence': 45, 'count': 85},
        {'district': 'Kandy', 'latitude': 7.2906, 'longitude': 80.6337, 'incidence': 38, 'count': 64},
        {'district': 'Colombo', 'latitude': 6.9271, 'longitude': 79.8612, 'incidence': 25, 'count': 42},
        {'district': 'Galle', 'latitude': 6.0535, 'longitude': 80.2210, 'incidence': 30, 'count': 51},
        {'district': 'Jaffna', 'latitude': 9.6615, 'longitude': 80.0255, 'incidence': 42, 'count': 58},
        {'district': 'Badulla', 'latitude': 6.9934, 'longitude': 81.0550, 'incidence': 35, 'count': 47},
        {'district': 'Matale', 'latitude': 7.4675, 'longitude': 80.6234, 'incidence': 28, 'count': 39},
    ],
    'Brown Planthopper (BPH)': [
        {'district': 'Anuradhapura', 'latitude': 8.3114, 'longitude': 80.4037, 'incidence': 85, 'count': 67},
        {'district': 'Kurunegala', 'latitude': 7.4867, 'longitude': 80.3647, 'incidence': 72, 'count': 54},
        {'district': 'Polonnaruwa', 'latitude': 7.9403, 'longitude': 81.0188, 'incidence': 68, 'count': 49},
        {'district': 'Hambantota', 'latitude': 6.1241, 'longitude': 81.1185, 'incidence': 45, 'count': 38},
        {'district': 'Colombo', 'latitude': 6.9271, 'longitude': 79.8612, 'incidence': 35, 'count': 28},
    ],
    'Rice Leaf-folder': [
        {'district': 'Kurunegala', 'latitude': 7.4867, 'longitude': 80.3647, 'incidence': 78, 'count': 56},
        {'district': 'Kandy', 'latitude': 7.2906, 'longitude': 80.6337, 'incidence': 68, 'count': 48},
        {'district': 'Anuradhapura', 'latitude': 8.3114, 'longitude': 80.4037, 'incidence': 55, 'count': 42},
        {'district': 'Galle', 'latitude': 6.0535, 'longitude': 80.2210, 'incidence': 52, 'count': 39},
        {'district': 'Polonnaruwa', 'latitude': 7.9403, 'longitude': 81.0188, 'incidence': 48, 'count': 36},
    ],
    'Stem Borer': [
        {'district': 'Polonnaruwa', 'latitude': 7.9403, 'longitude': 81.0188, 'incidence': 82, 'count': 61},
        {'district': 'Anuradhapura', 'latitude': 8.3114, 'longitude': 80.4037, 'incidence': 65, 'count': 48},
        {'district': 'Hambantota', 'latitude': 6.1241, 'longitude': 81.1185, 'incidence': 58, 'count': 44},
        {'district': 'Jaffna', 'latitude': 9.6615, 'longitude': 80.0255, 'incidence': 55, 'count': 41},
    ],
    'Paddy Bug': [
        {'district': 'Hambantota', 'latitude': 6.1241, 'longitude': 81.1185, 'incidence': 88, 'count': 65},
        {'district': 'Badulla', 'latitude': 6.9934, 'longitude': 81.0550, 'incidence': 72, 'count': 53},
        {'district': 'Moneragala', 'latitude': 6.8725, 'longitude': 81.3506, 'incidence': 68, 'count': 49},
        {'district': 'Ampara', 'latitude': 7.2916, 'longitude': 81.6724, 'incidence': 62, 'count': 45},
    ],
    'Rice Gall Midge': [
        {'district': 'Polonnaruwa', 'latitude': 7.9403, 'longitude': 81.0188, 'incidence': 79, 'count': 58},
        {'district': 'Anuradhapura', 'latitude': 8.3114, 'longitude': 80.4037, 'incidence': 71, 'count': 52},
        {'district': 'Trincomalee', 'latitude': 8.5874, 'longitude': 81.2152, 'incidence': 65, 'count': 47},
        {'district': 'Batticaloa', 'latitude': 7.7100, 'longitude': 81.6924, 'incidence': 58, 'count': 42},
    ]
}

@pest_bp.route('/heatmap', methods=['GET'])
def get_heatmap():
    """Get pest occurrence heatmap data - returns different data per pest"""
    try:
        pest_type = request.args.get('pest')
        
        # Default to 'all' if no pest specified
        if not pest_type or pest_type == 'all' or pest_type == 'All Pests':
            heatmap_data = PEST_HEATMAP_DATA['all']
        else:
            # Try to find the pest in our data
            found = False
            for key in PEST_HEATMAP_DATA.keys():
                if pest_type.lower() in key.lower() or key.lower() in pest_type.lower():
                    heatmap_data = PEST_HEATMAP_DATA[key]
                    found = True
                    break
            
            if not found:
                # Return filtered data from 'all' for the specific pest
                heatmap_data = [d.copy() for d in PEST_HEATMAP_DATA['all']]
                # Adjust incidence values based on pest type
                for item in heatmap_data:
                    if 'BPH' in pest_type:
                        if item['district'] in ['Anuradhapura', 'Kurunegala']:
                            item['incidence'] = min(100, item['incidence'] + 20)
                        else:
                            item['incidence'] = max(10, item['incidence'] - 10)
                    elif 'Leaf' in pest_type:
                        if item['district'] in ['Kurunegala', 'Kandy']:
                            item['incidence'] = min(100, item['incidence'] + 25)
                        else:
                            item['incidence'] = max(10, item['incidence'] - 5)
                    elif 'Stem' in pest_type:
                        if item['district'] in ['Polonnaruwa', 'Anuradhapura']:
                            item['incidence'] = min(100, item['incidence'] + 30)
                    elif 'Bug' in pest_type:
                        if item['district'] in ['Hambantota', 'Badulla']:
                            item['incidence'] = min(100, item['incidence'] + 35)
        
        return jsonify({'success': True, 'data': heatmap_data})
        
    except Exception as e:
        print(f"Heatmap error: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


# ============================================================
# PEST LIBRARY ENDPOINTS
# ============================================================

@pest_bp.route('/library', methods=['GET'])
def get_pest_library():
    """Get all pests in library"""
    language = request.args.get('lang', 'en')
    
    pests = [
        {'id': 'bph', 'name': 'Brown Planthopper (BPH)' if language == 'en' else 'දුඹුරු පැහැති කොළ මකුණා', 'scientific_name': 'Nilaparvata lugens'},
        {'id': 'leaf_folder', 'name': 'Rice Leaf-folder' if language == 'en' else 'කොළ නලියා', 'scientific_name': 'Cnaphalocrocis medinalis'},
        {'id': 'stem_borer', 'name': 'Stem Borer' if language == 'en' else 'කඳ කටුව', 'scientific_name': 'Scirpophaga incertulas'},
        {'id': 'paddy_bug', 'name': 'Paddy Bug' if language == 'en' else 'වී කුරුමිණියා', 'scientific_name': 'Leptocorisa oratorius'},
        {'id': 'gall_midge', 'name': 'Rice Gall Midge' if language == 'en' else 'සහල් පිත්තල මැස්සා', 'scientific_name': 'Orseolia oryzae'},
    ]
    
    return jsonify({'success': True, 'data': pests})


@pest_bp.route('/library/<pest_name>', methods=['GET'])
def get_pest_info(pest_name):
    """Get detailed information about a specific pest"""
    language = request.args.get('lang', 'en')
    
    pest_info_db = {
        'Brown Planthopper (BPH)': {
            'en': {
                'name': 'Brown Planthopper (BPH)',
                'scientific_name': 'Nilaparvata lugens',
                'description': 'Small brown insects that cluster at the base of rice plants, causing hopperburn and wilting.',
                'symptoms': ['Yellowing of leaves', 'Stunted growth', 'Wilting', 'Hopperburn patches'],
                'management': ['Use resistant varieties', 'Maintain proper spacing', 'Avoid excess nitrogen', 'Apply Buprofezin or Imidacloprid'],
                'favorable_conditions': ['High humidity (>70%)', 'High temperature (28-32°C)', 'Excess nitrogen fertilizer']
            }
        },
        'Rice Leaf-folder': {
            'en': {
                'name': 'Rice Leaf-folder',
                'scientific_name': 'Cnaphalocrocis medinalis',
                'description': 'Larvae fold rice leaves and feed on green tissue, causing white streaks.',
                'symptoms': ['Folded leaves', 'White streaks', 'Scraped leaf tissues'],
                'management': ['Encourage natural predators', 'Use light traps', 'Apply Chlorantraniliprole'],
                'favorable_conditions': ['Moderate rainfall', 'Cloudy warm weather', 'High nitrogen']
            }
        },
        'Stem Borer': {
            'en': {
                'name': 'Stem Borer',
                'scientific_name': 'Scirpophaga incertulas',
                'description': 'Larvae bore into rice stems causing "dead hearts" and "white heads".',
                'symptoms': ['Dead heart in vegetative stage', 'White heads in reproductive stage', 'Bored holes in stems'],
                'management': ['Use resistant varieties', 'Remove egg masses', 'Apply Cartap hydrochloride'],
                'favorable_conditions': ['High humidity', 'Dense planting', 'Continuous flooding']
            }
        },
        'Paddy Bug': {
            'en': {
                'name': 'Paddy Bug',
                'scientific_name': 'Leptocorisa oratorius',
                'description': 'Sucking pests that attack grains causing empty or discolored grains.',
                'symptoms': ['Empty grains', 'Discolored grains', 'Dark spots on grains'],
                'management': ['Use sweep nets', 'Neem sprays', 'Maintain clean bunds'],
                'favorable_conditions': ['Flowering stage', 'Adjacent weedy areas', 'Dry conditions']
            }
        },
        'Rice Gall Midge': {
            'en': {
                'name': 'Rice Gall Midge',
                'scientific_name': 'Orseolia oryzae',
                'description': 'Causes tube-like galls called "silver shoots" preventing panicle formation.',
                'symptoms': ['Tube-like galls', 'Silver shoots', 'Onion-like leaves'],
                'management': ['Use resistant varieties', 'Remove weeds', 'Apply Carbofuran at planting'],
                'favorable_conditions': ['Early tillering stage', 'High humidity', 'Close planting']
            }
        }
    }
    
    for key, info in pest_info_db.items():
        if pest_name.lower() in key.lower() or key.lower() in pest_name.lower():
            data = info.get(language, info['en'])
            return jsonify({'success': True, 'data': data})
    
    return jsonify({'success': False, 'error': 'Pest not found'}), 404


@pest_bp.route('/library/search', methods=['GET'])
def search_pest_library():
    """Search pests by name"""
    query = request.args.get('q', '')
    language = request.args.get('lang', 'en')
    
    if not query:
        return jsonify({'success': False, 'error': 'Search query required'}), 400
    
    pests = [
        {'id': 'bph', 'name': 'Brown Planthopper (BPH)' if language == 'en' else 'දුඹුරු පැහැති කොළ මකුණා'},
        {'id': 'leaf_folder', 'name': 'Rice Leaf-folder' if language == 'en' else 'කොළ නලියා'},
        {'id': 'stem_borer', 'name': 'Stem Borer' if language == 'en' else 'කඳ කටුව'},
        {'id': 'paddy_bug', 'name': 'Paddy Bug' if language == 'en' else 'වී කුරුමිණියා'},
        {'id': 'gall_midge', 'name': 'Rice Gall Midge' if language == 'en' else 'සහල් පිත්තල මැස්සා'},
    ]
    
    results = [p for p in pests if query.lower() in p['name'].lower()]
    
    return jsonify({'success': True, 'data': results})


@pest_bp.route('/library/prevention-tips', methods=['GET'])
def get_prevention_tips():
    """Get general pest prevention tips"""
    pest = request.args.get('pest')
    
    general_tips = [
        'Use certified disease-free seeds',
        'Maintain proper plant spacing (20cm x 15cm)',
        'Practice field sanitation - remove weeds and crop residues',
        'Use balanced fertilization (avoid excess nitrogen)',
        'Implement crop rotation with non-host crops',
        'Monitor fields regularly (twice weekly)',
        'Encourage natural enemies (spiders, dragonflies)',
        'Avoid water stagnation - maintain proper drainage',
        'Remove weed hosts from field borders',
        'Use resistant varieties when available'
    ]
    
    return jsonify({'success': True, 'data': general_tips})

# Add this to your pest.py after the existing library endpoints

@pest_bp.route('/library/id/<pest_id>', methods=['GET'])
def get_pest_info_by_id(pest_id):
    """Get pest info by ID (bph, leaf_folder, etc.)"""
    language = request.args.get('lang', 'en')
    
    # Map IDs to full names
    id_to_name = {
        'bph': 'Brown Planthopper (BPH)',
        'leaf_folder': 'Rice Leaf-folder',
        'stem_borer': 'Stem Borer',
        'paddy_bug': 'Paddy Bug',
        'gall_midge': 'Rice Gall Midge'
    }
    
    pest_name = id_to_name.get(pest_id)
    if not pest_name:
        return jsonify({'success': False, 'error': 'Invalid pest ID'}), 404
    
    # Reuse existing pest info
    pest_info_db = {
        'Brown Planthopper (BPH)': {
            'en': {
                'name': 'Brown Planthopper (BPH)',
                'scientific_name': 'Nilaparvata lugens',
                'description': 'Small brown insects that cluster at the base of rice plants, causing hopperburn and wilting.',
                'symptoms': ['Yellowing of leaves', 'Stunted growth', 'Wilting', 'Hopperburn patches'],
                'management': ['Use resistant varieties', 'Maintain proper spacing', 'Avoid excess nitrogen', 'Apply Buprofezin or Imidacloprid'],
                'favorable_conditions': ['High humidity (>70%)', 'High temperature (28-32°C)', 'Excess nitrogen fertilizer']
            },
            'si': {
                'name': 'දුඹුරු පැහැති කොළ මකුණා',
                'scientific_name': 'Nilaparvata lugens',
                'description': 'කුඩා දුඹුරු පැහැති කෘමීන් වී ශාකයේ පාදමේ රැස් වී, දඬු ගිනි ගැනීම සහ මැලවීම සිදු කරයි.',
                'symptoms': ['කොළ කහ පැහැ ගැන්වීම', 'වර්ධනය අඩාල වීම', 'මැලවීම', 'දඬු ගිනි ගැනීමේ පැල්ලම්'],
                'management': ['ප්‍රතිරෝධී ප්‍රභේද භාවිතා කරන්න', 'නිසි පරතරය පවත්වා ගන්න', 'අධික නයිට්‍රජන් වළක්වන්න', 'බුප්‍රොෆෙසින් හෝ ඉමිඩාක්ලොප්‍රිඩ් යොදන්න'],
                'favorable_conditions': ['අධික ආර්ද්‍රතාව (>70%)', 'අධික උෂ්ණත්වය (28-32°C)', 'අධික නයිට්‍රජන් පොහොර']
            }
        },
        'Rice Leaf-folder': {
            'en': {
                'name': 'Rice Leaf-folder',
                'scientific_name': 'Cnaphalocrocis medinalis',
                'description': 'Larvae fold rice leaves and feed on green tissue, causing white streaks.',
                'symptoms': ['Folded leaves', 'White streaks', 'Scraped leaf tissues'],
                'management': ['Encourage natural predators', 'Use light traps', 'Apply Chlorantraniliprole'],
                'favorable_conditions': ['Moderate rainfall', 'Cloudy warm weather', 'High nitrogen']
            },
            'si': {
                'name': 'වී කොළ ගඩොල්',
                'scientific_name': 'Cnaphalocrocis medinalis',
                'description': 'ද්‍රෝණි වී කොළ නවා ඇතුළත කොළ පටක ආහාරයට ගෙන සුදු ඉරි ඇති කරයි.',
                'symptoms': ['නවන ලද කොළ', 'සුදු ඉරි', 'සීරීම් ලකුණු සහිත කොළ පටක'],
                'management': ['ස්වභාවික විලෝපිකයන් දිරිගන්වන්න', 'ආලෝක උගුල් භාවිතා කරන්න', 'ක්ලෝරන්ට්‍රනිලිප්‍රෝල් යොදන්න'],
                'favorable_conditions': ['මධ්‍යස්ථ වර්ෂාපතනය', 'වළාකුළු සහිත උණුසුම් කාලගුණය', 'අධික නයිට්‍රජන්']
            }
        },
        'Stem Borer': {
            'en': {
                'name': 'Stem Borer',
                'scientific_name': 'Scirpophaga incertulas',
                'description': 'Larvae bore into rice stems causing "dead hearts" and "white heads".',
                'symptoms': ['Dead heart in vegetative stage', 'White heads in reproductive stage', 'Bored holes in stems'],
                'management': ['Use resistant varieties', 'Remove egg masses', 'Apply Cartap hydrochloride'],
                'favorable_conditions': ['High humidity', 'Dense planting', 'Continuous flooding']
            },
            'si': {
                'name': 'කඳ කටුව',
                'scientific_name': 'Scirpophaga incertulas',
                'description': 'ද්‍රෝණි වී කඳන් තුළට විනිවිද ගොස් "මැරුණු හදවත්" සහ "සුදු හිස්" ඇති කරයි.',
                'symptoms': ['ශාකමය අවධියේදී මැරුණු හදවත්', 'ප්‍රජනන අවධියේදී සුදු හිස්', 'කඳන්හි සිදුරු'],
                'management': ['ප්‍රතිරෝධී ප්‍රභේද භාවිතා කරන්න', 'බිත්තර පොකුරු ඉවත් කරන්න', 'කාටප් හයිඩ්‍රොක්ලෝරයිඩ් යොදන්න'],
                'favorable_conditions': ['අධික ආර්ද්‍රතාව', 'ඝන රෝපණ', 'අඛණ්ඩ ජලය රැඳීම']
            }
        },
        'Paddy Bug': {
            'en': {
                'name': 'Paddy Bug',
                'scientific_name': 'Leptocorisa oratorius',
                'description': 'Sucking pests that attack grains causing empty or discolored grains.',
                'symptoms': ['Empty grains', 'Discolored grains', 'Dark spots on grains'],
                'management': ['Use sweep nets', 'Neem sprays', 'Maintain clean bunds'],
                'favorable_conditions': ['Flowering stage', 'Adjacent weedy areas', 'Dry conditions']
            },
            'si': {
                'name': 'වී කුරුමිණියා',
                'scientific_name': 'Leptocorisa oratorius',
                'description': 'ධාන්‍ය වලට පහර දෙන උරා බොන පළිබෝධකයන් හිස් හෝ විකෘති වූ ධාන්‍ය ඇති කරයි.',
                'symptoms': ['හිස් ධාන්‍ය', 'විකෘති වූ ධාන්‍ය', 'ධාන්‍ය මත තද පැහැ ලප'],
                'management': ['දැල් භාවිතා කරන්න', 'නීම් ඉසින භාවිතා කරන්න', 'පිරිසිදු බැමි පවත්වා ගන්න'],
                'favorable_conditions': ['මල් හටගැනීමේ අවධිය', 'යාබද වල් ප්‍රදේශ', 'වියළි තත්වයන්']
            }
        },
        'Rice Gall Midge': {
            'en': {
                'name': 'Rice Gall Midge',
                'scientific_name': 'Orseolia oryzae',
                'description': 'Causes tube-like galls called "silver shoots" preventing panicle formation.',
                'symptoms': ['Tube-like galls', 'Silver shoots', 'Onion-like leaves'],
                'management': ['Use resistant varieties', 'Remove weeds', 'Apply Carbofuran at planting'],
                'favorable_conditions': ['Early tillering stage', 'High humidity', 'Close planting']
            },
            'si': {
                'name': 'වී ගැල් මිජ්',
                'scientific_name': 'Orseolia oryzae',
                'description': '"රිදී රිකිලි" ලෙස හැඳින්වෙන නල ආකාර ගෝල ඇති කර පුෂ්ප මංජරිය සෑදීම වළක්වයි.',
                'symptoms': ['නල ආකාර ගෝල', 'රිදී රිකිලි', 'ලූනු වැනි කොළ'],
                'management': ['ප්‍රතිරෝධී ප්‍රභේද භාවිතා කරන්න', 'වල් ඉවත් කරන්න', 'රෝපණයේදී කාබෝෆියුරාන් යොදන්න'],
                'favorable_conditions': ['මුල් කොළ වැකීමේ අවධිය', 'අධික ආර්ද්‍රතාව', 'සමීප රෝපණ']
            }
        }       
    }

# ============================================================
# NOTIFICATION ENDPOINTS
# ============================================================

@pest_bp.route('/notifications/toggle', methods=['POST'])
def toggle_notifications():
    """Enable/disable pest notifications"""
    try:
        data = request.json
        user_id = data.get('user_id')
        enabled = data.get('enabled', True)
        onesignal_id = data.get('onesignal_id')
        
        if not user_id:
            return jsonify({'success': False, 'error': 'user_id required'}), 400
        
        user_preferences[user_id] = {
            'enabled': enabled,
            'onesignal_id': onesignal_id,
            'updated_at': datetime.now().isoformat()
        }
        
        return jsonify({
            'success': True,
            'message': f'Notifications {"enabled" if enabled else "disabled"}'
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@pest_bp.route('/notifications/status', methods=['GET'])
def get_notification_status():
    """Get user's notification status"""
    try:
        user_id = request.args.get('user_id')
        
        if not user_id:
            return jsonify({'success': False, 'error': 'user_id required'}), 400
        
        if user_id in user_preferences:
            return jsonify({'success': True, 'data': user_preferences[user_id]})
        
        return jsonify({
            'success': True,
            'data': {'enabled': False, 'onesignal_id': None}
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


# ============================================================
# WEATHER ENDPOINTS
# ============================================================

@pest_bp.route('/weather/current', methods=['GET'])
def get_current_weather():
    """Get current weather for location"""
    try:
        city = request.args.get('city', 'Anuradhapura')
        weather = get_mock_weather(city)
        
        return jsonify({
            'success': True,
            'data': weather
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@pest_bp.route('/weather/forecast', methods=['GET'])
def get_weather_forecast():
    """Get weather forecast for location"""
    try:
        days = int(request.args.get('days', 7))
        city = request.args.get('city', 'Anuradhapura')
        
        forecast = get_weather_forecast_for_district(city, days)
        
        return jsonify({
            'success': True,
            'data': forecast
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@pest_bp.route('/statistics', methods=['GET'])
def get_statistics():
    """Get pest statistics for dashboard"""
    stats = {
        'total_forecasts': 0,
        'high_risk_alerts': 0,
        'common_pests': [
            {'name': 'Brown Planthopper (BPH)', 'count': 45},
            {'name': 'Rice Leaf-folder', 'count': 32},
            {'name': 'Stem Borer', 'count': 28},
            {'name': 'Paddy Bug', 'count': 25},
            {'name': 'Rice Gall Midge', 'count': 18}
        ],
        'district_risk': {
            'Anuradhapura': 'High',
            'Polonnaruwa': 'High',
            'Hambantota': 'Moderate',
            'Kurunegala': 'Moderate',
            'Kandy': 'Low'
        }
    }
    
    return jsonify({'success': True, 'data': stats})


print(f"\n✅ Pest routes registered successfully!")
print(f"   Available endpoints:")
print(f"   - POST /api/pest/predict")
print(f"   - POST /api/pest/forecast")
print(f"   - GET  /api/pest/districts")
print(f"   - GET  /api/pest/varieties")
print(f"   - GET  /api/pest/weather/<district>")
print(f"   - GET  /api/pest/model/status")
print(f"   - GET  /api/pest/library")
print(f"   - GET  /api/pest/heatmap?pest=...")
print(f"   - POST /api/pest/notifications/toggle")