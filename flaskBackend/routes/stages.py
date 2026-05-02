from flask import Blueprint, request, jsonify, current_app

stages_bp = Blueprint("stages", __name__)


# STAGE RECOMMENDATIONS

STAGE_RECOMMENDATIONS = {
  "Seedling": {
        "stage_name": "Seedling",
        "stage_name_sinhala": "🌱 පැළ අවදිය",
        "description": "බීජ වැපිරීමෙන් පසු අලුත් වී පැල බිහිවෙන මුල් අවස්ථාව.",
        "dap_range": "DAP 7–25",
        "fertilizer": {
            "title": "පොහොර යෙදීම:",
            "items": [
                "තවමත් පොහොර දාන්න එපා",
                "Basal fertilizer තිබුණා නම් ඇති"
            ]
        },
        "water_management": {
            "title": "ජල කළමනාකරණය:",
            "items": [
                "දිනපතා තෙත් කරන්න (waterlogged එපා)",
                "ජලය සෙ.මී. 2–3 රඳවන්න"
            ]
        },
        "weed_control": {
            "title": "වල් පාලනය:",
            "items": [
                "අතින් නෙළන්න",
                "Herbicide නොදාන්න"
            ]
        },
        "icon": "🌱"
    },

    "Tillering": {
        "stage_name": "Tillering",
        "stage_name_sinhala": "🌿 ටිලරිං අවදිය",
        "description": "ප්‍රධාන දණ්ඩෙන් tillers බිහිවෙන අවස්ථාව.",
        "dap_range": "DAP 21–50",
        "fertilizer": {
            "title": "පොහොර යෙදීම:",
            "items": [
                "Urea (N) යොදන්න",
                "DAP 21–25 basal",
                "DAP 40–45 top dressing"
            ]
        },
        "water_management": {
            "title": "ජල කළමනාකරණය:",
            "items": [
                "සෙ.මී. 5–7 ජලය",
                "2–3 දවස් water drain කරන්න"
            ]
        },
        "weed_control": {
            "title": "වල් පාලනය:",
            "items": [
                "Pretilachlor herbicide",
                "DAP 30 අතින් නෙළන්න"
            ]
        },
        "icon": "🌿"
    },

    "Panicle Initiation": {
        "stage_name": "Panicle Initiation",
        "stage_name_sinhala": "🎋 පැනිකල් ආරම්භය",
        "description": "ගොයම් සෑදීම ආරම්භ වන අවධිය.",
        "dap_range": "DAP 46–70",
        "fertilizer": {
            "title": "පොහොර යෙදීම:",
            "items": [
                "Potassium (MOP) යොදන්න",
                "Phosphorus වැදගත්"
            ]
        },
        "water_management": {
            "title": "ජල කළමනාකරණය:",
            "items": [
                "සෙ.මී. 5–10 ජලය",
                "Water shortage නැතිව තබන්න"
            ]
        },
        "weed_control": {
            "title": "වල් පාලනය:",
            "items": [
                "අතින් ඉවත් කරන්න",
                "Competition අඩුයි"
            ]
        },
        "icon": "🎋"
    },

    "Booting": {
        "stage_name": "Booting",
        "stage_name_sinhala": "🎍 බූටිං අවදිය",
        "description": "Panicle sheath එක ඇතුළේ වර්ධනය වේ.",
        "dap_range": "DAP 66–85",
        "fertilizer": {
            "title": "පොහොර යෙදීම:",
            "items": [
                "Zinc / Boron foliar spray",
                "Extra Urea එපා"
            ]
        },
        "water_management": {
            "title": "ජල කළමනාකරණය:",
            "items": [
                "ජලය අනිවාර්යයෙන් තබන්න",
                "Water stress වලක්වන්න"
            ]
        },
        "weed_control": {
            "title": "වල් පාලනය:",
            "items": [
                "Weeding නොකරන්න",
                "Crop damage වෙනවා"
            ]
        },
        "icon": "🎍"
    },

    "Heading": {
        "stage_name": "Heading",
        "stage_name_sinhala": "🌾 හෙඩිං අවදිය",
        "description": "Panicle පිටට එන අවස්ථාව.",
        "dap_range": "DAP 81–100",
        "fertilizer": {
            "title": "පොහොර යෙදීම:",
            "items": [
                "පොහොර නොදෙන්න",
                "Micronutrients only"
            ]
        },
        "water_management": {
            "title": "ජල කළමනාකරණය:",
            "items": [
                "සෙ.මී. 5 ජලය",
                "Pollination සඳහා වැදගත්"
            ]
        },
        "weed_control": {
            "title": "වල් පාලනය:",
            "items": [
                "අවශ්‍ය නෑ",
                "Field cover වෙලා"
            ]
        },
        "icon": "🌾"
    },

    "Maturity": {
        "stage_name": "Maturity",
        "stage_name_sinhala": "🟡 මේචුරිටි අවදිය",
        "description": "අස්වනු නෙළන අවධිය.",
        "dap_range": "DAP 96–120",
        "fertilizer": {
            "title": "පොහොර යෙදීම:",
            "items": [
                "කිසිම පොහොරක් එපා",
                "Quality අඩුවෙයි"
            ]
        },
        "water_management": {
            "title": "ජල කළමනාකරණය:",
            "items": [
                "Water drain කරන්න",
                "Harvest 10–14 days before dry field"
            ]
        },
        "weed_control": {
            "title": "වල් පාලනය:",
            "items": [
                "අවශ්‍ය නෑ",
                "Harvest ready"
            ]
        },
        "icon": "🟡"
    }
}

