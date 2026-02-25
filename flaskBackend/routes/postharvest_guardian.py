

from flask import Blueprint, request, jsonify, current_app
import os
import json
import pickle
import numpy as np
import pandas as pd
import anthropic
from datetime import datetime
from functools import lru_cache

postharvest_bp = Blueprint('postharvest', __name__, url_prefix='/api/guardian')

# ─── Model file paths ────────────────────────────────────────────────────────
MODEL_DIR     = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'models', 'postharvest')
STORAGE_MODEL = os.path.join(MODEL_DIR, 'storage_model.pkl')
ENCODERS_FILE = os.path.join(MODEL_DIR, 'label_encoders.pkl')
METADATA_FILE = os.path.join(MODEL_DIR, 'model_metadata.json')

# ─── Lazy model loading (only once, cached after first request) ───────────────
_models = {}

def load_models():
    """Load models once and cache them in _models dict."""
    global _models
    if _models:
        return _models

    errors = []

    try:
        with open(STORAGE_MODEL, 'rb') as f:
            _models['storage'] = pickle.load(f)
        print("[PostHarvest] ✅ storage_model.pkl loaded")
    except FileNotFoundError:
        errors.append("storage_model.pkl not found")
        _models['storage'] = None

    try:
        with open(ENCODERS_FILE, 'rb') as f:
            _models['encoders'] = pickle.load(f)
        print("[PostHarvest] ✅ label_encoders.pkl loaded")
    except FileNotFoundError:
        errors.append("label_encoders.pkl not found")
        _models['encoders'] = None

    try:
        with open(METADATA_FILE, 'r') as f:
            _models['metadata'] = json.load(f)
        print("[PostHarvest] ✅ model_metadata.json loaded")
    except FileNotFoundError:
        errors.append("model_metadata.json not found")
        # Fallback metadata so API still works without trained models
        _models['metadata'] = _get_fallback_metadata()

    if errors:
        print(f"[PostHarvest] ⚠️  Some models missing: {errors}")
        print(f"[PostHarvest]    Falling back to rule-based predictions")

    _models['loaded'] = True
    return _models


def _get_fallback_metadata():
    """Rule-based fallback when model files not yet available."""
    return {
        "label_encoders": {
            "varieties": ["At 307","At 362","Bg 300","Bg 352","Bg 358","Bg 360","Bg 403",
                          "Bg 94-1","Bw 367","Kalu Heenati","Kuruluthuda","Ld 368",
                          "Pachchaperumal","Pokkali","Rath Suwandel","Suwandel"],
            "methods":   ["Cold storage","Gene bank","Gunny bag","Hermetic","Polythene bag"],
            "types":     ["Improved","Traditional"],
        },
        "price_forecasts": {
            "Bg 352":        {"current_lkr": 256.73, "peak_lkr": 271.20, "days_to_peak": 84,  "gain_pct": 5.6, "gain_lkr_per_kg": 14.47},
            "Bg 300":        {"current_lkr": 249.58, "peak_lkr": 261.67, "days_to_peak": 77,  "gain_pct": 4.8, "gain_lkr_per_kg": 12.09},
            "Bg 403":        {"current_lkr": 255.73, "peak_lkr": 268.47, "days_to_peak": 91,  "gain_pct": 5.0, "gain_lkr_per_kg": 12.74},
            "Bw 367":        {"current_lkr": 303.29, "peak_lkr": 320.37, "days_to_peak": 84,  "gain_pct": 5.6, "gain_lkr_per_kg": 17.08},
            "Suwandel":      {"current_lkr": 903.91, "peak_lkr": 958.15, "days_to_peak": 98,  "gain_pct": 6.0, "gain_lkr_per_kg": 54.24},
            "Rath Suwandel": {"current_lkr": 704.31, "peak_lkr": 758.42, "days_to_peak": 91,  "gain_pct": 7.7, "gain_lkr_per_kg": 54.11},
            "Kalu Heenati":  {"current_lkr": 899.80, "peak_lkr": 960.86, "days_to_peak": 105, "gain_pct": 6.8, "gain_lkr_per_kg": 61.06},
            "Pokkali":       {"current_lkr": 715.74, "peak_lkr": 766.31, "days_to_peak": 77,  "gain_pct": 7.1, "gain_lkr_per_kg": 50.57},
            "Kuruluthuda":   {"current_lkr": 645.00, "peak_lkr": 685.00, "days_to_peak": 84,  "gain_pct": 6.2, "gain_lkr_per_kg": 40.0},
            "Pachchaperumal":{"current_lkr": 580.00, "peak_lkr": 612.00, "days_to_peak": 91,  "gain_pct": 5.5, "gain_lkr_per_kg": 32.0},
            "Ld 368":        {"current_lkr": 248.00, "peak_lkr": 260.00, "days_to_peak": 84,  "gain_pct": 4.8, "gain_lkr_per_kg": 12.0},
        },
        "risk_thresholds": {
            "green_buffer_days": 30,
            "moisture_danger":   14.0,
            "temp_danger":       30.0,
        }
    }


