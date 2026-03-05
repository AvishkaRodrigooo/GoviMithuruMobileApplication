"""
routes/postharvest_guardian.py
──────────────────────────────────────────────────────────────────────────────
Post-Harvest Guardian API Blueprint — GoviMithuru App
Author: Post-Harvest Team Member

INTEGRATION (add to app.py — 2 lines only):
    from routes.postharvest_guardian import postharvest_bp
    app.register_blueprint(postharvest_bp)

PLACE MODEL FILES IN:
    /models/postharvest/storage_model.pkl
    /models/postharvest/label_encoders.pkl
    /models/postharvest/price_scaler.pkl
    /models/postharvest/model_metadata.json

ENDPOINTS (all under /api/guardian/):
    POST /api/guardian/predict       → Storage + Price prediction + Risk signal
    POST /api/guardian/advice        → AI advisory from Claude LLM
    GET  /api/guardian/varieties     → List of all supported varieties
    GET  /api/guardian/prices        → Current price forecasts for all varieties
    GET  /api/guardian/health        → Service health check

DOES NOT MODIFY: predict.py, weed_predict.py, or any other existing blueprints.
──────────────────────────────────────────────────────────────────────────────
"""

from flask import Blueprint, request, jsonify, current_app
import os
import json
import pickle
import numpy as np
import pandas as pd
import anthropic
import requests
from datetime import datetime
from functools import lru_cache

postharvest_bp = Blueprint('postharvest', __name__, url_prefix='/api/guardian')

def _call_ollama_local(system_prompt, user_content, format_json=True):
    """
    Calls locally running Ollama. 
    Using 127.0.0.1 to avoid Windows localhost resolution lag.
    """
    url = "http://127.0.0.1:11434/api/chat"
    payload = {
        "model": "govimithuru-advisor",
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_content}
        ],
        "stream": False,
        "options": {"temperature": 0.3, "num_predict": 1024}
    }
    
    if format_json:
        payload["format"] = "json"

    try:
        # PING check for Ollama service availability
        requests.get("http://127.0.0.1:11434/", timeout=2)

        print(f"[Ollama] 🏠 Calling project model (govimithuru-advisor)...")
        # 180s timeout - local models can be very slow on CPUs
        response = requests.post(url, json=payload, timeout=180)
        response.raise_for_status()
        raw = response.json()['message']['content']
        print(f"[Ollama] ✅ Raw response (first 300 chars): {raw[:300]}")
        return raw
    except requests.exceptions.ConnectionError:
        print("[Ollama] ⚠️  Ollama.exe is NOT running. Please launch it from System Tray or CMD.")
        return None
    except Exception as e:
        print(f"[Ollama] ❌ Error: {str(e)[:100]}")
        return None

def _is_valid_key(key):
    """Checks if a key exists and isn't just a placeholder."""
    if not key: return False
    dummy_markers = ["your_", "placeholder", "key_here", "api_key", "AIzaSy_dummy", "gsk_dummy"]
    return not any(marker in key.lower() for marker in dummy_markers)

def _call_groq_free(system_prompt, user_content):
    """
    Calls Groq API (Llama 3.3). 
    """
    api_key = os.getenv('GROQ_API_KEY')
    if not _is_valid_key(api_key): return None
    
    url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    # Using Llama 3.3 70B - standard and highly reliable
    payload = {
        "model": "llama-3.3-70b-versatile",
        "messages": [
            {"role": "system", "content": f"{system_prompt}\n\nYou must respond in valid JSON format."},
            {"role": "user", "content": user_content}
        ],
        "temperature": 0.1,
        "response_format": {"type": "json_object"}
    }
    
    try:
        print(f"[Groq] 🚀 Calling Llama 3.3...")
        response = requests.post(url, json=payload, headers=headers, timeout=25)
        if response.status_code == 429: return "QUOTA_EXCEEDED"
        if response.status_code != 200:
            print(f"[Groq] ❌ HTTP Error {response.status_code}: {response.text[:150]}")
            return None
        return response.json()['choices'][0]['message']['content']
    except Exception as e:
        print(f"[Groq] ❌ Exception: {str(e)[:100]}")
        return None

