"""
routes/postharvest_guardian.py
──────────────────────────────────────────────────────────────────────────────
Post-Harvest Guardian API Blueprint — GoviMithuru App
COMPLETE v5.1 — Production ready, multilingual LLM, zero logic errors

HOW TO INTEGRATE (add to app.py — 2 lines only):
    from routes.postharvest_guardian import postharvest_bp
    app.register_blueprint(postharvest_bp)

OLLAMA SETUP (run once on the server machine):
    ollama serve
    ollama pull qwen2.5:7b
    Test: curl http://127.0.0.1:11434/

ALL ENDPOINTS (/api/guardian/):
  POST /predict                   → Storage + Price + Risk signal (main engine)
  POST /advice                    → Full AI advisory — multilingual (en/si/ta)
  POST /advice/explain            → Lightweight multilingual explanation only
  POST /risk_score                → Farmer-friendly safety score (0-100)
  POST /calculate_costs           → Real LKR economics breakdown
  POST /recommend_storage         → AI picks best bag for farmer's situation
  POST /dashboard_summary         → AI situational overview for all batches
  POST /inspect                   → Agronomic input validation
  POST /chat                      → Multilingual expert AI chat (qwen2.5:7b)
  POST /checklist_advice          → Advice for failed checklist items
  POST /assess-knowledge          → Farmer knowledge level assessment
  POST /recommend_dealers         → AI dealer ranking
  POST /best_dealer               → AI best dealer picker
  POST /best_time                 → Festival sell windows calendar
  POST /generate_report           → Full post-harvest report
  POST /dealer_profile            → Dealer registration validation
  POST /weather/predict-storage   → IoT-free indoor storage prediction
  GET  /varieties                 → All supported rice varieties
  GET  /prices                    → Current price forecasts ranked
  GET  /health                    → Service health check
  GET  /quiz                      → Farmer knowledge quiz (AI-generated)
  POST /evaluate-level            → Evaluate quiz score → farmer level
  GET  /weather                   → Real-time weather from Open-Meteo
  GET  /knowledge                 → Storage knowledge base
  GET  /festival_calendar         → Festival calendar data

SRI LANKA AGRONOMIC STANDARDS: SLR 603:2013
LLM ENGINE: qwen2.5:7b via Ollama (local, no API key needed)
LANGUAGE SUPPORT: English (en) | Sinhala (si) | Tamil (ta)
──────────────────────────────────────────────────────────────────────────────
"""

from flask import Blueprint, request, jsonify, current_app
import os
import json
import pickle
import numpy as np
import pandas as pd
import requests
import joblib
import re
import math
from datetime import datetime

postharvest_bp = Blueprint('postharvest', __name__, url_prefix='/api/guardian')

# ─── Language mapping ─────────────────────────────────────────────────────────
LANGUAGE_CODES = {
    'en':          'english',
    'ta':          'tamil',
    'si':          'sinhala',
    'ta-tanglish': 'tanglish',
    'si-singlish': 'singlish',
}

# ─── Sri Lanka Agronomic Constants (SLR 603:2013) ────────────────────────────
SL_CONSTANTS = {
    'storage_life': {
        'hermetic':  270,
        'metalbin':  365,
        'woven':     120,
        'gunny':      75,
        'polythene':  90,
    },
    'mc_penalty_per_pct': {
        'hermetic': 20,
        'metalbin': 15,
        'woven':    25,
        'gunny':    30,
        'polythene':20,
    },
    'temp_penalty_per_c': {
        'hermetic': 5,
        'metalbin': 4,
        'woven':    8,
        'gunny':   10,
        'polythene': 7,
    },
    'bag_capacity': {
        'hermetic': 50,
        'metalbin': 500,
        'woven':    50,
        'gunny':    50,
        'polythene':25,
    },
    'bag_unit_cost': {
        'hermetic': 450,
        'metalbin': 45000,
        'woven':     35,
        'gunny':     55,
        'polythene':  8,
    },
    'bag_reuse': {
        'hermetic': 3,
        'metalbin': 50,
        'woven':    2,
        'gunny':    1,
        'polythene':0,
    },
    'warehouse_rent_per_1000kg_month': {
        'home':      0,
        'shed':    250,
        'warehouse':800,
        'coop':    400,
        'silo':    600,
    },
    'fumigation_per_1000kg': 350,
    'labour_per_1000kg':     500,
    'mc_grade_a':   14.0,
    'mc_grade_b':   16.0,
    'mc_critical':  18.0,
    'mc_overdry':   10.0,
    'festivals': [
        {'name': 'Thai Pongal',       'month': 1,  'day': 14, 'boost_pct': 15, 'emoji': '🌾', 'impact': 18},
        {'name': 'Maha Shivaratri',   'month': 2,  'day': 18, 'boost_pct':  8, 'emoji': '🕉️', 'impact': 10},
        {'name': 'Sinhala New Year',  'month': 4,  'day': 13, 'boost_pct': 25, 'emoji': '🌞', 'impact': 35},
        {'name': 'Vesak',             'month': 5,  'day':  5, 'boost_pct': 15, 'emoji': '🏮', 'impact': 25},
        {'name': 'Poson',             'month': 6,  'day': 15, 'boost_pct':  8, 'emoji': '🕯️', 'impact': 12},
        {'name': 'Christmas',         'month': 12, 'day': 25, 'boost_pct': 12, 'emoji': '🎄', 'impact': 20},
    ],
    'glut_months': [3, 4, 8, 9],
}

# ─── Price forecasts (DOA / HARTI research-calibrated, 2024/25) ───────────────
PRICE_FORECASTS = {
    "Bg 250":  {"current_lkr": 247.50, "peak_lkr": 260.00, "days_to_peak": 77,  "gain_pct": 5.1},
    "Bg 300":  {"current_lkr": 249.58, "peak_lkr": 261.67, "days_to_peak": 77,  "gain_pct": 4.8},
    "Bg 352":  {"current_lkr": 256.73, "peak_lkr": 271.20, "days_to_peak": 84,  "gain_pct": 5.6},
    "Bg 366":  {"current_lkr": 243.00, "peak_lkr": 254.50, "days_to_peak": 70,  "gain_pct": 4.7},
    "Bg 379-2":{"current_lkr": 245.00, "peak_lkr": 257.25, "days_to_peak": 77,  "gain_pct": 5.0},
    "Bg 403":  {"current_lkr": 255.73, "peak_lkr": 268.47, "days_to_peak": 91,  "gain_pct": 5.0},
    "At 306":  {"current_lkr": 243.00, "peak_lkr": 254.15, "days_to_peak": 70,  "gain_pct": 4.6},
    "At 362":  {"current_lkr": 244.00, "peak_lkr": 256.20, "days_to_peak": 70,  "gain_pct": 5.0},
    "At 405":  {"current_lkr": 246.00, "peak_lkr": 258.30, "days_to_peak": 77,  "gain_pct": 5.0},
}
ALL_VARIETIES = list(PRICE_FORECASTS.keys())

# ─── Model paths ──────────────────────────────────────────────────────────────
MODEL_DIR        = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'models', 'postharvest')
ROOT_MODEL_DIR   = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'models')

STORAGE_MODEL    = os.path.join(MODEL_DIR, 'storage_model.pkl')
ENCODERS_FILE    = os.path.join(MODEL_DIR, 'label_encoders.pkl')
METADATA_FILE    = os.path.join(MODEL_DIR, 'model_metadata.json')
TEMP_MODEL_FILE  = os.path.join(MODEL_DIR, 'storage_temp_model.pkl')
HUMID_MODEL_FILE = os.path.join(MODEL_DIR, 'storage_humid_model.pkl')
TEMP_ENC_FILE    = os.path.join(MODEL_DIR, 'storage_temp_encoders.pkl')
TEMP_META_FILE   = os.path.join(MODEL_DIR, 'storage_temp_metadata.json')

# Root-level fallback scalers (if not found in postharvest)
XGB_PRICE_SCALER   = os.path.join(ROOT_MODEL_DIR, 'price_scaler.pkl')

_models = {}

def load_models():
    global _models
    if _models.get('loaded'):
        return _models

    # 1. model_metadata.json
    try:
        with open(METADATA_FILE) as f:
            _models['metadata'] = json.load(f)
    except Exception:
        _models['metadata'] = {}

    # 2. postharvest/storage_model.pkl (XGBoost Storage Life) + scalers
    try:
        if os.path.exists(STORAGE_MODEL):
            try:
                _models['xgb_storage'] = joblib.load(STORAGE_MODEL)
            except Exception:
                with open(STORAGE_MODEL, 'rb') as f:
                    _models['xgb_storage'] = pickle.load(f)

            if os.path.exists(ENCODERS_FILE):
                try:
                    _models['xgb_label_enc'] = joblib.load(ENCODERS_FILE)
                except Exception:
                    with open(ENCODERS_FILE, 'rb') as f:
                        _models['xgb_label_enc'] = pickle.load(f)
            else:
                _models['xgb_label_enc'] = None

            price_sc_path = os.path.join(MODEL_DIR, 'price_scaler.pkl')
            if not os.path.exists(price_sc_path) and os.path.exists(XGB_PRICE_SCALER):
                price_sc_path = XGB_PRICE_SCALER

            if os.path.exists(price_sc_path):
                _models['xgb_price_sc'] = joblib.load(price_sc_path)
            else:
                _models['xgb_price_sc'] = None
            
            _models['xgb_loaded'] = True
            print("[PostHarvest] ✅ postharvest/storage_model.pkl loaded")
        else:
            _models['xgb_loaded'] = False
            print("[PostHarvest] ℹ️ postharvest/storage_model.pkl missing — using physics")
    except Exception as exc:
        print(f"[PostHarvest] ⚠️ XGBoost load error: {exc}")
        _models['xgb_loaded'] = False

    # 3. Temp/Humid models
    try:
        if os.path.exists(TEMP_MODEL_FILE):
            _models['temp_ml']       = joblib.load(TEMP_MODEL_FILE)
            _models['humid_ml']      = joblib.load(HUMID_MODEL_FILE)
            _models['temp_enc']      = joblib.load(TEMP_ENC_FILE)
            with open(TEMP_META_FILE) as f:
                _models['temp_meta'] = json.load(f)
            _models['temp_ml_loaded'] = True
            print("[PostHarvest] ✅ XGBoost temp/humid models loaded")
        else:
            _models['temp_ml_loaded'] = False
    except Exception as exc:
        print(f"[PostHarvest] ⚠️ Temp/humid ML error: {exc}")
        _models['temp_ml_loaded'] = False

    _models['loaded'] = True
    return _models


# ─── Ollama helper ────────────────────────────────────────────────────────────
def _call_ollama(system_prompt, user_content,
                 format_json=True, model="qwen2.5:7b", max_tokens=1536):
    """
    Call locally running Ollama with qwen2.5:7b.
    Returns raw string or None on failure.
    Make sure Ollama is running: ollama serve
    Make sure model is pulled: ollama pull qwen2.5:7b
    """
    url = "http://127.0.0.1:11434/api/chat"
    payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user",   "content": user_content},
        ],
        "stream": False,
        "options": {"temperature": 0.15, "num_predict": max_tokens},
    }
    if format_json:
        payload["format"] = "json"
    try:
        requests.get("http://127.0.0.1:11434/", timeout=2)
        r = requests.post(url, json=payload, timeout=180)
        r.raise_for_status()
        return r.json()["message"]["content"]
    except requests.exceptions.ConnectionError:
        print("[Ollama] ⚠️ Ollama is NOT running. Run: ollama serve")
        return None
    except Exception as exc:
        print(f"[Ollama] ❌ Error: {str(exc)[:100]}")
        return None


def _clean_json(raw):
    """Bulletproof JSON extractor for messy LLM outputs."""
    cleaned = re.sub(r'<think>.*?</think>', '', raw, flags=re.DOTALL).strip()
    cleaned = re.sub(r'^```[a-zA-Z]*\s*', '', cleaned)
    cleaned = re.sub(r'\s*```$', '', cleaned).strip()
    first = cleaned.find('{')
    last  = cleaned.rfind('}')
    if first != -1 and last > first:
        cleaned = cleaned[first:last+1]
    else:
        fb = cleaned.find('[')
        lb = cleaned.rfind(']')
        if fb != -1 and lb > fb:
            cleaned = cleaned[fb:lb+1]
    cleaned = re.sub(r'\bTrue\b',  'true',  cleaned)
    cleaned = re.sub(r'\bFalse\b', 'false', cleaned)
    cleaned = re.sub(r'\bNone\b',  'null',  cleaned)
    cleaned = re.sub(r',\s*}', '}', cleaned)
    cleaned = re.sub(r',\s*]', ']', cleaned)
    return cleaned


# ─── Core agronomic helpers ───────────────────────────────────────────────────

def _normalize_bag_type(raw):
    """Normalize any bag name string to a canonical key."""
    if not raw:
        return 'gunny'
    key = str(raw).lower().replace(' ', '').replace('-', '').replace('_', '').replace('(', '').replace(')', '')
    mapping = {
        'hermetic': 'hermetic', 'hermeticbag': 'hermetic', 'hermeticbags': 'hermetic',
        'airtight': 'hermetic', 'superbag': 'hermetic', 'grainpro': 'hermetic',
        'pics': 'hermetic',
        'metalbin': 'metalbin', 'metalbins': 'metalbin', 'metalsilo': 'metalbin',
        'silo': 'metalbin', 'galvanisedsilo': 'metalbin',
        'woven': 'woven', 'ppwoven': 'woven', 'pp': 'woven',
        'wovenpolypropylene': 'woven', 'polypropylene': 'woven',
        'gunny': 'gunny', 'gonnyboru': 'gunny', 'goniboru': 'gunny',
        'goni': 'gunny', 'jute': 'gunny', 'jutesacks': 'gunny',
        'polythene': 'polythene', 'poly': 'polythene', 'polybag': 'polythene',
        'polythenebags': 'polythene', 'ldpe': 'polythene',
    }
    result = mapping.get(key, None)
    if result:
        return result
    if 'hermetic' in key or 'airtight' in key or 'super' in key: return 'hermetic'
    if 'silo' in key or 'metal' in key: return 'metalbin'
    if 'woven' in key or 'polyprop' in key: return 'woven'
    if 'gunny' in key or 'jute' in key or 'goni' in key: return 'gunny'
    if 'poly' in key or 'plastic' in key: return 'polythene'
    return 'gunny'


def _normalize_location(raw):
    """Normalize storage location string to a canonical key."""
    if not raw:
        return 'home'
    key = str(raw).lower().replace(' ', '').replace('-', '').replace('_', '')
    mapping = {
        'home': 'home', 'homestorage': 'home', 'house': 'home',
        'shed': 'shed', 'barn': 'shed', 'farmshed': 'shed',
        'warehouse': 'warehouse', 'store': 'warehouse', 'rentedwarehouse': 'warehouse',
        'coop': 'coop', 'cooperative': 'coop',
        'silo': 'silo', 'industrialsilo': 'silo',
    }
    result = mapping.get(key, None)
    if result: return result
    if 'home' in key or 'house' in key: return 'home'
    if 'shed' in key or 'barn' in key: return 'shed'
    if 'coop' in key or 'cooperative' in key: return 'coop'
    if 'silo' in key: return 'silo'
    if 'warehouse' in key or 'store' in key: return 'warehouse'
    return 'home'


def _get_next_festival():
    """Returns the next upcoming Sri Lankan festival from today."""
    today = datetime.now()
    upcoming = []
    for fest in SL_CONSTANTS['festivals']:
        for yr_offset in [0, 1]:
            try:
                fdate = datetime(today.year + yr_offset, fest['month'], fest['day'])
                if fdate > today:
                    days_away = (fdate - today).days
                    upcoming.append({**fest, 'date': fdate.strftime('%Y-%m-%d'),
                                     'days_away': days_away})
                    break
            except ValueError:
                continue
    upcoming.sort(key=lambda x: x['days_away'])
    return upcoming[0] if upcoming else None


