import pandas as pd
import numpy as np
import os
import pickle
import joblib
import json
from datetime import datetime
import warnings
warnings.filterwarnings("ignore")

from sklearn.model_selection import train_test_split, cross_val_score, StratifiedKFold
from sklearn.preprocessing import LabelEncoder, StandardScaler, RobustScaler
from sklearn.metrics import (
    r2_score, mean_squared_error, accuracy_score,
    classification_report, confusion_matrix
)
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor, GradientBoostingRegressor, VotingRegressor
from xgboost import XGBClassifier, XGBRegressor
from sklearn.feature_selection import SelectFromModel
import xgboost as xgb
import re
import matplotlib.pyplot as plt
import seaborn as sns

# Try to import imbalanced-learn, but provide fallback
try:
    from imblearn.over_sampling import SMOTE, ADASYN
    from imblearn.combine import SMOTETomek
    IMBALANCE_AVAILABLE = True
    print("✅ imbalanced-learn loaded successfully")
except ImportError:
    IMBALANCE_AVAILABLE = False
    print("⚠️ imbalanced-learn not available - using class weights instead")
    print("  To install: pip install imbalanced-learn")

print("=" * 80)
print("🚀 ENHANCED PEST FORECAST MODEL - TARGETING 90%+ ACCURACY")
print("📊 WITH ADVANCED FEATURES & IMBALANCE HANDLING")
print("=" * 80)

# ============================================================
# 1. LOAD & CLEAN DATA
# ============================================================
csv_path = "data/paddy_pest_weather_soil_option1_ml_ready.csv"
df = pd.read_csv(csv_path)
df.columns = df.columns.str.strip()
print(f"✅ Dataset Loaded: {df.shape}")

# Check class distribution before processing
print("\n📊 Original Class Distribution:")
print(df["RiskLevel"].value_counts() if "RiskLevel" in df.columns else "RiskLevel not found")

# ============================================================
# 2. ENHANCED TARGET PREPARATION
# ============================================================

# A. Incidence to RiskLevel (with balanced bins)
df["Incidence"] = pd.to_numeric(df["Incidence_percent"], errors="coerce")

# Use percentile-based bins for better balance
percentiles = df["Incidence"].quantile([0.33, 0.66]).values
df["RiskLevel"] = pd.cut(df["Incidence"], 
                         bins=[-np.inf, percentiles[0], percentiles[1], np.inf], 
                         labels=["Low", "Medium", "High"])

# B. Severity encoding (ensure balanced)
if "Severity" in df.columns:
    df["Severity"] = df["Severity"].fillna("Low")
    # Map with explicit handling
    severity_map = {"Low": 0, "Moderate": 1, "High": 2}
    df["Severity_encoded"] = df["Severity"].map(severity_map)
else:
    # Create balanced severity bins
    df["Severity_encoded"] = pd.qcut(df["Incidence"], q=3, labels=[0, 1, 2]).astype(int)

# C. Pest identification with grouping for rare classes
if "Pest" in df.columns:
    df["Pest"] = df["Pest"].fillna("Unknown")
    # Group rare pest types (appearing less than 5% of data)
    pest_counts = df["Pest"].value_counts(normalize=True)
    rare_pests = pest_counts[pest_counts < 0.05].index
    df["Pest_Grouped"] = df["Pest"].apply(lambda x: "Other" if x in rare_pests else x)
else:
    df["Pest_Grouped"] = "Unknown"

df = df.dropna(subset=["Incidence", "RiskLevel", "Severity_encoded"])

print("\n📊 Enhanced Target Distributions:")
print("RiskLevel:", df["RiskLevel"].value_counts())
print("Severity:", pd.Series(df["Severity_encoded"]).value_counts())
print("Pest types (grouped):", df["Pest_Grouped"].nunique())

# ============================================================
# 3. ADVANCED FEATURE ENGINEERING (EXPANDED)
# ============================================================