def _call_gemini_free(system_prompt, user_content):
    """
    Calls Google Gemini 1.5 Flash API.
    """
    api_key = os.getenv('GOOGLE_API_KEY')
    if not _is_valid_key(api_key): return None

    # Using v1 endpoint for better stability
    url = f"https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key={api_key}"

    payload = {
        "contents": [{
            "parts": [{"text": f"{system_prompt}\n\nDATA:\n{user_content}\n\nOutput only the JSON object."}]
        }],
        "generationConfig": {
            "temperature": 0.1,
            "maxOutputTokens": 2048,
            "responseMimeType": "application/json"
        }
    }

    try:
        print(f"[Gemini] 📤 Calling Gemini v1...")
        response = requests.post(url, json=payload, timeout=25)
        
        if response.status_code == 429:
            print("[Gemini] ⚠️ Quota Exhausted.")
            return "QUOTA_EXCEEDED"
        
        if response.status_code != 200:
            print(f"[Gemini] ❌ HTTP Error {response.status_code}: {response.text[:150]}")
            return None
            
        res_json = response.json()
        if 'candidates' not in res_json:
            print(f"[Gemini] ❌ Invalid response structure: {res_json}")
            return None
            
        text = res_json['candidates'][0]['content']['parts'][0]['text']
        return text.strip()
    except Exception as e:
        print(f"[Gemini] ❌ Exception: {str(e)[:100]}")
        return None


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
    """
    The 'Post-Harvest Risk Analyst' Decision Matrix (Strict Research Logic).
    Integrates XGBoost Spoilage (storage_days) vs LSTM Price Timing (days_to_peak).
    """
    buffer = storage_days - days_to_peak
    current_total_value = current_price * quantity_kg
    peak_total_value = peak_price * quantity_kg
    profit_gap = peak_total_value - current_total_value

    # 1. The "Red Zone" (Impossible / Spoilage before Peak)
    if storage_days < days_to_peak:
        signal = "RED"
        urgency = "SELL NOW"
        action = f"SELL NOW. Your rice will spoil in {storage_days} days, but the price won't rise for {days_to_peak} days. Do not wait."
    
    # 2. The "Green Zone" (Profitable / Safe Buffer)
    elif storage_days > (days_to_peak + 15):
        signal = "GREEN"
        urgency = "STORE"
        action = f"STORE. You have a safe buffer. You can wait {days_to_peak} days to gain an extra Rs. {profit_gap:,.0f}."
    
    # 3. The "Yellow Zone" (The Gap / High Risk)
    else:
        signal = "YELLOW"
        urgency = "RISK IS HIGH"
        action = f"Risk is High. You can only reach the peak price if you extend storage life. You MUST dry the paddy to 13% immediately to gain the extra days."

    # Simulation: What happens if farmer dries to 13%?
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
        "potential_profit_lkr":  round(profit_gap, 2),
        "at_risk_value_lkr":     round(current_total_value, 2),
        "sell_now_value_lkr":    round(current_total_value, 2),
        "wait_value_lkr":        round(peak_total_value, 2),
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
        humidity_pct   = float(data.get('humidity_pct', 65.0))
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
        humidity_pct   = float(data.get('humidity_pct', 65.0))
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
        user_notes          = data.get('context') or data.get('notes') or 'None provided.'
        mode                = data.get('mode', 'general') # 'general' or 'container'

        # ── Build LLM payload ────────────────────────────────────────────────
        llm_payload = {
            "Rice_Type":                variety,
            "Current_Moisture":         f"{moisture_pct}%",
            "Warehouse_Humidity":       f"{humidity_pct}%",
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
            "Farmer_Context_Notes":     user_notes,
        }

        # ── Decision Logic: Select Prompt based on Mode ──────────────────────
        if mode == 'container':
            system_prompt = """You are the Senior Logistics Officer at the Department of Agriculture. 
            Analyze the selected storage container method for the specific crop variety and quantity.

            STRICT RESPONSE SCHEMA (JSON):
            {
              "summary": "Direct verdict on the selected method",
              "cost_analysis": "Detailed LKR breakdown",
              "durability": "Expected life span and reusability",
              "protection": "Evaluation of pest and moisture protection",
              "verdict": "Exactly one: DEPLOYABLE / RISKY / NOT RECOMMENDED",
              "quick_tips": ["Action 1", "Action 2", "Action 3"]
            }"""
        else:
            system_prompt = """You are the Senior Agronomist at the Department of Agriculture, Sri Lanka. 
            Analyze the following harvest data for risk and profit.

            STRICT RESPONSE SCHEMA:
            {
              "signal": "GREEN/YELLOW/RED",
              "summary": "One sentence direct advice",
              "conflict": "Explanation of timeline risk between spoilage and peak price",
              "option_sell": {"value_lkr": "Rs. X", "rationale": "Why sell now?"},
              "option_wait": {"steps": ["Step 1", "Step 2", "Step 3", "Step 1"], "value_lkr": "Rs. X Gain"},
              "quick_tips": ["Tip 1", "Tip 2", "Tip 3"]
            }"""

        # ── Call LLM APIs (Speed Optimized Priority) ───────────────────────
        api_key_google    = os.getenv('GOOGLE_API_KEY')
        api_key_groq      = os.getenv('GROQ_API_KEY')
        
        raw_llm_response = None
        source = "rule_based"

        # 1. TRY GEMINI FIRST (Fastest Cloud Free Tier)
        if _is_valid_key(api_key_google):
            gem_res = _call_gemini_free(system_prompt, json.dumps(llm_payload))
            if gem_res and gem_res != "QUOTA_EXCEEDED":
                raw_llm_response = gem_res
                source = "gemini_api"

        # 2. TRY GROQ SECOND (Fast Cloud Fallback)
        if not raw_llm_response and _is_valid_key(api_key_groq):
            res = _call_groq_free(system_prompt, json.dumps(llm_payload))
            if res and res != "QUOTA_EXCEEDED":
                raw_llm_response = res
                source = "groq_api"

        # 3. TRY LOCAL OLLAMA THIRD (No Internet/Key Fallback)
        if not raw_llm_response:
            oll_res = _call_ollama_local(system_prompt, json.dumps(llm_payload))
            if oll_res:
                raw_llm_response = oll_res
                source = "local_ollama"

        # 3. Parse LLM JSON
        if raw_llm_response:
            try:
                clean_json = _rigorous_json_cleaner(raw_llm_response)
                advice_json = json.loads(clean_json)
                return jsonify({
                    "success": True,
                    "advice":  advice_json,
                    "source":  source,
                }), 200
            except Exception as e:
                print(f"[AI] ❌ Parse Error: {e} at {source}")

        # 4. Final Fallback (The Scientist)
        print("[AI] 🛡️ Returning Rule-Based Advisor (Fallback)")
        fallback_advice = _rule_based_advice_json(signal, storage_days, days_to_peak,
                                            current_price, peak_price, quantity_kg,
                                            potential_profit, buffer_days, variety)
        
        if mode == 'container':
            fallback_advice = {
                "summary": "Rule-based recommendation: Use Hermetic or Super Bags for moisture control.",
                "cost_analysis": "Approx. 150-500 LKR per unit.",
                "durability": "6-12 months typically.",
                "protection": "High seal integrity ensures pest safety.",
                "verdict": "DEPLOYABLE",
                "quick_tips": ["Ensure airtight seal", "Stack on pallets", "Keep in shade"]
            }

        return jsonify({
            "success": False,
            "source":  "rule_fallback",
            "advice":  fallback_advice
        }), 200

    except Exception as e:
        current_app.logger.error(f"[PostHarvest /advice] {e}")
        return jsonify({"error": "Advisory failed", "detail": str(e)}), 500