def _compute_storage_life(bag_type, moisture_pct, temp_c, has_pest_history=False, ventilation='natural'):
    """Physics-based storage life compliant with SLR 603:2013."""
    key     = _normalize_bag_type(bag_type)
    base    = SL_CONSTANTS['storage_life'][key]
    mc_pen  = SL_CONSTANTS['mc_penalty_per_pct'][key]
    tmp_pen = SL_CONSTANTS['temp_penalty_per_c'][key]

    if ventilation == 'none':
        mc_pen  *= 1.2
        tmp_pen *= 1.3
    elif ventilation == 'mechanical':
        mc_pen  *= 0.8
        tmp_pen *= 0.7

    if has_pest_history:
        base *= 0.8

    mc_excess   = max(0.0, moisture_pct - 13.0)
    temp_excess = max(0.0, temp_c - 28.0)
    days        = base - (mc_excess * mc_pen) - (temp_excess * tmp_pen)

    weevil_risk = "LOW"
    if moisture_pct > 14.0 and temp_c > 30.0:
        weevil_risk = "CRITICAL"
        days *= 0.6
    elif moisture_pct > 13.5 or temp_c > 29.0:
        weevil_risk = "MEDIUM"
        days *= 0.85

    days = max(7, int(round(days)))

    if moisture_pct < 10.0:
        grade, risk = "OVER-DRIED", "OVERDRY"
        explanation = f"MC {moisture_pct}% is dangerously low. Milling breakage risk >20%."
    elif moisture_pct <= 13.0:
        grade, risk = "Grade A+", "SAFE"
        explanation = f"Excellent MC {moisture_pct}%. Safe for {days} days."
    elif moisture_pct <= 14.0:
        grade, risk = "Grade A", "GOOD"
        explanation = f"MC {moisture_pct}% within Grade A limits."
    elif moisture_pct <= 16.0:
        grade, risk = "Grade B", "HIGH"
        explanation = f"MC {moisture_pct}% is borderline. Grade B quality."
    else:
        grade, risk = "Grade C", "CRITICAL"
        explanation = f"MC {moisture_pct}% is dangerously high (Grade C). DO NOT STORE."

    return {
        'storage_days':    days,
        'storage_months':  round(days / 30.0, 1),
        'grade':           grade,
        'risk':            risk,
        'explanation':     explanation,
        'weevil_risk':     weevil_risk,
        'moisture_risk':   "SAFE" if moisture_pct <= 14 else "RISK",
    }


def _compute_storage_costs(quantity_kg, bag_type, duration_months,
                            storage_location, current_price_lkr, expected_price_lkr):
    """Real Sri Lankan storage cost breakdown (2024/25 market prices). All values in LKR."""
    key     = _normalize_bag_type(bag_type)
    loc_key = _normalize_location(storage_location)

    cap       = SL_CONSTANTS['bag_capacity'][key]
    bags      = math.ceil(quantity_kg / cap)
    unit_cost = SL_CONSTANTS['bag_unit_cost'][key]
    reuses    = SL_CONSTANTS['bag_reuse'][key]
    bag_cost  = (bags * unit_cost) / (reuses + 1) if reuses > 0 else (bags * unit_cost)

    rent_rate    = SL_CONSTANTS['warehouse_rent_per_1000kg_month'].get(loc_key, 0)
    total_rent   = (quantity_kg / 1000.0) * rent_rate * duration_months
    fum_count    = 2 if duration_months > 3 else 1
    fumigation   = (quantity_kg / 1000.0) * SL_CONSTANTS['fumigation_per_1000kg'] * fum_count
    labour       = (quantity_kg / 1000.0) * SL_CONSTANTS['labour_per_1000kg']
    asset_value  = quantity_kg * current_price_lkr
    insurance    = asset_value * 0.005 if quantity_kg >= 5000 else 0.0

    total_cost  = bag_cost + total_rent + fumigation + labour + insurance
    cost_per_kg = total_cost / quantity_kg if quantity_kg > 0 else 0.0
    sell_now    = quantity_kg * current_price_lkr
    sell_peak   = quantity_kg * expected_price_lkr
    gross_gain  = sell_peak - sell_now
    net_profit  = gross_gain - total_cost
    break_even  = current_price_lkr + cost_per_kg
    roi         = (net_profit / total_cost * 100.0) if total_cost > 0 else 0.0

    if net_profit > 0 and net_profit > (total_cost * 0.2):
        profitability = "YES"
    elif net_profit > 0:
        profitability = "MARGINAL"
    else:
        profitability = "NO"

    return {
        'bags_required':       bags,
        'bag_type':            key,
        'effective_bag_cost':  round(bag_cost),
        'rent_cost':           round(total_rent),
        'fumigation_cost':     round(fumigation),
        'labour_cost':         round(labour),
        'insurance_cost':      round(insurance),
        'total_storage_cost':  round(total_cost),
        'cost_per_kg':         round(cost_per_kg, 2),
        'sell_now_value':      round(sell_now),
        'sell_peak_value':     round(sell_peak),
        'gross_gain':          round(gross_gain),
        'net_profit':          round(net_profit),
        'break_even_price':    round(break_even, 2),
        'profitability':       profitability,
        'roi_pct':             round(roi, 1),
        'asset_value':         round(asset_value),
    }


def _compute_risk_score(moisture_pct, bag_type, duration_months,
                         quantity_kg, has_pest_history, storage_location, temp_c=28.0):
    """Farmer-friendly risk score (0-100). SLR 603:2013 compliant."""
    score   = 100
    factors = []

    if moisture_pct > 18:
        score -= 40
        factors.append({'factor': 'Critical Moisture', 'deduction': 40,
                        'detail': f'MC {moisture_pct}% — total loss risk. Sun-dry IMMEDIATELY.'})
    elif moisture_pct > 16:
        score -= 30
        factors.append({'factor': 'High Moisture', 'deduction': 30,
                        'detail': f'MC {moisture_pct}% — Grade C. Mold forming within days. Do NOT store.'})
    elif moisture_pct > 14:
        score -= 20
        factors.append({'factor': 'Elevated Moisture', 'deduction': 20,
                        'detail': f'MC {moisture_pct}% — Grade B. Dry to 13% before long storage.'})
    elif moisture_pct > 13:
        score -= 8
        factors.append({'factor': 'Borderline Moisture', 'deduction': 8,
                        'detail': f'MC {moisture_pct}% — borderline Grade A. Monitor closely.'})
    elif moisture_pct < 10 and moisture_pct > 0:
        score -= 15
        factors.append({'factor': 'Over-dried', 'deduction': 15,
                        'detail': f'MC {moisture_pct}% — over-dried. Milling breakage risk >20%.'})

    life_data = _compute_storage_life(bag_type, moisture_pct, temp_c)
    life_days = life_data['storage_days']
    need_days = duration_months * 30.0
    if life_days < need_days:
        gap       = need_days - life_days
        deduction = min(25, int(gap / 3))
        score -= deduction
        factors.append({'factor': 'Container Mismatch', 'deduction': deduction,
                        'detail': f'{bag_type} lasts only {life_days} days but you need {int(need_days)} days.'})

    if has_pest_history and str(has_pest_history).lower() not in ['no', 'false', '0']:
        score -= 15
        factors.append({'factor': 'Pest History', 'deduction': 15,
                        'detail': 'Fumigate with Phostoxin before storing. Place rat guards on pallet legs.'})

    key = _normalize_bag_type(bag_type)
    if quantity_kg > 10000 and key in ['gunny', 'polythene']:
        score -= 10
        factors.append({'factor': 'Scale Risk', 'deduction': 10,
                        'detail': f'{int(quantity_kg):,} kg in {key} bags is very high risk.'})
    elif quantity_kg > 5000 and key == 'polythene':
        score -= 5
        factors.append({'factor': 'Scale Risk', 'deduction': 5,
                        'detail': f'Polythene for {int(quantity_kg):,} kg not recommended.'})

    if temp_c > 33:
        score -= 10
        factors.append({'factor': 'Dangerously High Temperature', 'deduction': 10,
                        'detail': f'{temp_c}°C — weevil breeding active. Install exhaust fan.'})
    elif temp_c > 30:
        score -= 5
        factors.append({'factor': 'Elevated Temperature', 'deduction': 5,
                        'detail': f'{temp_c}°C — open vents during morning (5–8 AM).'})

    score = max(0, min(100, score))

    if score >= 80:
        category, color = 'LOW',      '#16a34a'
    elif score >= 60:
        category, color = 'MEDIUM',   '#f59e0b'
    elif score >= 40:
        category, color = 'HIGH',     '#ea580c'
    else:
        category, color = 'CRITICAL', '#dc2626'

    loss_est = {'LOW': '0–3%', 'MEDIUM': '3–10%', 'HIGH': '10–25%', 'CRITICAL': '25–60%'}[category]

    return {
        'score':         score,
        'category':      category,
        'color':         color,
        'loss_estimate': loss_est,
        'risk_factors':  factors,
        'storage_life':  life_data,
    }


def _get_price_forecast(variety):
    """Get price forecast from model metadata or fallback."""
    meta = load_models().get('metadata', {})
    price_map = meta.get('price_forecasts', PRICE_FORECASTS)

    if variety in price_map:
        pf = dict(price_map[variety])
        pf['gain_lkr_per_kg'] = round(pf['peak_lkr'] - pf['current_lkr'], 2)
        return pf
    for key in price_map:
        if key.lower() in variety.lower() or variety.lower() in key.lower():
            pf = dict(price_map[key])
            pf['gain_lkr_per_kg'] = round(pf['peak_lkr'] - pf['current_lkr'], 2)
            return pf
    
    fallback_key = next(iter(price_map.keys()), 'Bg 300')
    pf = dict(price_map.get('Bg 300') or price_map[fallback_key] or PRICE_FORECASTS['Bg 300'])
    pf['gain_lkr_per_kg'] = round(pf['peak_lkr'] - pf['current_lkr'], 2)
    return pf


# ─────────────────────────────────────────────────────────────────────────────
# PHYSICS-BASED STORAGE TEMPERATURE & HUMIDITY PREDICTION ENGINE
# Reference: Building Thermal Simulation (ISO 13786), SLR 603:2013
# ─────────────────────────────────────────────────────────────────────────────

_STORAGE_TYPE_COEFF = {
    'home':      {'temp_gain': 3.0, 'lag_h': 4,  'humidity_factor': 0.90},
    'warehouse': {'temp_gain': 2.0, 'lag_h': 8,  'humidity_factor': 0.80},
    'shed':      {'temp_gain': 4.0, 'lag_h': 2,  'humidity_factor': 0.95},
    'coop':      {'temp_gain': 1.5, 'lag_h': 10, 'humidity_factor': 0.75},
    'co_op':     {'temp_gain': 1.5, 'lag_h': 10, 'humidity_factor': 0.75},
    'default':   {'temp_gain': 3.0, 'lag_h': 5,  'humidity_factor': 0.88},
}
_ROOF_MAT_MULT = {
    'tile': 1.0, 'tiles': 1.0, 'asbestos': 1.5,
    'metal': 2.0, 'metal sheet': 2.0, 'metalsheet': 2.0, 'zinc': 2.0,
    'concrete': 0.8, 'cadjan': 0.7, 'thatch': 0.7, 'default': 1.2,
}
_ROOF_COL_MULT   = {'white': 0.7, 'red': 1.0, 'dark': 1.3, 'grey': 1.1, 'default': 1.0}
_VENT_COEFF      = {
    'none':           {'temp': 1.3, 'humidity': 0.95},
    'natural':        {'temp': 1.0, 'humidity': 0.85},
    'fan':            {'temp': 0.7, 'humidity': 0.75},
    'fan assisted':   {'temp': 0.7, 'humidity': 0.75},
    'fanassisted':    {'temp': 0.7, 'humidity': 0.75},
    'air conditioned':{'temp': 0.5, 'humidity': 0.65},
    'airconditioned': {'temp': 0.5, 'humidity': 0.65},
    'default':        {'temp': 1.0, 'humidity': 0.88},
}
_HEIGHT_MULT = {'<3m': 1.2, '3-4m': 1.0, '>4m': 0.8, 'default': 1.0}


def _physics_predict(weather_24h, storage_cfg, rice_moisture_pct):
    """Physics-based indoor temp & humidity prediction using 24h outdoor data."""
    stype      = str(storage_cfg.get('storage_type', 'warehouse')).lower().replace(' ', '_')
    base       = dict(_STORAGE_TYPE_COEFF.get(stype, _STORAGE_TYPE_COEFF['default']))
    lag_h      = base['lag_h']
    temp_gain  = base['temp_gain']
    hum_factor = base['humidity_factor']

    roof_mat   = str(storage_cfg.get('roof_material', 'tile')).lower()
    roof_col   = str(storage_cfg.get('roof_color', 'red')).lower()
    temp_gain *= _ROOF_MAT_MULT.get(roof_mat, _ROOF_MAT_MULT['default'])
    temp_gain *= _ROOF_COL_MULT.get(roof_col, _ROOF_COL_MULT['default'])

    if storage_cfg.get('insulation', False):
        temp_gain *= 0.6
        lag_h     *= 1.5

    vent = str(storage_cfg.get('ventilation', 'natural')).lower()
    vc   = _VENT_COEFF.get(vent, _VENT_COEFF['default'])
    temp_gain  *= vc['temp']
    hum_factor  = vc['humidity']

    ch        = str(storage_cfg.get('ceiling_height', '3-4m'))
    temp_gain *= _HEIGHT_MULT.get(ch, _HEIGHT_MULT['default'])

    qty_kg = float(storage_cfg.get('rice_quantity_kg', 0) or 0)
    lag_h *= (1 + qty_kg / 10000.0)
    lag_h  = max(1, int(round(lag_h)))

    outdoor_temps = [w['temp'] for w in weather_24h]
    hourly_preds  = []

    for h in range(24):
        lag_idx     = (h - lag_h) % 24
        base_temp   = outdoor_temps[lag_idx]
        tod_corr    = 1.0 if 14 <= h <= 20 else (0.0 if 6 <= h < 14 or 20 < h <= 22 else -0.5)
        indoor_temp = base_temp + temp_gain + tod_corr
        outdoor_rh  = weather_24h[h]['humidity']
        base_rh     = outdoor_rh * hum_factor
        respiration = max(0.0, (rice_moisture_pct - 14.0) * 2.0) if rice_moisture_pct > 14 else 0
        indoor_rh   = min(100.0, base_rh + respiration)
        hourly_preds.append({'hour': h, 'temp': round(indoor_temp, 1), 'humidity': round(indoor_rh, 1)})

    def _weight(h):
        if 12 <= h < 18: return 2.0
        if 6 <= h < 12 or 18 <= h < 22: return 1.0
        return 0.5

    total_w   = sum(_weight(p['hour']) for p in hourly_preds)
    avg_temp  = sum(p['temp'] * _weight(p['hour']) for p in hourly_preds) / total_w
    avg_rh    = sum(p['humidity'] * _weight(p['hour']) for p in hourly_preds) / total_w
    peak_temp = max(p['temp'] for p in hourly_preds)
    peak_rh   = max(p['humidity'] for p in hourly_preds)

    temps    = [w['temp'] for w in weather_24h]
    variance = float(np.var(temps)) if len(temps) > 1 else 10.0
    conf     = 0.70
    if len(weather_24h) == 24: conf += 0.10
    if variance < 10:           conf += 0.10
    if any(w['temp'] > 40 or w['temp'] < 15 for w in weather_24h): conf -= 0.10
    conf = round(min(0.92, max(0.55, conf)), 2)

    if conf >= 0.85:   acc_label = f"~{int(conf*100)}% (Physics+Weather Model)"
    elif conf >= 0.70: acc_label = f"~{int(conf*100)}% (Stable Weather)"
    else:              acc_label = f"~{int(conf*100)}% (Variable Conditions)"

    alerts = []
    if peak_temp > 32:
        alerts.append({'level': 'warning',
                       'message': f"Peak storage temp may reach {peak_temp:.1f}°C — increase ventilation."})
    if peak_rh > 75:
        alerts.append({'level': 'warning',
                       'message': f"Peak humidity may reach {peak_rh:.0f}% — open vents and check moisture."})
    if avg_temp > 30 and avg_rh > 70:
        alerts.append({'level': 'critical',
                       'message': "Both temperature AND humidity are high — IMMEDIATE ventilation required!"})

    return {
        'avg_temperature':   round(avg_temp, 1),
        'avg_humidity':      round(avg_rh, 1),
        'peak_temperature':  round(peak_temp, 1),
        'peak_humidity':     round(peak_rh, 1),
        'confidence':        conf,
        'accuracy_label':    acc_label,
        'lag_hours_applied': lag_h,
        'temp_gain_applied': round(temp_gain, 2),
        'humidity_factor':   round(hum_factor, 2),
        'alerts':            alerts,
        'hourly_profile':    hourly_preds,
    }


