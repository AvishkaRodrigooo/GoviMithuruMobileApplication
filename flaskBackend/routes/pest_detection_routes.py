from flask import Blueprint, request, jsonify, current_app
import os
import uuid
from werkzeug.utils import secure_filename
import cv2
import numpy as np
from PIL import Image
import base64
import io
from datetime import datetime

# Import pest library
from utils.pest_library import pest_library

pest_detection_bp = Blueprint('pest_detection', __name__)

UPLOAD_FOLDER = 'uploads/pest_detection'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}

# Create upload folder 
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# FORCE MAPPING - Direct class ID to pest name mapping
# This is the most reliable method - change these if your model uses different class IDs
CLASS_ID_TO_PEST = {
    0: 'Brown Planthopper (BPH)',
    1: 'Rice Leaf-folder',
    2: 'Paddy Bug'
}

# Also store reverse mapping for debugging
PEST_TO_CLASS_ID = {
    'Brown Planthopper (BPH)': 0,
    'Rice Leaf-folder': 1,
    'Paddy Bug': 2
}

def map_yolo_class_to_pest_name(yolo_class_name, class_id=None, confidence=None):
    """
    Map YOLO detection class names/IDs to pest library keys
    Uses class_id as primary key for accuracy
    """
    print(f"🔍 Mapping: class_id={class_id}, name='{yolo_class_name}', conf={confidence}")
    
    # METHOD 1: Use class_id (most reliable)
    if class_id is not None:
        if class_id in CLASS_ID_TO_PEST:
            mapped_name = CLASS_ID_TO_PEST[class_id]
            print(f"✅ Class ID {class_id} -> {mapped_name}")
            return mapped_name
        else:
            print(f"⚠️ Class ID {class_id} not found in mapping. Available: {list(CLASS_ID_TO_PEST.keys())}")
    
    # METHOD 2: Try to parse numeric string
    yolo_str = str(yolo_class_name).strip()
    if yolo_str.isdigit():
        class_id_from_str = int(yolo_str)
        if class_id_from_str in CLASS_ID_TO_PEST:
            mapped_name = CLASS_ID_TO_PEST[class_id_from_str]
            print(f"✅ Converted digit '{yolo_str}' -> {mapped_name}")
            return mapped_name
    
    # METHOD 3: String matching based on common names
    yolo_lower = yolo_class_name.lower().strip() if yolo_class_name else ""
    
    # Check for BPH
    if any(word in yolo_lower for word in ['brown', 'planthopper', 'bph']):
        print(f"✅ String match (BPH) -> Brown Planthopper (BPH)")
        return 'Brown Planthopper (BPH)'
    
    # Check for Rice Leaf-folder
    if ('leaf' in yolo_lower or 'folder' in yolo_lower) and ('rice' in yolo_lower or 'paddy' in yolo_lower):
        print(f"✅ String match (Leaf-folder) -> Rice Leaf-folder")
        return 'Rice Leaf-folder'
    
    # Check for Paddy Bug
    if 'paddy' in yolo_lower or ('bug' in yolo_lower and 'rice' in yolo_lower):
        print(f"✅ String match (Paddy Bug) -> Paddy Bug")
        return 'Paddy Bug'
    
    # METHOD 4: Check model's class names
    try:
        from flask import current_app
        if hasattr(current_app, 'pest_detection_model'):
            model = current_app.pest_detection_model
            if hasattr(model, 'names') and model.names:
                for idx, name in model.names.items():
                    if class_id == idx:
                        name_lower = name.lower()
                        if 'brown' in name_lower or 'planthopper' in name_lower:
                            return 'Brown Planthopper (BPH)'
                        elif 'leaf' in name_lower and 'folder' in name_lower:
                            return 'Rice Leaf-folder'
                        elif 'paddy' in name_lower or 'bug' in name_lower:
                            return 'Paddy Bug'
                        # If none match but we have the name, try to map it
                        return name
    except Exception as e:
        print(f"Error checking model names: {e}")
    
    # METHOD 5: Hardcoded name mappings
    hardcoded = {
        'brown planthopper': 'Brown Planthopper (BPH)',
        'brown_planthopper': 'Brown Planthopper (BPH)',
        'brown-planthopper': 'Brown Planthopper (BPH)',
        'bph': 'Brown Planthopper (BPH)',
        'rice leaf-folder': 'Rice Leaf-folder',
        'rice_leaf_folder': 'Rice Leaf-folder',
        'rice leaf folder': 'Rice Leaf-folder',
        'leaf-folder': 'Rice Leaf-folder',
        'leaf_folder': 'Rice Leaf-folder',
        'paddy bug': 'Paddy Bug',
        'paddy_bug': 'Paddy Bug',
        'paddy-bug': 'Paddy Bug',
        'rice bug': 'Paddy Bug',
        'rice_bug': 'Paddy Bug'
    }
    
    if yolo_lower in hardcoded:
        print(f"✅ Hardcoded match -> {hardcoded[yolo_lower]}")
        return hardcoded[yolo_lower]
    
    # DEFAULT: Return original with warning
    print(f"⚠️ WARNING: No mapping found for class_id={class_id}, name='{yolo_class_name}'")
    print(f"   Defaulting to 'Brown Planthopper (BPH)' - PLEASE CHECK YOUR MODEL'S CLASS MAPPING!")
    
    # As a last resort, try to guess based on class_id range
    if class_id is not None:
        if class_id == 0:
            return 'Brown Planthopper (BPH)'
        elif class_id == 1:
            return 'Rice Leaf-folder'
        elif class_id == 2:
            return 'Paddy Bug'
    
    return 'Brown Planthopper (BPH)'