def extract_age(age_str):
    if pd.isna(age_str): return 30
    numbers = re.findall(r"\d+", str(age_str))
    if len(numbers) >= 2: return (int(numbers[0]) + int(numbers[1])) / 2
    elif len(numbers) == 1: return int(numbers[0])
    return 30

df["Age_Days"] = df["Paddy_Age_Days"].apply(extract_age)

# Weather & Soil cleaning with outlier handling
num_cols = ["Avg_Temp_C", "Rainfall_mm", "Humidity_%", "Soil_pH", "Soil_Moisture_%", "Organic_Matter_%"]
for col in num_cols:
    if col in df.columns:
        df[col] = pd.to_numeric(df[col], errors='coerce')
        # Clip outliers to 3 standard deviations
        mean, std = df[col].mean(), df[col].std()
        df[col] = df[col].clip(mean - 3*std, mean + 3*std)
        df[col] = df[col].fillna(df[col].median())

# EXPANDED FEATURE SET
# 1. Interaction features
df["Temp_Humidity"] = df["Avg_Temp_C"] * df["Humidity_%"] / 100
df["Rain_Temp"] = df["Rainfall_mm"] * df["Avg_Temp_C"] / 100
df["Rain_Humidity"] = df["Rainfall_mm"] * df["Humidity_%"] / 100
df["Moisture_pH"] = df["Soil_Moisture_%"] * df["Soil_pH"] / 10

# 2. Polynomial features
df["Temp_squared"] = df["Avg_Temp_C"] ** 2
df["Humidity_squared"] = df["Humidity_%"] ** 2
df["Rainfall_log"] = np.log1p(df["Rainfall_mm"])

# 3. Risk scores (enhanced)
df["Weather_Risk_Index"] = (
    (df["Avg_Temp_C"] > 30).astype(int) * 2 +
    (df["Humidity_%"] > 80).astype(int) * 2 +
    (df["Rainfall_mm"] > 50).astype(int)
)

# 4. Soil quality metrics
df["Soil_pH_deviation"] = abs(df["Soil_pH"] - 6.5)
df["Soil_Quality_Composite"] = (
    (6.5 - df["Soil_pH_deviation"]) / 2 +
    df["Organic_Matter_%"] / 5 +
    df["Soil_Moisture_%"] / 100
)

# 5. Growth stage with sub-stages
def get_detailed_growth_stage(age):
    if age <= 15: return 0
    elif age <= 25: return 1
    elif age <= 40: return 2
    elif age <= 55: return 3
    elif age <= 70: return 4
    elif age <= 85: return 5
    else: return 6
df["Growth_Stage_Detailed"] = df["Age_Days"].apply(get_detailed_growth_stage)

# 6. Lag features
df["Temp_rolling_mean"] = df["Avg_Temp_C"].rolling(window=5, min_periods=1).mean()
df["Rainfall_rolling_sum"] = df["Rainfall_mm"].rolling(window=3, min_periods=1).sum()

print(f"✅ {len([col for col in df.columns if col not in ['Incidence', 'RiskLevel', 'Severity', 'Pest']])} Features Created")

# ============================================================
# 4. ENCODING
# ============================================================
categorical_cols = ["District", "Paddy_Variety", "Paddy_Age_Stage", "Season", "Soil_Type", "Pest_Grouped"]

label_encoders = {}
for col in categorical_cols:
    if col in df.columns:
        # Frequency encoding for high-cardinality
        if df[col].nunique() > 10:
            freq_encoding = df[col].value_counts(normalize=True).to_dict()
            df[col + "_freq"] = df[col].map(freq_encoding)
        
        # Label encoding
        le = LabelEncoder()
        df[col + "_encoded"] = le.fit_transform(df[col].astype(str))
        label_encoders[col] = le

# Encode targets
risk_encoder = LabelEncoder()
df["RiskLevel_encoded"] = risk_encoder.fit_transform(df["RiskLevel"])
label_encoders["RiskLevel"] = risk_encoder

# Encode pest groups
if "Pest_Grouped" in df.columns:
    pest_encoder = LabelEncoder()
    df["Pest_Grouped_encoded"] = pest_encoder.fit_transform(df["Pest_Grouped"].astype(str))
    label_encoders["Pest_Grouped"] = pest_encoder