def _ml_predict_storage_conditions(weather_24h, storage_cfg, rice_moisture, lat, lon):
    """XGBoost + Physics hybrid prediction for indoor storage conditions."""
    m    = load_models()
    phys = _physics_predict(weather_24h, storage_cfg, rice_moisture)

    if not m.get('temp_ml_loaded'):
        return phys, "physics"

    try:
        enc  = m["temp_enc"]
        meta = m["temp_meta"]
        FEATURE_COLS = meta["feature_cols"]

        temps  = [w["temp"]     for w in weather_24h]
        humids = [w["humidity"] for w in weather_24h]

        outdoor_avg_temp     = sum(temps)  / len(temps)
        outdoor_avg_humidity = sum(humids) / len(humids)
        outdoor_peak_temp    = max(temps)
        outdoor_min_temp     = min(temps)
        outdoor_temp_variance= float(np.var(temps))

        stype   = storage_cfg.get("storage_type", "warehouse")
        rmat    = storage_cfg.get("roof_material", "tile")
        rcol    = storage_cfg.get("roof_color", "red")
        vent    = storage_cfg.get("ventilation", "natural")
        cheight = storage_cfg.get("ceiling_height", "3-4m")
        insul   = int(storage_cfg.get("insulation", False))
        qty     = float(storage_cfg.get("rice_quantity_kg", 500) or 500)
        reading_hour = datetime.now().hour

        def safe_enc(col, val):
            le = enc.get(col)
            if le and val in le.classes_:
                return int(le.transform([val])[0])
            return 0

        row = {
            "outdoor_avg_temp":          outdoor_avg_temp,
            "outdoor_avg_humidity":      outdoor_avg_humidity,
            "outdoor_peak_temp":         outdoor_peak_temp,
            "outdoor_min_temp":          outdoor_min_temp,
            "outdoor_temp_range":        outdoor_peak_temp - outdoor_min_temp,
            "outdoor_temp_variance":     outdoor_temp_variance,
            "outdoor_heat_index":        outdoor_avg_temp * 0.6 + outdoor_avg_humidity * 0.4,
            "weather_stability":         1.0 / (1 + outdoor_temp_variance),
            "storage_type_enc":          safe_enc("storage_type", stype),
            "roof_material_enc":         safe_enc("roof_material", rmat),
            "roof_color_enc":            safe_enc("roof_color", rcol),
            "ventilation_enc":           safe_enc("ventilation", vent),
            "ceiling_height_enc":        safe_enc("ceiling_height", cheight),
            "insulation":                insul,
            "log_quantity":              float(np.log1p(qty)),
            "rice_moisture_pct":         rice_moisture,
            "moisture_temp_interaction": rice_moisture * outdoor_avg_temp,
            "is_risky_moisture":         int(rice_moisture > 14),
            "climate_zone_enc":          2,
            "latitude":                  lat,
            "longitude":                 lon,
            "hour_sin":                  float(np.sin(2 * np.pi * reading_hour / 24)),
            "hour_cos":                  float(np.cos(2 * np.pi * reading_hour / 24)),
            "physics_lag_hours":         float(phys['lag_hours_applied']),
            "physics_temp_gain":         float(phys['temp_gain_applied']),
            "is_hot_outdoor":            int(outdoor_avg_temp > 32),
            "is_metal_dark_roof":        int(rmat == "metal" and rcol == "dark"),
        }

        X_df     = pd.DataFrame([row])[FEATURE_COLS]
        ml_temp  = float(m["temp_ml"].predict(X_df)[0])
        ml_humid = float(m["humid_ml"].predict(X_df)[0])
        ml_humid = max(30.0, min(100.0, ml_humid))

        blended_temp  = round(ml_temp  * 0.6 + phys["avg_temperature"] * 0.4, 1)
        blended_humid = round(ml_humid * 0.6 + phys["avg_humidity"]    * 0.4, 1)

        acc_pct = int(meta['accuracy']['temp_within_2c'] * 100) if 'accuracy' in meta else 85
        phys.update({
            "avg_temperature": blended_temp,
            "avg_humidity":    blended_humid,
            "accuracy_label":  f"~{acc_pct}% (Hybrid ML Prediction)",
            "ml_contribution": 0.6,
        })
        return phys, "ml_hybrid"

    except Exception as exc:
        print(f"[MLPredict] ⚠️ {exc}")
        return phys, "physics_fallback"


# ─── Festival Calendar ────────────────────────────────────────────────────────
FESTIVAL_CALENDAR_DATA = [
    {'name': 'Thai Pongal',      'name_si': 'තෛ පොංගල්',      'month': 1,  'day': 14, 'boost_pct': 15, 'icon': '🌾'},
    {'name': 'Maha Shivaratri',  'name_si': 'මහ ශිවරාත්‍රී',  'month': 2,  'day': 18, 'boost_pct': 8,  'icon': '🕉️'},
    {'name': 'Sinhala New Year', 'name_si': 'සිංහල අවුරුදු',   'month': 4,  'day': 13, 'boost_pct': 25, 'icon': '🎊'},
    {'name': 'Vesak',            'name_si': 'වෙසක්',           'month': 5,  'day':  5, 'boost_pct': 15, 'icon': '🪔'},
    {'name': 'Poson',            'name_si': 'පොසොන්',          'month': 6,  'day': 15, 'boost_pct': 8,  'icon': '🌕'},
    {'name': 'Christmas',        'name_si': 'නත්තල',           'month': 12, 'day': 25, 'boost_pct': 12, 'icon': '🎄'},
]
GLUT_MONTHS = [3, 4, 8, 9]


def _haversine_km(lat1, lon1, lat2, lon2):
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2) ** 2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def _estimate_transport_cost_lkr(distance_km, quantity_kg, offers_transport):
    if offers_transport:
        return 0
    if quantity_kg > 3000:
        rate, capacity = 75, 5000
    else:
        rate, capacity = 45, 2000
    trips = math.ceil(quantity_kg / capacity)
    return round(distance_km * rate * trips)


def _compute_dealer_score(dealer, distance_km, base_price_lkr, quantity_kg, harvest_grade):
    score = 50.0
    offer_price = dealer.get('currentPriceLkr') or dealer.get('current_price_lkr') or base_price_lkr
    premium_pct = ((offer_price - base_price_lkr) / base_price_lkr * 100) if base_price_lkr > 0 else 0
    score += min(25, max(-25, premium_pct * 5))
    if distance_km is not None:
        if distance_km > 50:   score -= 20
        elif distance_km > 20: score -= 12
        elif distance_km > 10: score -= 6
        elif distance_km > 5:  score -= 2
    if dealer.get('offersTransport'):  score += 15
    if dealer.get('instantPayment'):   score += 10
    rating = float(dealer.get('rating') or 3)
    score += (rating / 5.0) * 10
    if dealer.get('isVerified'):       score += 5
    accepted_grades = dealer.get('acceptedGrades') or []
    if harvest_grade in accepted_grades: score += 5
    min_qty = dealer.get('minQuantityKg') or 0
    if min_qty and quantity_kg < min_qty: score -= 20
    return round(max(0, min(100, score)))


def _normalize_location(storage_location: str) -> str:
    """Map arbitrary storage_location string to storage_type expected by ML models."""
    s = (storage_location or '').lower().strip()
    if 'warehouse' in s or 'store' in s:   return 'warehouse'
    if 'shed' in s:                         return 'shed'
    if 'silo' in s:                         return 'silo'
    if 'coop' in s or 'co-op' in s:        return 'co-op'
    return 'home'


def _normalize_bag_type(bag_type: str) -> str:
    """Normalize bag/container type string to a canonical key."""
    s = (bag_type or '').lower().strip()
    if 'hermetic' in s:  return 'hermetic'
    if 'poly' in s:      return 'polythene'
    if 'woven' in s or 'pp' in s: return 'woven'
    if 'metal' in s or 'silo' in s or 'bin' in s: return 'metalbin'
    return 'gunny'


def _get_best_sell_windows(harvest_date_str, storage_days, base_price_lkr):
    try:
        harvest_date = datetime.strptime(harvest_date_str, '%Y-%m-%d')
    except Exception:
        harvest_date = datetime.now()

    storage_end = harvest_date + pd.Timedelta(days=storage_days)
    today       = datetime.now()
    sell_start  = max(today, harvest_date)
    windows     = []

    for fest in FESTIVAL_CALENDAR_DATA:
        for yr_offset in [0, 1]:
            try:
                fdate = datetime(harvest_date.year + yr_offset, fest['month'], fest['day'])
            except ValueError:
                continue
            if fdate < sell_start or fdate > storage_end:
                continue
            win_start = max(sell_start, fdate - pd.Timedelta(days=7))
            win_end   = min(storage_end, fdate + pd.Timedelta(days=2))
            if win_start > storage_end:
                continue
            days_away     = (fdate - today).days
            boosted_price = round(base_price_lkr * (1 + fest['boost_pct'] / 100), 2)
            windows.append({
                **fest,
                'festival_date':    fdate.strftime('%Y-%m-%d'),
                'window_start':     win_start.strftime('%Y-%m-%d'),
                'window_end':       win_end.strftime('%Y-%m-%d'),
                'days_away':        days_away,
                'boosted_price_lkr':boosted_price,
                'gain_lkr_per_kg':  round(boosted_price - base_price_lkr, 2),
            })
            break

    windows.sort(key=lambda x: -x['boost_pct'])
    glut_in_window = [m for m in GLUT_MONTHS if any(
        (harvest_date + pd.Timedelta(days=d)).month == m
        for d in range(storage_days)
    )]

    return {
        'windows':          windows,
        'best_window':      windows[0] if windows else None,
        'glut_months':      glut_in_window,
        'storage_end_date': storage_end.strftime('%Y-%m-%d'),
        'harvest_date':     harvest_date.strftime('%Y-%m-%d'),
        'total_windows':    len(windows),
    }


# ═════════════════════════════════════════════════════════════════════════════
#  API ENDPOINTS
# ═════════════════════════════════════════════════════════════════════════════

# ─── /predict ─────────────────────────────────────────────────────────────────
@postharvest_bp.route('/predict', methods=['POST'])
def predict():
    """
    POST /api/guardian/predict
    Main prediction engine: storage + price + risk + economics in one call.
    Now uses root XGBoost model (storage_model_xgboost.pkl + price_scaler + label_encoders)
    with physics fallback. Optionally fetches real 24h weather for lat/lon.
    """
    try:
        data             = request.get_json() or {}
        variety          = data.get('variety', 'Bg 300')
        bag_type         = data.get('bag_type', data.get('storage_method', 'gunny'))
        moisture_pct     = float(data.get('moisture_pct', 13.0))
        temp_c           = float(data.get('temp_c', 28.0))
        humidity_pct     = float(data.get('humidity_pct', 65.0))
        quantity_kg      = float(data.get('quantity_kg', 1000.0))
        storage_location = data.get('storage_location', 'home')
        duration_months  = float(data.get('duration_months', 3.0))
        has_pest_history = data.get('has_pest_history', False)
        lat              = data.get('lat') or data.get('latitude')
        lon              = data.get('lon') or data.get('longitude')
        # Storage config for indoor temp prediction
        storage_cfg      = {
            'storage_type':    data.get('storage_type', _normalize_location(storage_location)),
            'roof_material':   data.get('roof_material', 'tile'),
            'roof_color':      data.get('roof_color', 'red'),
            'insulation':      bool(data.get('insulation', False)),
            'ventilation':     data.get('ventilation', 'natural'),
            'ceiling_height':  data.get('ceiling_height', '3-4m'),
            'rice_quantity_kg':quantity_kg,
        }

        if moisture_pct < 0 or moisture_pct > 30:
            return jsonify({'error': f'Invalid moisture: {moisture_pct}%. Must be 0–30%.'}), 400
        if temp_c < 15 or temp_c > 50:
            return jsonify({'error': f'Invalid temperature: {temp_c}°C.'}), 400

        m = load_models()

        # ── Step 1: Fetch real 24h outdoor weather if lat/lon provided ─────────
        weather_24h       = None
        outdoor_avg_temp  = temp_c - 3  # rough reverse of +3 indoor gain
        outdoor_avg_humid = humidity_pct
        weather_source    = 'manual_input'
        indoor_temp_pred  = temp_c
        indoor_humid_pred = humidity_pct
        hourly_profile    = []
        storage_alerts    = []

        if lat and lon:
            try:
                lat_f = float(lat)
                lon_f = float(lon)
                wx_url = (
                    f"https://api.open-meteo.com/v1/forecast"
                    f"?latitude={lat_f}&longitude={lon_f}"
                    f"&hourly=temperature_2m,relative_humidity_2m"
                    f"&current=temperature_2m,relative_humidity_2m"
                    f"&past_days=1&forecast_days=0&timezone=Asia%2FColombo"
                )
                wx_resp    = requests.get(wx_url, timeout=10)
                wx_resp.raise_for_status()
                wx_data    = wx_resp.json()
                hourly     = wx_data.get('hourly', {})
                cur        = wx_data.get('current', {})
                temps_raw  = (hourly.get('temperature_2m') or [])[-24:]
                humids_raw = (hourly.get('relative_humidity_2m') or [])[-24:]
                while len(temps_raw)  < 24: temps_raw.append(cur.get('temperature_2m', temp_c - 3))
                while len(humids_raw) < 24: humids_raw.append(cur.get('relative_humidity_2m', humidity_pct))
                weather_24h       = [{'hour': i, 'temp': temps_raw[i], 'humidity': humids_raw[i]}
                                     for i in range(24)]
                outdoor_avg_temp  = round(sum(temps_raw) / 24, 1)
                outdoor_avg_humid = round(sum(humids_raw) / 24, 1)
                weather_source    = 'Open-Meteo Realtime'
                # Fine-tune indoor storage conditions with ML + physics hybrid
                indoor_result, pred_method = _ml_predict_storage_conditions(
                    weather_24h, storage_cfg, moisture_pct, lat_f, lon_f
                )
                indoor_temp_pred  = indoor_result['avg_temperature']
                indoor_humid_pred = indoor_result['avg_humidity']
                hourly_profile    = indoor_result.get('hourly_profile', [])
                storage_alerts    = indoor_result.get('alerts', [])
                # Override temp_c with ML-predicted indoor temp for all downstream calculations
                temp_c = indoor_temp_pred
            except Exception as wx_exc:
                print(f"[predict] Weather fetch skipped: {wx_exc}")

        # ── Step 2: ML storage life prediction (XGBoost) ──────────
        ml_storage_days  = None
        ml_prediction_used = False
        ml_debug = {}

        if m.get('xgb_loaded') and m.get('xgb_storage') is not None:
            try:
                enc         = m.get('xgb_label_enc') or {}
                meta        = m.get('metadata', {})
                feat_cols   = (meta.get('xgboost', {}).get('feature_cols') or
                               meta.get('feature_cols', []))

                variety_key = variety
                var_enc     = 0
                if isinstance(enc, dict) and any(hasattr(v, 'transform') for v in enc.values()):
                    le_var = enc.get('Variety') or enc.get('variety') or enc.get('Variety_Enc')
                    if le_var is not None:
                        try:
                            var_enc = int(le_var.transform([variety_key])[0])
                        except Exception:
                            classes = list(le_var.classes_)
                            matched = next((c for c in classes if variety_key.lower() in c.lower()), classes[0])
                            var_enc = int(le_var.transform([matched])[0])
                else:
                    var_list = meta.get('label_encoders', {}).get('varieties', [])
                    var_enc  = next((i for i, v in enumerate(var_list) if variety_key.lower() in v.lower()), 0)

                type_enc   = 0
                method_enc = 0
                if isinstance(enc, dict) and any(hasattr(v, 'transform') for v in enc.values()):
                    le_type = enc.get('Type') or enc.get('type')
                    if le_type is not None:
                        try: type_enc = int(le_type.transform(['Improved'])[0])
                        except Exception: pass
                    le_meth = enc.get('Method') or enc.get('method')
                    if le_meth is not None:
                        bag_label_map = {
                            'hermetic': 'Hermetic bag', 'gunny': 'Gunny bag',
                            'polythene': 'Polythene bag', 'woven': 'Gunny bag',
                            'metalbin': 'Gunny bag'
                        }
                        bag_label = bag_label_map.get(_normalize_bag_type(bag_type), 'Gunny bag')
                        try: method_enc = int(le_meth.transform([bag_label])[0])
                        except Exception: pass
                else:
                    typ_list = meta.get('label_encoders', {}).get('types', [])
                    meth_list = meta.get('label_encoders', {}).get('methods', [])
                    type_enc = next((i for i, v in enumerate(typ_list) if 'Improved' in v), 0)
                    bag_label_map = {
                        'hermetic': 'Hermetic bag', 'gunny': 'Gunny bag',
                        'polythene': 'Polythene bag', 'woven': 'Gunny bag',
                        'metalbin': 'Gunny bag'
                    }
                    bag_label = bag_label_map.get(_normalize_bag_type(bag_type), 'Gunny bag')
                    method_enc = next((i for i, v in enumerate(meth_list) if bag_label.lower() in v.lower()), 0)

                high_moisture = int(moisture_pct > 14)
                high_temp     = int(temp_c > 30)
                mc_temp_inter = moisture_pct * temp_c

                row = {
                    'Variety_Enc':          var_enc,
                    'Type_Enc':             type_enc,
                    'Method_Enc':           method_enc,
                    'MC (%)':               moisture_pct,
                    'Temp (C)':             temp_c,
                    'High_Moisture':        high_moisture,
                    'High_Temp':            high_temp,
                    'MC_Temp_Interaction':  mc_temp_inter,
                }

                if feat_cols:
                    X = pd.DataFrame([[row.get(c, 0) for c in feat_cols]], columns=feat_cols)
                else:
                    X = pd.DataFrame([row])

                scaler = m.get('xgb_scaler')
                if scaler is not None:
                    try:
                        X_vals = scaler.transform(X)
                        X = pd.DataFrame(X_vals, columns=X.columns)
                    except Exception: pass

                raw_pred = float(m['xgb_storage'].predict(X)[0])

                # De-scale price if price_scaler was applied to target
                price_sc = m.get('xgb_price_sc')
                if price_sc is not None:
                    try:
                        raw_pred = float(price_sc.inverse_transform([[raw_pred]])[0][0])
                    except Exception: pass

                # XGBoost may predict storage_days or price — treat as days if in range
                if 7 <= raw_pred <= 1000:
                    ml_storage_days   = int(round(raw_pred))
                    ml_prediction_used = True
                    ml_debug = {'raw_xgb': raw_pred, 'features': row}
            except Exception as ml_exc:
                print(f"[predict] XGBoost ML error: {ml_exc}")

        # ── Step 3: Physics-based storage life (always computed as reference) ─
        physics_storage = _compute_storage_life(bag_type, moisture_pct, temp_c)

        # ── Step 4: Final storage = ML if available, else physics ─────────────
        if ml_prediction_used and ml_storage_days:
            # Blend: 60% ML, 40% physics for robustness
            blended_days = int(round(ml_storage_days * 0.6 + physics_storage['storage_days'] * 0.4))
            blended_days = max(7, blended_days)
            storage = dict(physics_storage)
            storage['storage_days']   = blended_days
            storage['storage_months'] = round(blended_days / 30.0, 1)
            storage['prediction_method'] = 'XGBoost Hybrid'
            storage['ml_days']        = ml_storage_days
            storage['physics_days']   = physics_storage['storage_days']
        else:
            storage = physics_storage
            storage['prediction_method'] = 'Physics Model'

        # ── Step 5: Price, risk, costs ────────────────────────────────────────
        price    = _get_price_forecast(variety)
        risk     = _compute_risk_score(
            moisture_pct, bag_type, duration_months,
            quantity_kg, has_pest_history, storage_location, temp_c
        )
        costs    = _compute_storage_costs(
            quantity_kg, bag_type, duration_months,
            storage_location, price['current_lkr'], price['peak_lkr']
        )
        festival = _get_next_festival()

        buf    = storage['storage_days'] - price['days_to_peak']
        signal = (
            'RED'    if storage['storage_days'] < price['days_to_peak'] or moisture_pct > 16
            else 'GREEN' if buf > 15 and moisture_pct <= 14
            else 'YELLOW'
        )

        return jsonify({
            'success':       True,
            'variety':       variety,
            'quantity_kg':   quantity_kg,
            'timestamp':     datetime.utcnow().isoformat(),
            'storage':       storage,
            'price':         price,
            'risk':          risk,
            'costs':         costs,
            'signal':        signal,
            'buffer_days':   buf,
            'next_festival': festival,
            # Indoor environment (ML fine-tuned)
            'indoor_environment': {
                'indoor_temp_c':      round(indoor_temp_pred, 1),
                'indoor_humidity_pct':round(indoor_humid_pred, 1),
                'outdoor_avg_temp':   outdoor_avg_temp,
                'outdoor_avg_humid':  outdoor_avg_humid,
                'weather_source':     weather_source,
                'storage_alerts':     storage_alerts,
                'hourly_profile':     hourly_profile,   # 24 entries: {hour, temp, humidity}
            },
            'risk_reward': {
                'signal':               signal,
                'buffer_days':          buf,
                'potential_profit_lkr': costs['net_profit'],
                'action': (
                    "Sell immediately — storage risk too high or moisture too dangerous"
                    if signal == 'RED' else
                    "Safe to store — good profit opportunity ahead"
                    if signal == 'GREEN' else
                    "Dry paddy to 13% first, then reassess"
                ),
                'intervention_viable': (moisture_pct > 13.5 and moisture_pct <= 16),
                'days_after_drying': storage['storage_days'] + 60 if moisture_pct > 13.5 else 0
            },
            'summary': {
                'signal':          signal,
                'storage_days':    storage['storage_days'],
                'days_to_peak':    price['days_to_peak'],
                'buffer_days':     buf,
                'risk_score':      risk['score'],
                'risk_category':   risk['category'],
                'current_price':   price['current_lkr'],
                'peak_price':      price['peak_lkr'],
                'net_profit':      costs['net_profit'],
                'recommendation': (
                    "Sell immediately — storage risk too high or moisture too dangerous"
                    if signal == 'RED' else
                    "Safe to store — good profit opportunity ahead"
                    if signal == 'GREEN' else
                    "Dry paddy to 13% first, then reassess"
                ),
            },
        }), 200

    except ValueError as exc:
        return jsonify({'error': f'Invalid input: {exc}'}), 400
    except Exception as exc:
        current_app.logger.error(f'[predict] {exc}')
        return jsonify({'error': 'Prediction failed', 'detail': str(exc)}), 500