def run_detection(image_path, model, confidence_threshold=0.5):
    """Run detection and return formatted results with smarter filtering"""
    try:
        print(f"🔬 Running inference with confidence threshold: {confidence_threshold}")
        
        if hasattr(model, 'names'):
            print(f"📋 Model class names: {model.names}")

        # 🔥 IMPORTANT: increase confidence threshold
        results = model(image_path, conf=confidence_threshold)

        detections = []

        # Collect all detections
        for result in results:
            boxes = result.boxes
            if boxes is not None:
                for box in boxes:
                    class_id = int(box.cls[0])
                    confidence = float(box.conf[0])

                    # Get class name
                    if hasattr(result, 'names') and class_id in result.names:
                        yolo_class_name = result.names[class_id]
                    elif hasattr(model, 'names') and class_id in model.names:
                        yolo_class_name = model.names[class_id]
                    else:
                        yolo_class_name = str(class_id)

                    detections.append({
                        'class_id': class_id,
                        'confidence': confidence,
                        'yolo_class_name': yolo_class_name,
                        'box': box
                    })

        print(f"📊 Raw detections: {len(detections)}")

        # ❌ No detections
        if len(detections) == 0:
            return [], ""

        # ✅ SORT by confidence
        detections = sorted(detections, key=lambda x: x['confidence'], reverse=True)

        top1 = detections[0]
        top2 = detections[1] if len(detections) > 1 else None

        # 🎯 FIX 1: ignore low confidence
        if top1['confidence'] < 0.5:
            print("⚠️ Low confidence detection ignored")
            return [], ""

        # 🎯 FIX 2: avoid always BPH (class_id = 0)
        if top1['class_id'] == 0 and top2:
            diff = abs(top1['confidence'] - top2['confidence'])
            if diff < 0.15:
                print("⚠️ Switching to second best prediction")
                top1 = top2

        # 🎯 Final detection
        final_box = top1['box']
        final_class_id = top1['class_id']
        final_conf = top1['confidence']
        yolo_class_name = top1['yolo_class_name']

        pest_name = map_yolo_class_to_pest_name(yolo_class_name, final_class_id, final_conf)

        bbox = []
        if hasattr(final_box, 'xyxy') and len(final_box.xyxy) > 0:
            bbox = final_box.xyxy[0].tolist()

        final_detection = {
            'class': pest_name,
            'yolo_class': yolo_class_name,
            'class_id': final_class_id,
            'confidence': final_conf,
            'bbox': bbox
        }

        # 📸 Annotated image
        annotated_base64 = ""
        try:
            annotated_img = results[0].plot()
            _, buffer = cv2.imencode('.jpg', annotated_img)
            annotated_base64 = base64.b64encode(buffer).decode('utf-8')
        except Exception as e:
            print(f"⚠️ Annotation error: {e}")

        return [final_detection], annotated_base64

    except Exception as e:
        print(f"❌ Error in run_detection: {str(e)}")
        return [], ""

