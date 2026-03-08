from flask import Blueprint, request, jsonify, current_app

stages_bp = Blueprint("stages", __name__)

# realistic ranges for validation
REALISTIC_RANGES = {
    "dap": (1, 150),           # days after planting
    "leaf_count": (1, 15),     # typical leaf count
    "tillers": (1, 20),        # typical tiller count
    "height": (10, 200)        # height in cm
}

# Growth stage recommendations (Sinhala) with descriptions
STAGE_RECOMMENDATIONS = {
    "Seedling": {
        "stage_name": "Seedling",
        "stage_name_sinhala": "🌱 පැළ අවදිය",
        "description": "බීජ වැපිරීමෙන් පසු අලුත් වී පැල බිහිවෙන මුල් අවස්ථාව. මේ කාලයේ පැල කුඩායි සහ කොළ ටිකක් පමණයි තියෙන්නේ.",
        "dap_range": "DAP 7–25",
        "fertilizer": {
            "title": "පොහොර යෙදීම:",
            "items": [
                "තවමත් පොහොර දාන්න එපා",
                "Nursery bed එකේ basal fertilizer දාලා තියෙනවා නම් ඇති"
            ]
        },
        "water_management": {
            "title": "ජල කළමනාකරණය:",
            "items": [
                "දිනපතා නිතර තෙත් කරන්න (waterlogged එපා)",
                "ජලය සෙ.මී. 2–3 ක් විතර රඳවා ගන්න"
            ]
        },
        "weed_control": {
            "title": "වල් පාලනය:",
            "items": [
                "පැළ කුඩා නිසා ප්‍රවේශමෙන් අතින් නෙළන්න",
                "Herbicide ගාන්න එපා — පැළ මැරෙනවා"
            ]
        },
        "icon": "🌱"
    },
    "Tillering": {
        "stage_name": "Tillering",
        "stage_name_sinhala": "🌿 ටිලරිං අවදිය",
        "description": "ප්‍රධාන දණ්ඩෙන් පැත්තට අලුත් දණ්ඩ (tillers) බිහිවෙන අවස්ථාව. මේක පැල ගණන වැඩිවෙන වැදගත් කාලයක්.",
        "dap_range": "DAP 21–50",
        "fertilizer": {
            "title": "පොහොර යෙදීම:",
            "items": [
                "Urea (N) — Tillers වැඩි කරන්න",
                "DAP 21–25 දී Basal dressing දාන්න",
                "DAP 40–45 දී Top dressing (Urea)"
            ]
        },
        "water_management": {
            "title": "ජල කළමනාකරණය:",
            "items": [
                "ජලය සෙ.මී. 5–7 ක් රඳවන්න",
                "Mid-tillering දී දිය හරින්න (2–3 දවස්) — tillering ශක්තිමත් වෙනවා"
            ]
        },
        "weed_control": {
            "title": "වල් පාලනය:",
            "items": [
                "මේ අදියර ඉතාම වැදගත්",
                "DAP 21 දී Herbicide (Pretilachlor) දාන්න",
                "අතින් නෙළීම DAP 30 දී කරන්න"
            ]
        },
        "icon": "🌿"
    },
    "Panicle Initiation": {
        "stage_name": "Panicle Initiation",
        "stage_name_sinhala": "🎋 පැනිකල් ආරම්භය/ගොයම් සෑදීම ආරම්භ වීම",
        "description": "වී පැලේ ඇතුළත ගොයම් (panicle) සෑදෙන්න ආරම්භ වන අවස්ථාව.",
        "dap_range": "DAP 46–70",
        "fertilizer": {
            "title": "පොහොර යෙදීම:",
            "items": [
                "Potassium (K) + Phosphorus (P) වැදගත්",
                "MOP (Muriate of Potash) දාන්න",
                "Urea ටිකක් — කරල් හොඳ කරන්න"
            ]
        },
        "water_management": {
            "title": "ජල කළමනාකරණය:",
            "items": [
                "ජලය නිතරම රඳවා ගන්න (සෙ.මී. 5–10)",
                "මේ අදියරේදී ජලය අඩු වුණොත් අස්වැන්න බාල වෙනවා"
            ]
        },
        "weed_control": {
            "title": "වල් පාලනය:",
            "items": [
                "ශාකය දැන් ලොකු නිසා weed competition අඩුයි",
                "ඉතිරි වූ වල් ගස් අතින් ඉවත් කරන්න"
            ]
        },
        "icon": "🎋"
    },
    "Booting": {
        "stage_name": "Booting",
        "stage_name_sinhala": "🎍 බූටිං අවදිය",
        "description": "ගොයම කොළ sheath එක ඇතුළේ වැඩෙන කාලය. පිටට එන්න කලින් පැලේ උඩ කොටස පිරුණු වගේ පේනවා.",
        "dap_range": "DAP 66–85",
        "fertilizer": {
            "title": "පොහොර යෙදීම:",
            "items": [
                "Foliar spray (Zinc, Boron) දාන්න",
                "Extra Urea එපා — කරල් බාල වෙනවා"
            ]
        },
        "water_management": {
            "title": "ජල කළමනාකරණය:",
            "items": [
                "ජලය අනිවාර්යයෙන් රඳවා ගන්න",
                "මේ අදියරේදී ජලය නැතිවුණොත් Spikelet sterility වෙනවා (හිස් ඇට)"
            ]
        },
        "weed_control": {
            "title": "වල් පාලනය:",
            "items": [
                "Weeding කරන්න එපා — ශාකය damage වෙනවා",
                "ශාකය බිමට වැහිලා මේ වෙලාවේ"
            ]
        },
        "icon": "🎍"
    },
    "Heading": {
        "stage_name": "Heading",
        "stage_name_sinhala": "🌾 හෙඩිං අවදිය",
        "description": "ගොයම කොළ ඇතුළෙන් පිටට එන අවස්ථාව. මේ වෙලාවේ ගොයම පැහැදිලිව පේනවා.",
        "dap_range": "DAP 81–100",
        "fertilizer": {
            "title": "පොහොර යෙදීම:",
            "items": [
                "පොහොර දාන්න එපා",
                "Foliar micronutrients පමණක් දාන්න (අවශ්‍ය නම්)"
            ]
        },
        "water_management": {
            "title": "ජල කළමනාකරණය:",
            "items": [
                "ජලය සෙ.මී. 5 ක් රඳවා ගන්න",
                "Pollination සඳහා ජලය ඉතා වැදගත්",
                "උදෑසන ජලය sprinkle කරන්න (උෂ්ණත්වය වැඩි නම්)"
            ]
        },
        "weed_control": {
            "title": "වල් පාලනය:",
            "items": [
                "අවශ්‍ය නෑ",
                "ශාකය සම්පූර්ණ cover කරලා තියෙනවා"
            ]
        },
        "icon": "🌾"
    },
    "Maturity": {
        "stage_name": "Maturity",
        "stage_name_sinhala": "🟡 මේචුරිටි අවදිය",
        "description": "වී වගාවේ අස්වනු නෙළන අවධිය (Maturity Stage) යනු කරල්වල ඇති ධාන්‍ය 85%-90%ක් පමණ කහ පැහැයට හැරී, ධාන්‍ය දැඩි වී, තෙතමනය 20%-25% දක්වා අඩුවන අවසාන අදියරයි.",
        "dap_range": "DAP 96–120",
        "fertilizer": {
            "title": "පොහොර යෙදීම:",
            "items": [
                "කිසිම පොහොරක් එපා",
                "දැන් දැම්මොත් ඇට quality බාල වෙනවා"
            ]
        },
        "water_management": {
            "title": "ජල කළමනාකරණය:",
            "items": [
                "DAP 100 ට පස්සේ ජලය හරින්න (drain කරන්න)",
                "Harvest කරන්න දින 10–14 කට කලින් කුඹුර වේළෙන්න දාන්න"
            ]
        },
        "weed_control": {
            "title": "වල් පාලනය:",
            "items": [
                "අවශ්‍ය නෑ",
                "Harvest සඳහා සූදානම් වෙන්න"
            ]
        },
        "icon": "🟡"
    }
}