@postharvest_bp.route('/chat', methods=['POST'])
def chat_ai():
    """Expert Chat endpoint for free-form Q&A."""
    try:
        data = request.get_json()
        question = data.get('question', '')
        context = data.get('context', {})
        
        system_msg = "You are the PostHarvest Guardian, a helpful AI expert for Sri Lankan paddy farmers. Answer questions about rice storage, drying, market trends, and pest control. Keep answers concise, practical, and empathetic."
        
        if context.get('custom_system_prompt'):
            system_msg += "\n\n" + context.get('custom_system_prompt')
            
        # Enhanced instructions for logistics consultation
        if context.get('interaction_type') == 'logistics_consult':
            system_msg += """\n\nLOGISTICS PROTOCOL: 
            1. Recommend the best storage method. 
            2. List exactly 2 Pros and 2 Cons. 
            3. Provide current LKR prices (e.g., Gunny: Rs. 100, Hermetic: Rs. 250).
            4. Suggest the sub-category suitability for the farmer's specific facility."""
        
        # New SLR 603 Grading Protocol
        elif context.get('interaction_type') == 'grading_consult':
            system_msg += """\n\nQUALITY GRADING PROTOCOL (SLR 603:2013):
            You are now the Technical Quality Auditor. 
            STANDARDS:
            - Grade A: <14% Moisture, <5% Broken, <1% Discolored, <0.1% Foreign. (Rs. 95/kg)
            - Grade B: <14.5% Moisture, <10% Broken, <2% Discolored, <0.5% Foreign. (Rs. 80/kg)
            - Grade C: <15.0% Moisture, <20% Broken, <5% Discolored, <1.0% Foreign. (Rs. 60/kg)

            INSTRUCTIONS:
            1. Systematic Discovery: Always check Moisture FIRST. If >15%, advise drying immediately.
            2. Economic Analysis: Show the farmer the price difference (LKR) between their current suspected grade and a higher grade.
            3. Visual Guidance: Provide quick 'hand tests' for parameters (e.g., Squeeze test for moisture).
            4. Be supportive and translate quality into PROFIT."""

        user_msg = f"Context: {json.dumps(context)}\n\nQuestion: {question}"

        # 1. Try Gemini (Speed Priority)
        api_key_google = os.getenv('GOOGLE_API_KEY')
        if _is_valid_key(api_key_google):
            res = _call_gemini_free(system_msg, user_msg)
            if res and res != "QUOTA_EXCEEDED":
                return jsonify({"success": True, "answer": res, "source": "gemini"}), 200

        # 2. Try Anthropic (Quality Fallback)
        api_key_anthropic = os.getenv('ANTHROPIC_API_KEY')
        if _is_valid_key(api_key_anthropic):
            try:
                client = anthropic.Anthropic(api_key=api_key_anthropic)
                message = client.messages.create(
                    model="claude-3-5-sonnet-20241022",
                    max_tokens=500,
                    system=system_msg,
                    messages=[{"role": "user", "content": user_msg}]
                )
                return jsonify({"success": True, "answer": message.content[0].text, "source": "claude"}), 200
            except: pass

        # 3. Try Ollama (Local Fallback)
        # Chat should NOT be forced into JSON format for natural flow
        ollama_res = _call_ollama_local(system_msg, user_msg, format_json=False)
        if ollama_res:
            # Final safety strip in case model still outputs JSON structure
            if ollama_res.strip().startswith('{'):
                try:
                    chat_data = json.loads(ollama_res)
                    ollama_res = chat_data.get('answer') or chat_data.get('summary') or chat_data.get('price') or ollama_res
                except: pass

            return jsonify({"success": True, "answer": ollama_res, "source": "local_ollama"}), 200

        return jsonify({"success": False, "error": "No LLM provider available"}), 400
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


