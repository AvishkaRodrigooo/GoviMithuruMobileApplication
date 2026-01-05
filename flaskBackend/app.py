from flask import Flask
from pymongo import MongoClient
import os
from dotenv import load_dotenv
from ultralytics import YOLO

load_dotenv()
app = Flask(__name__)

# MongoDB connection
MONGO_URI = os.getenv('MONGO_URI', "mongodb://localhost:27017/")
client = MongoClient(MONGO_URI)
db = client['my_database']

# Make db accessible from routes
app.db = db

# Load YOLO model ONCE here, before registering blueprints
app.model = YOLO("models/best.pt")

# Import blueprints

from routes.predict import predict_bp

# Register blueprints
from routes.weed_predict import weed_predict_bp

# Register blueprint
app.register_blueprint(weed_predict_bp)

app.register_blueprint(predict_bp)
if __name__ == '__main__':
    app.run(host='0.0.0.0', debug=True)
