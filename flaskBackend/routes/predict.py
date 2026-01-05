from flask import Blueprint, request, jsonify, current_app
import os
import uuid
import cv2
import base64

predict_bp = Blueprint('predict', __name__)

UPLOAD_FOLDER = "uploads"
RESULT_FOLDER = "results"

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(RESULT_FOLDER, exist_ok=True)

@predict_bp.route("/predict", methods=["POST"])
def predict():
    if "image" not in request.files:
        return jsonify({"error": "No image provided"}), 400

    image = request.files["image"]
    img_id = str(uuid.uuid4())
    input_path = os.path.join(UPLOAD_FOLDER, f"{img_id}.jpg")
    output_path = os.path.join(RESULT_FOLDER, f"{img_id}.jpg")

    # Save uploaded image
    image.save(input_path)

    # Run detection with YOLO loaded in app context
    model = current_app.model
    results = model(input_path)[0]

    boxes = results.boxes
    box_count = len(boxes)

    confidences = [box.conf.item() for box in boxes]
    avg_confidence = sum(confidences) / box_count if box_count > 0 else 0

    # Annotate image with bounding boxes
    annotated = results.plot()
    cv2.imwrite(output_path, annotated)

    # Read output image bytes and encode as base64
    with open(output_path, "rb") as f:
        img_bytes = f.read()
    img_base64 = base64.b64encode(img_bytes).decode("utf-8")

    response = {
        "image": img_base64,
        "box_count": box_count,
        "accuracy": round(avg_confidence * 100, 2)
    }
    return jsonify(response)
