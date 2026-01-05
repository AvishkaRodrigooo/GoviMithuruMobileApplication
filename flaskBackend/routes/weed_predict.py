from flask import Blueprint, request, jsonify
import os
import uuid
import numpy as np
from PIL import Image
import io
import tensorflow as tf

weed_predict_bp = Blueprint('weed_predict', __name__)

# Define your class labels in order matching model output
CLASS_LABELS = ["Commelina_benghalensis", "Cyperus_rotundus", "no_weed"]

# Weed Details Database----------------

WEED_DETAILS = {
    "Commelina_benghalensis": { 
        
        "sinhala_name": "දිය මෙනේරිය",
        "english_name": "Benghal Dayflower / Tropical Spiderwort",
        "type": "Broad-leaved weed (පුළුල් පත්‍ර සහිත වල්පැළ)",
        "scientific_name": "Commelina benghalensis",

        "distribution": [
            "වී කෙත් වල බහුලව පැතිරී ඇත",
            "ශ්‍රී ලංකාවේ වී,එළවළු වගා බිම් වල බහුලව දක්නට ලැබේ",
            "ජලය සහිත හෝ අඩිවියළි බිම් වල හොඳින් වර්ධනය වෙයි"
        ],

        "morphology": [
            "පහළට බිම පුරා පැතිරෙන (creeping) පැළ",
            "මෘදු, සාරවත් දණ්ඩ (succulent stems)",
            "ඕවල් හැඩැති, දිලිසෙන කොළ",
            "නිල් පැහැති කුඩා මල්",
            "ගොඩබිම් හා භූගත බීජ නිපදවයි"
        ],

        "reproduction": [
            "බීජ මඟින්",
            "දණ්ඩ කොටස් මඟින් (Vegetative propagation)"
        ],

        "impact_on_paddy": [
            "නයිට්‍රජන්, පොටෑසියම් වැනි පෝෂක ද්‍රව්‍ය සඳහා වී පැළ සමඟ තරඟ කරයි",
            "ජලය හා ආලෝකය අවහිර කරයි",
            "වී අස්වැන්න 20%-40% දක්වා අඩු විය හැක",
            "කෘමි හා රෝග සඳහා ආශ්‍රය විය හැක"
        ],

        "management": {
            "mechanical": "වගාව ආරම්භයේදී අතින් ඉවත් කිරීම",
            "cultural": [
                "නිසි ජල කළමනාකරණය",
                "ඝන වී පැළවීම",
                "වගා පෙර බිම් සකස් කිරීම"
            ],
            "chemical": "2,4-D, Bentazon (නිසි මාත්‍රාව හා කාලය අත්‍යවශ්‍යය)",
            "integrated": "IWM - භෞතික + සංස්කෘතික + රසායනික ක්‍රම එකට භාවිතය"
        }
    },
    "Cyperus_rotundus": {

         "sinhala_name": "මහ කලාඳුරු / කළු කඩල තණ",
        "english_name": "Nutgrass / Nut Sedge / Purple Nutsedge",
        "type": "Sedge weed (තණ වර්ගයට අයත්)",
        "scientific_name": "Cyperus rotundus",

        "distribution": [
            "තෙත් හා උණුසුම් කලාපවල විශාල ලෙස පැතිරී ඇත",
            "වී වගා බිම්, තේ, රබර්, එළවළු වගා වල බහුලව දක්නට ලැබේ",
            "ජලය සහිත හෝ අඩිවියළි බිම් වල ඉතා හොඳින් වර්ධනය වෙයි"
        ],

        "morphology": [
            "පටු, දිග, තණ වගේ කොළ",
            "තුන් කොණ (triangular) කඳ – sedge weeds වල විශේෂ ලක්ෂණයක්",
            "දුඹුරු / දුඹුරු-කළු වර්ණ මල්",
            "පස තුළ ගැට (tubers) සහිත වේ"
        ],

        "reproduction": [
            "ප්‍රධාන වශයෙන් පස ඇතුළත ගැට (tubers) මඟින්",
            "බීජ මඟින් (අඩු ප්‍රමාණයෙන්)",
            "Tubers පස තුළ දිගු කාලයක් ජීවත් වෙයි"
        ],

        "impact_on_paddy": [
            "වී ශාකයට අවශ්‍ය ජලය, පොහොර, පෝෂක ද්‍රව්‍ය සහ ඉඩ වැඩිව ලබාගනී",
            "ජලය හා ආලෝකය අවහිර කරයි",
            "වී අස්වැන්න 20% – 60% දක්වා අඩු විය හැක",
            "ඉවත් කිරීම අතිශය අමාරු weed එකකි"
        ],

        "management": {
            "mechanical": [
                "මුල් අවස්ථාවේදී අතින් ඉවත් කිරීම",
                "ගැට (tubers) සමඟම ඉවත් කළ යුතුය"
            ],
            "cultural": [
                "නිසි ලෙස පස සකස් කිරීම",
                "ජල පාලනය නිසි ලෙස සිදු කිරීම",
                "වගා පෙර බිම් සකස් කිරීම"
            ],
            "chemical": "Sedge වර්ගයට අදාල herbicides (ගොවි උපදේශක උපදෙස් අනුව පමණක් භාවිතා කළ යුතුයි)",
            "integrated": "භෞතික + සංස්කෘතික + රසායනික ක්‍රම එකට භාවිතය"
        }
    
    }
}


# Load TFLite model once globally in this file
interpreter = tf.lite.Interpreter(model_path="models/weed_classifier.tflite")
interpreter.allocate_tensors()

input_details = interpreter.get_input_details()
output_details = interpreter.get_output_details()

# Image Preprocessing Function
def preprocess_image(image_bytes):
    image = Image.open(io.BytesIO(image_bytes)).convert('RGB')
    # Resize to expected input size of model, e.g. 224x224 (update if different)
    image = image.resize((224, 224))
    input_data = np.array(image, dtype=np.float32)
    # Normalize if model requires, for example divide by 255
    input_data = input_data / 255.0
    # Add batch dimension
    input_data = np.expand_dims(input_data, axis=0)
    return input_data

@weed_predict_bp.route("/weed_predict", methods=["POST"])
def weed_predict():
    if "image" not in request.files:
        return jsonify({"error": "No image provided"}), 400

    image = request.files["image"]
    img_bytes = image.read()

    try:
        input_data = preprocess_image(img_bytes)

        # Set tensor
        interpreter.set_tensor(input_details[0]['index'], input_data)
        interpreter.invoke()

        # Get output and find predicted label
        output_data = interpreter.get_tensor(output_details[0]['index'])[0]  # Assuming output shape (1, num_classes)
        predicted_index = np.argmax(output_data)
        predicted_label = CLASS_LABELS[predicted_index]
        confidence = float(output_data[predicted_index])

         # Prepare response
        response = {
            "predicted_weed": predicted_label,
            "confidence": round(confidence * 100, 2),
            "details": WEED_DETAILS.get(predicted_label, None)
        }

        return jsonify(response)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
