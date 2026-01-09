import pandas as pd
import numpy as np
import joblib
import os
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.model_selection import train_test_split, GridSearchCV, cross_val_score
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor, GradientBoostingRegressor
from sklearn.metrics import accuracy_score, mean_squared_error, classification_report, r2_score
from xgboost import XGBClassifier, XGBRegressor
from sklearn.preprocessing import PowerTransformer
import warnings
warnings.filterwarnings('ignore')


DATA_PATH = "data/paddy_pest_weather_soil_SriLanka_2015_2024_updated.csv"
MODEL_DIR = "model"
os.makedirs(MODEL_DIR, exist_ok=True)


print("Loading dataset...")
df = pd.read_csv(DATA_PATH)
print(f" Initial dataset shape: {df.shape}")


print("\n🔧 Preprocessing data...")

def convert_age_days(age_str):
    """Convert age strings to numeric - FIXED VERSION"""
    if pd.isna(age_str):
        return np.nan
    if isinstance(age_str, (int, float)):
        return float(age_str)
    
    age_str = str(age_str).strip()
    
    
    if '-' in age_str:
        try:
            parts = age_str.split('-')
            num1 = float(parts[0].strip())
            num2 = float(parts[1].strip())
            return (num1 + num2) / 2
        except:
            return np.nan
    
    
    try:
        import re
        numbers = re.findall(r'\d+\.?\d*', age_str)
        if numbers:
            nums = [float(n) for n in numbers]
            return sum(nums) / len(nums)
    except:
        pass
    
    return np.nan


df["Paddy_Age_Days"] = df["Paddy_Age_Days"].apply(convert_age_days)
df["Paddy_Age_Days"] = df["Paddy_Age_Days"].fillna(df["Paddy_Age_Days"].median())


weather_cols = ["Avg_Temp_C", "Rainfall_mm", "Humidity_%", "Soil_Moisture_%"]
for col in weather_cols:
    if col in df.columns:
        df[col] = pd.to_numeric(df[col], errors='coerce')
        df[col] = df[col].fillna(df[col].mean())


print("\nFeature Engineering...")


df["Temp_Humidity_Interaction"] = df["Avg_Temp_C"] * df["Humidity_%"] / 100
df["Rain_Moisture_Interaction"] = df["Rainfall_mm"] * df["Soil_Moisture_%"] / 100
df["pH_Organic_Interaction"] = df["Soil_pH"] * df["Organic_Matter_%"]


def get_growth_stage(age):
    if age <= 25:
        return 0  # Seedling
    elif age <= 50:
        return 1  # Tillering
    elif age <= 70:
        return 2  # Reproductive
    elif age <= 90:
        return 3  # Ripening
    else:
        return 4  # Maturity

df["Growth_Stage"] = df["Paddy_Age_Days"].apply(get_growth_stage)


df["Weather_Severity_Score"] = (
    (df["Avg_Temp_C"] - df["Avg_Temp_C"].mean()) / df["Avg_Temp_C"].std() +
    (df["Humidity_%"] - df["Humidity_%"].mean()) / df["Humidity_%"].std() +
    (df["Rainfall_mm"] - df["Rainfall_mm"].mean()) / df["Rainfall_mm"].std()
)


df["Soil_Quality_Score"] = (
    (df["Soil_pH"] - 6.5).abs() * -1 +  
    df["Organic_Matter_%"] / 5 +  
    df["Soil_Moisture_%"] / 100  
)


categorical_cols = ["District", "Season", "Paddy_Variety", "Pest"]
le_dict = {}
for col in categorical_cols:
    le = LabelEncoder()
    df[f"{col}_encoded"] = le.fit_transform(df[col].astype(str))
    le_dict[col] = le
    joblib.dump(le, f"{MODEL_DIR}/{col}_encoder.pkl")
    print(f"Encoded {col}: {len(le.classes_)} unique values")


severity_mapping = {"Low": 0, "Moderate": 1, "High": 2}
df["Pest_Severity_encoded"] = df["Severity"].map(severity_mapping).fillna(0)


enhanced_features = [
   
    "Avg_Temp_C", "Rainfall_mm", "Humidity_%", 
    "Soil_pH", "Soil_Moisture_%", "Organic_Matter_%",
    "District_encoded", "Season_encoded", "Paddy_Variety_encoded",
    "Paddy_Age_Days",
    
    
    "Temp_Humidity_Interaction",
    "Rain_Moisture_Interaction",
    "pH_Organic_Interaction",
    "Growth_Stage",
    "Weather_Severity_Score",
    "Soil_Quality_Score"
]