# ─── Prediction Helpers ───────────────────────────────────────────────────────

FEATURE_COLS = [
    'Variety_Enc', 'Type_Enc', 'Method_Enc',
    'MC (%)', 'Temp (C)', 'High_Moisture', 'High_Temp', 'MC_Temp_Interaction'
]

def _predict_storage_days(variety_name, variety_type, storage_method,
                           moisture_pct, temp_c) -> dict:
    """Predict storage life using loaded XGBoost model or rule-based fallback."""
    m = load_models()

    if m['storage'] and m['encoders']:
        enc = m['encoders']
        v_classes = enc['variety'].classes_
        m_classes  = enc['method'].classes_

        v = int(enc['variety'].transform([variety_name])[0]) if variety_name in v_classes else 0
        t = int(enc['type'].transform([variety_type])[0])
        me = int(enc['method'].transform([storage_method])[0]) if storage_method in m_classes else 2

        mc_temp = moisture_pct * temp_c
        h_moist = int(moisture_pct > 14.0)
        h_temp  = int(temp_c > 30.0)

        X = pd.DataFrame([[v, t, me, moisture_pct, temp_c, h_moist, h_temp, mc_temp]],
                          columns=FEATURE_COLS)
        days = int(max(7, m['storage'].predict(X)[0]))
    else:
        # Rule-based fallback (biologically grounded)
        method_base = {"Gunny bag": 180, "Polythene bag": 240,
                       "Cold storage": 900, "Hermetic": 300, "Gene bank": 1800}
        type_bonus  = 30 if variety_type == "Traditional" else 0
        base = method_base.get(storage_method, 180) + type_bonus

        # Exponential moisture penalty (key research insight)
        if moisture_pct > 14:
            moisture_penalty = (2.5 ** (moisture_pct - 14)) * 60
        else:
            moisture_penalty = -(14 - moisture_pct) * 20

        temp_penalty = max(0, (temp_c - 25) * 8)
        interaction  = (moisture_pct - 13) * (temp_c - 28) * 5 if moisture_pct > 13 and temp_c > 28 else 0

        days = max(7, int(base - moisture_penalty - temp_penalty - interaction))
        cap  = 2700 if storage_method == "Cold storage" else 600
        days = min(days, cap)

    # Risk assessment
    if moisture_pct > 16:
        moisture_risk = "CRITICAL"
        risk_detail   = f"Moisture {moisture_pct}% is dangerously high (>16%). Fungi will develop within days. Dry immediately."
    elif moisture_pct > 14:
        moisture_risk = "HIGH"
        risk_detail   = f"Moisture {moisture_pct}% exceeds safe limit (>14%). Storage life significantly reduced."
    elif moisture_pct > 13:
        moisture_risk = "BORDERLINE"
        risk_detail   = f"Moisture {moisture_pct}% is borderline. Target 12-13% for optimal storage."
    else:
        moisture_risk = "SAFE"
        risk_detail   = f"Moisture {moisture_pct}% is within safe range (≤13%)."

    return {
        "storage_days":    days,
        "storage_months":  round(days / 30, 1),
        "moisture_risk":   moisture_risk,
        "moisture_detail": risk_detail,
        "safe_to_store":   days > 30,
        "model_used":      "xgboost" if (m['storage'] and m['encoders']) else "rule_based",
    }


def _get_price_forecast(variety_name: str) -> dict:
    """Get price forecast for a variety from metadata."""
    m  = load_models()
    pf = m['metadata'].get('price_forecasts', {})

    if variety_name in pf:
        return pf[variety_name]

    # Try fuzzy match
    for key in pf:
        if key.lower() in variety_name.lower() or variety_name.lower() in key.lower():
            return pf[key]

    # Default to Bg 352 if variety not found
    return pf.get('Bg 352', {
        "current_lkr": 256.0, "peak_lkr": 270.0,
        "days_to_peak": 84, "gain_pct": 5.5, "gain_lkr_per_kg": 14.0
    })