# ==============================
# PREDICT ROUTE (FIXED)
# ==============================
@stages_bp.route("/predict-stage", methods=["POST"])
def predict_stage():

    data = request.get_json()

    print("Incoming request:", data)  # DEBUG

    # ==========================
    # VALIDATION
    # ==========================
    if not data:
        return jsonify({"error": "No JSON body provided"}), 400

    if "variety" not in data:
        return jsonify({"error": "Missing 'variety'"}), 400

    if "dap" not in data:
        return jsonify({"error": "Missing 'dap'"}), 400

    variety = data["variety"]

    try:
        dap = float(data["dap"])
    except:
        return jsonify({"error": "DAP must be a number"}), 400

    clf = current_app.clf
    reg = current_app.reg
    le_variety = current_app.le_variety
    le_stage = current_app.le_stage
    le_color = current_app.le_color

    # ==========================
    # CHECK VARIETY
    # ==========================
    if variety not in le_variety.classes_:
        return jsonify({
            "error": f"Invalid variety. Allowed: {list(le_variety.classes_)}"
        }), 400

    try:
        # ==========================
        # ENCODE
        # ==========================
        variety_encoded = le_variety.transform([variety])[0]
        input_data = [[variety_encoded, dap]]

        # ==========================
        # PREDICT
        # ==========================
        class_pred = clf.predict(input_data)
        reg_pred = reg.predict(input_data)

        # ==========================
        # DECODE
        # ==========================
        stage = le_stage.inverse_transform([class_pred[0][0]])[0]
        color = le_color.inverse_transform([class_pred[0][1]])[0]

        leaf_count = int(reg_pred[0][0])
        tillers = int(reg_pred[0][1])
        height = float(round(reg_pred[0][2], 2))

    except Exception as e:
        return jsonify({"error": f"Prediction failed: {str(e)}"}), 500

    # ==========================
    # RECOMMENDATIONS
    # ==========================
    recommendations = STAGE_RECOMMENDATIONS.get(stage, {})

    # ==========================
    # RESPONSE
    # ==========================
    return jsonify({
        "growth_stage": stage,
        "leaf_color": color,
        "leaf_count": leaf_count,
        "tillers": tillers,
        "plant_height_cm": height,
        "recommendations": recommendations
    })