@pest_detection_bp.route('/detect', methods=['POST'])
def detect_pest():
    """
    Detect pests in uploaded image using YOLO model
    Accepts: image file or base64 encoded image
    """
    temp_path = None
    
    try:
        # Get model from app context
        model = current_app.pest_detection_model
        
        # Check model is loaded
        if model is None:
            return jsonify({
                'success': False, 
                'error': 'Pest detection model not loaded. Please check server logs.'
            }), 500
        
        # Get parameters from request
        confidence_threshold = 0.5
        language = 'en'  
        
        if request.is_json:
            confidence_threshold = float(request.json.get('confidence', 0.25))
            language = request.json.get('language', 'en')
        else:
            confidence_threshold = float(request.form.get('confidence', 0.25))
            language = request.form.get('language', 'en')
        
        print(f"📋 Request parameters: confidence={confidence_threshold}, language={language}")
        
        # Handle file upload
        if 'image' in request.files:
            file = request.files['image']
            if file and allowed_file(file.filename):
                ext = file.filename.rsplit('.', 1)[1].lower()
                filename = f"{uuid.uuid4()}.{ext}"
                temp_path = os.path.join(UPLOAD_FOLDER, filename)
                file.save(temp_path)
                print(f"📸 Image saved temporarily: {temp_path}")
                print(f"   Original filename: {file.filename}")
                print(f"   File size: {os.path.getsize(temp_path)} bytes")
            else:
                return jsonify({'success': False, 'error': 'Invalid file type'}), 400
                
        elif request.is_json and 'image_base64' in request.json:
            image_data = request.json['image_base64']
            if ',' in image_data:
                image_data = image_data.split(',')[1]
            
            # Decode and save temporarily
            image_bytes = base64.b64decode(image_data)
            image = Image.open(io.BytesIO(image_bytes))
            
            temp_path = os.path.join(UPLOAD_FOLDER, f"temp_{uuid.uuid4()}.jpg")
            image.save(temp_path)
            print(f"📸 Base64 image saved temporarily: {temp_path}")
            print(f"   Image size: {image.size}, mode: {image.mode}")
            
        else:
            return jsonify({'success': False, 'error': 'No image provided'}), 400
        
        # Verify file exists
        if not os.path.exists(temp_path):
            return jsonify({'success': False, 'error': 'Failed to save image'}), 500
        
        # Run detection
        print(f"🔍 Running detection on {temp_path}...")
        detections, annotated_base64 = run_detection(temp_path, model, confidence_threshold)
        print(f"📊 Found {len(detections)} detections")
        
        # Clean up temp file
        if temp_path and os.path.exists(temp_path):
            os.remove(temp_path)
            print(f"🧹 Temporary file cleaned up: {temp_path}")
        
        # No detections case
        if len(detections) == 0:
            print("✅ No pests detected in the image")
            return jsonify({
                'success': True,
                'no_detections': True,
                'message': 'No pests detected in the image',
                'data': {
                    'detections': [],
                    'count': 0,
                    'annotated_image': f"data:image/jpeg;base64,{annotated_base64}" if annotated_base64 else None
                }
            })
        
        # Get detailed pest information from library
        enhanced_detections = []
        for detection in detections:
            pest_name = detection['class']
            print(f"📚 Looking up pest info for: '{pest_name}'")
            
            # Try to get pest info from library
            pest_info = None
            try:
                pest_info = pest_library.get_pest_info(pest_name, language)
            except Exception as e:
                print(f"⚠️ Error getting pest info: {e}")
            
            if pest_info:
                print(f"✅ Found info in library for: {pest_name}")
                enhanced_detection = {
                    **detection,
                    'pest_details': pest_info
                }
            else:
                print(f"⚠️ No library info for: {pest_name}")
                # Try to find by alternative name
                alternative_name = None
                pest_lower = pest_name.lower()
                
                if any(word in pest_lower for word in ['brown', 'planthopper', 'bph']):
                    alternative_name = 'Brown Planthopper (BPH)'
                elif any(word in pest_lower for word in ['leaf', 'folder']) and any(word in pest_lower for word in ['rice', 'paddy']):
                    alternative_name = 'Rice Leaf-folder'
                elif any(word in pest_lower for word in ['paddy', 'bug']) or 'rice bug' in pest_lower:
                    alternative_name = 'Paddy Bug'
                
                if alternative_name:
                    try:
                        pest_info = pest_library.get_pest_info(alternative_name, language)
                        if pest_info:
                            print(f"✅ Found info using alternative name: {alternative_name}")
                            enhanced_detection = {
                                **detection,
                                'class': alternative_name,
                                'pest_details': pest_info
                            }
                        else:
                            enhanced_detection = create_default_pest_info(detection, language)
                    except:
                        enhanced_detection = create_default_pest_info(detection, language)
                else:
                    enhanced_detection = create_default_pest_info(detection, language)
            
            enhanced_detections.append(enhanced_detection)
        
        # Get general prevention tips
        prevention_tips = []
        try:
            prevention_tips = pest_library.get_prevention_tips()
        except Exception as e:
            print(f"⚠️ Error getting prevention tips: {e}")
            prevention_tips = ["Practice good field hygiene", "Monitor crops regularly", "Use resistant varieties"]
        
        print(f"✅ Returning {len(enhanced_detections)} enhanced detections")
        
        return jsonify({
            'success': True,
            'no_detections': False,
            'data': {
                'detections': enhanced_detections,
                'count': len(enhanced_detections),
                'annotated_image': f"data:image/jpeg;base64,{annotated_base64}" if annotated_base64 else None,
                'prevention_tips': prevention_tips,
                'language': language
            }
        })
        
    except Exception as e:
        # Clean up temp file in case of error
        if temp_path and os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except:
                pass
        
        import traceback
        print(f"❌ Error in pest detection: {str(e)}")
        print(traceback.format_exc())
        
        return jsonify({
            'success': False, 
            'error': str(e),
            'details': traceback.format_exc()
        }), 500


