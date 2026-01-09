import pandas as pd
import joblib
import os

from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score

DATA_PATH = "data/paddy_pest_weather_soil_SriLanka_2015_2024_updated.csv"
MODEL_DIR = "model"
os.makedirs(MODEL_DIR, exist_ok=True)

df = pd.read_csv(DATA_PATH)

# ---------- FIX PADDY AGE ----------
AGE_MAP = {
    "0-30 days": 15,
    "30-45 days": 38,
    "45-60 days": 53,
    "60-90 days": 75,
    "90+ days": 105
}
df["Paddy_Age_Days"] = df["Paddy_Age_Days"].map(AGE_MAP)
df = df.dropna(subset=["Paddy_Age_Days"])

# ---------- CLEAN PEST ----------
df["Pest"] = df["Pest"].str.strip().str.lower()

PEST_MAP = {
    "brown plant hopper": 1,
    "bph": 1,
    "yellow stem borer": 2,
    "stem borer": 2,
    "leaf folder": 3,
    "gall midge": 4
}

df["pest_label"] = df["Pest"].map(PEST_MAP)
df = df.dropna(subset=["pest_label"])
df["pest_label"] = df["pest_label"].astype(int)

print("✅ Pest samples:", len(df))

# ---------- ENCODERS ----------
le_district = LabelEncoder()
le_season = LabelEncoder()

df["district_code"] = le_district.fit_transform(df["District"])
df["season_code"] = le_season.fit_transform(df["Season"])

# ---------- FEATURES ----------
features = [
    "Avg_Temp_C",
    "Rainfall_mm",
    "Humidity_%",
    "Soil_Moisture_%",
    "district_code",
    "season_code",
    "Paddy_Age_Days"
]

X = df[features]
y = df["pest_label"]


X_train, X_test, y_train, y_test = train_test_split(
    X, y,
    test_size=0.2,
    random_state=42,
    stratify=y
)


model = RandomForestClassifier(
    n_estimators=500,
    max_depth=20,
    min_samples_leaf=2,
    class_weight="balanced",
    random_state=42,
    n_jobs=-1
)

model.fit(X_train, y_train)

# ---------- EVALUATION ----------
acc = accuracy_score(y_test, model.predict(X_test))
print(f"✅ Pest Type Accuracy: {acc*100:.2f}%")

# ---------- SAVE ----------
joblib.dump(model, f"{MODEL_DIR}/pest_type_model.pkl")
joblib.dump(le_district, f"{MODEL_DIR}/district_encoder.pkl")
joblib.dump(le_season, f"{MODEL_DIR}/season_encoder.pkl")

print("✅ Pest type model saved successfully")
