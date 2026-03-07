from flask import Flask
from flask_cors import CORS
import os
from dotenv import load_dotenv
from ultralytics import YOLO
import joblib
import numpy as np

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)

# ============================================================
# MongoDB Connection (Optional - won't break if not available)
# ============================================================
print("\n" + "="*60)
print("🔌 CHECKING MONGODB CONNECTION")
print("="*60)

try:
    from pymongo import MongoClient
    MONGO_URI = os.getenv('MONGO_URI', "mongodb://localhost:27017/")
    client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)  # 5 second timeout
    # Test connection
    client.admin.command('ping')
    db = client['my_database']
    app.db = db
    print("✅ MongoDB connected successfully")
except ImportError:
    print("⚠️ pymongo not installed - running without database")
    app.db = None
except Exception as e:
    print(f"⚠️ MongoDB connection failed: {e}")
    print("   Continuing without database - pest detection will still work")
    app.db = None

# ============================================================
# Load YOLO model for pest detection with multiple path support
# ============================================================
print("\n" + "="*60)
print("🔍 LOADING PEST DETECTION MODEL")
print("="*60)

# Define your target pest classes
TARGET_PEST_CLASSES = {
    0: 'Brown Planthopper (BPH)',
    1: 'Rice Leaf-folder',
    2: 'Paddy Bug'
}

try:
    # Try multiple possible model paths
    possible_paths = [
        "models/best.pt",
        "models/pest_3class.pt",
        "models/pest_3class_fixed.pt",
        "pest_model.pt",
        "runs/train/pest_3class_fixed/weights/best.pt",
        "runs/detect/train/weights/best.pt",
        "best.pt",
        "yolov8n.pt"  # Fallback to base model if nothing else found
    ]
    
    model_loaded = False
    loaded_path = None
    
    for model_path in possible_paths:
        if os.path.exists(model_path):
            print(f"📂 Found model at: {model_path}")
            try:
                app.model = YOLO(model_path)
                print(f"✅ YOLO Pest Detection Model loaded successfully from: {model_path}")
                model_loaded = True
                loaded_path = model_path
                break
            except Exception as e:
                print(f"❌ Failed to load model from {model_path}: {e}")
                continue
    
    if not model_loaded:
        print("⚠️ No YOLO model found in any path. Please train the model first.")
        print("   Looked in:")
        for path in possible_paths:
            print(f"   - {path}")
        print("\n💡 You can train a model using:")
        print("   python filter_to_3_pests.py")
        print("   python train_pest_detection.py")
        app.model = None
        app.pest_class_names = {}
        app.pest_detection_model = None
    else:
        # IMPORTANT FIX: Don't try to assign to model.names directly
        # Instead, store the class mapping separately in app.pest_class_names
        
        # Check what classes the model actually has
        if hasattr(app.model, 'names'):
            model_classes = app.model.names
            print(f"📊 Original model classes: {model_classes}")
            
            # Store the original classes
            app.original_model_classes = model_classes.copy() if model_classes else {}
            
            # Always use our target class mapping for the API
            # This doesn't modify the model, just how we interpret the results
            app.pest_class_names = TARGET_PEST_CLASSES.copy()
            
            print(f"✅ Using API class mapping: {app.pest_class_names}")
            
            # Check if the model's classes match our target
            if len(model_classes) == 3:
                # Check if classes are just numbers
                if all(str(k) == v for k, v in model_classes.items()):
                    print("ℹ️ Model has numeric class names - will map indices to proper names in API")
                else:
                    print(f"ℹ️ Model has custom class names: {model_classes}")
            else:
                print(f"⚠️ Model has {len(model_classes)} classes, but API expects 3 classes")
                print("   Will still work but mapping might need adjustment")
        else:
            print("⚠️ Model doesn't have 'names' attribute")
            app.original_model_classes = {}
            app.pest_class_names = TARGET_PEST_CLASSES.copy()
            print(f"✅ Using default API class mapping: {app.pest_class_names}")
        
        # Also store the model in pest_detection_model for consistency
        app.pest_detection_model = app.model
        
        print(f"✅ Model type: {type(app.model)}")
        print(f"📋 API will map class IDs to: {app.pest_class_names}")
        
        # Test the model with a dummy inference to ensure it's working
        try:
            print("🧪 Running model test inference...")
            dummy_img = np.zeros((416, 416, 3), dtype=np.uint8)
            results = app.model(dummy_img, verbose=False)
            print("✅ Model test inference successful")
            
            # Test class name extraction from results
            if len(results) > 0:
                if hasattr(results[0], 'names') and results[0].names:
                    print(f"✅ Results contain class names: {results[0].names}")
                else:
                    print("ℹ️ Results don't contain class names - API mapping will handle this")
        except Exception as e:
            print(f"⚠️ Model test inference failed: {e}")
            print("   This doesn't necessarily mean the model won't work with real images")
    
