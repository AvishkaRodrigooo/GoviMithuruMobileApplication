# 🌾 Keth Aruna (කෙත් අරුණ)  
*An AI-Driven Platform Guiding Paddy Farmers Across the Full Cultivation Lifecycle*

🔗 GitHub Repository: https://github.com/your-username/PaddyLife-AI-25-26J-242.git

## 1️⃣ Project Overview

### 📌 Project Title  
*PaddyLife AI: An AI-Driven Platform Guiding Paddy Farmers Across the Full Cultivation Lifecycle*

### 🧩 Problem Domain, Research Purpose & Motivation

Paddy farming is the backbone of Sri Lanka’s agricultural sector, yet farmers face numerous challenges that threaten productivity, sustainability, and livelihoods. These include outdated farming practices, limited access to real-time data, climate variability, pest outbreaks, inefficient nutrient use, and post-harvest losses. Many smallholder farmers lack modern tools, actionable insights, and access to technologies commonly used in other countries, leading to inconsistent yields, resource inefficiency, and economic hardship.

The primary purpose of this research is to develop an **integrated, AI-powered agricultural support platform** that guides paddy farmers through every stage of cultivation—from planning to post-harvest. By leveraging machine learning, computer vision, predictive analytics, and real-time field data, the system aims to:

- Provide hyper-local pest and disease forecasts
- Enable real-time weed detection and management
- Assist in crop planning and input optimization
- Advise on optimal harvest timing and post-harvest handling
- Improve decision-making, reduce losses, and enhance farmer livelihoods

A core focus of *PaddyLife AI* is **accessibility and localization**. The platform is designed for smallholder and new-generation farmers in Sri Lanka, offering tailored, data-driven recommendations that align with local conditions, crop varieties, and farming practices.

---

## 🔬 Research Components & AI Models

The system is powered by four specialized AI modules designed to address key challenges in paddy farming.

### 1️⃣ Pest Attack Forecasting

* *Focus:* Early detection and prediction of pest outbreaks.
* *Data Sources:* Historical weather data, crop growth stages, pest incidence records, soil conditions, humidity levels.
* *AI Technique:* **Machine Learning models** (e.g., Random Forest, LSTM) trained on multimodal data to provide dynamic, location-specific pest alerts.

### 2️⃣ AI-Powered Weed Detection & Removal Guidance

* *Focus:* Accurate identification and management of weed species.
* *Data Sources:* Mobile camera images, local weed-crop datasets, weather conditions.
* *AI Technique:* **Computer Vision & Edge-optimized models** for real-time, pixel-level weed segmentation and species recognition.

### 3️⃣ Smart Harvest & Post-Harvest Advisor

* *Focus:* Optimizing harvest timing and reducing post-harvest losses.
* *Data Sources:* NDVI, GDD, hyperlocal weather forecasts, market prices, storage conditions.
* *AI Technique:* **Regression models & Time-series analysis** to predict ideal harvest windows and provide storage/packaging recommendations.

### 4️⃣ Crop Establishment Planner for New Farmers

* *Focus:* Assisting new and smallholder farmers in crop selection and planning.
* *Data Sources:* Soil data, rainfall patterns, market trends, farmer experience level.
* *AI Technique:* **GIS integration, Simulation models (DSSAT), & Recommendation systems** to generate personalized planting calendars and profitability simulations.

---

### 🎯 Main Objectives

The primary objectives of *PaddyLife AI* are to:

- Develop an end-to-end AI-driven platform for paddy farming support
- Enable proactive pest and disease management through predictive analytics
- Provide real-time weed detection and removal strategies
- Optimize harvest timing and post-harvest handling to minimize losses
- Assist new farmers with data-driven crop planning and input management
- Enhance productivity, profitability, and climate resilience in Sri Lankan paddy farming

---

### 👥 Target Users / Stakeholders

- Smallholder and new-generation paddy farmers in Sri Lanka
- Agricultural cooperatives and extension services
- Agri-tech researchers and developers
- Policy makers and agricultural development organizations

---

### ⚙ High-Level System Functionality

At a high level, PaddyLife AI:

1. Collects field data via mobile inputs, sensors, and satellite feeds
2. Processes data using AI/ML models for pest, weed, and harvest insights
3. Delivers personalized recommendations via a web-based dashboard
4. Supports farmer decision-making across the full cultivation lifecycle
5. Continuously learns from farmer feedback and field reports

---

## System Architecture

### 🏗 Architecture Overview

PaddyLife AI follows a **web-based, modular architecture** consisting of:

- A **responsive web frontend** for farmer interaction and visualization
- A **backend API layer** for data management and business logic
- **AI/ML services** for predictive modeling and image analysis
- **Geospatial and weather data integration** for contextual insights

> 📌 *Architecture Diagram*
>
![System Architecture](htt<img width="774" height="888" alt="SystemDiagram" src="https://github.com/user-attachments/assets/ccf74006-7f90-488c-be46-b535c6caf92a" />


---

### 🧩 Frontend – Web Dashboard

*Technology Stack*

- React.js / Vue.js
- Tailwind CSS / Bootstrap
- Chart.js for visualizations

*Responsibilities*

- User authentication and profile management
- Dashboard for pest alerts, weed detection, crop planning, and harvest advice
- Image upload for weed identification
- Interactive farming calendar and input planner
- Real-time notifications and alerts

---

### 🌐 Backend – API & Data Layer

*Technology Stack*

- Node.js / Python (FastAPI/Django)
- PostgreSQL / MongoDB
- Firebase / AWS for storage

*Responsibilities*

- User and farm management
- Data aggregation from weather APIs, satellite feeds, and farmer inputs
- Communication with AI/ML services
- Storage of pest, weed, crop, and market data
- Generation of reports and insights

---

### 🤖 AI / ML Services

*Technology Stack*

- Python
- TensorFlow / PyTorch
- OpenCV for image processing
- Scikit-learn for traditional ML models

*Responsibilities*

- Pest forecasting using historical and real-time data
- Weed detection via computer vision models
- Harvest timing prediction using NDVI/GDD and weather data
- Crop recommendation and profitability simulation
- Model retraining based on farmer feedback

---

### 🗄 Database & External Integrations

*Primary Database*

- Stores farmer profiles, farm details, pest/weed records, harvest logs, and AI predictions.

*External Data Sources*

- Weather APIs (e.g., OpenWeatherMap)
- Satellite data (e.g., Sentinel Hub for NDVI)
- Market price feeds
- Soil and land data via GIS services

---

### 🔄 Data Flow Between Components

1. Farmer interacts with the **web dashboard**
2. Field data (images, logs) sent to backend
3. Backend processes and routes data to relevant AI services
4. AI models return predictions (pest risk, weed ID, harvest advice)
5. Backend stores results and pushes alerts to frontend
6. Farmer receives actionable insights and recommendations

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

## ▶ How to Run the Project

### 📌 Prerequisites

Ensure the following are installed:

- Node.js (v16+)
- Python (v3.9+)
- PostgreSQL / MongoDB
- Git

---

### 🌐 1. Run the Backend API

```bash
cd backend-api
npm install
# or pip install -r requirements.txt (if Python)
```

Create a `.env` file:

```env
PORT=5000
DB_URI=your_database_uri
WEATHER_API_KEY=your_key
```

Start the server:

```bash
npm start
# or python app.py
```

---

### 🖥 2. Run the Frontend

```bash
cd frontend
npm install
npm start
```

Access the dashboard at:

```
http://localhost:3000
```

---

### 🤖 3. Run AI Services

Each AI module can be run independently:

```bash
cd ai-services/pest-forecasting
python train_model.py
python serve_model.py
```

Repeat for other modules as needed.

---

## 🔐 Privacy & Ethical Considerations

- Farmer data is anonymized and stored securely
- Consent is obtained before data collection
- Farmers retain ownership of their data
- Models are trained on locally relevant datasets
- System promotes sustainable and eco-friendly farming practices

---

## 📊 Expected Outcomes

- Increased paddy yield and farmer income
- Reduced pesticide and fertilizer misuse
- Lower post-harvest losses
- Enhanced climate resilience
- Empowered farmers through accessible technology

---

## 👨‍💻 Contributors

*PaddyLife AI Research Group*  
**Centre of Excellence for AI (CoEAI), SLIIT**

- **IT22906762 Thambugala T.G.H.D** – Pest Attack Forecasting  
- **IT22364074 Rodrigo K.A.A.L** – AI-Powered Weed Detection  
- **IT22339942 Dilakshan K** – Smart Harvest & Post-Harvest Advisor  
- **IT22330932 Wijesinghe M.D.C.M** – Crop Establishment Planner

**Supervisors:**  
- Mrs. Lokesha Weerasinghe (Senior Lecturer)  
- Ms. Shalini Rupasinghe (Assistant Lecturer)  
- External Advisor – Department of Agricultural Development

---

## 📄 License

This project is developed for **academic and research purposes** under SLIIT regulations.

---