# ─── /advice ──────────────────────────────────────────────────────────────────
@postharvest_bp.route('/advice', methods=['POST'])
def get_advice():
    """
    POST /api/guardian/advice
    Full AI advisory: sell vs store decision with detailed options.
    Supports multilingual output via lang parameter: en | si | ta
    Uses qwen2.5:7b via Ollama (local, no API key needed).
    """
    try:
        data            = request.get_json() or {}
        variety         = data.get('variety', 'Bg 300')
        moisture_pct    = float(data.get('moisture_pct', 13.0))
        temp_c          = float(data.get('temp_c', 28.0))
        humidity_pct    = float(data.get('humidity_pct', 65.0))
        bag_type        = data.get('bag_type', data.get('storage_method', 'gunny'))
        quantity_kg     = float(data.get('quantity_kg', 1000.0))
        storage_days    = int(data.get('storage_days', 90))
        days_to_peak    = int(data.get('days_to_peak', 84))
        current_price   = float(data.get('current_price', 249.58))
        peak_price      = float(data.get('peak_price', 261.67))
        signal          = data.get('signal', 'YELLOW')
        net_profit      = float(data.get('net_profit', 0))
        festival        = data.get('next_festival', _get_next_festival())
        mode            = data.get('mode', 'general')
        farmer_notes    = data.get('context', data.get('notes', 'None provided.'))
        lang            = data.get('lang', 'en')
        target_lang     = LANGUAGE_CODES.get(lang, 'english')

        fest_str = (
            f"{festival['name']} in {festival['days_away']} days (+{festival['boost_pct']}% price boost)"
            if festival else "No major Sri Lankan festival in next 30 days"
        )

        system_prompt = f"""You are the Senior Post-Harvest Business Advisor for Sri Lankan rice farmers (DOA certified).

NON-NEGOTIABLE AGRONOMIC FACTS (SLR 603:2013):
- Grade A: MC ≤ 14%. Grade B: MC 14–16%. Grade C: MC > 16%.
- Hermetic bags: 9 months safe. Gunny: 75 days. PP Woven: 120 days.
- Festival price boosts: Thai Pongal +15%, Avurudu +25%, Vesak +15%, Christmas +12%.
- Glut seasons (Mar–Apr, Aug–Sep): lowest prices. Holding is usually wrong during glut.

DECISION RULES:
1. MC > 16% → ALWAYS recommend immediate sale or sun-drying first. Never recommend storing.
2. Storage life < days to price peak → ALWAYS recommend sell now.
3. Net profit < 0 after storage costs → Storing is a loss — recommend sell.
4. GREEN signal + MC ≤ 13% → Confidently recommend storing with specific steps.
5. YELLOW signal → Recommend drying to 13% first, then reassess.

LANGUAGE: Respond ENTIRELY in {target_lang}. Every word of the advice content must be in {target_lang}.
Keep ALL JSON keys in English — only the values should be in {target_lang}.

STRICT JSON RESPONSE:
{{
  "signal": "SELL NOW or STORE or DRY FIRST THEN STORE",
  "headline": "one powerful sentence in {target_lang}",
  "sell_option": {{
    "value_lkr": {round(quantity_kg * current_price)},
    "rationale": "plain 1-sentence reason in {target_lang}"
  }},
  "store_option": {{
    "steps": ["preparation step 1 in {target_lang}", "step 2", "step 3"],
    "projected_value_lkr": {round(quantity_kg * peak_price)},
    "conditions": "what conditions MUST be true — in {target_lang}"
  }},
  "festival_advice": "specific advice about upcoming Sri Lankan festival in {target_lang}",
  "quick_wins": ["immediate action 1 in {target_lang}", "action 2", "action 3"],
  "danger_warning": null
}}"""

        user_content = json.dumps({
            'variety':               variety,
            'quantity_kg':           quantity_kg,
            'moisture_pct':          moisture_pct,
            'temp_c':                temp_c,
            'humidity_pct':          humidity_pct,
            'bag_type':              bag_type,
            'storage_life_days':     storage_days,
            'days_to_price_peak':    days_to_peak,
            'current_price_lkr':     current_price,
            'peak_price_lkr':        peak_price,
            'net_profit_lkr':        net_profit,
            'risk_signal':           signal,
            'next_sri_lankan_festival': fest_str,
            'farmer_notes':          farmer_notes,
            'sell_now_total_lkr':    round(quantity_kg * current_price),
            'sell_peak_total_lkr':   round(quantity_kg * peak_price),
            'response_language':     target_lang,
        })

        llm_raw = _call_ollama(system_prompt, user_content, format_json=True,
                               model="qwen2.5:7b", max_tokens=1536)
        if llm_raw:
            try:
                advice = json.loads(_clean_json(llm_raw))
                return jsonify({
                    'success': True,
                    'advice':  advice,
                    'lang':    lang,
                    'source':  'qwen2.5:7b'
                }), 200
            except Exception as exc:
                print(f'[advice] parse error: {exc}')

        fallback = _rule_based_advice(signal, storage_days, days_to_peak,
                                      current_price, peak_price, quantity_kg,
                                      net_profit, buf=storage_days - days_to_peak,
                                      variety=variety)
        return jsonify({
            'success': True,
            'advice':  fallback,
            'lang':    lang,
            'source':  'rule_based_fallback'
        }), 200

    except Exception as exc:
        current_app.logger.error(f'[advice] {exc}')
        return jsonify({'error': str(exc)}), 500


def _rule_based_advice(signal, storage_days, days_to_peak, current_price,
                        peak_price, quantity_kg, net_profit, buf, variety):
    """Fallback advice when Ollama is not available."""
    sell_now_val = round(current_price * quantity_kg)
    wait_val     = round(peak_price   * quantity_kg)
    if signal == 'RED':
        headline = f"Sell immediately — your {variety} will spoil before price peaks."
        steps    = ["Sell as soon as possible", "Do not attempt long storage", "Contact nearest Economic Center"]
    elif signal == 'GREEN':
        headline = f"Safe to store — potential profit of Rs. {net_profit:,.0f} awaiting."
        steps    = ["Dry paddy to 13% moisture", "Use hermetic or woven bags", "Monitor weekly for pests", "Wait for festival season"]
    else:
        headline = f"Dry paddy to 13% first — then reassess your storage decision."
        steps    = ["Sun-dry paddy for 2–3 days", "Test moisture with salt bottle test", "Switch to hermetic bags", "Check price again after drying"]

    return {
        "signal":   "SELL NOW" if signal == "RED" else "STORE" if signal == "GREEN" else "DRY FIRST THEN STORE",
        "headline": headline,
        "sell_option": {
            "value_lkr": sell_now_val,
            "rationale": "Guaranteed income today with zero spoilage risk."
        },
        "store_option": {
            "steps": steps,
            "projected_value_lkr": wait_val,
            "conditions": f"Moisture must be below 14%, use hermetic bags, monitor weekly."
        },
        "festival_advice": "Check upcoming Sinhala New Year (April) for best prices — typically +25% boost.",
        "quick_wins": ["Test moisture today", "Check bags for holes", "Place neem leaves inside bags"],
        "danger_warning": "Immediate drying required — do not store above 16% moisture." if signal == "RED" else None
    }


# ─── /advice/explain (lightweight multilingual endpoint) ─────────────────────
@postharvest_bp.route('/advice/explain', methods=['POST'])
def explain_advice():
    """
    POST /api/guardian/advice/explain
    Lightweight endpoint: takes prediction summary, returns LLM explanation
    in the requested language.
    """
    try:
        data         = request.get_json() or {}
        variety      = data.get('variety',      'Bg 300')
        quantity_kg  = float(data.get('quantity_kg',   1000))
        moisture_pct = float(data.get('moisture_pct',  13.0))
        storage_days = int(data.get('storage_days',    90))
        days_to_peak = int(data.get('days_to_peak',    84))
        current_price= float(data.get('current_price', 249.58))
        peak_price   = float(data.get('peak_price',    261.67))
        signal       = data.get('signal', 'YELLOW')
        net_profit   = float(data.get('net_profit', 0))
        lang         = data.get('lang', 'en')
        target_lang  = LANGUAGE_CODES.get(lang, 'english')
        festival     = _get_next_festival()

        fest_str = (
            f"{festival['name']} in {festival['days_away']} days (+{festival['boost_pct']}% boost)"
            if festival else "No upcoming festival"
        )

        system_prompt = f"""You are the Senior Post-Harvest Business Advisor for Sri Lankan rice farmers.
Respond ENTIRELY in {target_lang}. Every word must be in {target_lang}.
Keep ALL JSON keys in English — only the values in {target_lang}.

STRICT JSON RESPONSE:
{{
  "signal": "SELL NOW or STORE or DRY FIRST THEN STORE",
  "headline": "one powerful sentence in {target_lang}",
  "sell_option": {{
    "value_lkr": {round(quantity_kg * current_price)},
    "rationale": "reason in {target_lang}"
  }},
  "store_option": {{
    "steps": ["step 1 in {target_lang}", "step 2", "step 3"],
    "projected_value_lkr": {round(quantity_kg * peak_price)},
    "conditions": "conditions in {target_lang}"
  }},
  "festival_advice": "festival advice in {target_lang}",
  "quick_wins": ["tip 1 in {target_lang}", "tip 2", "tip 3"],
  "danger_warning": null
}}"""

        user_content = json.dumps({
            'variety':            variety,
            'quantity_kg':        quantity_kg,
            'moisture_pct':       moisture_pct,
            'storage_life_days':  storage_days,
            'days_to_price_peak': days_to_peak,
            'current_price_lkr':  current_price,
            'peak_price_lkr':     peak_price,
            'net_profit_lkr':     net_profit,
            'risk_signal':        signal,
            'festival':           fest_str,
            'response_language':  target_lang,
        })

        llm_raw = _call_ollama(system_prompt, user_content,
                               format_json=True, model="qwen2.5:7b", max_tokens=1536)
        if llm_raw:
            try:
                advice = json.loads(_clean_json(llm_raw))
                return jsonify({'success': True, 'advice': advice, 'lang': lang,
                                'source': 'qwen2.5:7b'}), 200
            except Exception as exc:
                print(f"[explain_advice] parse error: {exc}")

        fallback = _rule_based_advice(signal, storage_days, days_to_peak,
                                      current_price, peak_price, quantity_kg,
                                      net_profit, storage_days - days_to_peak, variety)
        return jsonify({'success': True, 'advice': fallback, 'lang': lang,
                        'source': 'rule_based_fallback'}), 200

    except Exception as exc:
        current_app.logger.error(f'[explain_advice] {exc}')
        return jsonify({'error': str(exc)}), 500


