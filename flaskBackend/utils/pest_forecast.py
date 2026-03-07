import pandas as pd
import numpy as np
import joblib
import re
from datetime import datetime, timedelta
from sklearn.preprocessing import RobustScaler

class PestForecastEngine:
    """Enhanced Pest Forecasting Engine using trained XGBoost model"""
    
    def __init__(self, model_path="models/enhanced_pest_model_complete.pkl"):
        """Load the trained model package"""
        try:
            self.model_package = joblib.load(model_path)
            self.models = {
                'risk': self.model_package['risk_model'],
                'severity': self.model_package['severity_model'],
                'pest': self.model_package.get('pest_model'),
                'incidence': self.model_package['incidence_model']
            }
            self.scaler = self.model_package['scaler']
            self.encoders = self.model_package['encoders']
            self.features = self.model_package['features']
            self.selector = self.model_package.get('feature_selector')
            self.risk_classes = self.model_package.get('risk_classes', ['Low', 'Medium', 'High'])
            self.metrics = self.model_package.get('metrics', {})
            print(f"✅ PestForecastEngine initialized with {len(self.features)} features")
            print(f"   Model accuracy: {self.metrics.get('risk_accuracy', 0)*100:.1f}%")
        except Exception as e:
            print(f"❌ Failed to load model: {e}")
            raise
    
    def preprocess_input(self, user_data):
        """Transform user input into model features"""
        
        # Extract basic features
        features = {}
        
        # Weather features
        features['Avg_Temp_C'] = float(user_data.get('temperature', 28))
        features['Rainfall_mm'] = float(user_data.get('rainfall', 50))
        features['Humidity_%'] = float(user_data.get('humidity', 75))
        
        # Soil features
        features['Soil_pH'] = float(user_data.get('soil_ph', 6.5))
        features['Soil_Moisture_%'] = float(user_data.get('soil_moisture', 70))
        features['Organic_Matter_%'] = float(user_data.get('organic_matter', 2.5))
        
        # Paddy features
        age_days = self._calculate_age_days(user_data)
        features['Age_Days'] = age_days
        
        # Categorical features (will be encoded)
        features['District'] = user_data.get('district', 'Anuradhapura')
        features['Paddy_Variety'] = user_data.get('paddy_variety', 'BG 358')
        features['Season'] = user_data.get('season', self._determine_season(user_data.get('start_date')))
        features['Soil_Type'] = user_data.get('soil_type', 'Reddish Brown Earth')
        
        # Generate derived features (matching training)
        df = pd.DataFrame([features])
        
        # 1. Polynomial features
        df['Temp_squared'] = df['Avg_Temp_C'] ** 2
        df['Humidity_squared'] = df['Humidity_%'] ** 2
        df['Rainfall_log'] = np.log1p(df['Rainfall_mm'])
        
        # 2. Interaction features
        df['Temp_Humidity'] = df['Avg_Temp_C'] * df['Humidity_%'] / 100
        df['Rain_Temp'] = df['Rainfall_mm'] * df['Avg_Temp_C'] / 100
        df['Rain_Humidity'] = df['Rainfall_mm'] * df['Humidity_%'] / 100
        df['Moisture_pH'] = df['Soil_Moisture_%'] * df['Soil_pH'] / 10
        
        # 3. Risk indices
        df['Weather_Risk_Index'] = (
            (df['Avg_Temp_C'] > 30).astype(int) * 2 +
            (df['Humidity_%'] > 80).astype(int) * 2 +
            (df['Rainfall_mm'] > 50).astype(int)
        )
        
        # 4. Soil quality metrics
        df['Soil_pH_deviation'] = abs(df['Soil_pH'] - 6.5)
        df['Soil_Quality_Composite'] = (
            (6.5 - df['Soil_pH_deviation']) / 2 +
            df['Organic_Matter_%'] / 5 +
            df['Soil_Moisture_%'] / 100
        )
        
        # 5. Growth stage
        df['Growth_Stage_Detailed'] = self._get_growth_stage(age_days)
        
        # 6. Lag features (simplified for single prediction)
        df['Temp_rolling_mean'] = df['Avg_Temp_C']
        df['Rainfall_rolling_sum'] = df['Rainfall_mm']
        
        # 7. Encode categoricals
        for col in ['District', 'Paddy_Variety', 'Season', 'Soil_Type']:
            if col in self.encoders:
                try:
                    df[col + '_encoded'] = self.encoders[col].transform([features[col]])[0]
                except:
                    # Use most common class if unseen
                    df[col + '_encoded'] = 0
        
        # Prepare feature vector
        feature_vector = pd.DataFrame()
        for feat in self.features:
            if feat in df.columns:
                feature_vector[feat] = df[feat].values[0]
            else:
                feature_vector[feat] = 0
        
        return feature_vector
    
    def predict(self, user_data):
        """Make full pest forecast prediction"""
        
        # Preprocess input
        X = self.preprocess_input(user_data)
        X_scaled = self.scaler.transform(X)
        
        # Apply feature selection if available
        if self.selector is not None:
            X_selected = self.selector.transform(X_scaled)
        else:
            X_selected = X_scaled
        
        # Make predictions
        results = {}
        
        # 1. Risk Level
        risk_idx = self.models['risk'].predict(X_scaled)[0]
        risk_proba = self.models['risk'].predict_proba(X_scaled)[0]
        results['risk_level'] = self.risk_classes[int(risk_idx)]
        results['risk_probabilities'] = {
            self.risk_classes[i]: float(risk_proba[i])
            for i in range(len(self.risk_classes))
        }
        
        # 2. Severity
        severity_idx = self.models['severity'].predict(X_scaled)[0]
        severity_labels = ['Low', 'Moderate', 'High']
        results['severity'] = severity_labels[int(severity_idx)]
        
        # 3. Incidence Percentage
        if X_selected.shape[1] > 0:
            incidence = self.models['incidence'].predict(X_selected)[0]
            results['predicted_incidence'] = float(np.clip(incidence, 0, 100))
        else:
            results['predicted_incidence'] = 15.0
        
        # 4. Pest Type
        if self.models['pest'] is not None:
            pest_idx = self.models['pest'].predict(X_scaled)[0]
            pest_encoder = self.encoders.get('Pest_Grouped')
            if pest_encoder:
                results['predicted_pest'] = pest_encoder.inverse_transform([int(pest_idx)])[0]
            else:
                results['predicted_pest'] = 'Brown Planthopper (BPH)'
        else:
            results['predicted_pest'] = self._get_common_pest(user_data)
        
        # 5. Recommendations
        results['recommendations'] = self._generate_recommendations(results, user_data)
        
        # 6. Timeline
        results['expected_timeline'] = self._calculate_timeline(results, user_data)
        
        # 7. Confidence Score
        results['confidence'] = float(self.metrics.get('risk_accuracy', 0.85))
        
        return results
    
    def _calculate_age_days(self, user_data):
        """Calculate paddy age in days from start date"""
        if 'age_days' in user_data:
            return int(user_data['age_days'])
        elif 'start_date' in user_data:
            try:
                start = datetime.strptime(user_data['start_date'], '%Y-%m-%d')
                today = datetime.now()
                return (today - start).days
            except:
                return 30
        else:
            return 30
    
    def _determine_season(self, start_date):
        """Determine Maha or Yala season based on start date"""
        if not start_date:
            return 'Maha'
        try:
            month = datetime.strptime(start_date, '%Y-%m-%d').month
            # Maha: September-March, Yala: April-August
            return 'Yala' if 4 <= month <= 8 else 'Maha'
        except:
            return 'Maha'
    
    def _get_growth_stage(self, age_days):
        """Get detailed growth stage code"""
        if age_days <= 15:
            return 0  # Seedling
        elif age_days <= 25:
            return 1  # Early tillering
        elif age_days <= 40:
            return 2  # Active tillering
        elif age_days <= 55:
            return 3  # Panicle initiation
        elif age_days <= 70:
            return 4  # Booting
        elif age_days <= 85:
            return 5  # Flowering
        else:
            return 6  # Grain filling
    
    def _get_common_pest(self, user_data):
        """Fallback pest prediction based on conditions"""
        temp = float(user_data.get('temperature', 28))
        humidity = float(user_data.get('humidity', 75))
        
        if humidity > 80 and temp > 28:
            return 'Brown Planthopper (BPH)'
        elif humidity > 85 and temp < 30:
            return 'Sheath Blight'
        elif 25 < temp < 32 and humidity < 80:
            return 'Rice Leaf-folder'
        else:
            return 'Paddy Bug'
    
    def _generate_recommendations(self, results, user_data):
        """Generate actionable recommendations"""
        risk = results['risk_level']
        pest = results['predicted_pest']
        incidence = results['predicted_incidence']
        
        recs = []
        
        # Risk-based recommendations
        if risk == 'High':
            recs.append({
                'priority': 'high',
                'action': 'Immediate action required',
                'description': f'High risk of {pest} detected. Prepare for immediate intervention.',
                'timeframe': 'Next 3-5 days'
            })
            recs.append({
                'priority': 'high',
                'action': 'Apply preventive measures',
                'description': 'Consider applying recommended pesticides or biological controls.',
                'timeframe': 'Within 48 hours'
            })
        elif risk == 'Medium':
            recs.append({
                'priority': 'medium',
                'action': 'Monitor closely',
                'description': f'Medium risk of {pest}. Increase field monitoring frequency.',
                'timeframe': 'Next 7-10 days'
            })
            recs.append({
                'priority': 'medium',
                'action': 'Prepare control measures',
                'description': 'Have pesticides ready and scout fields twice weekly.',
                'timeframe': 'This week'
            })
        else:
            recs.append({
                'priority': 'low',
                'action': 'Routine monitoring',
                'description': 'Low pest risk. Continue standard field monitoring.',
                'timeframe': 'Weekly'
            })
        
        # Pest-specific recommendations
        pest_recs = {
            'Brown Planthopper (BPH)': 'Use resistant varieties, maintain proper spacing, avoid excess nitrogen. Apply Buprofezin/Imidacloprid if needed.',
            'Sheath Blight': 'Improve air circulation, avoid dense planting. Apply Hexaconazole or Validamycin. Reduce nitrogen and apply Potash.',
            'Rice Leaf-folder': 'Encourage natural predators, use light traps. Apply Chlorantraniliprole if high damage.',
            'Paddy Bug': 'Use sweep nets, neem sprays, maintain clean bunds. Apply balanced fertilizer.'
        }
        
        for key, text in pest_recs.items():
            if key in pest or pest in key:
                recs.append({
                    'priority': 'medium',
                    'action': f'{key} Management',
                    'description': text,
                    'timeframe': 'As needed'
                })
                break
        
        return recs
    
    def _calculate_timeline(self, results, user_data):
        """Estimate when pest is expected to appear"""
        risk = results['risk_level']
        
        if risk == 'High':
            days = '2-4'
        elif risk == 'Medium':
            days = '5-8'
        else:
            days = '10-14'
        
        return {
            'expected_in_days': days,
            'warning_period': f'Expect signs within {days} days',
            'peak_risk_period': f'{days} days from now'
        }

# Singleton instance
forecast_engine = PestForecastEngine()