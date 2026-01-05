from flask import Blueprint, request, jsonify, current_app
import numpy as np

storage_bp = Blueprint("storage_bp", __name__, url_prefix="/api/storage")

@storage_bp.route("/predict", methods=["POST"])
def storage_predict():
    data = request.json

    features = current_app.storage_features
    scaler = current_app.storage_scaler
    model = current_app.storage_model
    encoders = current_app.label_encoders

    input_vector = []

    for feature in features:
        value = data.get(feature)

        if feature in encoders:
            value = encoders[feature].transform([value])[0]

        input_vector.append(value)

    X = np.array(input_vector).reshape(1, -1)
    X_scaled = scaler.transform(X)

    prediction = model.predict(X_scaled)[0]

    return jsonify({
        "type": "storage_prediction",
        "result": int(prediction)
    })