def _rule_based_advice_json(signal, storage_days, days_to_peak, current_price,
                         peak_price, quantity_kg, potential_profit, buffer_days, variety) -> dict:
    """Fallback JSON advice structure."""
    sell_now_val = current_price * quantity_kg
    wait_val     = peak_price * quantity_kg
    
    return {
        "signal": signal,
        "summary": "Wait for higher prices but improve storage conditions immediately." if signal != "RED" else "Immediate sale is recommended to prevent total crop loss.",
        "conflict": f"Your {variety} has a storage life of {storage_days} days, but the market peak is {days_to_peak} days away. You have a {buffer_days} day safety window.",
        "option_sell": {
            "value_lkr": f"{sell_now_val:,.0f}",
            "rationale": "Safest option. Guarantees income today with zero risk of spoilage."
        },
        "option_wait": {
            "value_lkr": f"{(wait_val - sell_now_val):,.0f} EXTRA Profit",
            "steps": [
                "Dry the paddy to exactly 13% moisture",
                "Use airtight Hermetic bags for longer life",
                "Ensure ventilation keeps warehouse cool",
                "Monitor for weevil activity weekly"
            ]
        },
        "quick_tips": ["Check MC%", "Use Hermetic bags", "Clean storage area"]
    }


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


@postharvest_bp.route('/quiz', methods=['GET'])
def get_quiz():
    """Generates 3 quick questions to test farmer knowledge level."""
    system_prompt = "You are a teacher for Sri Lankan paddy farmers. Generate 3 multiple-choice questions about paddy storage and moisture. Return ONLY JSON."
    user_prompt = """Generate 3 questions. 
    FORMAT: array of objects {question, options: [A, B, C, D], answer: "A/B/C/D", explanation: "short tip"}.
    Questions should range from easy (moisture) to hard (hermetic storage)."""
    
    # 1. Try Gemini first (Fastest)
    api_key = os.getenv('GOOGLE_API_KEY')
    raw_res = None
    if _is_valid_key(api_key):
        raw_res = _call_gemini_free(system_prompt, user_prompt)
    
    # 2. Try Ollama (Local) as requested by user
    if not raw_res or raw_res == "QUOTA_EXCEEDED":
        raw_res = _call_ollama_local(system_prompt, user_prompt)
    
    # 3. Handle Fallback if all else fails
    if not raw_res:
        # Fallback questions if AI fails
        questions = [
            {
                "question": "What is the recommended moisture level for long-term paddy storage?",
                "options": ["10%", "13%", "16%", "20%"],
                "answer": "B",
                "explanation": "13% moisture prevents fungal growth and keeps seeds viable."
            },
            {
                "question": "Which storage method provides the best protection against weevils?",
                "options": ["Open gunny bags", "Polythene bags", "Hermetic (airtight) bags", "Wooden boxes"],
                "answer": "C",
                "explanation": "Hermetic bags suffocate insects by removing oxygen."
            },
            {
                "question": "What happens if paddy is stored at 17% moisture?",
                "options": ["It stays fresh", "It germinates to sprouts", "It rots and heats up", "It becomes more valuable"],
                "answer": "C",
                "explanation": "High moisture causes high respiration, heat, and rapid rotting."
            }
        ]
        return jsonify({"success": True, "questions": questions, "source": "static"}), 200

    try:
        clean_json = raw_res.strip()
        start = clean_json.find("[")
        end = clean_json.rfind("]") + 1
        if start != -1 and end != -1:
            questions = json.loads(clean_json[start:end])
            return jsonify({"success": True, "questions": questions, "source": "ai"}), 200
    except Exception as e:
        print(f"[Quiz AI Error] {e}")
        
    return jsonify({"error": "Failed to generate quiz"}), 500