@stages_bp.route("/predict-stage", methods=["POST"])
def predict_stage():
    data = request.json

    try:
        variety = data["variety"]
        dap = float(data["dap"])
        leaf_count = float(data["leaf_count"])
        tillers = float(data["tillers"])
        height = float(data["height"])
        leaf_color = data["leaf_color"]
    except (KeyError, ValueError):
        return jsonify({"error": "Invalid or missing input data"}), 400

    # validate numeric inputs
    for key, (min_val, max_val) in REALISTIC_RANGES.items():
        value = locals()[key]
        if value < min_val or value > max_val:
            return jsonify({"error": f"{key} out of realistic range ({min_val}-{max_val})"}), 400

    # manual mapping
    variety_map = {
        "BG300": 0,
        "BG352": 1,
        "BG366": 2
    }

    color_map = {
        "Dark Green": 0,
        "Green": 1,
        "Light Green": 2,
        "Yellow": 3
    }

    if variety not in variety_map:
        return jsonify({"error": f"Unknown variety: {variety}"}), 400
    if leaf_color not in color_map:
        return jsonify({"error": f"Unknown leaf_color: {leaf_color}"}), 400

    input_data = [[
        variety_map[variety],
        dap,
        leaf_count,
        tillers,
        height,
        color_map[leaf_color]
    ]]

    model = current_app.stage_model

    try:
        prediction = model.predict(input_data)
    except Exception as e:
        return jsonify({"error": f"Model prediction failed: {str(e)}"}), 500

    stage_map = {
        0: "Booting",
        1: "Heading",
        2: "Maturity",
        3: "Panicle Initiation",
        4: "Seedling",
        5: "Tillering"
    }

    stage = stage_map.get(int(prediction[0]), "Unknown Stage")
    
    # Get recommendations for the predicted stage
    recommendations = STAGE_RECOMMENDATIONS.get(stage, {
        "stage_name": stage,
        "stage_name_sinhala": stage,
        "description": "තොරතුරු නැත",
        "dap_range": "Unknown",
        "fertilizer": {"title": "පොහොර යෙදීම:", "items": ["තොරතුරු නැත"]},
        "water_management": {"title": "ජල කළමනාකරණය:", "items": ["තොරතුරු නැත"]},
        "weed_control": {"title": "වල් පාලනය:", "items": ["තොරතුරු නැත"]},
        "icon": "🌾"
    })

    # Return both stage and recommendations
    return jsonify({
        "growth_stage": stage,
        "recommendations": recommendations
    })