# ─── /risk_score ──────────────────────────────────────────────────────────────
@postharvest_bp.route('/risk_score', methods=['POST'])
def risk_score_endpoint():
    """POST /api/guardian/risk_score — Farmer-friendly safety score (0-100)."""
    try:
        data             = request.get_json() or {}
        moisture_pct     = float(data.get('moisture_pct', 13.0))
        bag_type         = data.get('bag_type', data.get('container', 'gunny'))
        duration_months  = float(data.get('duration_months', data.get('duration', 3)))
        quantity_kg      = float(data.get('quantity_kg',  data.get('quantity', 1000)))
        has_pest_history = data.get('has_pest_history', False)
        storage_location = data.get('storage_location', data.get('location_type', 'home'))
        temp_c           = float(data.get('temp_c', 28.0))

        risk_data = _compute_risk_score(
            moisture_pct, bag_type, duration_months,
            quantity_kg, has_pest_history, storage_location, temp_c
        )

        system_prompt = """You are the Post-Harvest Safety Officer for Sri Lankan rice farmers (SLR 603:2013 expert).
Given a risk score and risk factors, write plain, empathetic advice for a village farmer.
Use simple English. No technical jargon. Be direct.

STRICT JSON RESPONSE:
{
  "verdict": "2-sentence plain verdict — what does this score mean for THIS farmer right now?",
  "urgent_action": "the ONE most important step to take today",
  "loss_if_ignored": "how much rice (kg and LKR) they risk losing if nothing is done",
  "farmer_tip": "one practical traditional Sri Lankan tip (neem kohomba leaves, salt test, cadjan mat, etc.)"
}"""

        user_content = (
            f"Score: {risk_data['score']}/100, Category: {risk_data['category']}, "
            f"Moisture: {moisture_pct}%, Bag: {bag_type}, Duration: {duration_months} months, "
            f"Quantity: {quantity_kg}kg, Pest history: {has_pest_history}, "
            f"Location: {storage_location}, Temp: {temp_c}°C, "
            f"Factors: {json.dumps(risk_data['risk_factors'])}"
        )

        llm_raw = _call_ollama(system_prompt, user_content, format_json=True)
        ai_data = {}
        if llm_raw:
            try:
                ai_data = json.loads(_clean_json(llm_raw))
            except Exception:
                pass

        return jsonify({
            'success':          True,
            'score':            risk_data['score'],
            'category':         risk_data['category'],
            'color':            risk_data['color'],
            'loss_estimate':    risk_data['loss_estimate'],
            'risk_factors':     risk_data['risk_factors'],
            'storage_life':     risk_data['storage_life'],
            'ai_verdict':       ai_data.get('verdict',
                                 f"Risk level is {risk_data['category']}. Check moisture immediately."),
            'ai_urgent':        ai_data.get('urgent_action',
                                 'Verify moisture content and ensure bags are sealed tightly.'),
            'ai_loss_warning':  ai_data.get('loss_if_ignored',
                                 f"Estimated {risk_data['loss_estimate']} weight loss if unaddressed."),
            'ai_farmer_tip':    ai_data.get('farmer_tip',
                                 'Place dried neem (kohomba) leaves inside bags to repel weevils naturally.'),
        }), 200

    except Exception as exc:
        current_app.logger.error(f'[risk_score] {exc}')
        return jsonify({'error': str(exc)}), 500


# ─── /calculate_costs ─────────────────────────────────────────────────────────
@postharvest_bp.route('/calculate_costs', methods=['POST'])
def calculate_costs():
    """POST /api/guardian/calculate_costs — Real Sri Lankan LKR storage economics with AI verdict."""
    try:
        data             = request.get_json() or {}
        quantity_kg      = float(data.get('quantity_kg', data.get('quantity', 1000)))
        bag_type         = data.get('bag_type', data.get('container', 'gunny'))
        duration_months  = float(data.get('duration_months', data.get('duration', 3)))
        storage_location = data.get('storage_location', data.get('storage_type', 'home'))
        variety          = data.get('variety', 'Bg 300')

        pf             = _get_price_forecast(variety)
        current_price  = float(data.get('current_price',  pf['current_lkr']))
        expected_price = float(data.get('expected_price', pf['peak_lkr']))

        costs = _compute_storage_costs(
            quantity_kg, bag_type, duration_months,
            storage_location, current_price, expected_price
        )

        system_prompt = """You are the Agricultural Economist for the Department of Agriculture, Sri Lanka.
A farmer is deciding whether to store paddy or sell now. Give direct, honest economic advice.
Use plain language. Use LKR figures from the data provided.

STRICT JSON RESPONSE:
{
  "economic_verdict": "2-sentence plain verdict in LKR — is it worth storing?",
  "best_advice": "specific step-by-step recommendation for this farmer's exact situation",
  "risk_warning": "the #1 financial risk if they proceed with storing",
  "comparison": "compare storing vs selling today: exact LKR numbers"
}"""

        user_content = json.dumps({
            'quantity_kg': quantity_kg, 'bag_type': bag_type,
            'duration_months': duration_months, 'storage_location': storage_location,
            'current_price_lkr': current_price, 'expected_price_lkr': expected_price,
            'total_storage_cost_lkr': costs['total_storage_cost'],
            'net_profit_lkr': costs['net_profit'], 'profitability': costs['profitability'],
            'break_even_price': costs['break_even_price'], 'roi_pct': costs['roi_pct'],
            'bags_required': costs['bags_required'],
        })

        llm_raw = _call_ollama(system_prompt, user_content, format_json=True)
        ai_data = {}
        if llm_raw:
            try:
                ai_data = json.loads(_clean_json(llm_raw))
            except Exception:
                pass

        return jsonify({
            'success': True,
            **costs,
            'ai_economic_verdict': ai_data.get('economic_verdict', ''),
            'ai_best_advice':      ai_data.get('best_advice', ''),
            'ai_risk_warning':     ai_data.get('risk_warning', ''),
            'ai_comparison':       ai_data.get('comparison', ''),
        }), 200

    except Exception as exc:
        current_app.logger.error(f'[calculate_costs] {exc}')
        return jsonify({'error': str(exc)}), 500


# ─── /recommend_dealers ───────────────────────────────────────────────────────
@postharvest_bp.route('/recommend_dealers', methods=['POST'])
def recommend_dealers():
    """POST /api/guardian/recommend_dealers — AI-driven dealer recommendation."""
    try:
        data        = request.get_json() or {}
        dealers     = data.get('dealers', [])
        farmer_lat  = float(data.get('farmer_lat', 7.8731))
        farmer_lon  = float(data.get('farmer_lon', 80.7718))
        variety     = data.get('variety', 'Bg 300')
        quantity_kg = float(data.get('quantity_kg', 1000))
        grade       = data.get('grade', 'A')
        lang        = data.get('lang', 'en')
        target_lang = LANGUAGE_CODES.get(lang, 'english')

        if not dealers:
            return jsonify({'success': True, 'recommendations': []})

        results = []
        for d in dealers:
            d_lat = float(d.get('latitude', 0))
            d_lon = float(d.get('longitude', 0))
            dist  = _haversine_km(farmer_lat, farmer_lon, d_lat, d_lon)

            has_transport = d.get('hasTransport', False)
            cost_per_km   = float(d.get('transportCostPerKm', 0))
            min_charge    = float(d.get('transportMinCharge', 0))
            effective_dist= max(0, dist - 5)
            trans_cost    = max(min_charge, effective_dist * cost_per_km) if has_transport else (dist * 120)

            unit_price    = float(d.get('price', d.get('pricePerKg', 240)))
            total_revenue = unit_price * quantity_kg
            net_profit    = total_revenue - trans_cost

            results.append({
                'id':               d.get('id'),
                'name':             d.get('dealerName', 'Unknown Dealer'),
                'contact':          d.get('contactNumber', ''),
                'location':         d.get('locationName', ''),
                'price':            unit_price,
                'distance_km':      round(dist, 1),
                'transport_cost':   round(trans_cost),
                'net_profit':       round(net_profit),
                'has_transport':    has_transport,
                'reliability_score':d.get('reliability', 85),
                'capacity_kg':      d.get('capacityKg', 5000),
            })

        results.sort(key=lambda x: (-x['net_profit'], x['distance_km']))

        system_prompt = f"""You are an Agricultural Market Expert for GoviMithuru Sri Lanka.
Pick the BEST dealer and explain WHY in {target_lang}. Focus on profit and distance.
ALWAYS return in {target_lang}.
STRICT JSON: {{"verdict": "reason", "top_reason": "one key advantage"}}"""

        user_content = f"Variety: {variety}, Qty: {quantity_kg}kg, Grade: {grade}\nDealers: {json.dumps(results[:5])}"

        llm_raw  = _call_ollama(system_prompt, user_content, format_json=True)
        ai_advice = {}
        if llm_raw:
            try:
                ai_advice = json.loads(_clean_json(llm_raw))
            except Exception:
                pass

        return jsonify({
            'success':         True,
            'recommendations': results,
            'ai_verdict':      ai_advice.get('verdict',
                               'Best dealer picked based on maximum net profit after transport costs.'),
            'top_pick_id':     results[0]['id'] if results else None
        }), 200

    except Exception as exc:
        current_app.logger.error(f'[recommend_dealers] {exc}')
        return jsonify({'error': str(exc)}), 500


# ─── /recommend_storage ───────────────────────────────────────────────────────
@postharvest_bp.route('/recommend_storage', methods=['POST'])
def recommend_storage():
    """POST /api/guardian/recommend_storage — AI picks best storage container."""
    try:
        data            = request.get_json() or {}
        quantity_kg     = float(data.get('quantity_kg', 1000))
        duration_months = float(data.get('duration_months', 3))
        moisture_pct    = float(data.get('moisture_pct', 13.5))
        temp_c          = float(data.get('temp_c', 28.0))
        budget_lkr      = float(data.get('budget_lkr', 0))
        variety         = data.get('variety', 'Bg 300')
        lang            = data.get('lang', 'en')
        target_lang     = LANGUAGE_CODES.get(lang, 'english')

        pf      = _get_price_forecast(variety)
        options = []
        for bt in ['hermetic', 'woven', 'gunny', 'metalbin']:
            life   = _compute_storage_life(bt, moisture_pct, temp_c)
            cost   = _compute_storage_costs(
                quantity_kg, bt, duration_months, 'home',
                pf['current_lkr'], pf['peak_lkr']
            )
            viable = life['storage_days'] >= (duration_months * 30.0)
            options.append({
                'bag_type':       bt,
                'storage_days':   life['storage_days'],
                'storage_months': life['storage_months'],
                'viable':         viable,
                'bags_needed':    cost['bags_required'],
                'total_cost_lkr': cost['total_storage_cost'],
                'net_profit_lkr': cost['net_profit'],
                'grade':          life['grade'],
                'risk':           life['risk'],
                'explanation':    life['explanation'],
            })

        options.sort(key=lambda x: (-int(x['viable']), -x['net_profit_lkr']))

        system_prompt = f"""You are the Post-Harvest Storage Specialist for the Department of Agriculture, Sri Lanka.
Recommend the BEST storage container. Be direct. Give ONE clear recommendation in {target_lang}.
ALWAYS return the response in {target_lang}.

STRICT JSON RESPONSE:
{{
  "recommended_bag": "hermetic|woven|gunny|metalbin",
  "recommendation_headline": "one sentence in {target_lang}",
  "why_others_unsuitable": "brief plain reason in {target_lang}",
  "preparation_steps": ["step 1 in {target_lang}", "step 2", "step 3"],
  "where_to_buy_in_sl": "specific Sri Lanka purchase locations in {target_lang}",
  "cost_justification": "cost worth it? In LKR in {target_lang}."
}}"""

        user_content = json.dumps({
            'variety': variety, 'quantity_kg': quantity_kg,
            'duration_months': duration_months, 'moisture_pct': moisture_pct,
            'temp_c': temp_c, 'budget_lkr': budget_lkr,
            'options_analysis': options,
        })

        llm_raw = _call_ollama(system_prompt, user_content, format_json=True)
        ai_rec  = {}
        if llm_raw:
            try:
                ai_rec = json.loads(_clean_json(llm_raw))
            except Exception:
                pass

        if not ai_rec.get('recommended_bag'):
            best = options[0] if options else {}
            ai_rec = {
                'recommended_bag':          best.get('bag_type', 'hermetic'),
                'recommendation_headline':  f"Best option for {quantity_kg}kg for {duration_months} months.",
                'preparation_steps':        ['Clean and dry the storage area', 'Check bags for holes', 'Place bags on pallets'],
                'where_to_buy_in_sl':       'Agrarian Service Centers island-wide, Economic Centers, CIC outlets',
                'cost_justification':       f"Net profit: LKR {best.get('net_profit_lkr', 0):,.0f}",
            }

        return jsonify({
            'success':           True,
            'options':           options,
            'ai_recommendation': ai_rec,
            'best_option':       options[0] if options else None,
        }), 200

    except Exception as exc:
        return jsonify({'error': str(exc)}), 500


# ─── /dashboard_summary ───────────────────────────────────────────────────────
@postharvest_bp.route('/dashboard_summary', methods=['POST'])
def dashboard_summary():
    """POST /api/guardian/dashboard_summary — AI situational overview for all harvest batches."""
    try:
        data     = request.get_json() or {}
        harvests = data.get('harvests', [])
        temp     = float(data.get('temp', 28.0))
        humidity = float(data.get('humidity', 65.0))

        if not harvests:
            return jsonify({
                'type':  'IDLE', 'label': 'NO STOCK',
                'msg':   'Register your harvest to start monitoring.',
                'color': '#64748b', 'bg': ['#1e293b', '#0f172a'],
            })

        batch_summaries = []
        for h in harvests:
            mc   = float(h.get('moisturePct', h.get('moisture_pct', h.get('moisture', 13.5))))
            qty  = float(h.get('quantityKg',  h.get('quantity_kg', 1000)))
            bt   = h.get('bagType', h.get('bag_type', h.get('storageMethod', 'gunny')))
            risk = _compute_risk_score(mc, bt, 3, qty, False, 'home', temp)
            batch_summaries.append({
                'variety':       h.get('variety', 'Unknown'),
                'moisture_pct':  mc,
                'quantity_kg':   qty,
                'bag_type':      bt,
                'risk_score':    risk['score'],
                'risk_category': risk['category'],
            })

        critical_count = sum(1 for b in batch_summaries if b['risk_category'] == 'CRITICAL')
        high_count     = sum(1 for b in batch_summaries if b['risk_category'] in ['CRITICAL', 'HIGH'])

        system_prompt = """You are the Post-Harvest Situational Analyst for GoviMithuru Sri Lanka.
Analyse all harvest batches and give ONE overall dashboard status.

STRICT JSON (no extra fields):
{
  "type": "CRITICAL"|"WARN"|"SELL"|"HOLD"|"GOOD",
  "label": "SHORT UPPERCASE LABEL (max 3 words)",
  "msg": "One powerful, actionable sentence (max 12 words).",
  "color": "hex color code",
  "bg": ["hex_gradient_start","hex_gradient_end"]
}
COLOR GUIDE: CRITICAL→#f87171,bg=[#450a0a,#2d0606] | WARN→#fbbf24,bg=[#422006,#2d1a03] | GOOD→#34d399,bg=[#064e3b,#022c22]"""

        user_content = (
            f"Batches: {json.dumps(batch_summaries)}, "
            f"Critical: {critical_count}, High-risk: {high_count}, "
            f"Outdoor Temp: {temp}°C, Humidity: {humidity}%"
        )

        llm_raw = _call_ollama(system_prompt, user_content, format_json=True,
                               model='qwen2.5:7b', max_tokens=256)
        if llm_raw:
            try:
                result = json.loads(_clean_json(llm_raw))
                if all(k in result for k in ['type', 'label', 'msg', 'color', 'bg']):
                    return jsonify(result)
            except Exception:
                pass

        if critical_count > 0:
            return jsonify({'type': 'CRITICAL', 'label': 'URGENT ACTION',
                            'msg': 'Critical moisture risk — act now.',
                            'color': '#f87171', 'bg': ['#450a0a', '#2d0606']})
        if high_count > 0:
            return jsonify({'type': 'WARN', 'label': 'CHECK STOCK',
                            'msg': 'Some batches need attention.',
                            'color': '#fbbf24', 'bg': ['#422006', '#2d1a03']})
        return jsonify({'type': 'GOOD', 'label': 'STOCK SAFE',
                        'msg': 'All batches within safe limits.',
                        'color': '#34d399', 'bg': ['#064e3b', '#022c22']})

    except Exception as exc:
        return jsonify({'error': str(exc)}), 500


