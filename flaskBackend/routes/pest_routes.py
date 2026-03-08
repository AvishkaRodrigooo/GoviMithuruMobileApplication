from flask import Blueprint, request, jsonify, current_app
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from utils.pest_forecast import forecast_engine
from utils.weather_service import weather_service
from utils.pest_notifications import notifier
from utils.heatmap_generator import heatmap_generator
from utils.pest_library import pest_library
import json
import joblib
import os
from sklearn.preprocessing import StandardScaler
import warnings
warnings.filterwarnings('ignore')

pest_bp = Blueprint('pest', __name__)

# In-memory store for user notification preferences
# In production, use database
user_preferences = {}

# ============================================================
# FORECASTING ENDPOINTS
# ============================================================

pest_bp = Blueprint('pest', __name__)

# Load models once at startup
MODEL_DIR = "model"
models = {}
scalers = {}
encoders = {}
features = []

try:
    # Load pest model
    models['pest'] = joblib.load(f"{MODEL_DIR}/pest_model.pkl")
    models['severity'] = joblib.load(f"{MODEL_DIR}/severity_model.pkl")
    models['incidence'] = joblib.load(f"{MODEL_DIR}/incidence_model.pkl")
    models['ensemble'] = joblib.load(f"{MODEL_DIR}/incidence_ensemble_model.pkl")
    
    # Load scaler and encoders
    scalers['feature'] = joblib.load(f"{MODEL_DIR}/feature_scaler.pkl")
    features = joblib.load(f"{MODEL_DIR}/features.pkl")
    
    # Load label encoders
    for col in ["District", "Season", "Paddy_Variety", "Pest"]:
        try:
            encoders[col] = joblib.load(f"{MODEL_DIR}/{col}_encoder.pkl")
        except:
            print(f"Warning: Could not load {col} encoder")
            
    print(" All models loaded successfully")
except Exception as e:
    print(f" Error loading models: {e}")
    print("Using rule-based fallback predictions")


# FORECASTING ENDPOINTS 


@pest_bp.route('/predict', methods=['POST'])
def predict_pest():
    """
    Main prediction endpoint for React Native app
    Expected JSON:
    {
        "district": "Anuradhapura",
        "paddy_type": "BG300",
        "paddy_age": 45,
        "language": "en"
    }
    """
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
        
        #  current weather data 
        weather_data = get_weather_for_district(district)
        
        #  features for prediction
        features_dict = prepare_features(district, paddy_type, paddy_age, weather_data)
        
        #  prediction
        prediction_result = make_prediction(features_dict)
        
      
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
            'prediction_source': 'ML Model' if models else 'Rule-Based Fallback'
        }
        
        return jsonify(response)
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'error': str(e)
        }), 500

@pest_bp.route('/forecast', methods=['POST'])
def get_7day_forecast():
    """
    Get 7-day pest forecast for React Native app
    """
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
            #  features for each day
            day_weather = weather_forecast[day-1] if day <= len(weather_forecast) else weather_forecast[-1]
            
            features_dict = prepare_features(
                district, 
                paddy_type, 
                current_age + day, 
                day_weather
            )
            
            #  prediction for this day
            day_prediction = make_prediction(features_dict)
            
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
            'source': 'Weather Data'
        })

@pest_bp.route('/model/status', methods=['GET'])
def get_model_status():
    """Check if ML models are loaded"""
    return jsonify({
        'ml_models_loaded': bool(models),
        'models': list(models.keys()) if models else []
    })


# HELPER FUNCTIONS