def _calculate_risk_reward(storage_days, days_to_peak, current_price,
                            peak_price, quantity_kg) -> dict:
    """The core Risk-Reward Bridge formula (research contribution)."""
    buffer = storage_days - days_to_peak
    profit = round((peak_price - current_price) * quantity_kg, 2)
    risk   = round(current_price * quantity_kg, 2)

    if buffer > 30:
        signal, urgency = "GREEN",  "SAFE"
        action = f"Store & wait. {buffer}-day safety buffer is comfortable."
    elif buffer > 0:
        signal, urgency = "YELLOW", "CAUTION"
        action = f"Thin {buffer}-day buffer. Reduce moisture to 13% and monitor daily."
    else:
        signal, urgency = "RED",    "CRITICAL"
        action = f"Rice will rot {abs(buffer)} days BEFORE price peaks. Intervene NOW."

    # What happens if farmer dries to 13% + uses hermetic bags?
    # Re-predict with improved conditions
    improved_days = _predict_storage_days(
        "Bg 352", "Improved", "Hermetic", 13.0, 25.0
    )['storage_days']
    improved_buffer = improved_days - days_to_peak
    intervention_viable = improved_buffer > 0

    return {
        "signal":                signal,
        "urgency":               urgency,
        "buffer_days":           buffer,
        "action":                action,
        "potential_profit_lkr":  profit,
        "at_risk_value_lkr":     risk,
        "sell_now_value_lkr":    round(current_price * quantity_kg, 2),
        "wait_value_lkr":        round(peak_price * quantity_kg, 2),
        "intervention_viable":   intervention_viable,
        "days_after_drying":     improved_days,
    }


# ─── ENDPOINTS ────────────────────────────────────────────────────────────────

