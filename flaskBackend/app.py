from flask import Flask
from pymongo import MongoClient
import os
from dotenv import load_dotenv
from ultralytics import YOLO
from flask_cors import CORS
import joblib

load_dotenv()

app = Flask(__name__)
CORS(app)


# LOAD ML MODEL

model_data = joblib.load("models/model.pkl")

app.clf = model_data["classifier"]
app.reg = model_data["regressor"]
app.le_variety = model_data["le_variety"]
app.le_stage = model_data["le_stage"]
app.le_color = model_data["le_color"]

# DEBUG
print("Model loaded")
print("Allowed varieties:", list(app.le_variety.classes_))

MONGO_URI = os.getenv('MONGO_URI', "mongodb://localhost:27017/")
client = MongoClient(MONGO_URI)
db = client['my_database']
app.db = db

# YOLO MODEL

app.model = YOLO("models/best.pt")


#ROUTES

from routes.stages import stages_bp
from routes.predict import predict_bp
from routes.weed_predict import weed_predict_bp
from routes.postharvest_guardian import postharvest_bp

app.register_blueprint(stages_bp)
app.register_blueprint(predict_bp)
app.register_blueprint(weed_predict_bp)
app.register_blueprint(postharvest_bp)

# RUN
# ==============================
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)