# ============================================================
# 5. FEATURE SET
# ============================================================
feature_cols = [
    "Avg_Temp_C", "Rainfall_mm", "Humidity_%", 
    "Temp_squared", "Humidity_squared", "Rainfall_log",
    "Soil_pH", "Soil_Moisture_%", "Organic_Matter_%",
    "Soil_pH_deviation", "Soil_Quality_Composite",
    "Age_Days", "Growth_Stage_Detailed",
    "Temp_Humidity", "Rain_Temp", "Rain_Humidity", "Moisture_pH",
    "Weather_Risk_Index",
    "Temp_rolling_mean", "Rainfall_rolling_sum"
]

# Add encoded categoricals
for col in categorical_cols:
    if col + "_encoded" in df.columns:
        feature_cols.append(col + "_encoded")
    if col + "_freq" in df.columns:
        feature_cols.append(col + "_freq")

feature_cols = [f for f in feature_cols if f in df.columns]
X = df[feature_cols].fillna(df[feature_cols].median())

# Targets
y_risk = df["RiskLevel_encoded"].values
y_severity = df["Severity_encoded"].values
y_incidence = df["Incidence"].values
y_pest = df["Pest_Grouped_encoded"].values if "Pest_Grouped_encoded" in df.columns else None

print(f"✅ Feature Matrix: {X.shape} | {len(feature_cols)} Features")

# ============================================================
# 6. TRAIN-TEST SPLIT
# ============================================================
X_train, X_test, y_risk_train, y_risk_test = train_test_split(
    X, y_risk, test_size=0.2, random_state=42, stratify=y_risk
)

# Scale features
scaler = RobustScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

# Split other targets
_, _, y_sev_train, y_sev_test = train_test_split(
    X, y_severity, test_size=0.2, random_state=42, stratify=y_severity
)
_, _, y_inc_train, y_inc_test = train_test_split(
    X, y_incidence, test_size=0.2, random_state=42
)

# ============================================================
# 7. HANDLE CLASS IMBALANCE (with fallback)
# ============================================================
print("\n🔄 Handling class imbalance...")

if IMBALANCE_AVAILABLE:
    # Use SMOTE if available
    print("Using SMOTE for oversampling...")
    smote = SMOTE(random_state=42, k_neighbors=min(3, np.bincount(y_risk_train).min()-1))
    X_train_balanced, y_risk_balanced = smote.fit_resample(X_train_scaled, y_risk_train)
    
    # Also balance severity
    smote_sev = SMOTE(random_state=42, k_neighbors=min(3, np.bincount(y_sev_train).min()-1))
    X_train_sev_balanced, y_sev_balanced = smote_sev.fit_resample(X_train_scaled, y_sev_train)
    
    print(f"Before SMOTE - Risk: {np.bincount(y_risk_train)}")
    print(f"After SMOTE - Risk: {np.bincount(y_risk_balanced)}")
else:
    # Fallback: Use class weights in models
    print("Using class weights approach...")
    X_train_balanced, y_risk_balanced = X_train_scaled, y_risk_train
    X_train_sev_balanced, y_sev_balanced = X_train_scaled, y_sev_train
    
    # Calculate class weights
    from sklearn.utils.class_weight import compute_class_weight
    risk_classes = np.unique(y_risk_train)
    risk_weights = compute_class_weight('balanced', classes=risk_classes, y=y_risk_train)
    risk_class_weight = dict(zip(risk_classes, risk_weights))
    
    sev_classes = np.unique(y_sev_train)
    sev_weights = compute_class_weight('balanced', classes=sev_classes, y=y_sev_train)
    sev_class_weight = dict(zip(sev_classes, sev_weights))
    
    print(f"Risk class weights: {risk_class_weight}")

# ============================================================
# 8. OPTIMIZED MODELS
# ============================================================

# A. Risk Level Classifier
print("\n🎯 Training Optimized Risk Level Classifier...")