X = df[enhanced_features]
y_pest = df["Pest_encoded"]
y_severity = df["Pest_Severity_encoded"]
y_incidence = df["Incidence_percent"]

print(f"\nFinal dataset: {len(df)} samples")
print(f" Enhanced features: {len(enhanced_features)}")
print(f" Features used: {enhanced_features}")


scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)
joblib.dump(scaler, f"{MODEL_DIR}/feature_scaler.pkl")

y_incidence_transformed = np.log1p(y_incidence)  


print("\n Training enhanced models with cross-validation...")

#
print("\n Training Enhanced Pest Model...")
X_train, X_test, y_pest_train, y_pest_test = train_test_split(
    X_scaled, y_pest, test_size=0.2, random_state=42, stratify=y_pest
)

# better accuracy = xgboost
pest_model = XGBClassifier(
    n_estimators=300,
    max_depth=8,
    learning_rate=0.1,
    subsample=0.8,
    colsample_bytree=0.8,
    random_state=42,
    use_label_encoder=False,
    eval_metric='mlogloss'
)


cv_scores = cross_val_score(pest_model, X_train, y_pest_train, cv=5, scoring='accuracy')
print(f" Cross-validation accuracy: {cv_scores.mean():.3f} ± {cv_scores.std():.3f}")

pest_model.fit(X_train, y_pest_train)
y_pest_pred = pest_model.predict(X_test)
pest_accuracy = accuracy_score(y_pest_test, y_pest_pred)

print(f" Enhanced Pest Model Accuracy: {pest_accuracy * 100:.2f}%")
print("\n Enhanced Pest Classification Report:")
print(classification_report(y_pest_test, y_pest_pred, target_names=le_dict['Pest'].classes_))


print("\n Training Enhanced Severity Model...")
X_train_s, X_test_s, y_sev_train, y_sev_test = train_test_split(
    X_scaled, y_severity, test_size=0.2, random_state=42, stratify=y_severity
)


severity_model = RandomForestClassifier(
    n_estimators=300,
    max_depth=15,
    min_samples_split=5,
    min_samples_leaf=2,
    class_weight='balanced',
    random_state=42,
    n_jobs=-1
)

cv_scores_sev = cross_val_score(severity_model, X_train_s, y_sev_train, cv=5, scoring='accuracy')
print(f" Cross-validation accuracy: {cv_scores_sev.mean():.3f} ± {cv_scores_sev.std():.3f}")

severity_model.fit(X_train_s, y_sev_train)
y_sev_pred = severity_model.predict(X_test_s)
sev_accuracy = accuracy_score(y_sev_test, y_sev_pred)

print(f" Enhanced Severity Model Accuracy: {sev_accuracy * 100:.2f}%")


print("\n Training Enhanced Incidence Model...")
X_train_i, X_test_i, y_inc_train, y_inc_test = train_test_split(
    X_scaled, y_incidence_transformed, test_size=0.2, random_state=42
)


incidence_model = GradientBoostingRegressor(
    n_estimators=300,
    learning_rate=0.05,
    max_depth=5,
    min_samples_split=10,
    min_samples_leaf=5,
    subsample=0.8,
    random_state=42
)


incidence_model.fit(X_train_i, y_inc_train)


y_inc_pred_transformed = incidence_model.predict(X_test_i)
y_inc_pred = np.expm1(y_inc_pred_transformed)  
y_inc_test_original = np.expm1(y_inc_test)  

inc_mse = mean_squared_error(y_inc_test_original, y_inc_pred)
inc_rmse = np.sqrt(inc_mse)
inc_r2 = r2_score(y_inc_test_original, y_inc_pred)

print(f" Enhanced Incidence Model Performance:")
print(f"   RMSE: {inc_rmse:.2f}%")
print(f"   R² Score: {inc_r2:.3f}")
print(f"   MSE: {inc_mse:.2f}")


print(f"\nActual vs Enhanced Predicted sample (first 5):")
for i in range(min(5, len(y_inc_test_original))):
    actual = y_inc_test_original.iloc[i] if hasattr(y_inc_test_original, 'iloc') else y_inc_test_original[i]
    pred = y_inc_pred[i]
    error = abs(actual - pred)
    print(f"   Actual: {actual:.1f}% | Predicted: {pred:.1f}% | Error: {error:.1f}%")


print("\n Training Ensemble Incidence Model...")
from sklearn.ensemble import VotingRegressor
from sklearn.linear_model import Ridge
from sklearn.svm import SVR

