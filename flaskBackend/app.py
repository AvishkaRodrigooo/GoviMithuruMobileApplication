from flask import Flask
from flask_cors import CORS
from pymongo import MongoClient
from dotenv import load_dotenv
import os
import joblib
from ultralytics import YOLO

load_dotenv()

app = Flask(__name__)
CORS(app)

# ------------------ DATABASE ------------------
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/")
client = MongoClient(MONGO_URI)
app.db = client["govimithuru"]

# ------------------ LOAD MODELS (ONCE) ------------------

# 1️⃣ YOLO MODEL (Friend's Image Model)
app.yolo_model = YOLO("models/best.pt")

# 2️⃣ XGBOOST MODEL (Your Storage Model)
app.storage_model = joblib.load("models/storage_model_xgboost.pkl")
app.storage_scaler = joblib.load("models/storage_scaler.pkl")
app.label_encoders = joblib.load("models/label_encoders.pkl")
app.storage_features = joblib.load("models/storage_features.pkl")

# ------------------ ROUTES ------------------
from routes.image_predict import image_bp
from routes.storage_predict import storage_bp

app.register_blueprint(image_bp)
app.register_blueprint(storage_bp)

@app.route("/")
def home():
    return "Govimithuru Backend Running ✅ (YOLO + XGBoost)"

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