@postharvest_bp.route('/predict', methods=['POST'])
def predict():
    """
    POST /api/guardian/predict
    Body (JSON):
    {
        "variety":        "Bg 352",
        "variety_type":   "Improved",
        "storage_method": "Gunny bag",
        "moisture_pct":   17.0,
        "temp_c":         28.0,
        "quantity_kg":    2000
    }
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "JSON body required"}), 400

        # Required fields
        variety        = data.get('variety', 'Bg 352')
        variety_type   = data.get('variety_type', 'Improved')
        storage_method = data.get('storage_method', 'Gunny bag')
        moisture_pct   = float(data.get('moisture_pct', 13.0))
        temp_c         = float(data.get('temp_c', 28.0))
        quantity_kg    = float(data.get('quantity_kg', 1000.0))

        # ── Run both models ──────────────────────────────────────────────────
        storage_result = _predict_storage_days(
            variety, variety_type, storage_method, moisture_pct, temp_c
        )
        price_result   = _get_price_forecast(variety)
        risk_result    = _calculate_risk_reward(
            storage_result['storage_days'],
            price_result['days_to_peak'],
            price_result['current_lkr'],
            price_result['peak_lkr'],
            quantity_kg,
        )

        response = {
            "success":   True,
            "variety":   variety,
            "quantity_kg": quantity_kg,
            "timestamp": datetime.utcnow().isoformat(),
            "storage":   storage_result,
            "price":     price_result,
            "risk_reward": risk_result,
            "summary": {
                "signal":          risk_result['signal'],
                "storage_days":    storage_result['storage_days'],
                "days_to_peak":    price_result['days_to_peak'],
                "buffer_days":     risk_result['buffer_days'],
                "current_price":   price_result['current_lkr'],
                "peak_price":      price_result['peak_lkr'],
                "potential_profit":risk_result['potential_profit_lkr'],
            }
        }
        return jsonify(response), 200

    except ValueError as e:
        return jsonify({"error": f"Invalid input: {str(e)}"}), 400
    except Exception as e:
        current_app.logger.error(f"[PostHarvest /predict] {e}")
        return jsonify({"error": "Prediction failed", "detail": str(e)}), 500


@postharvest_bp.route('/advice', methods=['POST'])
def get_ai_advice():
    """
    POST /api/guardian/advice
    Calls Anthropic Claude to generate expert advisory text.
    Expects same body as /predict PLUS the prediction results.
    
    Set ANTHROPIC_API_KEY in your .env file.
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "JSON body required"}), 400

        # Extract prediction data (client sends pre-calculated results for efficiency)
        variety        = data.get('variety', 'Bg 352')
        moisture_pct   = float(data.get('moisture_pct', 13.0))
        temp_c         = float(data.get('temp_c', 28.0))
        storage_method = data.get('storage_method', 'Gunny bag')
        quantity_kg    = float(data.get('quantity_kg', 1000.0))
        storage_days   = int(data.get('storage_days', 90))
        days_to_peak   = int(data.get('days_to_peak', 84))
        current_price  = float(data.get('current_price', 256.73))
        peak_price     = float(data.get('peak_price', 278.50))
        signal         = data.get('signal', 'YELLOW')
        buffer_days    = int(data.get('buffer_days', 0))
        potential_profit = float(data.get('potential_profit', 0))
        intervention_viable = data.get('intervention_viable', True)
        days_after_drying   = int(data.get('days_after_drying', 180))

        # ── Build LLM payload ────────────────────────────────────────────────
        llm_payload = {
            "Rice_Type":                variety,
            "Current_Moisture":         f"{moisture_pct}%",
            "Storage_Method":           storage_method,
            "Warehouse_Temp_C":         temp_c,
            "Quantity_kg":              quantity_kg,
            "XGBoost_Storage_Life":     f"{storage_days} days",
            "LSTM_Days_To_Price_Peak":  f"{days_to_peak} days",
            "Current_Market_Price":     f"{current_price} LKR/kg",
            "Predicted_Peak_Price":     f"{peak_price} LKR/kg",
            "Profit_If_Waiting":        f"{potential_profit:,.0f} LKR",
            "Risk_Signal":              signal,
            "Buffer_Days":              buffer_days,
            "Storage_After_Drying":     f"{days_after_drying} days",
            "Intervention_Viable":      intervention_viable,
        }

        system_prompt = """You are an Expert Post-Harvest Agriculture Advisor for the Sri Lanka Department of Agriculture (GoviMithuru App).
Your goal: maximize farmer profit while ensuring ZERO food waste.

RESPONSE FORMAT — Three sections (no markdown headers, use plain text):

1. STATUS REPORT: Start with exactly one of: "🟢 GREEN SIGNAL", "🟡 YELLOW CAUTION", or "🔴 RED ALERT"
   followed by one clear sentence.

2. THE CONFLICT: Explain simply in 2-3 sentences: "Your vee (rice) is safe for X days, but the best price 
   is Y days away." Use the word "vee" (Sinhala for rice paddy) naturally once.

3. STRATEGIC ADVICE — Two options:
   Option A (Sell Now): Calculate exact LKR earned. When is this right?
   Option B (Intervene & Wait): Step-by-step actions to extend storage life:
     - Dry paddy to 13% moisture (reduces fungal risk)
     - Use hermetic/airtight bags (cuts oxygen → slows spoilage)
     - Keep warehouse below 25°C
     - Apply food-grade diatomaceous earth if pests present
   Then calculate profit if Option B succeeds.

TONE: Professional but empathetic. Scientifically accurate. Think like a trusted village agricultural officer.
Keep the entire response under 280 words."""

        # ── Call Anthropic API ───────────────────────────────────────────────
        api_key = os.getenv('ANTHROPIC_API_KEY')
        if not api_key:
            return jsonify({
                "success": False,
                "error":   "ANTHROPIC_API_KEY not configured",
                "advice":  _rule_based_advice(signal, storage_days, days_to_peak,
                                               current_price, peak_price, quantity_kg,
                                               potential_profit, buffer_days, variety)
            }), 200  # Return rule-based fallback instead of error

        client = anthropic.Anthropic(api_key=api_key)
        message = client.messages.create(
            model="claude-opus-4-6",
            max_tokens=600,
            system=system_prompt,
            messages=[{
                "role":    "user",
                "content": f"Please analyze this farmer's situation:\n\n{json.dumps(llm_payload, indent=2)}"
            }]
        )

        advice_text = message.content[0].text if message.content else ""

        return jsonify({
            "success": True,
            "advice":  advice_text,
            "source":  "claude_api",
        }), 200

    except anthropic.APIConnectionError:
        return jsonify({
            "success": False,
            "error":   "Cannot connect to AI service",
            "advice":  _rule_based_advice(signal, storage_days, days_to_peak,
                                           current_price, peak_price, quantity_kg,
                                           potential_profit, buffer_days, variety)
        }), 200
    except Exception as e:
        current_app.logger.error(f"[PostHarvest /advice] {e}")
        return jsonify({"error": "Advisory failed", "detail": str(e)}), 500