# ─── /inspect ─────────────────────────────────────────────────────────────────
@postharvest_bp.route('/inspect', methods=['POST'])
def inspect():
    """POST /api/guardian/inspect — Validates farmer input for agronomic impossibilities."""
    data        = request.get_json() or {}
    variety     = data.get('variety', 'Unknown')
    quantity_kg = float(data.get('quantity_kg', 0))
    acres       = float(data.get('acres', 0))
    moisture    = float(data.get('moisture_pct', data.get('moisture', 0)))
    grade       = data.get('grade', 'A')
    bag_type    = data.get('bag_type', 'gunny')

    warnings = []

    if acres > 0 and quantity_kg > 0:
        ypa = quantity_kg / acres
        if ypa > 4500:
            warnings.append({
                'type': 'YIELD_HIGH',
                'message':    f'Reported yield {int(ypa):,} kg/acre is unusually high for Sri Lanka.',
                'suggestion': f'Average yield is 2,500–3,500 kg/acre. Verify your land area ({acres} acres) or quantity ({quantity_kg:,} kg).'
            })
        elif ypa < 500:
            warnings.append({
                'type': 'YIELD_LOW',
                'message':    f'Reported yield only {int(ypa):,} kg/acre — very low.',
                'suggestion': 'Check if land area is entered correctly. Contact Agrarian Service Center if yield was genuinely this low.'
            })

    if grade == 'A' and moisture > 14.0:
        warnings.append({
            'type': 'GRADE_CONFLICT',
            'message':    f'Grade A selected but moisture is {moisture}% (above 14%).',
            'suggestion': 'Grade A requires MC below 14%. Either dry the paddy or select Grade B/C.'
        })

    if moisture > 25:
        warnings.append({
            'type': 'MOISTURE_IMPOSSIBLE',
            'message':    f'Moisture {moisture}% is unrealistic for paddy.',
            'suggestion': 'Please check your moisture meter calibration.'
        })
    elif 0 < moisture < 7:
        warnings.append({
            'type': 'MOISTURE_OVERDRY',
            'message':    f'Moisture {moisture}% — critically over-dried.',
            'suggestion': 'MC below 7% will cause severe milling breakage. Ideal range: 12–14%.'
        })

    key = _normalize_bag_type(bag_type)
    if key == 'polythene' and quantity_kg > 2000:
        warnings.append({
            'type': 'BAG_QUANTITY_MISMATCH',
            'message':    f'Polythene bags not suitable for {quantity_kg:,.0f} kg.',
            'suggestion': 'For quantities over 1,000 kg, use PP Woven, Gunny, or Hermetic bags.'
        })

    if moisture > 18:
        warnings.append({
            'type': 'CRITICAL_MOISTURE',
            'message':    f'MC {moisture}% is critical — DO NOT STORE.',
            'suggestion': 'This paddy will develop aflatoxin within days. Sun-dry to below 14% first.'
        })

    return jsonify({
        'is_valid':      len(warnings) == 0,
        'warnings':      warnings,
        'warning_count': len(warnings),
    }), 200


# ─── /chat ────────────────────────────────────────────────────────────────────
@postharvest_bp.route('/chat', methods=['POST'])
def chat():
    """
    POST /api/guardian/chat
    ─────────────────────────────────────────────────────────────────────────
    Multilingual expert AI chat for Sri Lankan paddy farmers.
    Powered by qwen2.5:7b via local Ollama (no API key required).

    Supported languages:
        en           → English
        si           → Sinhala (සිංහල)
        ta           → Tamil (தமிழ்)
        ta-tanglish  → Tamil written in English letters
        si-singlish  → Sinhala written in English letters

    Request body (all fields optional except `question`):
    {
        "question":  "How do I test moisture content?",
        "lang":      "si",                  ← en | si | ta | ta-tanglish | si-singlish
        "context": {
            "requested_language": "si",     ← overrides lang if present
            "step_title":         "Moisture Testing",
            "storage_type":       "Home",
            "sub_category":       "Kitchen/Room Storage",
            "variety":            "Bg 352",
            "quantity":           1000,
            "moisture":           13.5,
            "storage_method":     "hermetic"
        },
        "history": [                        ← last 4–6 messages for context
            {"role": "user",      "content": "..."},
            {"role": "assistant", "content": "..."}
        ]
    }

    Response:
    {
        "success":       true,
        "answer":        "<plain text in requested language>",
        "language_code": "si",
        "source":        "qwen2.5:7b"  | "rule_based_fallback"
    }
    ─────────────────────────────────────────────────────────────────────────
    """
    try:
        data      = request.get_json() or {}
        question  = str(data.get('question', '')).strip()
        context   = data.get('context', {})
        history   = data.get('history', [])

        # ── Language resolution: context.requested_language > body.lang > 'en' ──
        lang_code = (
            context.get('requested_language')
            or data.get('lang', 'en')
        )
        # Normalize to one of the five supported codes
        if lang_code not in ('en', 'si', 'ta', 'ta-tanglish', 'si-singlish'):
            lang_code = 'en'

        if not question:
            return jsonify({
                'success': False,
                'error':   'Question is required.',
                'answer':  '',
            }), 400

        # ── Build context string from optional context fields ───────────────
        ctx_parts = []
        if context.get('step_title'):     ctx_parts.append(f"Storage Step: {context['step_title']}")
        if context.get('storage_type'):   ctx_parts.append(f"Storage Type: {context['storage_type']}")
        if context.get('sub_category'):   ctx_parts.append(f"Sub-category: {context['sub_category']}")
        if context.get('variety'):        ctx_parts.append(f"Rice Variety: {context['variety']}")
        if context.get('quantity'):       ctx_parts.append(f"Quantity: {context['quantity']} kg")
        if context.get('moisture'):       ctx_parts.append(f"Moisture: {context['moisture']}%")
        if context.get('storage_method'): ctx_parts.append(f"Container: {context['storage_method']}")
        ctx_str = " | ".join(ctx_parts) if ctx_parts else "No specific crop context provided"

        # ── Per-language system prompts ─────────────────────────────────────
        # Each prompt hard-codes the output language so qwen2.5:7b stays on track.
        system_prompts = {

            'en': (
                "You are GoviMithuru Post-Harvest Guardian AI — an expert advisor for Sri Lankan paddy farmers.\n"
                f"Farmer context: {ctx_str}\n\n"
                "TOPIC SCOPE: Only answer questions about:\n"
                "  • Rice / paddy storage (hermetic bags, gunny, metal silos, woven bags)\n"
                "  • Drying methods (sun-drying, mechanical dryers, salt bottle test)\n"
                "  • Pest control (weevil/ghun, rats, mold, kohomba neem leaves, Phostoxin)\n"
                "  • Moisture content — SLR 603:2013 standards (Grade A ≤14%, Grade B 14–16%, Grade C >16%)\n"
                "  • Market timing (festival price boosts, glut months, sell vs store decisions)\n"
                "  • LKR economics (storage costs, break-even price, net profit)\n\n"
                "RESPONSE RULES:\n"
                "  • RESPOND IN ENGLISH ONLY.\n"
                "  • Be SHORT — maximum 4 sentences.\n"
                "  • Be practical and empathetic. Use exact LKR prices when relevant.\n"
                "  • Mention local Sri Lankan methods (kohomba, cadjan mat, salt bottle test, pol katu).\n"
                "  • If the question is completely unrelated to post-harvest, politely redirect."
            ),

            'si': (
                "ඔබ ගොවිමිතුරු අස්වනු ආරක්ෂිත AI සහායකයා — ශ්‍රී ලාංකික ගොවීන් සඳහා පළපුරුදු උපදේශකයා.\n"
                f"ගොවි සන්දර්භය: {ctx_str}\n\n"
                "ප්‍රතිචාර නීති:\n"
                "  • සිංහල භාෂාවෙන් පමණක් පිළිතුරු දෙන්න.\n"
                "  • කෙටියෙන් ලිවිය — උපරිම වාක්‍ය 4 ක්.\n"
                "  • ප්‍රායෝගික හා ගෞරවාන්විත ලෙස කතා කරන්න.\n"
                "  • SLR 603 ප්‍රමිතීන් (Grade A MC ≤14%, Grade B 14–16%) සඳහන් කරන්න.\n"
                "  • කොහොඹ කොළ, ලුණු බෝතල් පරීක්ෂාව, පොල් කටු ආදී ශ්‍රී ලාංකික ක්‍රම සඳහන් කරන්න.\n"
                "  • LKR මිල ගණන් අදාළ විට සඳහන් කරන්න.\n"
                "  • අස්වනු ගබඩාවට අදාළ නොවන ප්‍රශ්නයකට කාරුණිකව යොමු කරන්න."
            ),

            'ta': (
                "நீங்கள் கோவிமிதுரு அறுவடைக்குப் பிந்தைய காவலர் AI — இலங்கை நெல் விவசாயிகளுக்கான நிபுணர் ஆலோசகர்.\n"
                f"விவசாயி சூழல்: {ctx_str}\n\n"
                "பதில் விதிகள்:\n"
                "  • தமிழ் மொழியில் மட்டும் பதிலளிக்கவும்.\n"
                "  • சுருக்கமாக — அதிகபட்சம் 4 வாக்கியங்கள்.\n"
                "  • நடைமுறை ரீதியாக மற்றும் மரியாதையாக பேசுங்கள்.\n"
                "  • SLR 603 தரங்கள் (Grade A MC ≤14%, Grade B 14–16%) குறிப்பிடவும்.\n"
                "  • வேம்பு இலை, உப்பு பாட்டில் சோதனை, தென்னை நார் போன்ற இலங்கை முறைகள் குறிப்பிடவும்.\n"
                "  • LKR விலைகள் பொருத்தமானபோது குறிப்பிடவும்.\n"
                "  • களஞ்சியத்திற்கு தொடர்பில்லாத கேள்விகளை மரியாதையாக திருப்பி விடவும்."
            ),

            'ta-tanglish': (
                "You are GoviMithuru AI for Sri Lankan paddy farmers.\n"
                f"Farmer context: {ctx_str}\n\n"
                "CRITICAL RULE: Reply ONLY in Tanglish — Tamil words written in English letters. "
                "NO Tamil script at all. NO pure English paragraphs.\n"
                "Example style: 'Unga paddy 13% moisture vachukonga. Hermetic bag use pannunga — 9 madam safe-a irukkum.'\n"
                "  • Maximum 4 sentences.\n"
                "  • Practical tips using LKR prices.\n"
                "  • Mention Sri Lankan methods (kohomba ilai, uppu bottle test, hermetic bag)."
            ),

            'si-singlish': (
                "You are GoviMithuru AI for Sri Lankan paddy farmers.\n"
                f"Farmer context: {ctx_str}\n\n"
                "CRITICAL RULE: Reply ONLY in Singlish — Sinhala words written in English letters. "
                "NO Sinhala script at all. NO pure English sentences.\n"
                "Example style: 'Oya vee 13% moisture ekata adukaranna. Hermetic bags use karanna — masa 9 k safe.'\n"
                "  • Maximum 4 sentences.\n"
                "  • Practical tips using LKR prices.\n"
                "  • Mention Sri Lankan methods (kohomba kola, lunu bottle test, pol katu)."
            ),
        }

        system_msg = system_prompts.get(lang_code, system_prompts['en'])

        # ── Build conversation string from history ──────────────────────────
        hist_lines = []
        for msg in history[-6:]:                     # keep last 6 turns only
            role    = msg.get('role', 'user')
            content = str(msg.get('content', '')).strip()
            if content:
                label = 'Farmer' if role == 'user' else 'Advisor'
                hist_lines.append(f"{label}: {content}")

        if hist_lines:
            user_msg = "\n".join(hist_lines) + f"\n\nFarmer: {question}"
        else:
            user_msg = f"Farmer: {question}"

        # ── Call Ollama qwen2.5:7b (free-text, not JSON mode) ───────────────
        raw_answer = _call_ollama(
            system_msg,
            user_msg,
            format_json=False,
            model="qwen2.5:7b",
            max_tokens=512,
        )

        if raw_answer:
            # Strip any accidental markdown code blocks
            cleaned = re.sub(r'```[a-z]*\n?|```', '', raw_answer).strip()
            # Remove any stray "Advisor:" prefix the model may add
            cleaned = re.sub(r'^Advisor:\s*', '', cleaned, flags=re.IGNORECASE).strip()
            return jsonify({
                'success':       True,
                'answer':        cleaned,
                'language_code': lang_code,
                'source':        'qwen2.5:7b',
            }), 200

        # ── Rule-based fallback when Ollama is offline ──────────────────────
        fallback_answers = {
            'en': (
                "GoviMithuru AI is temporarily offline. "
                "Key tip: Store paddy at 13% moisture or less (SLR 603 Grade A). "
                "Use hermetic bags for storage over 2 months. "
                "Place dried kohomba (neem) leaves inside bags to repel weevils."
            ),
            'si': (
                "AI සේවාව තාවකාලිකව නොතිබේ. "
                "ප්‍රධාන ඉඟිය: 13% ට අඩු ආර්ද්‍රතාවකින් වී ගබඩා කරන්න (SLR 603 Grade A). "
                "මාස 2 ට වඩා ගබඩා කිරීමට hermetic bags භාවිත කරන්න. "
                "කොහොඹ කොළ ඇට්ටිය තුළ දමා weevil මැදිරිය වළකින්න."
            ),
            'ta': (
                "AI சேவை தற்காலிகமாக இல்லை. "
                "முக்கிய குறிப்பு: 13% ஈரப்பதத்தில் நெல்லை சேமிக்கவும் (SLR 603 Grade A). "
                "2 மாதத்திற்கும் அதிகமான சேமிப்புக்கு hermetic bags பயன்படுத்துங்கள். "
                "பூச்சிகளை விரட்ட உலர்ந்த வேம்பு (kohomba) இலைகளை பைகளில் வையுங்கள்."
            ),
            'ta-tanglish': (
                "AI thaaramaaga offline aagiduchi. "
                "Key tip: 13% moisture-la paddy store pannunga (SLR 603 Grade A). "
                "2 madam mela store pannanumna hermetic bags use pannunga. "
                "Weevil varaamal irukka dry-aana kohomba ilai bag-la podu."
            ),
            'si-singlish': (
                "AI service eka tikak nathi. "
                "Muhunu tip eka: 13% moisture ekata vee godaka karanna (SLR 603 Grade A). "
                "Masa 2 ta vada godaka karanava nam hermetic bags use karanna. "
                "Weevil enna denna epa kiyala dry kohomba kola bag ekata danna."
            ),
        }

        return jsonify({
            'success':       True,
            'answer':        fallback_answers.get(lang_code, fallback_answers['en']),
            'language_code': lang_code,
            'source':        'rule_based_fallback',
        }), 200

    except Exception as exc:
        current_app.logger.error(f'[chat] {exc}')
        return jsonify({
            'success': False,
            'error':   str(exc),
            'answer':  'Advisor temporarily unavailable. Tip: Store paddy at 13% MC or below.',
        }), 500


# ─── /checklist_advice ────────────────────────────────────────────────────────
@postharvest_bp.route('/checklist_advice', methods=['POST'])
def checklist_advice():
    """POST /api/guardian/checklist_advice — AI advice for failed checklist items."""
    try:
        data         = request.get_json() or {}
        failed_items = data.get('failed_items', [])
        variety      = data.get('variety', 'Rice')
        moisture     = data.get('moisture', data.get('moisture_pct', 'Unknown'))

        if not failed_items:
            return jsonify({
                'success': True,
                'guide': '✅ All checks passed! Your harvest is ready for safe storage.'
            })

        system_prompt = (
            "You are the GoviMithuru Storage Safety Inspector (SLR 603:2013 standard). "
            "A Sri Lankan farmer has unchecked critical safety items before storing paddy. "
            "Explain clearly WHY each unchecked item is dangerous. "
            "Give SPECIFIC, practical fixes using locally available materials in Sri Lanka. "
            "Format: numbered list. Max 2 sentences per item. Be firm but respectful."
        )
        user_content = (
            f"Farmer is storing {variety} paddy (Moisture: {moisture}%). "
            f"UNCHECKED ITEMS: {', '.join(failed_items)}."
        )

        guide = _call_ollama(system_prompt, user_content, format_json=False, max_tokens=1024)

        if not guide:
            item_advice = {
                'Moisture content ≤ 14%': 'MC above 14% causes mold within 2 weeks. Sun-dry on clean black polythene for 2–3 days.',
                'Free from visible pests': 'Even 5 weevils can multiply to 50,000 in 3 months. Fumigate with Phostoxin tablet (1 tablet per 50 kg).',
                'Dry floor (no seepage)': 'Ground moisture wicks into bags and raises MC by 2–3% in days. Place coconut husk or wooden pallets.',
                'Good ventilation present': 'Stagnant air raises temperature. Install PVC pipe vents or open shed doors at 5–8 AM daily.',
            }
            lines = []
            for i, item in enumerate(failed_items[:6], 1):
                advice = item_advice.get(item, 'Fix this item before storing. Risk of moisture, pest, or mold damage.')
                lines.append(f"{i}. {item}: {advice}")
            guide = '\n\n'.join(lines)

        return jsonify({'success': True, 'guide': guide}), 200

    except Exception as exc:
        return jsonify({'error': str(exc)}), 500