ensemble_model = VotingRegressor([
    ('gb', GradientBoostingRegressor(n_estimators=200, learning_rate=0.05, max_depth=5, random_state=42)),
    ('rf', RandomForestRegressor(n_estimators=200, max_depth=10, random_state=42)),
    ('ridge', Ridge(alpha=1.0))
])

ensemble_model.fit(X_train_i, y_inc_train)
y_inc_ensemble_transformed = ensemble_model.predict(X_test_i)
y_inc_ensemble = np.expm1(y_inc_ensemble_transformed)

ensemble_rmse = np.sqrt(mean_squared_error(y_inc_test_original, y_inc_ensemble))
ensemble_r2 = r2_score(y_inc_test_original, y_inc_ensemble)

print(f" Ensemble Incidence Model Performance:")
print(f"   RMSE: {ensemble_rmse:.2f}% (Improvement: {inc_rmse - ensemble_rmse:.2f}%)")
print(f"   R² Score: {ensemble_r2:.3f}")


joblib.dump(pest_model, f"{MODEL_DIR}/pest_model.pkl")
joblib.dump(severity_model, f"{MODEL_DIR}/severity_model.pkl")
joblib.dump(incidence_model, f"{MODEL_DIR}/incidence_model.pkl")
joblib.dump(ensemble_model, f"{MODEL_DIR}/incidence_ensemble_model.pkl")  
joblib.dump(enhanced_features, f"{MODEL_DIR}/features.pkl")


print("\n" + "="*60)
print("FINAL MODEL PERFORMANCE SUMMARY")
print("="*60)


print("\n Pest Model Feature Importance (Top 10):")
importances = pest_model.feature_importances_
feature_importance_df = pd.DataFrame({
    'feature': enhanced_features,
    'importance': importances
}).sort_values('importance', ascending=False)

for idx, row in feature_importance_df.head(10).iterrows():
    print(f"   {row['feature']}: {row['importance']:.4f}")


print("\n Severity Model Feature Importance (Top 10):")
importances_sev = severity_model.feature_importances_
feature_importance_sev = pd.DataFrame({
    'feature': enhanced_features,
    'importance': importances_sev
}).sort_values('importance', ascending=False)

for idx, row in feature_importance_sev.head(10).iterrows():
    print(f"   {row['feature']}: {row['importance']:.4f}")


errors = abs(y_inc_test_original - y_inc_pred)
print(f"\n Incidence Prediction Error Analysis:")
print(f"   Mean Absolute Error: {errors.mean():.2f}%")
print(f"   Median Absolute Error: {errors.median():.2f}%")
print(f"   Max Error: {errors.max():.2f}%")
print(f"   % Predictions within 5% error: {(errors <= 5).sum() / len(errors) * 100:.1f}%")
print(f"   % Predictions within 10% error: {(errors <= 10).sum() / len(errors) * 100:.1f}%")


print("\n Dataset Statistics:")
print(f"   Total samples: {len(df)}")
print(f"   Features used: {len(enhanced_features)}")
print(f"   Unique pests: {len(df['Pest'].unique())}")
print(f"   Incidence range: {df['Incidence_percent'].min():.1f}% - {df['Incidence_percent'].max():.1f}%")
print(f"   Average incidence: {df['Incidence_percent'].mean():.1f}%")

print("\n" + "="*60)
print("PERFORMANCE SUMMARY")
print("="*60)
print(f"{'Model':<30} {'Metric':<20} {'Value':<10}")
print("-" * 60)
print(f"{'Pest Identification':<30} {'Accuracy':<20} {pest_accuracy*100:>9.2f}%")
print(f"{'Severity Prediction':<30} {'Accuracy':<20} {sev_accuracy*100:>9.2f}%")
print(f"{'Incidence Prediction':<30} {'RMSE':<20} {inc_rmse:>9.2f}%")
print(f"{'Incidence Prediction':<30} {'R² Score':<20} {inc_r2:>9.3f}")
print(f"{'Ensemble Incidence':<30} {'RMSE':<20} {ensemble_rmse:>9.2f}%")
print(f"{'Ensemble Incidence':<30} {'R² Score':<20} {ensemble_r2:>9.3f}")
print("="*60)

print("\nAll enhanced models saved successfully!")
print("Models saved in: model/ directory")


performance_report = {
    'pest_accuracy': pest_accuracy,
    'severity_accuracy': sev_accuracy,
    'incidence_rmse': inc_rmse,
    'incidence_r2': inc_r2,
    'ensemble_rmse': ensemble_rmse,
    'ensemble_r2': ensemble_r2,
    'features': enhanced_features,
    'sample_count': len(df)
}

joblib.dump(performance_report, f"{MODEL_DIR}/performance_report.pkl")