def prepare_features(district, paddy_variety, paddy_age, weather):
    """Prepare feature vector for prediction"""
    
    
    district_encoded = encode_value('District', district)
    variety_encoded = encode_value('Paddy_Variety', paddy_variety)
    
    # Default season based on month
    season = get_current_season()
    season_encoded = encode_value('Season', season)
    
    
    growth_stage = get_growth_stage_code(paddy_age)
    
    # Calculate interaction features
    temp_humidity = weather['temp'] * weather['humidity'] / 100
    rain_moisture = weather['rain'] * weather.get('soil_moisture', 75) / 100
    ph_organic = weather.get('soil_ph', 6.5) * weather.get('organic_matter', 2.0)
    
   
    weather_severity = (
        (weather['temp'] - 27) / 3 +  
        (weather['humidity'] - 75) / 15 +
        (weather['rain'] - 5) / 5
    )
    
    # Calculate soil quality score
    soil_quality = (
        -abs(weather.get('soil_ph', 6.5) - 6.5) +  
        weather.get('organic_matter', 2.0) / 5 +
        weather.get('soil_moisture', 75) / 100
    )
    
    features = {
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
    
    
    feature_array = []
    for f in features:
        feature_array.append(features[f])
    
    
    if 'feature' in scalers:
        feature_array = scalers['feature'].transform([feature_array])[0]
    
    return feature_array

def make_prediction(features):
    """Make prediction using loaded models"""
    
    # Reshape features for prediction
    features_2d = [features] if isinstance(features[0], (int, float)) else features
    
    if models.get('pest'):
        # Use ML models
        pest_pred = models['pest'].predict(features_2d)[0]
        severity_pred = models['severity'].predict(features_2d)[0]
        incidence_pred_transformed = models['incidence'].predict(features_2d)[0]
        incidence_percent = np.expm1(incidence_pred_transformed)
        
        #  pest name from encoder
        if 'Pest' in encoders:
            pest_name = encoders['Pest'].inverse_transform([int(pest_pred)])[0]
        else:
            pest_name = f"Pest_{pest_pred}"
        
        #  confidence scores
        pest_proba = models['pest'].predict_proba(features_2d)[0]
        confidence = float(np.max(pest_proba) * 100)
        
        #  top 3 pests
        top_indices = np.argsort(pest_proba)[-3:][::-1]
        top_pests = []
        for idx in top_indices:
            if 'Pest' in encoders:
                pest = encoders['Pest'].inverse_transform([int(idx)])[0]
            else:
                pest = f"Pest_{idx}"
            top_pests.append({
                'pest': pest,
                'probability': float(pest_proba[idx] * 100),
                'severity': get_severity_from_probability(pest_proba[idx]),
                'risk_factor': 'Primary' if idx == pest_pred else 'Secondary'
            })
        
        
        severity_map = {0: 'Low', 1: 'Moderate', 2: 'High'}
        severity = severity_map.get(severity_pred, 'Low')
        
        # Calculate risk level based on incidence
        risk_level = get_risk_level(incidence_percent)
        
        return {
            'predicted_pest': pest_name,
            'severity': severity,
            'incidence_percent': float(incidence_percent),
            'risk_level': risk_level,
            'risk_score': float(incidence_percent * 2),  
            'confidence': confidence,
            'top_pests': top_pests,
            'weather_impact': get_weather_impact(features)
        }
    else:
       
        return get_rule_based_prediction(features)

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

def get_weather_impact(features):
    """Generate weather impact statements"""
    impacts = []
    
    if features[0] > 32:  # High temperature
        impacts.append("High temperature increases pest activity")
    if features[2] > 80:  # High humidity
        impacts.append("High humidity favors fungal growth")
    if features[1] > 20:  # High rainfall
        impacts.append("Heavy rainfall may reduce pest population")
    if features[3] < 5.5:  # Low pH
        impacts.append("Acidic soil may stress plants")
    
    if not impacts:
        impacts.append("Normal weather conditions")
    
    return impacts

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
        return 0  # Seedling
    elif age <= 50:
        return 1  # Tillering
    elif age <= 70:
        return 2  # Reproductive
    elif age <= 90:
        return 3  # Ripening
    else:
        return 4  # Maturity

def get_current_season():
    """Determine current season based on month"""
    month = datetime.now().month
    if 5 <= month <= 9:
        return 'Yala'
    else:
        return 'Maha'

def get_weather_for_district(district):
    """Get weather data for a district (mock or real API)"""
   
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

def get_mock_weather(district):
    """Get mock weather data for a district"""
    # District-specific weather patterns
    weather_patterns = {
        'Anuradhapura': {'temp': 29.5, 'rain': 7.2, 'humidity': 78},
        'Polonnaruwa': {'temp': 30.1, 'rain': 6.8, 'humidity': 75},
        'Hambantota': {'temp': 31.2, 'rain': 3.5, 'humidity': 70},
        'Kurunegala': {'temp': 28.8, 'rain': 8.5, 'humidity': 80},
        'Kandy': {'temp': 24.5, 'rain': 10.2, 'humidity': 85},
        'Badulla': {'temp': 23.8, 'rain': 9.5, 'humidity': 82},
        'Colombo': {'temp': 28.5, 'rain': 12.0, 'humidity': 83},
    }
    
    default = {'temp': 28.0, 'rain': 7.0, 'humidity': 78}
    pattern = weather_patterns.get(district, default)
    
    return {
        'temp': pattern['temp'] + np.random.uniform(-1, 1),
        'rain': pattern['rain'] + np.random.uniform(-2, 2),
        'humidity': pattern['humidity'] + np.random.uniform(-3, 3),
        'description': 'Partly cloudy' if np.random.random() > 0.3 else 'Light rain',
        'pressure': 1013 + np.random.randint(-5, 5),
        'wind_speed': 2.5 + np.random.uniform(-1, 1),
        'wind_deg': np.random.randint(0, 360),
        'clouds': np.random.randint(20, 80),
        'soil_moisture': 65 + np.random.randint(-10, 10),
        'soil_ph': 6.5 + np.random.uniform(-0.3, 0.3),
        'organic_matter': 2.0 + np.random.uniform(-0.2, 0.2)
    }

def get_rule_based_prediction(features):
    """Fallback rule-based prediction when ML models aren't available"""
    
    temp = features[0] if len(features) > 0 else 28
    rain = features[1] if len(features) > 1 else 5
    humidity = features[2] if len(features) > 2 else 75
    age = features[9] if len(features) > 9 else 45
    
    
    risk_score = 0
    
    # Temperature impact
    if temp > 30:
        risk_score += 30
    elif temp > 28:
        risk_score += 20
    elif temp > 25:
        risk_score += 10
    
    # Humidity impact
    if humidity > 85:
        risk_score += 30
    elif humidity > 75:
        risk_score += 20
    elif humidity > 65:
        risk_score += 10
    
    # Rainfall impact
    if rain > 15:
        risk_score -= 20  # Heavy rain reduces pest
    elif rain > 8:
        risk_score += 20
    elif rain > 3:
        risk_score += 10
    
    # Age impact
    if 30 <= age <= 60:
        risk_score += 20  # Vulnerable stage
    
    # Determine risk level
    if risk_score >= 70:
        risk_level = 'Very High'
        incidence = 45 + np.random.uniform(-5, 5)
    elif risk_score >= 50:
        risk_level = 'High'
        incidence = 35 + np.random.uniform(-5, 5)
    elif risk_score >= 30:
        risk_level = 'Moderate'
        incidence = 22 + np.random.uniform(-5, 5)
    elif risk_score >= 15:
        risk_level = 'Low'
        incidence = 12 + np.random.uniform(-3, 3)
    else:
        risk_level = 'Very Low'
        incidence = 5 + np.random.uniform(-2, 2)
    
    # Pest based on conditions
    if humidity > 80 and temp > 28:
        pest = 'Brown Planthopper (BPH)'
    elif rain > 10 and humidity > 75:
        pest = 'Rice Leaf-folder'
    elif temp < 26 and humidity > 85:
        pest = 'Sheath Blight'
    elif 25 <= age <= 50:
        pest = 'Stem Borer'
    else:
        pest = 'Paddy Bug'
    
    return {
        'predicted_pest': pest,
        'severity': 'High' if risk_score > 50 else 'Moderate' if risk_score > 30 else 'Low',
        'incidence_percent': float(incidence),
        'risk_level': risk_level,
        'risk_score': float(risk_score),
        'confidence': 75.0,
        'top_pests': [
            {'pest': pest, 'probability': 65.0, 'severity': 'High' if risk_score > 50 else 'Moderate', 'risk_factor': 'Primary'},
            {'pest': 'Rice Leaf-folder', 'probability': 25.0, 'severity': 'Moderate', 'risk_factor': 'Secondary'}
        ],
        'weather_impact': ['Normal weather conditions']
    }

# @pest_bp.route('/forecast/history', methods=['GET'])
# def get_forecast_history():
#     """Get user's forecast history"""
#     try:
#         user_id = request.args.get('user_id')
#         limit = int(request.args.get('limit', 10))
        
#         if not user_id:
#             return jsonify({'success': False, 'error': 'user_id required'}), 400
        
#         if hasattr(current_app, 'db'):
#             forecasts = list(current_app.db.pest_forecasts.find(
#                 {'user_id': user_id},
#                 {'_id': 0}
#             ).sort('created_at', -1).limit(limit))
            
#             return jsonify({
#                 'success': True,
#                 'data': forecasts
#             })
#         else:
#             return jsonify({
#                 'success': False,
#                 'error': 'Database not available'
#             }), 500
            
#     except Exception as e:
#         return jsonify({'success': False, 'error': str(e)}), 500


# NOTIFICATION ENDPOINTS


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
        
        # Store preference
        user_preferences[user_id] = {
            'enabled': enabled,
            'onesignal_id': onesignal_id,
            'updated_at': datetime.now().isoformat()
        }
        
        
        if hasattr(current_app, 'db'):
            current_app.db.user_notifications.update_one(
                {'user_id': user_id},
                {'$set': {
                    'enabled': enabled,
                    'onesignal_id': onesignal_id,
                    'updated_at': datetime.now()
                }},
                upsert=True
            )
        
  
        if enabled and onesignal_id:
            notifier.schedule_daily_forecast(onesignal_id, hour=6, minute=0)
        else:
            notifier.cancel_scheduled(user_id)
        
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
            return jsonify({
                'success': True,
                'data': user_preferences[user_id]
            })
        
        
        if hasattr(current_app, 'db'):
            pref = current_app.db.user_notifications.find_one(
                {'user_id': user_id},
                {'_id': 0}
            )
            if pref:
                return jsonify({
                    'success': True,
                    'data': pref
                })
        
       
        return jsonify({
            'success': True,
            'data': {
                'enabled': False,
                'onesignal_id': None
            }
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@pest_bp.route('/notifications/send-alert', methods=['POST'])
def send_pest_alert():
    """Manually send pest alert (admin use)"""
    try:
        data = request.json
        user_id = data.get('user_id')
        onesignal_id = data.get('onesignal_id')
        pest = data.get('pest', 'Pest')
        risk = data.get('risk', 'Medium')
        district = data.get('district', 'your area')
        
        if not onesignal_id:
            return jsonify({'success': False, 'error': 'onesignal_id required'}), 400
        
        success = notifier.send_pest_alert(onesignal_id, pest, risk, district)
        
        return jsonify({
            'success': success,
            'message': 'Alert sent' if success else 'Failed to send'
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


# PEST LIBRARY ENDPOINTS


@pest_bp.route('/library', methods=['GET'])
def get_pest_library():
    """Get all pests in library"""
    try:
        language = request.args.get('lang', 'en')
        pests = pest_library.get_all_pests(language)
        
        return jsonify({
            'success': True,
            'data': pests
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@pest_bp.route('/library/<pest_name>', methods=['GET'])
def get_pest_info(pest_name):
    """Get detailed information about a specific pest"""
    try:
        language = request.args.get('lang', 'en')
        info = pest_library.get_pest_info(pest_name, language)
        
        if info:
            return jsonify({
                'success': True,
                'data': info
            })
        else:
            return jsonify({
                'success': False,
                'error': 'Pest not found'
            }), 404
            
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@pest_bp.route('/library/search', methods=['GET'])
def search_pest_library():
    """Search pests by name or symptom"""
    try:
        query = request.args.get('q', '')
        language = request.args.get('lang', 'en')
        
        if not query:
            return jsonify({'success': False, 'error': 'Search query required'}), 400
        
        results = pest_library.search_pests(query, language)
        
        return jsonify({
            'success': True,
            'data': results
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@pest_bp.route('/library/prevention-tips', methods=['GET'])
def get_prevention_tips():
    """Get general pest prevention tips"""
    try:
        pest = request.args.get('pest')
        tips = pest_library.get_prevention_tips(pest)
        
        return jsonify({
            'success': True,
            'data': tips
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


# HEATMAP ENDPOINTS


@pest_bp.route('/heatmap', methods=['GET'])
def get_heatmap():
    """Get pest occurrence heatmap data"""
    try:
        pest = request.args.get('pest')
        
        #  data
        try:
            df = pd.read_csv('data/paddy_pest_weather_soil_SriLanka_2015_2024_updated.csv')
        except:
            
            return jsonify({
                'success': True,
                'data': [
                    {'district': 'Anuradhapura', 'latitude': 8.3114, 'longitude': 80.4037, 'incidence': 75, 'count': 120},
                    {'district': 'Kurunegala', 'latitude': 7.4867, 'longitude': 80.3647, 'incidence': 60, 'count': 95},
                    {'district': 'Polonnaruwa', 'latitude': 7.9403, 'longitude': 81.0188, 'incidence': 45, 'count': 80},
                    {'district': 'Hambantota', 'latitude': 6.1241, 'longitude': 81.1185, 'incidence': 30, 'count': 65},
                    {'district': 'Colombo', 'latitude': 6.9271, 'longitude': 79.8612, 'incidence': 20, 'count': 40}
                ]
            })
        
        if pest:
           
            pest_data = df[df['Pest'].str.contains(pest, na=False)]
            heatmap_data = heatmap_generator.get_heatmap_data(pest_data)
        else:
            
            heatmap_data = heatmap_generator.get_heatmap_data(df)
        
        return jsonify({
            'success': True,
            'data': heatmap_data
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@pest_bp.route('/heatmap/generate', methods=['POST'])
def generate_heatmap():
    """Generate and return a heatmap HTML file"""
    try:
        data = request.json
        pest = data.get('pest')
        
       
        df = pd.read_csv('data/paddy_pest_weather_soil_option1_ml_ready.csv')
        
        if pest:
            result = heatmap_generator.generate_pest_specific_heatmap(pest, df)
        else:
            result = heatmap_generator.generate_heatmap(df)
        
        return jsonify({
            'success': True,
            'data': result
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


# STATISTICS ENDPOINTS


@pest_bp.route('/statistics', methods=['GET'])
def get_statistics():
    """Get pest statistics for dashboard"""
    try:
        district = request.args.get('district')
        days = int(request.args.get('days', 30))
        
       
        stats = {
            'total_forecasts': 0,
            'high_risk_alerts': 0,
            'common_pests': [],
            'district_risk': {},
            'trend_data': []
        }
        
        if hasattr(current_app, 'db'):
           
            stats['total_forecasts'] = current_app.db.pest_forecasts.count_documents({})
            
            
            cutoff = datetime.now() - timedelta(days=days)
            stats['high_risk_alerts'] = current_app.db.pest_forecasts.count_documents({
                'risk_level': 'High',
                'created_at': {'$gte': cutoff}
            })
            
            
            pipeline = [
                {'$group': {'_id': '$predicted_pest', 'count': {'$sum': 1}}},
                {'$sort': {'count': -1}},
                {'$limit': 5}
            ]
            common = list(current_app.db.pest_forecasts.aggregate(pipeline))
            stats['common_pests'] = [{'name': c['_id'], 'count': c['count']} for c in common]
        
        return jsonify({
            'success': True,
            'data': stats
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


# WEATHER ENDPOINTS


@pest_bp.route('/weather/current', methods=['GET'])
def get_current_weather():
    """Get current weather for location"""
    try:
        lat = request.args.get('lat', type=float)
        lon = request.args.get('lon', type=float)
        city = request.args.get('city')
        
        if city:
            weather = weather_service.get_weather_by_city(city)
        elif lat and lon:
            weather = weather_service.get_current_weather(lat, lon)
        else:
            # Default to Anuradhapura
            weather = weather_service.get_weather_by_city('Anuradhapura')
        
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
        lat = request.args.get('lat', type=float)
        lon = request.args.get('lon', type=float)
        days = int(request.args.get('days', 7))
        
        if lat and lon:
            forecast = weather_service.get_forecast(lat, lon, days)
        else:
           
            forecast = weather_service.get_forecast(8.3114, 80.4037, days)
        
        return jsonify({
            'success': True,
            'data': forecast
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


# MODEL INFO ENDPOINTS


@pest_bp.route('/model-info', methods=['GET'])
def get_model_info():
    """Get information about the ML model"""
    try:
        if hasattr(forecast_engine, 'metrics'):
            return jsonify({
                'success': True,
                'data': {
                    'metrics': forecast_engine.metrics,
                    'features': forecast_engine.features[:20],  # First 20 features
                    'risk_classes': forecast_engine.risk_classes
                }
            })
        else:
            return jsonify({
                'success': False,
                'error': 'Model info not available'
            }), 404
            
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500