# ─── /assess-knowledge ────────────────────────────────────────────────────────
@postharvest_bp.route('/assess-knowledge', methods=['POST'])
def assess_knowledge():
    """POST /api/guardian/assess-knowledge — Analyse farmer questions to determine knowledge level."""
    try:
        data      = request.get_json() or {}
        questions = data.get('questions', [])

        if not questions:
            return jsonify({
                'success': True, 'level': 'BEGINNER',
                'description': 'New to post-harvest storage. Starting with the basics.',
                'suggested_tips': [
                    'Learn to test moisture content using the salt bottle method',
                    'Understand the difference between hermetic and gunny bags',
                    'Know the 3 most dangerous pests: weevil, rat, mold'
                ],
            })

        system_prompt = """You are the Agricultural Knowledge Assessor for the Department of Agriculture Sri Lanka.
Analyse the farmer's questions/statements and classify their expertise level.

STRICT JSON RESPONSE:
{
  "level": "ADVANCED" | "INTERMEDIATE" | "BEGINNER",
  "description": "1 sentence explaining why they were classified this way",
  "suggested_tips": ["Tip 1 relevant to their level", "Tip 2", "Tip 3"]
}"""

        llm_raw = _call_ollama(system_prompt, json.dumps(questions), format_json=True)
        if llm_raw:
            try:
                assessment = json.loads(_clean_json(llm_raw))
                return jsonify({
                    'success':        True,
                    'level':          assessment.get('level', 'BEGINNER'),
                    'description':    assessment.get('description', ''),
                    'suggested_tips': assessment.get('suggested_tips', []),
                }), 200
            except Exception:
                pass

        return jsonify({'error': 'Assessment failed'}), 500

    except Exception as exc:
        return jsonify({'success': False, 'error': str(exc)}), 500


# ─── /varieties ───────────────────────────────────────────────────────────────
@postharvest_bp.route('/varieties', methods=['GET'])
def get_varieties():
    """GET /api/guardian/varieties — Return supported rice varieties."""
    return jsonify({
        'success':   True,
        'varieties': ALL_VARIETIES,
        'count':     len(ALL_VARIETIES),
        'note':      'Varieties matching GoviMithuru admin seed management panel.'
    }), 200


# ─── /prices ──────────────────────────────────────────────────────────────────
@postharvest_bp.route('/prices', methods=['GET'])
def get_prices():
    """GET /api/guardian/prices — Current price forecasts ranked by gain potential."""
    ranked = sorted(PRICE_FORECASTS.items(), key=lambda x: x[1]['gain_pct'], reverse=True)
    result = [{
        'variety': k, **v,
        'gain_lkr_per_kg': round(v['peak_lkr'] - v['current_lkr'], 2)
    } for k, v in ranked]
    return jsonify({
        'success':   True,
        'count':     len(result),
        'forecasts': result,
        'updated':   datetime.utcnow().isoformat(),
        'source':    'DOA/HARTI research data 2024/25'
    }), 200


# ─── /health ──────────────────────────────────────────────────────────────────
@postharvest_bp.route('/health', methods=['GET'])
def health():
    """GET /api/guardian/health — Service health check."""
    m = load_models()
    return jsonify({
        'status':     'healthy',
        'models': {
            'xgboost_storage': m.get('storage') is not None,
            'label_encoders':  m.get('encoders') is not None,
            'temp_ml':         m.get('temp_ml_loaded', False),
        },
        'ai_engine':  'qwen2.5:7b via Ollama (local)',
        'languages':  ['en', 'si', 'ta', 'ta-tanglish', 'si-singlish'],
        'varieties':  len(ALL_VARIETIES),
        'timestamp':  datetime.utcnow().isoformat(),
    }), 200


# ─── /quiz ────────────────────────────────────────────────────────────────────
@postharvest_bp.route('/quiz', methods=['GET'])
def get_quiz():
    """GET /api/guardian/quiz — AI-generated knowledge quiz for Sri Lankan paddy farmers."""
    system_prompt = (
        "You are a teacher for Sri Lankan paddy farmers. "
        "Generate 3 multiple-choice questions about paddy storage and moisture. "
        "Use Sri Lankan context (LKR prices, local varieties Bg352, At362, local festivals). "
        "Return ONLY a valid JSON array. No preamble."
    )
    user_prompt = (
        'Generate 3 questions. '
        'FORMAT: JSON array of objects with keys: '
        'question, options (["A. ...", "B. ...", "C. ...", "D. ..."]), '
        'answer ("A", "B", "C", or "D"), explanation (1 practical Sri Lanka tip). '
        'Topics: easy (moisture %), medium (bag selection), harder (festival pricing).'
    )

    raw = _call_ollama(system_prompt, user_prompt, format_json=True)

    fallback = [
        {
            'question':    'What is the maximum safe moisture content for long-term paddy storage in Sri Lanka (SLR 603)?',
            'options':     ['A. 10%', 'B. 13%', 'C. 16%', 'D. 20%'],
            'answer':      'B',
            'explanation': '13% MC is Grade A+ and prevents fungal growth. Above 14% = Grade B, above 16% = Grade C (do not store).'
        },
        {
            'question':    'Which storage method gives the LONGEST protection against weevils for Sri Lankan paddy?',
            'options':     ['A. Gunny (jute) bags', 'B. Polythene bags', 'C. Hermetic airtight bags', 'D. Bamboo baskets'],
            'answer':      'C',
            'explanation': 'Hermetic bags remove oxygen, suffocating weevils and preventing mold. Safe for 9 months at 13% MC.'
        },
        {
            'question':    'During which Sri Lankan festival does paddy price typically rise by 25%?',
            'options':     ['A. Thai Pongal (January)', 'B. Sinhala New Year (April)', 'C. Vesak (May)', 'D. Christmas (December)'],
            'answer':      'B',
            'explanation': 'Sinhala New Year (Avurudu) in April typically brings a 25% price boost — the best time to sell stored paddy.'
        },
    ]

    if not raw:
        return jsonify({'success': True, 'questions': fallback, 'source': 'static'}), 200

    try:
        questions = json.loads(_clean_json(raw))
        if isinstance(questions, list) and len(questions) >= 3:
            return jsonify({'success': True, 'questions': questions, 'source': 'ai'}), 200
    except Exception:
        pass

    return jsonify({'success': True, 'questions': fallback, 'source': 'static'}), 200


# ─── /evaluate-level ──────────────────────────────────────────────────────────
@postharvest_bp.route('/evaluate-level', methods=['POST'])
def evaluate_level():
    """POST /api/guardian/evaluate-level — Evaluate quiz score → farmer knowledge level."""
    data  = request.get_json() or {}
    score = int(data.get('score', 0))
    total = int(data.get('total', 3))
    pct   = (score / total * 100) if total > 0 else 0

    if pct >= 90:
        level = 'ADVANCED'
        desc  = 'Expert farmer: You understand hermetic storage, SLR standards, and market timing.'
    elif pct >= 60:
        level = 'INTERMEDIATE'
        desc  = 'Practitioner: Good basics but could optimize moisture management and market timing.'
    else:
        level = 'BEGINNER'
        desc  = 'Learner: Start with daily moisture testing and basic bag selection.'

    return jsonify({
        'success':     True,
        'level':       level,
        'description': desc,
        'score':       score,
        'total':       total,
        'pct':         round(pct, 1),
        'redirect':    'Dashboard'
    }), 200


# ─── /weather ─────────────────────────────────────────────────────────────────
@postharvest_bp.route('/weather', methods=['GET'])
def get_weather():
    """GET /api/guardian/weather — Real-time weather from Open-Meteo (no API key needed)."""
    lat = request.args.get('lat', default=7.8731, type=float)
    lon = request.args.get('lon', default=80.7718, type=float)
    try:
        url = (
            f"https://api.open-meteo.com/v1/forecast"
            f"?latitude={lat}&longitude={lon}"
            f"&current=temperature_2m,relative_humidity_2m,wind_speed_10m,cloud_cover"
            f"&hourly=temperature_2m,relative_humidity_2m,cloud_cover"
            f"&past_days=1&forecast_days=1&timezone=Asia%2FColombo"
        )
        resp   = requests.get(url, timeout=10)
        resp.raise_for_status()
        d      = resp.json()
        cur    = d.get('current', {})
        hourly = d.get('hourly', {})
        temps  = hourly.get('temperature_2m', [])[-24:]
        humids = hourly.get('relative_humidity_2m', [])[-24:]
        clouds = hourly.get('cloud_cover', [])[-24:]
        w24    = [
            {
                'hour':     i,
                'temp':     temps[i]  if i < len(temps)  else cur.get('temperature_2m', 28),
                'humidity': humids[i] if i < len(humids) else cur.get('relative_humidity_2m', 70),
                'clouds':   clouds[i] if i < len(clouds) else 50,
            }
            for i in range(24)
        ]
        return jsonify({
            'success':      True,
            'temp_c':       cur.get('temperature_2m'),
            'humidity_pct': cur.get('relative_humidity_2m'),
            'wind_speed':   cur.get('wind_speed_10m', 0),
            'cloud_cover':  cur.get('cloud_cover', 50),
            'weather_24h':  w24,
            'source':       'Open-Meteo Realtime',
            'timestamp':    datetime.now().isoformat(),
        }), 200

    except Exception as exc:
        diurnal   = [25.0,24.5,24.0,24.0,24.5,25.5,27.0,29.0,31.0,32.5,33.5,
                     34.0,34.5,34.0,33.5,32.5,31.0,29.5,28.0,27.0,26.5,26.0,25.5,25.0]
        fallback24= [{'hour': i, 'temp': diurnal[i], 'humidity': 72, 'clouds': 50} for i in range(24)]
        return jsonify({
            'success': False, 'fallback': True,
            'temp_c': 28.5, 'humidity_pct': 72,
            'weather_24h': fallback24, 'error': str(exc)
        }), 200


# ─── /weather/predict-storage ─────────────────────────────────────────────────
@postharvest_bp.route('/weather/predict-storage', methods=['POST'])
def predict_storage_conditions():
    """POST /api/guardian/weather/predict-storage — IoT-free indoor storage prediction."""
    try:
        data          = request.get_json() or {}
        lat           = float(data.get('lat', 7.8731))
        lon           = float(data.get('lon', 80.7718))
        rice_moisture = float(data.get('rice_moisture_pct', 13.5))
        storage_cfg   = {
            'storage_type':    data.get('storage_type',    'warehouse'),
            'roof_material':   data.get('roof_material',   'tile'),
            'roof_color':      data.get('roof_color',      'red'),
            'insulation':      bool(data.get('insulation', False)),
            'ventilation':     data.get('ventilation',     'natural'),
            'ceiling_height':  data.get('ceiling_height',  '3-4m'),
            'rice_quantity_kg':float(data.get('rice_quantity_kg', 0) or 0),
        }

        wx_url = (
            f"https://api.open-meteo.com/v1/forecast"
            f"?latitude={lat}&longitude={lon}"
            f"&hourly=temperature_2m,relative_humidity_2m,cloud_cover"
            f"&current=temperature_2m,relative_humidity_2m"
            f"&past_days=1&forecast_days=0&timezone=Asia%2FColombo"
        )
        wx_resp    = requests.get(wx_url, timeout=12)
        wx_resp.raise_for_status()
        wx_data    = wx_resp.json()
        hourly     = wx_data.get('hourly', {})
        cur        = wx_data.get('current', {})
        temps_raw  = (hourly.get('temperature_2m') or [])[-24:]
        humids_raw = (hourly.get('relative_humidity_2m') or [])[-24:]

        while len(temps_raw)  < 24: temps_raw.append(cur.get('temperature_2m', 28.5))
        while len(humids_raw) < 24: humids_raw.append(cur.get('relative_humidity_2m', 72))

        weather_24h       = [{'hour': i, 'temp': temps_raw[i], 'humidity': humids_raw[i], 'clouds': 50}
                              for i in range(24)]
        outdoor_avg_temp  = round(sum(temps_raw)  / 24, 1)
        outdoor_avg_humid = round(sum(humids_raw) / 24, 1)

        result, method = _ml_predict_storage_conditions(
            weather_24h, storage_cfg, rice_moisture, lat, lon
        )

        calib_msg = (
            f"🧠 Hybrid ML Prediction — {result['accuracy_label']}. "
            f"Outdoor avg: {outdoor_avg_temp}°C. Indoor predicted: {result['avg_temperature']}°C."
            if method == "ml_hybrid" else
            f"🔬 Physics Model — {result['accuracy_label']}. "
            f"Outdoor: {outdoor_avg_temp}°C / {outdoor_avg_humid}% RH."
        )

        return jsonify({
            'success': True,
            'indoor': {
                'avg_temperature':  result['avg_temperature'],
                'avg_humidity':     result['avg_humidity'],
                'peak_temperature': result['peak_temperature'],
                'peak_humidity':    result['peak_humidity'],
                'confidence':       result['confidence'],
                'accuracy_label':   result['accuracy_label'],
                'alerts':           result['alerts'],
            },
            'outdoor': {
                'avg_temperature': outdoor_avg_temp,
                'avg_humidity':    outdoor_avg_humid,
            },
            'model_params': {
                'thermal_lag_hours': result['lag_hours_applied'],
                'temp_gain_applied': result['temp_gain_applied'],
                'humidity_factor':   result['humidity_factor'],
                'storage_type':      storage_cfg['storage_type'],
                'roof_material':     storage_cfg['roof_material'],
                'ventilation':       storage_cfg['ventilation'],
            },
            'calibration_message': calib_msg,
            'data_source':         'Open-Meteo 24h',
            'timestamp':           datetime.now().isoformat(),
        }), 200

    except requests.exceptions.RequestException:
        return jsonify({
            'success': True,
            'indoor': {
                'avg_temperature': 30.0, 'avg_humidity': 72.0,
                'peak_temperature': 33.0, 'peak_humidity': 79.0,
                'confidence': 0.55, 'accuracy_label': '~55% (Offline Fallback)',
                'alerts': [],
            },
            'outdoor': {'avg_temperature': 27.0, 'avg_humidity': 70.0},
            'model_params': {},
            'calibration_message': "⚠️ Weather API unavailable — using Sri Lanka average conditions.",
            'data_source': 'fallback',
            'timestamp':   datetime.now().isoformat(),
        }), 200

    except Exception as exc:
        current_app.logger.error(f'[predict_storage_conditions] {exc}')
        return jsonify({'success': False, 'error': str(exc)}), 500