def _rule_based_advice(signal, storage_days, days_to_peak, current_price,
                        peak_price, quantity_kg, potential_profit, buffer_days, variety) -> str:
    """Fallback advisory when Claude API is unavailable."""
    sell_now_value = current_price * quantity_kg
    wait_value     = peak_price * quantity_kg

    if signal == "GREEN":
        return (
            f"🟢 GREEN SIGNAL — Your {variety} is in a safe position.\n\n"
            f"THE CONFLICT: Your vee (rice) is safe for {storage_days} days, and the best market "
            f"price arrives in just {days_to_peak} days. You have a comfortable buffer of {buffer_days} days.\n\n"
            f"STRATEGIC ADVICE:\n"
            f"Option A (Sell Now): Earn {sell_now_value:,.0f} LKR at {current_price} LKR/kg. Safe, but not optimal.\n"
            f"Option B (Wait): Store using current conditions. Earn {wait_value:,.0f} LKR at {peak_price} LKR/kg. "
            f"Potential gain of {potential_profit:,.0f} LKR. Monitor moisture weekly."
        )
    elif signal == "YELLOW":
        return (
            f"🟡 YELLOW CAUTION — Proceed carefully with your {variety} storage.\n\n"
            f"THE CONFLICT: Your vee is safe for {storage_days} days, but the best price is "
            f"{days_to_peak} days away. You have only a {buffer_days}-day buffer — any deterioration "
            f"in conditions could shift this to a RED alert.\n\n"
            f"STRATEGIC ADVICE:\n"
            f"Option A (Sell Now): Earn {sell_now_value:,.0f} LKR immediately. Eliminates risk.\n"
            f"Option B (Intervene): 1) Reduce moisture to 13% by sun-drying. 2) Transfer to hermetic bags. "
            f"3) Ensure warehouse stays below 25°C. If successful, earn {wait_value:,.0f} LKR."
        )
    else:
        return (
            f"🔴 RED ALERT — Immediate action required for your {variety}.\n\n"
            f"THE CONFLICT: Your vee is safe for only {storage_days} days, but the best price is "
            f"{days_to_peak} days away. Your rice will develop fungus {abs(buffer_days)} days "
            f"BEFORE the price peaks. Waiting is not an option in current conditions.\n\n"
            f"STRATEGIC ADVICE:\n"
            f"Option A (Sell Now — RECOMMENDED): Earn {sell_now_value:,.0f} LKR immediately. "
            f"This prevents total loss.\n"
            f"Option B (Emergency Intervention): 1) IMMEDIATELY dry paddy to 13% moisture. "
            f"2) Use hermetic/airtight bags. 3) Move to a cooler location below 25°C. "
            f"If you complete these steps within 48 hours, you may extend storage life enough "
            f"to wait for the {peak_price} LKR/kg peak."
        )


@postharvest_bp.route('/varieties', methods=['GET'])
def get_varieties():
    """GET /api/guardian/varieties — Returns all supported varieties."""
    m = load_models()
    varieties = m['metadata'].get('label_encoders', {}).get('varieties', [])
    return jsonify({"success": True, "varieties": varieties, "count": len(varieties)}), 200


@postharvest_bp.route('/prices', methods=['GET'])
def get_prices():
    """GET /api/guardian/prices — Returns current price forecasts for all varieties."""
    m  = load_models()
    pf = m['metadata'].get('price_forecasts', {})

    # Add rank by potential gain
    ranked = sorted(pf.items(), key=lambda x: x[1].get('gain_pct', 0), reverse=True)
    result = [{"variety": k, **v} for k, v in ranked]

    return jsonify({
        "success":   True,
        "count":     len(result),
        "forecasts": result,
        "updated":   datetime.utcnow().isoformat(),
    }), 200


@postharvest_bp.route('/health', methods=['GET'])
def health_check():
    """GET /api/guardian/health — Service health check."""
    m = load_models()
    return jsonify({
        "status":       "healthy",
        "models_loaded": {
            "xgboost_storage":  m.get('storage') is not None,
            "label_encoders":   m.get('encoders') is not None,
            "metadata":         m.get('metadata') is not None,
        },
        "timestamp": datetime.utcnow().isoformat(),
    }), 200