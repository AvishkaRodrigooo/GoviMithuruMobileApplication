from flask import Flask
from flask_cors import CORS
import os
from dotenv import load_dotenv
from pymongo import MongoClient
import joblib
import numpy as np
from ultralytics import YOLO

# ==============================
# INIT
# ==============================
load_dotenv()

app = Flask(__name__)
CORS(app)

# ==============================
# DATABASE CONNECTION
# ==============================
print("\n=== CONNECTING TO MONGODB ===")

try:
    MONGO_URI = os.getenv('MONGO_URI', "mongodb://localhost:27017/")
    client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
    client.admin.command('ping')
    app.db = client['my_database']
    print("MongoDB connected")
except Exception as e:
    print(f"MongoDB failed: {e}")
    app.db = None

# ==============================
# LOAD CLASSICAL ML MODEL
# ==============================
print("\n=== LOADING ML MODEL ===")

try:
    model_data = joblib.load("models/model.pkl")

    app.clf = model_data["classifier"]
    app.reg = model_data["regressor"]
    app.le_variety = model_data["le_variety"]
    app.le_stage = model_data["le_stage"]
    app.le_color = model_data["le_color"]

    print("ML model loaded")
except Exception as e:
    print(f"ML model failed: {e}")

# ==============================
# LOAD YOLO MODEL
# ==============================
print("\n=== LOADING YOLO MODEL ===")

TARGET_PEST_CLASSES = {
    0: 'Brown Planthopper',
    1: 'Rice Leaf-folder',
    2: 'Paddy Bug'
}

try:
    model_path = "models/pest_3class.pt"

    if os.path.exists(model_path):
        app.model = YOLO(model_path)
        app.pest_class_names = TARGET_PEST_CLASSES
        print("YOLO model loaded")
    else:
        print("YOLO model not found")
        app.model = None
        app.pest_class_names = {}
except Exception as e:
    print(f"YOLO load error: {e}")
    app.model = None
    app.pest_class_names = {}

# ==============================
# IMPORT ROUTES
# ==============================
print("\n=== REGISTERING ROUTES ===")

try:
    from routes.stages import stages_bp
    app.register_blueprint(stages_bp, url_prefix='/api/stages')
    # app.register_blueprint(stages_bp)
except Exception as e:
    print(f"stages error: {e}")

try:
    from routes.predict import predict_bp
    app.register_blueprint(predict_bp, url_prefix='/api/predict')
    # app.register_blueprint(predict_bp)
    print("predict loaded")
except Exception as e:
    print(f"predict error: {e}")

try:
    from routes.weed_predict import weed_predict_bp
    app.register_blueprint(weed_predict_bp, url_prefix='/api/weed') 
    # app.register_blueprint(weed_predict_bp)
    print("weed loaded")
except Exception as e:
    print(f"weed error: {e}")

try:
    from routes.postharvest_guardian import postharvest_bp
    # Remove url_prefix - it's already defined in the blueprint as '/api/guardian'
    app.register_blueprint(postharvest_bp)
    print("postharvest loaded")
except Exception as e:
    print(f"postharvest error: {e}")

try:
    from routes.pest_detection_routes import pest_detection_bp
    app.register_blueprint(pest_detection_bp, url_prefix='/api/pest-detection')
    print("pest detection loaded")
except Exception as e:
    print(f"pest detection error: {e}")

try:
    from routes.pest_routes import pest_bp
    app.register_blueprint(pest_bp, url_prefix='/api/pest')
    print("pest routes loaded")
except Exception as e:
    print(f"pest routes error: {e}")

try:
    from routes.gemini_routes import gemini_bp
    app.register_blueprint(gemini_bp, url_prefix='/api/gemini')
    print("gemini loaded")
except Exception as e:
    print(f"gemini error: {e}")

# ==============================
# BASIC ROUTES
# ==============================

@app.route('/')
def home():
    return {
        "status": "running",
        "features": [
            "pest detection",
            "weed detection",
            "postharvest",
            "prediction",
            "gemini ai"
        ]
    }

@app.route('/health')
def health():
    return {
        "status": "healthy",
        "database": app.db is not None,
        "model_loaded": app.model is not None
    }

# ==============================
# RUN SERVER
# ==============================
if __name__ == '__main__':
    print("\n=== SERVER STARTED ===")
    print("http://localhost:5000")
    print("======================\n")
    
    # Use debug=False to avoid threading issues with the postharvest blueprint
    # If you need debug mode, use use_reloader=False
    app.run(host='0.0.0.0', port=5000, debug=False)