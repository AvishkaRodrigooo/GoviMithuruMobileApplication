from flask import Blueprint, request, jsonify, current_app
import os
import uuid
import cv2
import base64
import sys
import traceback

predict_bp = Blueprint('predict', __name__)

UPLOAD_FOLDER = "uploads"
RESULT_FOLDER = "results"

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(RESULT_FOLDER, exist_ok=True)

# ========== SOIL MODEL LOADING ==========
# Try to load soil model, but handle errors gracefully

soil_model = None
district_encoder = None
city_encoder = None
soil_encoder = None
soil_model_loaded = False
soil_model_error = None

def load_soil_model():
    """
    Load soil prediction model with proper error handling
    """
    global soil_model, district_encoder, city_encoder, soil_encoder
    global soil_model_loaded, soil_model_error
    
    try:
        # First try without joblib
        import importlib.util
        
        MODEL_PATH = os.path.join(os.path.dirname(__file__), '..', 'models', 'crop_recommender')
        
        print(f"🔍 Looking for soil model in: {MODEL_PATH}")
        
        # Check if files exist
        required_files = ['model.pkl', 'district_encoder.pkl', 'city_encoder.pkl', 'soil_encoder.pkl']
        for file in required_files:
            file_path = os.path.join(MODEL_PATH, file)
            if not os.path.exists(file_path):
                print(f"❌ File not found: {file_path}")
                soil_model_error = f"Model file missing: {file}"
                return
        
        # Try to load with joblib
        import joblib
        import numpy as np
        
        print("📦 Loading soil model files...")
        
        soil_model = joblib.load(os.path.join(MODEL_PATH, 'model.pkl'))
        district_encoder = joblib.load(os.path.join(MODEL_PATH, 'district_encoder.pkl'))
        city_encoder = joblib.load(os.path.join(MODEL_PATH, 'city_encoder.pkl'))
        soil_encoder = joblib.load(os.path.join(MODEL_PATH, 'soil_encoder.pkl'))
        
        soil_model_loaded = True
        print("✅ Soil type model loaded successfully!")
        print(f"📊 Model can predict {len(soil_encoder.classes_)} soil types")
        print(f"📍 Available districts: {len(district_encoder.classes_)}")
        print(f"🏙️  Available cities: {len(city_encoder.classes_)}")
        
    except ImportError as e:
        soil_model_error = f"Missing dependency: {str(e)}"
        print(f"❌ Import error: {e}")
        
    except Exception as e:
        soil_model_error = str(e)
        print(f"❌ Error loading soil model: {e}")
        traceback.print_exc()

# Try to load on module import
load_soil_model()

# ========== EXISTING YOLO ENDPOINTS ==========
@predict_bp.route("/predict", methods=["POST"])
def predict():
    if "image" not in request.files:
        return jsonify({"error": "No image provided"}), 400

    image = request.files["image"]
    img_id = str(uuid.uuid4())
    input_path = os.path.join(UPLOAD_FOLDER, f"{img_id}.jpg")
    output_path = os.path.join(RESULT_FOLDER, f"{img_id}.jpg")

    image.save(input_path)
    model = current_app.model
    results = model(input_path)[0]

    boxes = results.boxes
    box_count = len(boxes)
    confidences = [box.conf.item() for box in boxes]
    avg_confidence = sum(confidences) / box_count if box_count > 0 else 0

    annotated = results.plot()
    cv2.imwrite(output_path, annotated)

    with open(output_path, "rb") as f:
        img_bytes = f.read()
    img_base64 = base64.b64encode(img_bytes).decode("utf-8")

    response = {
        "image": img_base64,
        "box_count": box_count,
        "accuracy": round(avg_confidence * 100, 2)
    }
    return jsonify(response)

# ========== SOIL TYPE ENDPOINTS ==========
@predict_bp.route('/predict/soil-type', methods=['POST'])
def predict_soil_type():
    """
    Predict soil type based on district and city
    """
    try:
        # Check if model is loaded
        if not soil_model_loaded:
            return jsonify({
                'success': False,
                'error': soil_model_error or 'Soil prediction model not loaded',
                'available': False
            }), 503
        
        data = request.get_json()
        
        # Validate required fields
        if not data or 'district' not in data or 'city' not in data:
            return jsonify({
                'success': False,
                'error': 'Please provide district and city',
                'available': True
            }), 400
        
        district = data['district'].strip()
        city = data['city'].strip()
        
        # Debug
        print(f"🌱 Soil prediction request: {district}, {city}")
        
        # Check if district exists
        if district not in district_encoder.classes_:
            return jsonify({
                'success': False,
                'error': f'District "{district}" not found',
                'available_districts': list(district_encoder.classes_)[:20],
                'available': True
            }), 404
        
        # Check if city exists
        if city not in city_encoder.classes_:
            # Try to find similar cities
            similar_cities = [c for c in city_encoder.classes_ 
                            if city.lower() in c.lower() or c.lower() in city.lower()]
            
            if not similar_cities:
                return jsonify({
                    'success': False,
                    'error': f'City "{city}" not found',
                    'available_cities_sample': list(city_encoder.classes_)[:20],
                    'available': True
                }), 404
            
            # Use the first similar city
            suggested_city = similar_cities[0]
            return jsonify({
                'success': True,
                'prediction': {
                    'soil_type': None,
                    'confidence': None,
                    'suggested_city': suggested_city,
                    'message': f'Using "{suggested_city}" instead. Please confirm.',
                    'available': True
                }
            })
        
        # Encode and predict
        district_encoded = district_encoder.transform([district])[0]
        city_encoded = city_encoder.transform([city])[0]
        
        prediction_encoded = soil_model.predict([[district_encoded, city_encoded]])[0]
        soil_type = soil_encoder.inverse_transform([prediction_encoded])[0]
        
        # Get confidence
        import numpy as np
        probabilities = soil_model.predict_proba([[district_encoded, city_encoded]])[0]
        confidence = float(probabilities[prediction_encoded] * 100)
        
        return jsonify({
            'success': True,
            'prediction': {
                'soil_type': soil_type,
                'confidence': confidence,
                'district': district,
                'city': city,
                'available': True
            }
        })
        
    except Exception as e:
        print(f"❌ Soil prediction error: {e}")
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': str(e),
            'available': soil_model_loaded
        }), 500

@predict_bp.route('/predict/available-data', methods=['GET'])
def get_available_data():
    """
    Get list of available districts and cities
    """
    try:
        if not soil_model_loaded:
            return jsonify({
                'success': False,
                'error': soil_model_error or 'Model not loaded',
                'available': False
            }), 503
        
        return jsonify({
            'success': True,
            'data': {
                'districts': list(district_encoder.classes_),
                'cities_sample': list(city_encoder.classes_)[:50],
                'total_cities': len(city_encoder.classes_),
                'soil_types_sample': list(soil_encoder.classes_)[:20],
                'total_soil_types': len(soil_encoder.classes_),
                'available': True
            }
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'available': soil_model_loaded
        }), 500

# Test endpoint
@predict_bp.route('/predict/test', methods=['GET'])
def test_endpoint():
    return jsonify({
        'status': 'Soil prediction service',
        'model_loaded': soil_model_loaded,
        'error': soil_model_error,
        'available_endpoints': [
            'POST /predict/soil-type',
            'GET /predict/available-data',
            'GET /predict/test'
        ]
    })

@predict_bp.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy',
        'soil_model': 'loaded' if soil_model_loaded else 'not loaded',
        'error': soil_model_error
    })