except Exception as e:
    print(f"❌ Failed to load YOLO model: {e}")
    import traceback
    traceback.print_exc()
    app.model = None
    app.pest_class_names = TARGET_PEST_CLASSES.copy()  # Still set class names even if model fails
    app.pest_detection_model = None

# ============================================================
# Load Enhanced Pest Forecast Models (Individual files)
# ============================================================
print("\n" + "="*60)
print("🔍 LOADING PEST FORECAST MODELS")
print("="*60)

MODEL_DIR = "model"  # Your training script saves to "model" directory

try:
    # Check if we have the complete package first (for backward compatibility)
    complete_model_path = os.path.join("models", "enhanced_pest_model_complete.pkl")
    if os.path.exists(complete_model_path):
        app.pest_forecast_model = joblib.load(complete_model_path)
        print("✅ Complete Pest Forecast Model loaded successfully")
        if isinstance(app.pest_forecast_model, dict):
            print(f"   Model contains: {list(app.pest_forecast_model.keys())}")
            app.pest_forecast_models = app.pest_forecast_model
    else:
        # Check if individual model files exist
        required_files = [
            "pest_model.pkl",
            "severity_model.pkl", 
            "incidence_model.pkl",
            "incidence_ensemble_model.pkl",
            "feature_scaler.pkl",
            "features.pkl",
            "District_encoder.pkl",
            "Season_encoder.pkl",
            "Paddy_Variety_encoder.pkl",
            "Pest_encoder.pkl",
            "performance_report.pkl"
        ]
        
        # Check if directory exists
        if not os.path.exists(MODEL_DIR):
            print(f"⚠️ Model directory '{MODEL_DIR}' not found")
            os.makedirs(MODEL_DIR, exist_ok=True)
            print(f"✅ Created model directory: {MODEL_DIR}")
        
        # Check which files exist
        existing_files = []
        missing_files = []
        for f in required_files:
            if os.path.exists(os.path.join(MODEL_DIR, f)):
                existing_files.append(f)
            else:
                missing_files.append(f)
        
        if len(existing_files) == len(required_files):
            # Load individual models from the "model" directory
            print("📂 Loading individual model files...")
            
            app.pest_model = joblib.load(os.path.join(MODEL_DIR, "pest_model.pkl"))
            app.severity_model = joblib.load(os.path.join(MODEL_DIR, "severity_model.pkl"))
            app.incidence_model = joblib.load(os.path.join(MODEL_DIR, "incidence_model.pkl"))
            app.ensemble_model = joblib.load(os.path.join(MODEL_DIR, "incidence_ensemble_model.pkl"))
            app.feature_scaler = joblib.load(os.path.join(MODEL_DIR, "feature_scaler.pkl"))
            app.features = joblib.load(os.path.join(MODEL_DIR, "features.pkl"))
            
            # Load encoders
            app.district_encoder = joblib.load(os.path.join(MODEL_DIR, "District_encoder.pkl"))
            app.season_encoder = joblib.load(os.path.join(MODEL_DIR, "Season_encoder.pkl"))
            app.variety_encoder = joblib.load(os.path.join(MODEL_DIR, "Paddy_Variety_encoder.pkl"))
            app.pest_encoder = joblib.load(os.path.join(MODEL_DIR, "Pest_encoder.pkl"))
            
            # Load performance report
            app.performance_report = joblib.load(os.path.join(MODEL_DIR, "performance_report.pkl"))
            
            print("✅ Individual Pest Forecast Models loaded successfully")
            print(f"   Pest Model Accuracy: {app.performance_report.get('pest_accuracy', 0)*100:.2f}%")
            print(f"   Severity Model Accuracy: {app.performance_report.get('severity_accuracy', 0)*100:.2f}%")
            print(f"   Incidence RMSE: {app.performance_report.get('incidence_rmse', 0):.2f}%")
            
            # Create a unified model dictionary for easy access
            app.pest_forecast_models = {
                'pest_model': app.pest_model,
                'severity_model': app.severity_model,
                'incidence_model': app.incidence_model,
                'ensemble_model': app.ensemble_model,
                'scaler': app.feature_scaler,
                'features': app.features,
                'encoders': {
                    'District': app.district_encoder,
                    'Season': app.season_encoder,
                    'Paddy_Variety': app.variety_encoder,
                    'Pest': app.pest_encoder
                },
                'performance': app.performance_report
            }
            print(f"✅ Created unified model dictionary with {len(app.pest_forecast_models)} components")
            
        else:
            print("⚠️ Pest forecast model files not found. Some files are missing:")
            for f in missing_files:
                print(f"   - {f}")
            print("\n💡 Run the forecast model training script first to generate these files.")
            app.pest_forecast_models = None
        