def create_default_pest_info(detection, language):
    """Create default pest info when library lookup fails"""
    pest_name = detection['class']
    confidence = detection.get('confidence', 0)
    
    print(f"📝 Creating default info for: {pest_name} (conf: {confidence:.3f})")
    
    # Try to create meaningful default info based on class name
    pest_lower = pest_name.lower()
    
    if any(word in pest_lower for word in ['brown', 'planthopper', 'bph']):
        return {
            **detection,
            'pest_details': {
                'name': 'Brown Planthopper (BPH)',
                'description': 'Brown planthopper is a major pest of rice that sucks plant sap causing hopper burn.' if language == 'en' else 'දුඹුරු පැහැති කෘමියා සහල් වලට හානි කරන ප්‍රධාන පළිබෝධයකි.',
                'symptoms': ['Yellowing of plants', 'Hopper burn', 'Stunted growth'] if language == 'en' else ['පැලෑටි කහ වීම', 'කෘමි හානිය', 'වර්ධනය අඩුවීම'],
                'management': ['Use resistant varieties', 'Avoid excessive nitrogen', 'Use recommended pesticides'] if language == 'en' else ['ප්‍රතිරෝධී ප්‍රභේද භාවිතා කරන්න', 'අධික නයිට්‍රජන් වළක්වන්න', 'නිර්දේශිත පළිබෝධනාශක භාවිතා කරන්න']
            }
        }
    elif any(word in pest_lower for word in ['leaf', 'folder']) and any(word in pest_lower for word in ['rice', 'paddy']):
        return {
            **detection,
            'pest_details': {
                'name': 'Rice Leaf-folder',
                'description': 'Rice leaf folder caterpillars fold rice leaves and feed on green tissues.' if language == 'en' else 'සහල් කොළ එතුම් දළඹුවන් කොළ එතා ඒවායේ හරිත පටක ආහාරයට ගනී.',
                'symptoms': ['Leaves folded longitudinally', 'White streaks on leaves', 'Reduced photosynthesis'] if language == 'en' else ['කොළ දිගට නැවීම', 'කොළ මත සුදු ඉරි', 'ප්‍රභාසංශ්ලේෂණය අඩුවීම'],
                'management': ['Use light traps', 'Conserve natural enemies', 'Apply recommended insecticides'] if language == 'en' else ['ආලෝක උගුල් භාවිතා කරන්න', 'ස්වභාවික සතුරන් ආරක්ෂා කරන්න', 'නිර්දේශිත කෘමිනාශක යොදන්න']
            }
        }
    elif any(word in pest_lower for word in ['paddy', 'bug']) or 'rice bug' in pest_lower:
        return {
            **detection,
            'pest_details': {
                'name': 'Paddy Bug',
                'description': 'Paddy bugs feed on developing grains causing unfilled or discolored grains.' if language == 'en' else 'වී කුරුමිණියන් වැඩෙන ධාන්ය ආහාරයට ගෙන හිස් හෝ වර්ණවෙනස් වූ ධාන්ය ඇති කරයි.',
                'symptoms': ['Unfilled grains', 'Discolored grains', 'Spotted grains'] if language == 'en' else ['හිස් ධාන්ය', 'වර්ණවෙනස් වූ ධාන්ය', 'පුල්ලි සහිත ධාන්ය'],
                'management': ['Early planting', 'Use resistant varieties', 'Apply insecticides at heading stage'] if language == 'en' else ['ඉක්මන් වපුරනය', 'ප්‍රතිරෝධී ප්‍රභේද භාවිතය', 'මල් පිපෙන අවදියේ කෘමිනාශක යෙදීම']
            }
        }
    else:
        # Generic pest info based on class_id if available
        class_id = detection.get('class_id')
        if class_id == 0:
            return create_default_pest_info({**detection, 'class': 'Brown Planthopper (BPH)'}, language)
        elif class_id == 1:
            return create_default_pest_info({**detection, 'class': 'Rice Leaf-folder'}, language)
        elif class_id == 2:
            return create_default_pest_info({**detection, 'class': 'Paddy Bug'}, language)
        
        # Ultimate fallback
        return {
            **detection,
            'pest_details': {
                'name': pest_name,
                'description': 'Information not available in library' if language == 'en' else 'තොරතුරු නොමැත',
                'symptoms': ['Unknown - Please consult local expert'] if language == 'en' else ['නොදනී - කෘෂිකර්ම නිලධාරි හමුවන්න'],
                'management': ['Consult local agricultural expert for proper identification and management'] if language == 'en' else ['නිසි හඳුනාගැනීම සහ කළමනාකරණය සඳහා පළාත් කෘෂිකර්ම නිලධාරි හමුවන්න']
            }
        }


