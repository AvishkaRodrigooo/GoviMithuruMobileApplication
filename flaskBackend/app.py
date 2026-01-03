from flask import Flask
from pymongo import MongoClient
from flask_cors import CORS 
import os
from dotenv import load_dotenv
from ultralytics import YOLO

load_dotenv()
app = Flask(__name__)
CORS(app)
# MongoDB connection (adjust if you want to use MongoDB)
MONGO_URI = os.getenv('MONGO_URI', "mongodb://localhost:27017/")
client = MongoClient(MONGO_URI)
db = client['my_database']
app.db = db

# Load YOLO model ONCE
app.model = YOLO("models/best.pt")

# Import and register blueprint
from routes.predict import predict_bp
app.register_blueprint(predict_bp)

@app.route("/")
def home():
    return "Govimithuru Backend Running ✅"

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