except Exception as e:
    print(f"⚠️ Failed to load Pest Forecast Models: {e}")
    import traceback
    traceback.print_exc()
    app.pest_model = None
    app.severity_model = None
    app.incidence_model = None
    app.ensemble_model = None
    app.pest_forecast_models = None

print("="*60 + "\n")

# ============================================================
# Import and Register Blueprints
# ============================================================
print("📦 Registering blueprints...")

try:
    from routes.postharvest_guardian import postharvest_bp
    app.register_blueprint(postharvest_bp)
    print("✅ Registered: postharvest_guardian")
except Exception as e:
    print(f"⚠️ Failed to register postharvest_guardian: {e}")

try:
    from routes.predict import predict_bp
    app.register_blueprint(predict_bp)
    print("✅ Registered: predict")
except Exception as e:
    print(f"⚠️ Failed to register predict: {e}")

try:
    from routes.weed_predict import weed_predict_bp
    app.register_blueprint(weed_predict_bp)
    print("✅ Registered: weed_predict")
except Exception as e:
    print(f"⚠️ Failed to register weed_predict: {e}")

try:
    from routes.pest_routes import pest_bp
    app.register_blueprint(pest_bp, url_prefix='/api/pest')
    print("✅ Registered: pest_routes at /api/pest")
except Exception as e:
    print(f"⚠️ Failed to register pest_routes: {e}")

try:
    from routes.pest_detection_routes import pest_detection_bp
    app.register_blueprint(pest_detection_bp, url_prefix='/api/pest-detection')
    print("✅ Registered: pest_detection_routes at /api/pest-detection")
except Exception as e:
    print(f"⚠️ Failed to register pest_detection_routes: {e}")

# ============================================================
# Register Gemini AI Blueprint (NEW)
# ============================================================
try:
    from routes.gemini_routes import gemini_bp
    app.register_blueprint(gemini_bp)
    print("✅ Registered: gemini_routes at /api/gemini")
except Exception as e:
    print(f"⚠️ Failed to register gemini_routes: {e}")

print("✅ All blueprints registered")
print("="*60 + "\n")

# ============================================================
# Routes
# ============================================================
@app.route('/')
def home():
    """Home endpoint with API status"""
    # Check model status
    pest_detection_status = "loaded" if app.model is not None else "not loaded"
    pest_forecast_status = "loaded" if (hasattr(app, 'pest_forecast_models') and app.pest_forecast_models is not None) else "not loaded"
    gemini_status = "loaded"  # Gemini is always available if package is installed
    
    # Get class names safely
    class_names = {}
    if hasattr(app, 'pest_class_names') and app.pest_class_names:
        class_names = app.pest_class_names
    
    return {
        "status": "online",
        "message": "GoviMithuru API is running",
        "timestamp": __import__('datetime').datetime.now().isoformat(),
        "features": ["pest-forecast", "pest-detection", "post-harvest", "weed-detection", "gemini-ai"],
        "database": {
            "connected": app.db is not None
        },
        "models": {
            "pest_detection": {
                "status": pest_detection_status,
                "classes": class_names,
                "num_classes": len(class_names)
            },
            "pest_forecast": {
                "status": pest_forecast_status
            },
            "gemini_ai": {
                "status": gemini_status
            }
        }
    }