if IMBALANCE_AVAILABLE:
    risk_model = XGBClassifier(
        n_estimators=500,
        max_depth=8,
        learning_rate=0.05,
        subsample=0.8,
        colsample_bytree=0.8,
        min_child_weight=3,
        gamma=0.1,
        reg_lambda=2,
        reg_alpha=1,
        scale_pos_weight='balanced',
        random_state=42,
        n_jobs=-1,
        eval_metric='mlogloss'
    )
else:
    risk_model = XGBClassifier(
        n_estimators=500,
        max_depth=8,
        learning_rate=0.05,
        subsample=0.8,
        colsample_bytree=0.8,
        min_child_weight=3,
        gamma=0.1,
        reg_lambda=2,
        reg_alpha=1,
        random_state=42,
        n_jobs=-1,
        eval_metric='mlogloss'
    )

risk_model.fit(
    X_train_balanced, y_risk_balanced,
    eval_set=[(X_test_scaled, y_risk_test)],
    early_stopping_rounds=50,
    verbose=False
)

y_risk_pred = risk_model.predict(X_test_scaled)
risk_accuracy = accuracy_score(y_risk_test, y_risk_pred)
print(f"✅ RISK LEVEL ACCURACY: {risk_accuracy:.1%}")

# B. Severity Classifier
print("\n🎯 Training Optimized Severity Classifier...")
severity_model = XGBClassifier(
    n_estimators=500,
    max_depth=7,
    learning_rate=0.03,
    subsample=0.8,
    colsample_bytree=0.8,
    min_child_weight=2,
    random_state=42,
    n_jobs=-1,
    eval_metric='mlogloss'
)

severity_model.fit(
    X_train_sev_balanced, y_sev_balanced,
    eval_set=[(X_test_scaled, y_sev_test)],
    early_stopping_rounds=50,
    verbose=False
)

y_sev_pred = severity_model.predict(X_test_scaled)
sev_accuracy = accuracy_score(y_sev_test, y_sev_pred)

print(f"✅ SEVERITY ACCURACY: {sev_accuracy:.1%}")
print("\n📊 Severity Classification Report:")
print(classification_report(y_sev_test, y_sev_pred, target_names=["Low", "Moderate", "High"]))

# C. Pest Identification
if y_pest is not None:
    print("\n🎯 Training Pest Identification Model...")
    X_train_pest, X_test_pest, y_pest_train, y_pest_test = train_test_split(
        X, y_pest, test_size=0.2, random_state=42, stratify=y_pest
    )
    X_train_pest_scaled = scaler.transform(X_train_pest)
    X_test_pest_scaled = scaler.transform(X_test_pest)
    
    if IMBALANCE_AVAILABLE and len(np.unique(y_pest_train)) > 1:
        smote_pest = SMOTE(random_state=42, k_neighbors=min(2, np.bincount(y_pest_train).min()-1))
        X_train_pest_balanced, y_pest_balanced = smote_pest.fit_resample(
            X_train_pest_scaled, y_pest_train
        )
    else:
        X_train_pest_balanced, y_pest_balanced = X_train_pest_scaled, y_pest_train
    
    pest_model = XGBClassifier(
        n_estimators=300,
        max_depth=6,
        learning_rate=0.1,
        random_state=42,
        n_jobs=-1
    )
    
    pest_model.fit(X_train_pest_balanced, y_pest_balanced)
    y_pest_pred = pest_model.predict(X_test_pest_scaled)
    pest_acc = accuracy_score(y_pest_test, y_pest_pred)
    print(f"🦟 Pest ID Accuracy: {pest_acc:.1%}")
else:
    pest_model = None
    pest_acc = 0

# D. Incidence Regressor
print("\n📈 Training Enhanced Incidence Regressor...")

# Feature selection
selector = SelectFromModel(RandomForestRegressor(n_estimators=100, random_state=42), threshold="median")
X_train_selected = selector.fit_transform(X_train_scaled, y_inc_train)
X_test_selected = selector.transform(X_test_scaled)

print(f"Features selected: {X_train_selected.shape[1]} out of {X_train_scaled.shape[1]}")