@postharvest_bp.route('/evaluate-level', methods=['POST'])
def evaluate_level():
    """Evaluates score and returns user level."""
    data = request.get_json()
    score = data.get('score', 0) # 0 to 3
    
    if score >= 3:
        level = "ADVANCED"
        desc  = "Expert: You understand hermetic storage and biological limits."
    elif score >= 2:
        level = "INTERMEDIATE"
        desc  = "Practitioner: You know the basics but could optimize for profit."
    else:
        level = "BEGINNER"
        desc  = "Learner: Let's start with basic moisture and bag selection."
        
    return jsonify({
        "success": True,
        "level":   level,
        "description": desc,
        "redirect": "Dashboard"
    }), 200


@postharvest_bp.route('/knowledge', methods=['GET'])
def get_storage_knowledge():
    """
    GET /api/guardian/knowledge
    Returns a structured guide for storage intervention strategies.
    Maps XGBoost variables to actionable industrial vs traditional hacks.
    """
    knowledge = [
        {
            "id": "v-temp",
            "title": "Ventilation & Temperature Control",
            "icon": "fan",
            "goal": "Reduce Warehouse_Temp to inhibit fungal growth.",
            "xgb_var": "Warehouse_Temp",
            "items": [
                {
                    "name": "Cooling System",
                    "industrial": "Electric Exhaust Fan / AC",
                    "traditional": "PVC Pipe Breathers / Roof Whitewash",
                    "logic": "Passive aeration uses cross-ventilation. Inserting drilled PVC pipes in paddy piles allows heat to rise naturally."
                },
                {
                    "name": "Dehumidification",
                    "industrial": "Industrial Dehumidifier",
                    "traditional": "Salt & Charcoal Trays",
                    "logic": "Rock salt and charcoal naturally absorb airborne moisture in storage corners."
                }
            ]
        },
        {
            "id": "m-control",
            "title": "Moisture Management",
            "icon": "water-percent",
            "goal": "Maintain Moisture_Content below 14% threshold.",
            "xgb_var": "Moisture_Content",
            "items": [
                {
                    "name": "Verification",
                    "industrial": "Digital Moisture Meter (Rs. 15k+)",
                    "traditional": "The 'Salt Bottle' Test",
                    "logic": "Mixing paddy with dry salt in a bottle; sticking salt indicates >14% moisture (biological danger zone)."
                },
                {
                    "name": "Drying Method",
                    "industrial": "Mechanical Flatbed Dryer",
                    "traditional": "Black Polythene on Raised Ground",
                    "logic": "Black tarps absorb max heat. Raised platforms prevent 'ground sweat' condensation."
                }
            ]
        },
        {
            "id": "p-protect",
            "title": "Pest & Insect Protection",
            "icon": "bug-stop",
            "goal": "Reduce Pest_Presence binary risk variable.",
            "xgb_var": "Pest_Presence",
            "items": [
                {
                    "name": "Repellents",
                    "industrial": "Chemical Fumigation (Phostoxin)",
                    "traditional": "Dried Neem (Kohomba) Leaves",
                    "logic": "Azadirachtin in Neem leaves acts as a natural deterrent for weevils (ghun)."
                },
                {
                    "name": "Rodent Guard",
                    "industrial": "Glue Traps / Ultrasonic Repellers",
                    "traditional": "Tin Plate Legs (Rat Guards)",
                    "logic": "Slippery tin overhangs on pallet legs physically block rats from climbing."
                }
            ]
        },
        {
            "id": "s-method",
            "title": "Storage Structure",
            "icon": "home-modern",
            "goal": "Optimize Storage_Method efficiency.",
            "xgb_var": "Storage_Method",
            "items": [
                {
                    "name": "Floor Strategy",
                    "industrial": "Standard Wooden Pallets",
                    "traditional": "Coconut Husk Layer / Logs",
                    "logic": "Laying husks creates a thermal break. Never place bags on cement as it transfers moisture."
                },
                {
                    "name": "Bin Type",
                    "industrial": "Galvanized Metal Silo",
                    "traditional": "Wooden Box (Atuwa) / Mud Bin",
                    "logic": "Raised traditional Atuwa protects from ground moisture and improves airflow."
                }
            ]
        }
    ]
    
    return jsonify({
        "success": True,
        "knowledge": knowledge,
        "disclaimer": "Traditional methods are recommended based on research papers for small-scale preservation."
    }), 200