@app.route('/model-info')
def model_info():
    """Endpoint to check model information"""
    info = {
        "pest_detection": {
            "loaded": app.model is not None,
            "model_path": "Found" if app.model is not None else "Not found",
            "api_classes": app.pest_class_names if hasattr(app, 'pest_class_names') else {},
            "num_classes": len(app.pest_class_names) if hasattr(app, 'pest_class_names') else 0
        },
        "pest_forecast": {
            "loaded": hasattr(app, 'pest_forecast_models') and app.pest_forecast_models is not None,
        },
        "gemini_ai": {
            "loaded": True,
            "endpoint": "/api/gemini/chat"
        },
        "database": {
            "connected": app.db is not None
        }
    }
    
    # Add original model classes if available
    if app.model is not None and hasattr(app.model, 'names'):
        info["pest_detection"]["original_model_classes"] = app.model.names
    
    # Add forecast model performance if available
    if hasattr(app, 'performance_report') and app.performance_report:
        info["pest_forecast"]["performance"] = {
            "pest_accuracy": f"{app.performance_report.get('pest_accuracy', 0)*100:.2f}%",
            "severity_accuracy": f"{app.performance_report.get('severity_accuracy', 0)*100:.2f}%",
            "incidence_rmse": f"{app.performance_report.get('incidence_rmse', 0):.2f}%",
            "ensemble_rmse": f"{app.performance_report.get('ensemble_rmse', 0):.2f}%"
        }
    
    return info

@app.route('/health')
def health_check():
    """Simple health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": __import__('datetime').datetime.now().isoformat(),
        "database": app.db is not None,
        "gemini": "available"
    }

@app.route('/debug/models')
def debug_models():
    """Debug endpoint to see all available models"""
    import os
    
    model_files = []
    for root, dirs, files in os.walk('.'):
        for file in files:
            if file.endswith('.pt') or file.endswith('.pkl'):
                rel_path = os.path.relpath(os.path.join(root, file))
                model_files.append(rel_path)
    
    return {
        "current_directory": os.getcwd(),
        "model_files_found": model_files,
        "model_files_count": len(model_files),
        "pest_detection_loaded": app.model is not None,
        "pest_detection_api_classes": app.pest_class_names if hasattr(app, 'pest_class_names') else {},
        "pest_detection_original_classes": app.model.names if app.model and hasattr(app.model, 'names') else "Not available",
        "pest_forecast_loaded": hasattr(app, 'pest_forecast_models') and app.pest_forecast_models is not None,
        "gemini_loaded": True,
        "database_connected": app.db is not None
    }

@app.route('/debug/test-detection', methods=['GET'])
def test_detection():
    """Test endpoint to verify detection is working"""
    if app.model is None:
        return {
            "success": False,
            "error": "Model not loaded",
            "message": "Please train a detection model first"
        }
    
    return {
        "success": True,
        "message": "Detection model is ready",
        "original_model_classes": app.model.names if hasattr(app.model, 'names') else "No classes",
        "api_mapping_classes": app.pest_class_names if hasattr(app, 'pest_class_names') else {},
        "num_classes": len(app.pest_class_names) if hasattr(app, 'pest_class_names') else 0,
        "suggestion": "Use POST /api/pest-detection/detect with an image to test"
    }

if __name__ == '__main__':
    print("\n" + "="*60)
    print("🚀 Starting GoviMithuru API Server")
    print("="*60)
    print(f"📡 Server will run on: http://0.0.0.0:5005")
    print(f"📱 Access from phone using: http://192.168.1.105:5005")
    print(f"📊 Model status:")
    print(f"   - Pest Detection: {'✅ Loaded' if app.model else '❌ Not loaded'}")
    if app.model:
        print(f"     Original model classes: {app.model.names if hasattr(app.model, 'names') else 'None'}")
        print(f"     API will map to: {app.pest_class_names}")
    print(f"   - Pest Forecast: {'✅ Loaded' if hasattr(app, 'pest_forecast_models') and app.pest_forecast_models else '❌ Not loaded'}")
    print(f"   - Gemini AI: {'✅ Loaded'}")
    print(f"   - Database: {'✅ Connected' if app.db else '❌ Not connected'}")
    print("="*60 + "\n")
    print("📌 Available endpoints:")
    print("   - GET  /                  - Home")
    print("   - GET  /health            - Health check")
    print("   - GET  /model-info        - Model info")
    print("   - GET  /debug/models      - Debug models")
    print("   - POST /api/pest-detection/detect - Detect pests")
    print("   - GET  /api/pest-detection/health - Detection health")
    print("   - POST /api/gemini/chat   - Gemini AI chat")  # NEW
    print("   - GET  /api/gemini/health - Gemini health check")  # NEW
    print("="*60 + "\n")
    
    app.run(host='0.0.0.0', port=5005, debug=True)