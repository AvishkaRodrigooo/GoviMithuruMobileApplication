from flask import Flask
import os
from dotenv import load_dotenv
from ultralytics import YOLO
from flask_cors import CORS
import joblib
from pymongo import MongoClient

# Import blueprints
from routes.predict import predict_bp
from routes.weed_predict import weed_predict_bp
from routes.postharvest_guardian import postharvest_bp
from routes.stages import stages_bp
from routes.pest_routes import pest_bp
from routes.pest_detection_routes import pest_detection_bp

load_dotenv()

app = Flask(__name__)
CORS(app) # Enable CORS for all routes

app.stage_model = joblib.load("models/paddy_stage_model.pkl")

# MongoDB connection
MONGO_URI = os.getenv('MONGO_URI', "mongodb://localhost:27017/")
client = MongoClient(MONGO_URI)
db = client['my_database']

# Make db accessible from routes
app.db = db

# Load YOLO model ONCE here, before registering blueprints
app.model = YOLO("models/best.pt")
app.pest_detection_model = app.model

# Register blueprints
app.register_blueprint(predict_bp)
app.register_blueprint(weed_predict_bp)
app.register_blueprint(postharvest_bp)
app.register_blueprint(stages_bp)
app.register_blueprint(pest_bp, url_prefix='/api/pest')
app.register_blueprint(pest_detection_bp, url_prefix='/api/pest-detection')

if __name__ == '__main__':
    app.run(host='0.0.0.0', debug=True)