@postharvest_bp.route('/weather', methods=['GET'])
def get_realtime_weather():
    """
    Fetches real-time weather data for Free Mode monitoring.
    Uses Open-Meteo (No API key required).
    """
    lat = request.args.get('lat', default=6.9271, type=float) # Default Colombo
    lon = request.args.get('lon', default=79.8612, type=float)

    try:
        # Open-Meteo current weather endpoint
        url = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current=temperature_2m,relative_humidity_2m&timezone=Asia/Colombo"
        
        print(f"[Weather] 🌡️ Syncing climate for {lat}, {lon}")
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        data = response.json()
        
        current = data.get('current', {})
        
        return jsonify({
            "success": True,
            "temp_c": current.get('temperature_2m'),
            "humidity_pct": current.get('relative_humidity_2m'),
            "source": "Open-Meteo Realtime Sync",
            "timestamp": datetime.now().isoformat()
        }), 200
        
    except Exception as e:
        print(f"[Weather] ❌ Error syncing: {str(e)}")
        return jsonify({
            "success": False,
            "error": "Failed to sync realtime weather data",
            "fallback": True,
            "temp_c": 28.5,
            "humidity_pct": 72
        }), 200

@postharvest_bp.route('/inspect', methods=['POST'])
def inspect_harvest_logic():
    """
    Analyzes harvest input for "Agronomic Impossibilities" based on SLR 603.
    """
    data = request.get_json() or {}
    
    variety = data.get('variety', 'Unknown')
    quantity_kg = float(data.get('quantity_kg', 0))
    acres = float(data.get('acres', 0))
    moisture = float(data.get('moisture', 0))
    grade = data.get('grade', 'A')
    
    is_valid = True
    warning_message = None
    suggested_correction = None

    # 1. Yield Check (SL Standards: ~2000-3000kg/acre. Max logic: 4500kg)
    if acres > 0:
        yield_per_acre = quantity_kg / acres
        if yield_per_acre > 4500:
            is_valid = False
            warning_message = f"Yield Discrepancy: You reported {int(yield_per_acre)}kg per acre."
            suggested_correction = f"This yield is unusually high for Sri Lankan standards (Avg: 3000kg). Please verify the land area ({acres} acres) or total quantity ({quantity_kg}kg)."

    # 2. Moisture vs. Grade Conflict (SLR 603: Grade A < 14%)
    if is_valid and grade == "A" and moisture > 14:
        is_valid = False
        warning_message = f"SLR 603 Conflict: Grade A selected but moisture is {moisture}%."
        suggested_correction = f"Grade A requires moisture below 14% for long-term safety. Either dry the paddy further or downgrade to Grade B/C."

    # 3. Biological Reality (Over-drying risk)
    if is_valid and moisture < 8:
        is_valid = False
        warning_message = "Milling Risk: Moisture is extremely low (<8%)."
        suggested_correction = "Over-dried rice becomes brittle and breaks during milling, reducing selling price. Please verify your moisture meter calibration."

    return jsonify({
        "is_valid": is_valid,
        "warning_message": warning_message,
        "suggested_correction": suggested_correction
    }), 200