# ─── /knowledge ───────────────────────────────────────────────────────────────
@postharvest_bp.route('/knowledge', methods=['GET'])
def knowledge():
    """GET /api/guardian/knowledge — Storage knowledge base: industrial vs traditional Sri Lankan methods."""
    data = [
        {
            'id': 'v-temp', 'title': 'Ventilation & Temperature', 'icon': 'fan',
            'goal': 'Keep storage temp below 30°C', 'xgb_var': 'Warehouse_Temp',
            'items': [
                {
                    'name': 'Cooling',
                    'industrial': 'Electric Exhaust Fan / Air Conditioner',
                    'traditional': 'PVC Pipe Breathers / White Roof Paint',
                    'logic': 'Drill 4-inch PVC pipes through walls at 45°. Allows hot air to escape passively at zero cost.',
                },
                {
                    'name': 'Dehumidification',
                    'industrial': 'Industrial Dehumidifier (Rs. 150,000+)',
                    'traditional': 'Rock Salt Trays / Activated Charcoal',
                    'logic': 'Place 2 kg of rock salt in shallow clay trays in corners. Absorbs 500–800 ml moisture per month.',
                },
            ],
        },
        {
            'id': 'm-control', 'title': 'Moisture Management', 'icon': 'water-percent',
            'goal': 'Maintain MC below 14% (SLR 603)', 'xgb_var': 'Moisture_Content',
            'items': [
                {
                    'name': 'Testing',
                    'industrial': 'Digital Moisture Meter (Rs. 15,000–50,000)',
                    'traditional': 'Salt Bottle Test (Free)',
                    'logic': 'Mix paddy with dry salt in a bottle. If salt sticks = MC > 14%. If salt flows free = MC is safe.',
                },
                {
                    'name': 'Drying',
                    'industrial': 'Mechanical Flatbed Dryer (DOA/IRRI)',
                    'traditional': 'Black Polythene on Raised Ground',
                    'logic': 'Spread paddy 5cm thick on black polythene. Stir every 2 hours. 2–3 days reduces MC by 2–3%.',
                },
            ],
        },
        {
            'id': 'p-protect', 'title': 'Pest Protection', 'icon': 'bug-stop',
            'goal': 'Zero pest presence (SLR 603)', 'xgb_var': 'Pest_Presence',
            'items': [
                {
                    'name': 'Weevil (Ghun) Control',
                    'industrial': 'Phostoxin (Aluminium Phosphide) Fumigation',
                    'traditional': 'Dried Neem (Kohomba) Leaves',
                    'logic': 'Layer 200g of dried kohomba leaves between every 10 bags. Repels weevils for 3–4 months.',
                },
                {
                    'name': 'Rat Control',
                    'industrial': 'Ultrasonic Repellers / Glue Traps',
                    'traditional': 'Tin Plate Rat Guards on Pallet Legs',
                    'logic': 'Cut 30cm circles from tin. Wrap around pallet legs smooth side up. Rats cannot grip smooth tin.',
                },
            ],
        },
        {
            'id': 's-method', 'title': 'Storage Structure', 'icon': 'home-modern',
            'goal': 'Optimal storage environment', 'xgb_var': 'Storage_Method',
            'items': [
                {
                    'name': 'Floor Strategy',
                    'industrial': 'Treated Wooden Pallets (15cm height)',
                    'traditional': 'Coconut Husk / Pol Katu Layer',
                    'logic': 'Spread a 10cm layer of dry coconut husk under bags. Never place bags on cement.',
                },
                {
                    'name': 'Bin Type',
                    'industrial': 'Galvanised Metal Silo (IRRI design)',
                    'traditional': 'Raised Wooden Box (Atuwa) / Clay Bin',
                    'logic': 'Traditional Atuwa on legs protects from ground moisture. Seal lid with neem oil cloth.',
                },
            ],
        },
    ]
    return jsonify({
        'success':    True,
        'knowledge':  data,
        'count':      len(data),
        'standard':   'SLR 603:2013',
        'disclaimer': 'Traditional methods validated by DOA Sri Lanka field research.',
    }), 200


# ─── /festival_calendar ───────────────────────────────────────────────────────
@postharvest_bp.route('/festival_calendar', methods=['GET'])
def festival_calendar():
    """GET /api/guardian/festival_calendar — Festival calendar data for frontend rendering."""
    return jsonify({
        'success':     True,
        'festivals':   FESTIVAL_CALENDAR_DATA,
        'glut_months': GLUT_MONTHS,
        'notes': {
            'boost_explanation': 'Price increase historically observed before Sri Lankan festivals (DOA/HARTI 2019–2024)',
            'glut_months':       'March–April (Maha harvest) and August–September (Yala harvest) — lowest prices',
            'sell_window':       'Optimal selling: 7 days before festival (demand rises, buyers build stock)',
        },
    }), 200


# ─── /best_time ───────────────────────────────────────────────────────────────
@postharvest_bp.route('/best_time', methods=['POST'])
def best_time():
    """POST /api/guardian/best_time — Returns all best sell windows within the storage period."""
    try:
        data         = request.get_json() or {}
        storage_days = int(data.get('storage_days', 90))
        variety      = data.get('variety', 'Bg 300')
        harvest_date = data.get('harvest_date', datetime.now().strftime('%Y-%m-%d'))
        base_price   = float(data.get('current_price_lkr') or _get_price_forecast(variety)['current_lkr'])

        result = _get_best_sell_windows(harvest_date, storage_days, base_price)

        return jsonify({
            'success':       True,
            'variety':       variety,
            'base_price':    base_price,
            'storage_days':  storage_days,
            **result,
            'calendar_data': FESTIVAL_CALENDAR_DATA,
            'glut_months':   GLUT_MONTHS,
        }), 200

    except Exception as exc:
        current_app.logger.error(f'[best_time] {exc}')
        return jsonify({'error': str(exc)}), 500


# ─── /best_dealer ─────────────────────────────────────────────────────────────
@postharvest_bp.route('/best_dealer', methods=['POST'])
def best_dealer():
    """POST /api/guardian/best_dealer — AI-powered dealer selection using qwen2.5:7b."""
    try:
        data              = request.get_json() or {}
        dealers_raw       = data.get('dealers', [])
        harvest           = data.get('harvest', {})
        farmer_location   = data.get('farmer_location', {})
        prediction_signal = data.get('prediction_signal', 'YELLOW')

        if not dealers_raw:
            return jsonify({'success': False, 'error': 'No dealers provided'}), 400

        variety       = harvest.get('variety', 'Bg 300')
        quantity_kg   = float(harvest.get('quantityKg', 1000))
        harvest_grade = harvest.get('grade', 'A')
        pf            = _get_price_forecast(variety)
        base_price    = pf['current_lkr']
        farmer_lat    = farmer_location.get('lat')
        farmer_lng    = farmer_location.get('lng')

        enriched = []
        for d in dealers_raw:
            dist_km = None
            if farmer_lat and farmer_lng and d.get('latitude') and d.get('longitude'):
                try:
                    dist_km = round(_haversine_km(
                        float(farmer_lat), float(farmer_lng),
                        float(d['latitude']), float(d['longitude'])
                    ), 1)
                except Exception:
                    pass

            offer_price    = float(d.get('currentPriceLkr') or d.get('current_price_lkr') or
                                   d.get('priceLkr') or base_price)
            transport_cost = _estimate_transport_cost_lkr(
                dist_km or 0, quantity_kg, d.get('offersTransport', False)
            )
            gross_value = offer_price * quantity_kg
            net_value   = gross_value - transport_cost
            score       = _compute_dealer_score(d, dist_km, base_price, quantity_kg, harvest_grade)
            enriched.append({
                **d,
                'distance_km':        dist_km,
                'transport_cost_lkr': transport_cost,
                'offer_price_lkr':    offer_price,
                'gross_value_lkr':    round(gross_value),
                'net_value_lkr':      round(net_value),
                'score':              score,
            })

        enriched.sort(key=lambda x: (-x['score'], -x['net_value_lkr']))
        top5 = enriched[:5]

        system_prompt = """You are the Agricultural Marketing Specialist for the Department of Agriculture, Sri Lanka.
A farmer needs to select the BEST dealer to sell their paddy.

STRICT JSON RESPONSE:
{
  "best_dealer_id": "exact dealer id string",
  "reason": "2-3 sentence plain explanation with specific LKR numbers",
  "warning": "any concern or caveat (null if none)",
  "negotiation_tip": "one specific tip for the farmer when calling this dealer"
}"""

        user_content = json.dumps({
            'harvest':                {'variety': variety, 'quantityKg': quantity_kg, 'grade': harvest_grade},
            'prediction_signal':      prediction_signal,
            'market_base_price_lkr':  base_price,
            'dealers':                top5,
        })

        llm_raw = _call_ollama(system_prompt, user_content, format_json=True)
        ai_data = {}
        if llm_raw:
            try:
                ai_data = json.loads(_clean_json(llm_raw))
            except Exception:
                pass

        fallback_best = top5[0]
        best_id       = ai_data.get('best_dealer_id', fallback_best.get('id'))
        if not ai_data.get('reason'):
            fb = fallback_best
            ai_data['reason'] = (
                f"{fb.get('dealerName', 'This dealer')} offers LKR {fb['offer_price_lkr']}/kg "
                f"with net value LKR {fb['net_value_lkr']:,} for your {quantity_kg}kg. Score: {fb['score']}/100."
            )
            ai_data['best_dealer_id'] = fallback_best.get('id')

        return jsonify({
            'success':            True,
            'best_dealer_id':     best_id,
            'reason':             ai_data.get('reason', ''),
            'warning':            ai_data.get('warning'),
            'negotiation_tip':    ai_data.get('negotiation_tip', ''),
            'all_dealers_scored': [{
                'id':                d.get('id'),
                'name':              d.get('dealerName'),
                'score':             d['score'],
                'net_value_lkr':     d['net_value_lkr'],
                'offer_price_lkr':   d['offer_price_lkr'],
                'distance_km':       d['distance_km'],
                'transport_cost_lkr':d['transport_cost_lkr'],
            } for d in enriched],
        }), 200

    except Exception as exc:
        current_app.logger.error(f'[best_dealer] {exc}')
        return jsonify({'error': str(exc)}), 500


# ─── /dealer_profile ──────────────────────────────────────────────────────────
@postharvest_bp.route('/dealer_profile', methods=['POST'])
def dealer_profile():
    """POST /api/guardian/dealer_profile — Validates dealer registration inputs."""
    try:
        data     = request.get_json() or {}
        errors   = []
        warnings = []

        required = ['dealerName', 'phone', 'district', 'currentPriceLkr']
        for f in required:
            if not data.get(f):
                errors.append(f'Missing required field: {f}')

        phone = str(data.get('phone', ''))
        if phone and not re.match(r'^(\+94|0)[0-9]{9,10}$', phone.replace(' ', '').replace('-', '')):
            warnings.append('Phone number format: use 07X-XXXXXXX or +94 7X XXXXXXX')

        try:
            price = float(data.get('currentPriceLkr', 0))
            if price < 200 or price > 500:
                warnings.append(f'Price LKR {price}/kg seems unusual. Typical range: LKR 220–380/kg.')
        except Exception:
            errors.append('currentPriceLkr must be a number')

        lat = data.get('latitude')
        lon = data.get('longitude')
        if lat and lon:
            try:
                lat_f, lon_f = float(lat), float(lon)
                if not (5.9 <= lat_f <= 9.9 and 79.5 <= lon_f <= 82.0):
                    warnings.append('Coordinates appear to be outside Sri Lanka. Please verify.')
            except Exception:
                errors.append('latitude/longitude must be valid numbers')
        else:
            warnings.append('No location coordinates provided. Distance calculation unavailable for farmers.')

        raw_grades        = data.get('acceptedGrades', [])
        normalised_grades = [g.upper().strip() for g in raw_grades if g]
        valid_grades      = {'A', 'B', 'C', 'A+'}
        invalid_grades    = [g for g in normalised_grades if g not in valid_grades]
        if invalid_grades:
            warnings.append(f'Unknown grades: {invalid_grades}. Valid grades: A, A+, B, C')

        return jsonify({
            'success':            len(errors) == 0,
            'errors':             errors,
            'warnings':           warnings,
            'normalised_grades':  normalised_grades,
            'validation_passed':  len(errors) == 0,
        }), 200

    except Exception as exc:
        return jsonify({'error': str(exc)}), 500


# ─── /generate_report ─────────────────────────────────────────────────────────
@postharvest_bp.route('/generate_report', methods=['POST'])
def generate_report():
    """POST /api/guardian/generate_report — Full post-harvest report. Supports EN / SI / TA."""
    try:
        data          = request.get_json() or {}
        harvest       = data.get('harvest', {})
        prediction    = data.get('prediction', {})
        cost_price    = data.get('cost_price', {})
        best_dealer_d = data.get('best_dealer', {})
        calendar_data = data.get('calendar_data', {})
        language      = data.get('language', 'en')
        generated_by  = data.get('generated_by', 'unknown')

        variety         = harvest.get('variety', 'Unknown')
        quantity_kg     = float(harvest.get('quantityKg', 0) or 0)
        moisture        = harvest.get('moisture', 'Unknown')
        grade           = harvest.get('grade', 'Unknown')
        storage_method  = harvest.get('storageMethod', 'Unknown')
        season          = harvest.get('season', 'Unknown')

        storage_data = prediction.get('storage', {})
        price_data   = prediction.get('price', {})
        risk_data    = prediction.get('risk', {})
        costs_data   = prediction.get('costs', {})
        signal       = prediction.get('signal', 'YELLOW')

        if not calendar_data.get('bestFestivals') and storage_data.get('storage_days'):
            best_time_result = _get_best_sell_windows(
                datetime.now().strftime('%Y-%m-%d'),
                storage_data['storage_days'],
                float(price_data.get('current_lkr') or 249)
            )
            best_festivals = best_time_result['windows'][:3]
        else:
            best_festivals = calendar_data.get('bestFestivals', [])

        report_data = {
            'report_title':   f'Post-Harvest Advisory Report — {variety}',
            'generated_at':   datetime.now().strftime('%d %B %Y %H:%M'),
            'generated_by':   generated_by,
            'language':       language,
            'harvest': {
                'variety': variety, 'quantityKg': quantity_kg,
                'moisture': moisture, 'grade': grade,
                'storageMethod': storage_method, 'season': season,
            },
            'storage_analysis': {
                'safe_days':    storage_data.get('storage_days', 'N/A'),
                'safe_months':  storage_data.get('storage_months', 'N/A'),
                'grade':        storage_data.get('grade', 'N/A'),
                'risk_level':   storage_data.get('risk', 'N/A'),
                'explanation':  storage_data.get('explanation', ''),
                'safety_score': risk_data.get('score', 'N/A'),
                'risk_category':risk_data.get('category', 'N/A'),
            },
            'price_forecast': {
                'current_market':  price_data.get('current_lkr', 'N/A'),
                'peak_forecast':   price_data.get('peak_lkr', 'N/A'),
                'days_to_peak':    price_data.get('days_to_peak', 'N/A'),
                'gain_pct':        price_data.get('gain_pct', 'N/A'),
            },
            'economics': {
                'current_value':     costs_data.get('sell_now_value', 'N/A'),
                'peak_value':        costs_data.get('sell_peak_value', 'N/A'),
                'total_storage_cost':costs_data.get('total_storage_cost', 'N/A'),
                'net_profit':        costs_data.get('net_profit', 'N/A'),
                'profitability':     costs_data.get('profitability', 'N/A'),
            },
            'best_sell_windows': best_festivals,
            'dealer':            best_dealer_d,
            'risk_factors':      risk_data.get('risk_factors', []),
            'signal':            signal,
            'recommendation': (
                'SELL NOW — storage risk too high'                if signal == 'RED' else
                'SAFE TO STORE — profitable opportunity ahead'    if signal == 'GREEN' else
                'DRY PADDY FIRST, then store or sell'
            ),
        }

        lang_instruction = {
            'en': 'Write in clear, simple English suitable for a Sri Lankan farmer.',
            'si': 'Write entirely in Sinhala script. Be respectful and clear.',
            'ta': 'Write entirely in Tamil script. Be respectful and clear.',
        }.get(language, 'Write in clear, simple English.')

        system_prompt = f"""You are the Senior Agricultural Report Writer for the Department of Agriculture, Sri Lanka.
Write a COMPLETE post-harvest advisory report for a Sri Lankan paddy farmer.
{lang_instruction}
Include all key numbers (LKR amounts, days, percentages).
Start with the most important action the farmer must take TODAY.
Do NOT add any markdown code blocks. Return only the report text."""

        report_text = _call_ollama(system_prompt, json.dumps(report_data, ensure_ascii=False, default=str),
                                   format_json=False, max_tokens=2048)

        if not report_text:
            lines = [
                f"POST-HARVEST ADVISORY REPORT — GoviMithuru",
                f"Generated: {report_data['generated_at']}",
                "=" * 50,
                f"\nHARVEST: {variety} | {quantity_kg} kg | Season: {season}",
                f"Grade: {grade} | Moisture: {moisture}% | Container: {storage_method}",
                f"\nRECOMMENDATION: {report_data['recommendation']}",
                f"\n── STORAGE ANALYSIS ──",
                f"Safe storage: {storage_data.get('storage_days', 'N/A')} days",
                f"Safety score: {risk_data.get('score', 'N/A')}/100 ({risk_data.get('category', 'N/A')})",
                storage_data.get('explanation', ''),
                f"\n── PRICE FORECAST ──",
                f"Current market: LKR {price_data.get('current_lkr', 'N/A')}/kg",
                f"Peak forecast:  LKR {price_data.get('peak_lkr', 'N/A')}/kg in {price_data.get('days_to_peak', 'N/A')} days",
                f"\nGenerated by GoviMithuru Post-Harvest Guardian v5.1",
                f"Standards: SLR 603:2013 | Data: DOA/HARTI 2024/25",
            ]
            report_text = '\n'.join(filter(None, lines))

        return jsonify({
            'success':     True,
            'report_text': report_text,
            'report_data': report_data,
            'language':    language,
            'generated_at':report_data['generated_at'],
        }), 200

    except Exception as exc:
        current_app.logger.error(f'[generate_report] {exc}')
        return jsonify({'error': str(exc), 'success': False}), 500