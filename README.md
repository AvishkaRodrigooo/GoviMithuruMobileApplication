# 🌾 **Keth Aruna (කෙත් අරුණ)**  
*AI-Powered Paddy Farming Support Platform*

🔗 **Group ID:** 25J-26J-242  
🔗 **GitHub Repository:** (https://github.com/AvishkaRodrigooo/GoviMithuruMobileApplication)

---

## 📋 **Project Overview**

### 🎯 **Research Problem**
Sri Lankan paddy farmers face multiple challenges that threaten productivity and sustainability:
- **Inefficient & Reactive Farming:** Reliance on outdated methods and intuition
- **Critical Knowledge Gaps:** Lack of real-time, hyper-local advisory services
- **High Post-Harvest Losses:** 15% losses due to improper storage and timing
- **Barriers to Technology Adoption:** Complex and expensive solutions inaccessible to smallholders

### 🎯 **Main Research Objective**
To design and develop an integrated, AI-driven web platform that provides Sri Lankan paddy farmers with data-guided decision-making support across the entire cultivation lifecycle, aiming to increase productivity, profitability, and resilience against climate and pest risks.

---

## 🔬 **Research Components & AI Modules**

### 1️⃣ **AI-Based Pest Forecasting System** *(by IT22906762 - Thambugala T.G.H.D)*

**Problem:** Traditional pest forecasting relies on seasonal calendars and manual scouting - reactive, time-consuming, and inaccurate.

**Solution:**
- **Multimodal Data Fusion:** Weather, soil, crop stage, pest history, farmer images
- **Adaptive AI Models:** XGBoost, Random Forest with continuous learning
- **Real-time Mobile Alerts:** Proactive notifications with risk predictions
- **Farmer Participation:** Community-driven data through pest image uploads

**Key Features:**
- 7-Day Risk Forecasting
- Pest Attack Predictor with versatile data
- Hyper-local alerts based on district and paddy variety
- Android push notifications for high-risk scenarios

**Technologies:** Python, TensorFlow, Machine Learning Models

---

### 2️⃣ **AI-Powered Weed Detection & Stages Identification** *(by IT22364074 - Rodrigo K.A.A.L)*

**Problem:** Paddy yield loss of 30-45% due to weeds; no growth stage identification in current solutions.

**Solution:**
- **Real-time Weed Detection:** CNN models for local weed identification (කලාඳුරු, දිය මෙනේරිය)
- **Growth Stage Classification:** Fertilizer recommendations based on plant stage
- **Edge AI Implementation:** Runs on farmers' smartphones (offline capability)
- **Herbicide Guidance:** Chemical and manual removal strategies

**Key Features:**
- Weed species identification via mobile camera
- Growth stage-based fertilizer recommendations
- Localized herbicide guidelines
- Farmer-input based decision support system

**Technologies:** Computer Vision (OpenCV), CNNs, TensorFlow Lite, React Native

---

### 3️⃣ **AI-Powered Post-Harvest Advisor** *(by IT22339942 - Dilakshan K)*

**Problem:** Rs 45 billion annual losses from poor storage decisions; 20-30% price volatility unpredicted.

**Solution:**
- **Storage Time Optimization:** AI models predict optimal storage duration (89.2% accuracy)
- **Price Forecasting:** LSTM Neural Network for market price prediction (83.5% accuracy)
- **Farmer-Dealer Connection:** Direct marketplace integration
- **Smart Alerts:** Real-time monitoring and notifications

**Key Features:**
- Storage analysis and recommendations
- Market price tracking and trading
- Sensor integration for real-time monitoring
- Dealer dashboard for direct transactions

**Technologies:** XGBoost, LightGBM, LSTM, Flask REST API, Cloud Run

---

### 4️⃣ **AI-Driven Crop Establishment Planner for New Farmers** *(by IT22330932 - Wijesinghe M.D.C.M)*

**Problem:** New farmers face high risk of crop failure due to lack of personalized guidance.

**Solution:**
- **Personalized Crop Recommendations:** Based on soil, climate, and market data
- **Adaptive Farming Calendar:** Stage-wise planting and harvesting guidance
- **Profitability Simulator:** Yield, cost, and revenue predictions
- **Smart Input Planner:** Calculates seed, fertilizer, and pesticide requirements

**Key Features:**
- Soil type prediction using Random Forest Classifier
- Live market price integration
- Input cost optimization
- Multi-language support (Sinhala, Tamil, English)

**Technologies:** React Native, Firebase, Python, GIS, Random Forest Classifier

---

## 🏗 **System Architecture**

### **Overall S<img width="774" height="888" alt="SystemDiagram" src="https://github.com/user-attachments/assets/2763e326-0abb-41e1-b5af-0d8f5b4d29b6" />
ystem Diagram**


### **Data Flow:**
1. **Data Collection:** Weather, soil, market, farmer inputs
2. **AI Processing:** Four specialized modules analyze data
3. **Recommendations:** Personalized advice for each farming stage
4. **Farmer Interface:** Mobile and web access to insights


---

## 🏗 Project Structure (Monorepo)

```bash
PaddyLife-AI/
├── frontend/                 # 🌐 Web Dashboard
├── backend-api/              # ⚙ Node.js/Python Backend
├── ai-services/              # 🧠 Python AI/ML Models
│   ├── pest-forecasting/
│   ├── weed-detection/
│   ├── harvest-advisor/
│   └── crop-planner/
├── database/                 # 🗄 SQL/NoSQL Schemas & Scripts
├── docs/                     # 📖 Documentation
└── README.md                 # 🏠 Project Overview
```

---


## 📱 **User Interfaces & Prototypes**

### **Pest Forecasting Dashboard:**
- District-based pest risk mapping
- 7-day forecast visualization
- Push notification system
- Pest library and identification

### **Weed Detection Interface:**
- Mobile camera integration
- Real-time weed scanning
- Herbicide recommendations
- Growth stage analysis

### **Post-Harvest Advisor:**
- Storage condition monitoring
- Market price tracking
- Dealer connection platform
- Profit optimization tools

### **Crop Establishment Planner:**
- Soil type prediction
- Crop variety recommendations
- Input cost calculator
- Farming calendar generator

---
---

## ▶ How to Run the Project

### 📌 Prerequisites

Ensure the following are installed:

- Node.js (v16+)
- Python (v3.9+)
- PostgreSQL / MongoDB
- Git

---

🌐 1. Run the Backend API
bash
cd backend-api
npm install
# or pip install -r requirements.txt (if Python)
Create a .env file:

env
PORT=5000
DB_URI=your_database_uri
WEATHER_API_KEY=your_key
Start the server:

bash
npm start
# or python app.py
🖥 2. Run the Frontend
bash
cd frontend
npm install
npm start
Access the dashboard at:

text
http://localhost:3000
🤖 3. Run AI Services
Each AI module can be run independently:

bash
cd ai-services/pest-forecasting
python train_model.py
python serve_model.py
Repeat for other modules as needed.

---

## 🎯 **Validation & Success Metrics**

### **Accuracy Targets:**
- **Pest Forecasting:** >85% accuracy in outbreak prediction
- **Weed Detection:** >85% accuracy in species identification
- **Post-Harvest:** 89.2% accuracy in storage optimization
- **Crop Planning:** 80-90% accuracy in soil classification

### **Field Validation:**
- Trials with farmers in Kurunegala, Anuradhapura, Polonnaruwa, Ampara
- User adoption and usability testing
- Impact assessment on yield improvement and loss reduction

---

## 🔐 **Ethical Considerations**

### **Data Privacy & Security:**
- Anonymized farmer data collection
- Ethical clearance through Department of Agriculture partnerships
- Farmer consent for data usage
- Secure data storage and transmission

### **Responsible AI:**
- Localized models trained on Sri Lankan data
- Bias mitigation in algorithmic decisions
- Transparent recommendation systems
- Farmer-centric design principles

---

## 🚀 **Future Work & Scalability**

### **Technical Enhancements:**
1. **IoT Sensor Integration:** Real-time field monitoring
2. **Multi-language Expansion:** Full Sinhala and Tamil support
3. **Advanced Analytics:** Predictive yield modeling
4. **Offline Capabilities:** Enhanced mobile functionality

---

## 👥 **Project Team**

### **Research Group:**
- **IT22906762** - Thambugala T.G.H.D (Pest Forecasting)
- **IT22364074** - Rodrigo K.A.A.L (Weed Detection)
- **IT22339942** - Dilakshan K (Post-Harvest Advisor)
- **IT22330932** - Wijesinghe M.D.C.M (Crop Establishment Planner)

### **Supervisors:**
- **Mrs. Lokesha Weerasinghe** (Senior Lecturer)
- **Ms. Shalini Rupasinghe** (Assistant Lecturer)
- **External Advisor** - Department of Agricultural Development

### **Institution:**
**Sri Lanka Institute of Information Technology**

---

## 📊 **Expected Impact**

### **For Farmers:**
- 20-30% increase in yield consistency
- 30-40% reduction in pesticide costs
- 15-20% reduction in post-harvest losses
- Improved climate resilience

### **For Sri Lankan Agriculture:**
- Enhanced food security
- Sustainable farming practices
- Digital transformation of traditional agriculture
- Economic empowerment of smallholder farmers

---

## 📄 **License & Usage**

This project is intended for academic and research purposes only.

*"වී කෘෂිකර්මයේ සම්පූර්ණ සහය - AI-Driven Paddy Farming Support"*

---
**Project Status:** Development Phase  
**Target Launch:** Maha Season 2026/2027