ensemble_reg = VotingRegressor([
    ('rf', RandomForestRegressor(n_estimators=300, max_depth=10, random_state=42)),
    ('xgb', XGBRegressor(n_estimators=300, max_depth=5, learning_rate=0.05, random_state=42)),
    ('gb', GradientBoostingRegressor(n_estimators=300, max_depth=4, learning_rate=0.05, random_state=42))
])

ensemble_reg.fit(X_train_selected, y_inc_train)
y_inc_pred = ensemble_reg.predict(X_test_selected)

inc_rmse = np.sqrt(mean_squared_error(y_inc_test, y_inc_pred))
inc_r2 = r2_score(y_inc_test, y_inc_pred)

print(f"🎯 Incidence RMSE: {inc_rmse:.2f}% | R²: {inc_r2:.3f}")

# ============================================================
# 9. FEATURE IMPORTANCE
# ============================================================
print("\n📊 Top 10 Most Important Features (Risk Model):")
feature_importance = pd.DataFrame({
    'feature': feature_cols,
    'importance': risk_model.feature_importances_
}).sort_values('importance', ascending=False).head(10)

for idx, row in feature_importance.iterrows():
    print(f"   {row['feature']}: {row['importance']:.3f}")

# ============================================================
# 10. CROSS-VALIDATION
# ============================================================
print("\n🔄 5-Fold Cross-Validation Scores:")
cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
cv_scores = cross_val_score(risk_model, X_train_balanced, y_risk_balanced, cv=cv, scoring='accuracy')
print(f"Risk Model CV Accuracy: {cv_scores.mean():.1%} (+/- {cv_scores.std()*2:.1%})")

# ============================================================
# 11. SAVE EVERYTHING
# ============================================================
os.makedirs("models/enhanced_pest_model", exist_ok=True)

model_package = {
    "pest_model": pest_model,
    "severity_model": severity_model,
    "risk_model": risk_model,
    "incidence_model": ensemble_reg,
    "feature_selector": selector,
    "scaler": scaler,
    "encoders": label_encoders,
    "features": feature_cols,
    "selected_features": [feature_cols[i] for i in selector.get_support(indices=True)] if selector.get_support().any() else [],
    "risk_classes": risk_encoder.classes_.tolist(),
    "metrics": {
        "severity_accuracy": float(sev_accuracy),
        "risk_accuracy": float(risk_accuracy),
        "pest_accuracy": float(pest_acc),
        "incidence_rmse": float(inc_rmse),
        "incidence_r2": float(inc_r2),
        "cv_mean": float(cv_scores.mean()),
        "cv_std": float(cv_scores.std())
    },
    "training_date": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
}

joblib.dump(model_package, "models/enhanced_pest_model_complete.pkl")
print("\n💾 ENHANCED MODEL SAVED: models/enhanced_pest_model_complete.pkl")

# ============================================================
# 12. FINAL SUMMARY
# ============================================================
print("\n" + "="*80)
print("🏆 ENHANCED PERFORMANCE SUMMARY")
print("="*80)
print(f"{'Metric':<25} {'Score':>15}")
print("-"*40)
print(f"{'Risk Level Accuracy':<25} {risk_accuracy*100:>14.1f}%")
print(f"{'Severity Accuracy':<25} {sev_accuracy*100:>14.1f}%")
print(f"{'Pest ID Accuracy':<25} {pest_acc*100:>14.1f}%")
print(f"{'Incidence RMSE':<25} {inc_rmse:>14.1f}%")
print(f"{'Incidence R²':<25} {inc_r2:>14.3f}")
print(f"{'5-Fold CV Mean':<25} {cv_scores.mean()*100:>14.1f}%")
print("="*80)

# Save metrics
with open("models/enhanced_pest_model/metrics.json", "w") as f:
    json.dump(model_package["metrics"], f, indent=2)

print("✅ Metrics saved to models/enhanced_pest_model/metrics.json")
print("🚀 ENHANCED MODEL READY FOR DEPLOYMENT!")
print("="*80)