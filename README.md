# GoviMithuruMobileApplication
An AI-powered platform providing Sri Lankan paddy farmers with personalized guidance throughout the entire cultivation lifecycle - from land preparation to harvest and post-harvest management.

Research Problem

•Inefficient & Reactive Farming: Farmers rely on outdated methods and intuition, making them vulnerable to climate change, pests, and diseases, which leads to inconsistent yields and resource waste.

•Critical Knowledge Gaps: There is a significant lack of access to real-time, hyper-local advisory services for crucial decisions like pest control, weed identification, optimal harvesting time, and proper storage techniques
.
•High Post-Harvest Losses: Significant economic losses occur after harvest due to poor timing, inadequate drying methods in unpredictable weather, and insufficient storage solutions against pests and spoilage.

•Barriers to Technology Adoption: Complex and expensive modern solutions are inaccessible to smallholder farmers, compounded by a lack of personalized guidance for new farmers, hindering the sector's modernization and sustainability.

Research Main Objective

•To design and develop an integrated, AI-driven web platform that provides Sri Lankan paddy farmers with data-guided decision-making support across the entire cultivation lifecycle, aiming to increase productivity, profitability, and resilience against climate and pest risks.

Specific Sub-Objectives & Components

•Pest Attack Forecasting: To predict outbreaks using ML models on historical and real-time weather, crop stage, and pest data, sending proactive alerts to farmers.

•AI-Powered Weed Detection: To accurately identify weed species in real-time using a smartphone camera and computer vision, providing tailored removal guidance.

•Smart Harvest & Post-Harvest Advisor: To determine the optimal harvest time using crop maturity and weather data, and provide science-based storage and selling recommendations to minimize losses.

•Crop Establishment Planner: To assist new farmers by recommending suitable paddy varieties and generating a personalized cultivation calendar based on their specific field's soil, climate, and market data. 


Overall System Diagram

i[image alt](https://github.com/AvishkaRodrigooo/GoviMithuruMobileApplication/blob/1523e0858ebf2ea0262a57214162b6c9439cf4d9/image.png)

Pest Forcasting System  

RESEARCH GAP & PROBLEM
Traditional pest forecasting in Sri Lanka relies on seasonal calendars, farmer experience, and manual scouting – reactive, time-consuming, and inaccurate.
Existing systems are rule-based or weather-only models, failing to adapt to changing climate conditions, pest diversity, and local farming contexts not based on paddy type.
Farmers lack real-time, localized, and actionable predictions, leading to delayed detection, overuse of pesticides, reduced yields, and financial loss.

Shortcomings of Existing Systems

Depend on seasonal calendars and farmer intuition → delayed pest detection. 
Rule-based / weather-only models → cannot adapt to climate variability & pest diversity. 
Manual data collection → time-consuming, labor-intensive, not scalable. 
Lack of real-time forecasting & actionable insights → excessive pesticide use, crop loss. 

SOLUTION

• Multimodal data fusion (weather, soil, crop stage, pest history,farmer images).
• Adaptive AI Models (XG Boost Random Forest) enabling continuous learning and improved predictions.
• Farmer participation via pest image uploads & field reports.
• Real-time mobile alerts with  risk prediction, actionable recommendations.

Evidences for Completion

•Functional AI Model: A trained and validated machine learning model file (e.g., .h5, .pkl) demonstrating high accuracy on test datasets for pest prediction.

•Integrated System Module: Source code (e.g., GitHub repository) showing the integrated forecasting module within the larger platform, including API endpoints for data ingestion and alert generation.

•Working Prototype: Screenshots or a video demonstration of the mobile interface showcasing

•A dashboard displaying pest risk forecasts and maps.

•Notifications (in-app or SMS) being triggered.

•Dataset: The curated dataset of Sri Lankan pest images, weather, and soil data used for training and testing the model.

Future work
•Pest image data set processing.
•Heat Map for pest in dashboard 
•Pest library 
Furthermore Testing 

system overview

https://github.com/AvishkaRodrigooo/GoviMithuruMobileApplication/blob/82d4b24d7e3f7d48ada594edc49968a9624574f1/image%20(1).png

system demo 

https://github.com/AvishkaRodrigooo/GoviMithuruMobileApplication/blob/2eb4d00db172f6ede5cb85bcc0537ec08cd5c81e/function%20demo.gif

backend start: python app.py
Frontend start: npx expo start