def _rigorous_json_cleaner(raw: str) -> str:
    """
    Bulletproof JSON extractor for messy LLM outputs.
    Handles: <think> tags, markdown fences, preamble prose,
    single quotes, Python booleans/None, trailing commas.
    """
    import re

    cleaned = raw.strip()

    # 0. Print raw for debug (first 500 chars)
    print(f"[JSON Cleaner] Raw input (first 500 chars): {cleaned[:500]}")

    # 1. Strip <think>...</think> reasoning tokens (Ollama/qwen/deepseek models)
    cleaned = re.sub(r'<think>.*?</think>', '', cleaned, flags=re.DOTALL)
    cleaned = cleaned.strip()

    # 2. Strip markdown fences (```json ... ``` or ``` ... ```)
    cleaned = re.sub(r'^```[a-zA-Z]*\s*', '', cleaned)
    cleaned = re.sub(r'\s*```$', '', cleaned)
    cleaned = cleaned.strip()

    # 3. Extract the JSON object — find FIRST { and LAST }
    #    This handles preamble text like "Here is the JSON:"
    first_brace = cleaned.find('{')
    last_brace = cleaned.rfind('}')
    if first_brace != -1 and last_brace != -1 and last_brace > first_brace:
        cleaned = cleaned[first_brace:last_brace + 1]
    else:
        # No braces at all — try extracting a JSON array
        first_bracket = cleaned.find('[')
        last_bracket = cleaned.rfind(']')
        if first_bracket != -1 and last_bracket != -1:
            cleaned = cleaned[first_bracket:last_bracket + 1]

    # 4. Replace Python-style booleans and None → JSON equivalents
    cleaned = re.sub(r'\bTrue\b', 'true', cleaned)
    cleaned = re.sub(r'\bFalse\b', 'false', cleaned)
    cleaned = re.sub(r'\bNone\b', 'null', cleaned)

    # 5. Fix missing commas between } and "key" or ] and "key"
    cleaned = re.sub(r'}\s*"', '}, "', cleaned)
    cleaned = re.sub(r']\s*"', '], "', cleaned)

    # 6. Fix missing commas between string values and next key
    cleaned = re.sub(r'"\s*\n\s*"', '",\n"', cleaned)

    # 7. Remove trailing commas before } or ]
    cleaned = re.sub(r',\s*}', '}', cleaned)
    cleaned = re.sub(r',\s*]', ']', cleaned)

    # 8. Safer single-quote replacement: Only replace at start/end of words or braces
    #    This avoids breaking apostrophes like "Farmer's" while fixing "key": 'value'
    cleaned = re.sub(r"':", '":', cleaned)
    cleaned = re.sub(r": '", ': "', cleaned)
    cleaned = re.sub(r"',", '",', cleaned)
    cleaned = re.sub(r"'}", '"}', cleaned)
    cleaned = re.sub(r"{'", '{"', cleaned)

    print(f"[JSON Cleaner] Cleaned output (first 500 chars): {cleaned[:500]}")
    return cleaned