@pest_detection_bp.route('/detect-from-camera', methods=['POST'])
def detect_from_camera():
    """Handle image captured from camera"""
    return detect_pest()


@pest_detection_bp.route('/classes', methods=['GET'])
def get_detection_classes():
    """Get all available pest classes that the model can detect"""
    try:
        model = current_app.pest_detection_model
        
        if model is None:
            return jsonify({
                'success': False,
                'error': 'Model not loaded'
            }), 500
        
        # Get model classes
        if hasattr(model, 'names') and model.names:
            yolo_classes = model.names
            print(f"📋 Model classes from model: {yolo_classes}")
        else:
            # Model doesn't have names attribute
            yolo_classes = {0: '0', 1: '1', 2: '2'}
            print(f"⚠️ Model has no names, using indices: {yolo_classes}")
        
        # Map to library pest names using our mapping
        mapped_classes = []
        for class_id in sorted(yolo_classes.keys()):
            yolo_class = yolo_classes[class_id]
            pest_name = map_yolo_class_to_pest_name(yolo_class, class_id)
            
            # Check if pest exists in library
            available = False
            try:
                available = pest_name in pest_library.pests
            except:
                available = False
            
            mapped_classes.append({
                'class_id': class_id,
                'yolo_class': yolo_class,
                'library_pest': pest_name,
                'available_in_library': available
            })
        
        return jsonify({
            'success': True,
            'data': {
                'classes': mapped_classes,
                'count': len(mapped_classes),
                'mapping_info': 'Class IDs: 0=BPH, 1=Rice Leaf-folder, 2=Paddy Bug'
            }
        })
        
    except Exception as e:
        print(f"❌ Error in get_detection_classes: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500


@pest_detection_bp.route('/library/search', methods=['GET'])
def search_pest_library():
    """Search for pests in the library"""
    try:
        query = request.args.get('q', '')
        language = request.args.get('language', 'en')
        
        if not query:
            return jsonify({'success': False, 'error': 'Search query required'}), 400
        
        results = pest_library.search_pests(query, language)
        
        return jsonify({
            'success': True,
            'data': {
                'results': results,
                'count': len(results)
            }
        })
        
    except Exception as e:
        print(f"❌ Error in search_pest_library: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500


@pest_detection_bp.route('/library/all', methods=['GET'])
def get_all_pests():
    """Get list of all pests in the library"""
    try:
        language = request.args.get('language', 'en')
        pests = pest_library.get_all_pests(language)
        
        return jsonify({
            'success': True,
            'data': {
                'pests': pests,
                'count': len(pests)
            }
        })
        
    except Exception as e:
        print(f"❌ Error in get_all_pests: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500


@pest_detection_bp.route('/library/<pest_name>', methods=['GET'])
def get_pest_details(pest_name):
    """Get detailed information about a specific pest"""
    try:
        language = request.args.get('language', 'en')
        
        pest_info = pest_library.get_pest_info(pest_name, language)
        
        if pest_info:
            return jsonify({
                'success': True,
                'data': pest_info
            })
        else:
            return jsonify({
                'success': False,
                'error': 'Pest not found in library'
            }), 404
        
    except Exception as e:
        print(f"❌ Error in get_pest_details: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500


@pest_detection_bp.route('/library/prevention-tips', methods=['GET'])
def get_prevention_tips():
    """Get general pest prevention tips"""
    try:
        pest_name = request.args.get('pest')
        
        if pest_name:
            tips = pest_library.get_prevention_tips(pest_name)
        else:
            tips = pest_library.get_prevention_tips()
        
        return jsonify({
            'success': True,
            'data': {
                'tips': tips,
                'count': len(tips)
            }
        })
        
    except Exception as e:
        print(f"❌ Error in get_prevention_tips: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500


# Simple in-memory storage
detection_history = []


@pest_detection_bp.route('/history', methods=['GET'])
def get_detection_history():
    """Get pest detection history"""
    try:
        user_id = request.args.get('user_id', 'anonymous')
        limit = int(request.args.get('limit', 20))
        
        user_history = [h for h in detection_history if h.get('user_id') == user_id]
        
        # Return last items
        recent_history = user_history[-limit:] if user_history else []
        
        return jsonify({
            'success': True,
            'data': recent_history
        })
        
    except Exception as e:
        print(f"❌ Error in get_detection_history: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500


@pest_detection_bp.route('/save-detection', methods=['POST'])
def save_detection():
    """Save detection result to in-memory storage"""
    try:
        data = request.json
        if not data:
            return jsonify({'success': False, 'error': 'No data provided'}), 400
        
        data['id'] = str(uuid.uuid4())
        data['timestamp'] = datetime.now().isoformat()
        
        # Store in memory list
        detection_history.append(data)
        
        # Keep only last 100 items 
        if len(detection_history) > 100:
            detection_history.pop(0)
        
        return jsonify({
            'success': True,
            'data': {
                'id': data['id']
            }
        })
        
    except Exception as e:
        print(f"❌ Error in save_detection: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500


@pest_detection_bp.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint for pest detection service"""
    try:
        model = current_app.pest_detection_model
        class_names = current_app.pest_class_names if hasattr(current_app, 'pest_class_names') else {}
        
        # Get model classes if available
        model_classes = {}
        if model is not None:
            if hasattr(model, 'names') and model.names:
                model_classes = model.names
            else:
                model_classes = {0: 'Class 0', 1: 'Class 1', 2: 'Class 2'}
        
        return jsonify({
            'status': 'healthy',
            'model_loaded': model is not None,
            'classes': class_names,
            'model_classes': model_classes,
            'class_mapping': CLASS_ID_TO_PEST,
            'endpoints': [
                '/detect',
                '/detect-from-camera', 
                '/classes',
                '/library/search',
                '/library/all',
                '/library/<pest_name>',
                '/library/prevention-tips',
                '/history',
                '/save-detection',
                '/health'
            ],
            'message': 'Pest detection service is running',
            'timestamp': datetime.now().isoformat()
        }), 200
        
    except Exception as e:
        print(f"❌ Error in health_check: {str(e)}")
        return jsonify({
            'status': 'unhealthy',
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500


# Debug endpoint to test class mapping
@pest_detection_bp.route('/test-mapping', methods=['GET'])
def test_mapping():
    """Test endpoint to verify class mapping"""
    test_cases = [
        {'class_id': 0, 'name': 'brown planthopper', 'expected': 'Brown Planthopper (BPH)'},
        {'class_id': 1, 'name': 'rice leaf-folder', 'expected': 'Rice Leaf-folder'},
        {'class_id': 2, 'name': 'paddy bug', 'expected': 'Paddy Bug'},
        {'class_id': 0, 'name': '0', 'expected': 'Brown Planthopper (BPH)'},
        {'class_id': 1, 'name': '1', 'expected': 'Rice Leaf-folder'},
        {'class_id': 2, 'name': '2', 'expected': 'Paddy Bug'},
    ]
    
    results = []
    for test in test_cases:
        mapped = map_yolo_class_to_pest_name(test['name'], test['class_id'])
        results.append({
            'input_class_id': test['class_id'],
            'input_name': test['name'],
            'mapped_to': mapped,
            'expected': test['expected'],
            'correct': mapped == test['expected']
        })
    
    return jsonify({
        'success': True,
        'test_results': results,
        'current_mapping': CLASS_ID_TO_PEST
    })