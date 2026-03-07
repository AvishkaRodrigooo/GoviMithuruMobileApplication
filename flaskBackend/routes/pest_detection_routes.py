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

# Import your pest library
from utils.pest_library import pest_library

pest_detection_bp = Blueprint('pest_detection', __name__)

UPLOAD_FOLDER = 'uploads/pest_detection'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}

# Create upload folder if it doesn't exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def is_rice_field_image(image_path):
    """
    Simple check to see if the image might be a rice field
    This is a basic check - you can enhance this with a classifier
    """
    try:
        img = cv2.imread(image_path)
        if img is None:
            return True  # Assume it's valid if can't read
        
        # Convert to HSV for better color analysis
        hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
        
        # Define green color range for rice plants
        lower_green = np.array([35, 40, 40])
        upper_green = np.array([85, 255, 255])
        
        # Create mask for green regions
        green_mask = cv2.inRange(hsv, lower_green, upper_green)
        
        # Calculate percentage of green pixels
        green_pixels = cv2.countNonZero(green_mask)
        total_pixels = img.shape[0] * img.shape[1]
        green_percentage = (green_pixels / total_pixels) * 100
        
        print(f"🌱 Green percentage in image: {green_percentage:.2f}%")
        
        # FIX: Lower threshold to 1% to be more permissive
        if green_percentage < 1:
            print("⚠️ Image has very little green - might not be a rice field")
            return False
        
        return True
    except Exception as e:
        print(f"⚠️ Error in is_rice_field_image: {e}")
        return True  # Assume it's valid on error

def map_yolo_class_to_pest_name(yolo_class_name, class_id=None, confidence=None):
    """
    Map YOLO detection class names to pest library keys
    This handles variations in naming between model and library
    """
    # First, check what the YOLO class name is
    print(f"🔍 Mapping YOLO class: '{yolo_class_name}' (ID: {class_id}, Confidence: {confidence})")
    
    # HARD-CODED MAPPING for your specific 3 classes and common pests
    hardcoded_mapping = {
        # String mappings
        '0': 'Brown Planthopper (BPH)',
        '1': 'Rice Leaf-folder',
        '2': 'Paddy Bug',
        # Integer mappings
        0: 'Brown Planthopper (BPH)',
        1: 'Rice Leaf-folder',
        2: 'Paddy Bug',
        # Name mappings
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
        'rice_bug': 'Paddy Bug',
        # Caterpillar mappings
        'caterpillar': 'Caterpillar',
        'armyworm': 'Armyworm',
        'worm': 'Caterpillar',
        'larva': 'Caterpillar',
        'cutworm': 'Cutworm',
        'bollworm': 'Bollworm',
        'hornworm': 'Hornworm',
        'looper': 'Looper Caterpillar'
    }
    
    # IMPORTANT: Your model is outputting actual class IDs (0, 1, 2)
    # First try mapping by class_id (most reliable)
    if class_id is not None:
        if class_id in hardcoded_mapping:
            mapped_name = hardcoded_mapping[class_id]
            print(f"✅ ID mapping found for class {class_id}: '{mapped_name}'")
            return mapped_name
        else:
            print(f"⚠️ Class ID {class_id} not found in mapping")
    
    # If class_id didn't work, try mapping by the raw yolo_class_name
    yolo_lower = str(yolo_class_name).lower().strip()
    
    # Check if it's a digit string
    if str(yolo_class_name).isdigit():
        class_id_from_str = int(yolo_class_name)
        if class_id_from_str in hardcoded_mapping:
            mapped_name = hardcoded_mapping[class_id_from_str]
            print(f"✅ Converted digit '{yolo_class_name}' to ID mapping: '{mapped_name}'")
            return mapped_name
    
    # Try direct string mapping
    if yolo_lower in hardcoded_mapping:
        mapped_name = hardcoded_mapping[yolo_lower]
        print(f"✅ String mapping found: '{mapped_name}'")
        return mapped_name
    
    # If no exact match, try partial matching
    if any(word in yolo_lower for word in ['brown', 'planthopper', 'bph']):
        print(f"✅ Partial match (BPH): 'Brown Planthopper (BPH)'")
        return 'Brown Planthopper (BPH)'
    elif any(word in yolo_lower for word in ['leaf', 'folder']) and ('rice' in yolo_lower or 'paddy' in yolo_lower):
        print(f"✅ Partial match (Leaf folder): 'Rice Leaf-folder'")
        return 'Rice Leaf-folder'
    elif any(word in yolo_lower for word in ['paddy', 'bug']) or 'rice bug' in yolo_lower:
        print(f"✅ Partial match (Paddy Bug): 'Paddy Bug'")
        return 'Paddy Bug'
    elif any(word in yolo_lower for word in ['caterpillar', 'worm', 'armyworm', 'larva']):
        print(f"✅ Partial match (Caterpillar): 'Caterpillar'")
        return 'Caterpillar'
    elif any(word in yolo_lower for word in ['cutworm']):
        print(f"✅ Partial match (Cutworm): 'Cutworm'")
        return 'Cutworm'
    
    # Try to find partial match in pest library keys
    try:
        for pest_key in pest_library.pests.keys():
            pest_key_lower = pest_key.lower()
            # Check if any word from YOLO class appears in pest key
            yolo_words = yolo_lower.split()
            for word in yolo_words:
                if len(word) > 3 and word in pest_key_lower:
                    print(f"✅ Library match found: '{pest_key}' (matched word: '{word}')")
                    return pest_key
            
            # Also try reverse: check if pest key words appear in YOLO class
            pest_words = pest_key_lower.split()
            for word in pest_words:
                if len(word) > 3 and word in yolo_lower:
                    print(f"✅ Library match found: '{pest_key}' (matched word: '{word}')")
                    return pest_key
    except Exception as e:
        print(f"⚠️ Error accessing pest library: {e}")
    
    # If still no match, check against current app's class names
    try:
        app_class_names = current_app.pest_class_names
        for class_id_val, class_name in app_class_names.items():
            if class_name.lower() == yolo_lower:
                print(f"✅ App class match: '{class_name}'")
                return class_name
    except:
        pass
    
    # Return original if no mapping found with a warning
    print(f"⚠️ No mapping found for: '{yolo_class_name}' - using original")
    return yolo_class_name

def run_detection(image_path, model, confidence_threshold=0.25):
    """Run detection and return formatted results"""
    try:
        print(f"🔬 Running inference with confidence threshold: {confidence_threshold}")
        
        # Print model info for debugging
        if hasattr(model, 'names'):
            print(f"📋 Model class names: {model.names}")
        else:
            print("⚠️ Model doesn't have 'names' attribute")
        
        # Run inference with a very low threshold to catch any detection
        # This ensures we see everything, then filter later
        results = model(image_path, conf=0.1)  # Lower threshold to catch more
        
        detections = []
        for result_idx, result in enumerate(results):
            boxes = result.boxes
            if boxes is not None and len(boxes) > 0:
                print(f"📦 Found {len(boxes)} detections in result {result_idx}")
                
                for box_idx, box in enumerate(boxes):
                    class_id = int(box.cls[0])
                    confidence = float(box.conf[0])
                    
                    # Get class name from model if available
                    if hasattr(result, 'names') and result.names and class_id in result.names:
                        yolo_class_name = result.names[class_id]
                    else:
                        yolo_class_name = str(class_id)
                    
                    print(f"  📍 Detection {box_idx}: class='{yolo_class_name}' (ID:{class_id}), conf={confidence:.3f}")
                    
                    # Map to pest name using class_id
                    pest_name = map_yolo_class_to_pest_name(yolo_class_name, class_id, confidence)
                    
                    # Get bounding box coordinates
                    bbox = []
                    if hasattr(box, 'xyxy') and len(box.xyxy) > 0:
                        bbox = box.xyxy[0].tolist()
                    
                    detection = {
                        'class': pest_name,
                        'yolo_class': yolo_class_name,
                        'class_id': class_id,
                        'confidence': confidence,
                        'bbox': bbox
                    }
                    detections.append(detection)
            else:
                print(f"📭 No detections in result {result_idx}")
        
        # Generate annotated image
        annotated_base64 = ""
        try:
            if len(results) > 0:
                # If we have results, plot them (even if no detections, this will return original image)
                annotated_img = results[0].plot()
                # Convert to base64
                _, buffer = cv2.imencode('.jpg', annotated_img)
                annotated_base64 = base64.b64encode(buffer).decode('utf-8')
            else:
                # If no results at all, return original image
                img = cv2.imread(image_path)
                if img is not None:
                    _, buffer = cv2.imencode('.jpg', img)
                    annotated_base64 = base64.b64encode(buffer).decode('utf-8')
        except Exception as e:
            print(f"⚠️ Error generating annotated image: {e}")
            # Fallback to original image
            try:
                img = cv2.imread(image_path)
                if img is not None:
                    _, buffer = cv2.imencode('.jpg', img)
                    annotated_base64 = base64.b64encode(buffer).decode('utf-8')
            except:
                annotated_base64 = ""
        
        return detections, annotated_base64
        
    except Exception as e:
        print(f"❌ Error in run_detection: {str(e)}")
        import traceback
        traceback.print_exc()
        # Return empty detections but still try to encode image
        try:
            img = cv2.imread(image_path)
            if img is not None:
                _, buffer = cv2.imencode('.jpg', img)
                annotated_base64 = base64.b64encode(buffer).decode('utf-8')
            else:
                annotated_base64 = ""
        except:
            annotated_base64 = ""
        
        return [], annotated_base64

def get_bph_management():
    """Return BPH management data directly"""
    return {
        'name': 'Brown Planthopper (BPH)',
        'description': 'Small brown insects that cluster at the base of rice plants, causing hopperburn and wilting.',
        'symptoms': [
            'Yellowing of leaves',
            'Stunted growth',
            'Wilting',
            'Hopperburn patches'
        ],
        'management': [
            'Use resistant varieties',
            'Maintain proper spacing',
            'Avoid excessive nitrogen fertilizer',
            'Use recommended pesticides like buprofezin or pymetrozine',
            'Practice alternate wetting and drying',
            'Conserve natural enemies like spiders and ladybirds'
        ]
    }

def get_leaf_folder_management():
    """Return Rice Leaf-folder management data"""
    return {
        'name': 'Rice Leaf-folder',
        'description': 'Caterpillars that fold rice leaves and feed on green tissues, reducing photosynthesis.',
        'symptoms': [
            'Leaves folded longitudinally',
            'White streaks on leaves',
            'Reduced photosynthesis',
            'Scraped leaf surface'
        ],
        'management': [
            'Use light traps to monitor adult moths',
            'Conserve natural enemies like parasitoids',
            'Avoid excessive nitrogen fertilizer',
            'Use recommended insecticides if damage exceeds threshold',
            'Practice field sanitation'
        ]
    }

def get_paddy_bug_management():
    """Return Paddy Bug management data"""
    return {
        'name': 'Paddy Bug',
        'description': 'Insects that feed on developing grains causing unfilled or discolored grains.',
        'symptoms': [
            'Unfilled grains',
            'Discolored grains',
            'Spotted grains',
            'Chaffy grains'
        ],
        'management': [
            'Early planting to avoid peak populations',
            'Use resistant varieties',
            'Apply insecticides at heading stage if needed',
            'Practice synchronous planting',
            'Maintain field hygiene'
        ]
    }

def get_caterpillar_management():
    """Return generic caterpillar management data"""
    return {
        'name': 'Caterpillar',
        'description': 'Caterpillars are the larval stage of moths and butterflies that feed on plant leaves, causing damage to crops.',
        'symptoms': [
            'Chewed leaves',
            'Holes in leaves',
            'Presence of caterpillars on plants',
            'Leaf skeletonization',
            'Droppings (frass) on leaves'
        ],
        'management': [
            'Handpick and destroy caterpillars',
            'Use light traps to monitor adult moths',
            'Apply neem-based pesticides',
            'Use recommended insecticides if infestation is severe',
            'Practice crop rotation',
            'Conserve natural enemies like birds and parasitic wasps',
            'Use biological controls like Bacillus thuringiensis (Bt)'
        ]
    }

def get_armyworm_management():
    """Return Armyworm management data"""
    return {
        'name': 'Armyworm',
        'description': 'Armyworms are caterpillars that move in large groups and can quickly defoliate plants.',
        'symptoms': [
            'Ragged feeding damage on leaves',
            'Rapid defoliation',
            'Caterpillars moving in groups',
            'Presence of droppings'
        ],
        'management': [
            'Monitor fields regularly for early detection',
            'Use pheromone traps',
            'Apply recommended insecticides when larvae are small',
            'Conserve natural enemies',
            'Practice deep plowing to expose pupae',
            'Use biological controls'
        ]
    }

def get_cutworm_management():
    """Return Cutworm management data"""
    return {
        'name': 'Cutworm',
        'description': 'Cutworms are caterpillars that cut young plants at the base, causing them to wilt and die.',
        'symptoms': [
            'Seedlings cut off at ground level',
            'Wilting plants',
            'Caterpillars curled up in soil during day',
            'Missing plants in rows'
        ],
        'management': [
            'Use collars around young plants',
            'Handpick caterpillars at night',
            'Keep field free of weeds',
            'Apply insecticides around plant base',
            'Practice tillage to expose larvae'
        ]
    }

def get_pest_management_data(pest_name):
    """Get pest management data based on pest name"""
    pest_lower = pest_name.lower()
    
    if any(word in pest_lower for word in ['brown', 'planthopper', 'bph']):
        return get_bph_management()
    elif any(word in pest_lower for word in ['leaf', 'folder']) and any(word in pest_lower for word in ['rice', 'paddy']):
        return get_leaf_folder_management()
    elif any(word in pest_lower for word in ['paddy', 'bug']) or 'rice bug' in pest_lower:
        return get_paddy_bug_management()
    elif 'armyworm' in pest_lower:
        return get_armyworm_management()
    elif 'cutworm' in pest_lower:
        return get_cutworm_management()
    elif any(word in pest_lower for word in ['caterpillar', 'worm', 'larva']):
        return get_caterpillar_management()
    else:
        # Generic pest info
        return {
            'name': pest_name,
            'description': f'This appears to be {pest_name}. Please consult local agricultural expert for proper identification and management.',
            'symptoms': ['Visible pest on plant', 'Potential feeding damage'],
            'management': [
                'Consult local agricultural expert for proper identification',
                'Monitor crop regularly',
                'Practice integrated pest management',
                'Use recommended control measures based on local advice'
            ]
        }

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
        
        # Check if model is loaded
        if model is None:
            return jsonify({
                'success': False, 
                'error': 'Pest detection model not loaded. Please check server logs.'
            }), 500
        
        # Get parameters from request
        confidence_threshold = 0.25
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
                print(f"✅ Image saved temporarily: {temp_path}")
            else:
                return jsonify({'success': False, 'error': 'Invalid file type'}), 400
                
        elif request.is_json and 'image_base64' in request.json:
            image_data = request.json['image_base64']
            if ',' in image_data:
                image_data = image_data.split(',')[1]
            
            image_bytes = base64.b64decode(image_data)
            image = Image.open(io.BytesIO(image_bytes))
            
            temp_path = os.path.join(UPLOAD_FOLDER, f"temp_{uuid.uuid4()}.jpg")
            image.save(temp_path)
            print(f"✅ Base64 image saved temporarily: {temp_path}")
            
        else:
            return jsonify({'success': False, 'error': 'No image provided'}), 400
        
        # Verify image was saved
        if not os.path.exists(temp_path):
            return jsonify({'success': False, 'error': 'Failed to save image'}), 500
        
        # OPTIONAL: Rice field check - completely disabled to avoid filtering
        # is_rice_field = is_rice_field_image(temp_path)
        # if not is_rice_field:
        #     print("⚠️ Image doesn't appear to be a rice field")
        #     # Clean up temp file
        #     if temp_path and os.path.exists(temp_path):
        #         os.remove(temp_path)
        #     
        #     return jsonify({
        #         'success': True,
        #         'no_detections': True,
        #         'message': 'Please upload a rice field image',
        #         'data': {
        #             'detections': [],
        #             'count': 0,
        #             'annotated_image': None,
        #             'prevention_tips': []
        #         }
        #     })
        
        # Run detection
        print(f"🔍 Running detection on {temp_path}...")
        detections, annotated_base64 = run_detection(temp_path, model, confidence_threshold)
        print(f"✅ Found {len(detections)} detections")
        
        # Clean up temp file
        if temp_path and os.path.exists(temp_path):
            os.remove(temp_path)
            print(f"✅ Temporary file cleaned up: {temp_path}")
        
        # Log detection confidences for debugging
        if len(detections) > 0:
            confidences = [d['confidence'] for d in detections]
            print(f"📊 Detection confidences: {confidences}")
            for i, d in enumerate(detections):
                print(f"   Detection {i}: {d['class']} (conf: {d['confidence']:.3f})")
        else:
            print("📭 No detections found at all")
            return jsonify({
                'success': True,
                'no_detections': True,
                'message': 'No pests detected in the image',
                'data': {
                    'detections': [],
                    'count': 0,
                    'annotated_image': f"data:image/jpeg;base64,{annotated_base64}" if annotated_base64 else None,
                    'prevention_tips': [
                        "Practice good field hygiene",
                        "Monitor crops regularly",
                        "Use resistant varieties"
                    ]
                }
            })
        
        # FIX: Very low confidence threshold to catch all detections
        min_confidence = 0.15  # Very low threshold to catch everything
        
        filtered_detections = [d for d in detections if d['confidence'] >= min_confidence]
        
        print(f"📊 After confidence filtering (>{min_confidence}): {len(filtered_detections)} detections (from {len(detections)})")
        
        # If no detections after filtering, return no_detections
        if len(filtered_detections) == 0:
            print("📭 No pests detected after confidence filtering")
            return jsonify({
                'success': True,
                'no_detections': True,
                'message': 'No pests detected in the image',
                'data': {
                    'detections': [],
                    'count': 0,
                    'annotated_image': f"data:image/jpeg;base64,{annotated_base64}" if annotated_base64 else None,
                    'prevention_tips': [
                        "Practice good field hygiene",
                        "Monitor crops regularly",
                        "Use resistant varieties"
                    ]
                }
            })
        
        # If we have detections, process them
        print(f"📊 Processing {len(filtered_detections)} detections...")
        
        # Get detailed pest information
        enhanced_detections = []
        for detection in filtered_detections:
            pest_name = detection['class']
            confidence = detection['confidence']
            print(f"📚 Getting pest info for: '{pest_name}' (conf: {confidence:.3f})")
            
            pest_info = get_pest_management_data(pest_name)
            
            enhanced_detection = {
                **detection,
                'pest_details': pest_info
            }
            enhanced_detections.append(enhanced_detection)
        
        # Get general prevention tips
        prevention_tips = [
            "Practice good field hygiene",
            "Monitor crops regularly",
            "Use resistant varieties",
            "Maintain proper spacing",
            "Avoid excessive nitrogen fertilizer",
            "Conserve natural enemies"
        ]
        
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
    elif any(word in pest_lower for word in ['caterpillar', 'worm', 'larva']):
        return {
            **detection,
            'pest_details': {
                'name': 'Caterpillar',
                'description': 'This appears to be a caterpillar, which is the larval stage of a moth or butterfly.' if language == 'en' else 'මෙය දළඹුවෙකු ලෙස පෙනේ, එය සලබයෙකු හෝ සමනලයෙකුගේ කීට අවස්ථාවයි.',
                'symptoms': ['Chewed leaves', 'Visible caterpillars on plants'] if language == 'en' else ['හපන ලද කොළ', 'පැලෑටි මත දළඹුවන් පෙනීම'],
                'management': ['Handpick caterpillars', 'Use neem-based pesticides', 'Consult local expert'] if language == 'en' else ['දළඹුවන් අතින් එකතු කරන්න', 'නිම් බාහිත පළිබෝධනාශක භාවිතා කරන්න', 'පළාත් කෘෂිකර්ම නිලධාරි හමුවන්න']
            }
        }
    else:
        # Generic pest info
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
            yolo_classes = list(model.names.values())
        else:
            # If model doesn't have names, use our hardcoded classes
            yolo_classes = ['Brown Planthopper (BPH)', 'Rice Leaf-folder', 'Paddy Bug']
        
        print(f"📋 Model classes: {yolo_classes}")
        
        # Map to library pest names
        mapped_classes = []
        for i, yolo_class in enumerate(yolo_classes):
            pest_name = map_yolo_class_to_pest_name(yolo_class, i)
            
            # Check if pest exists in library
            available = False
            try:
                available = pest_name in pest_library.pests
            except:
                available = False
            
            mapped_classes.append({
                'class_id': i,
                'yolo_class': yolo_class,
                'library_pest': pest_name,
                'available_in_library': available
            })
        
        return jsonify({
            'success': True,
            'data': {
                'classes': mapped_classes,
                'count': len(mapped_classes)
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

# Simple in-memory storage for demo purposes
detection_history = []

@pest_detection_bp.route('/history', methods=['GET'])
def get_detection_history():
    """Get pest detection history"""
    try:
        user_id = request.args.get('user_id', 'anonymous')
        limit = int(request.args.get('limit', 20))
        
        # Filter by user_id if needed
        user_history = [h for h in detection_history if h.get('user_id') == user_id]
        
        # Return last 'limit' items
        recent_history = user_history[-limit:]
        
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
        
        # Add timestamp and ID
        data['id'] = str(uuid.uuid4())
        data['timestamp'] = datetime.now().isoformat()
        
        # Store in memory list
        detection_history.append(data)
        
        # Keep only last 100 items to prevent memory issues
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
        model_classes = []
        if model is not None:
            if hasattr(model, 'names') and model.names:
                model_classes = list(model.names.values())
            else:
                model_classes = ['Brown Planthopper (BPH)', 'Rice Leaf-folder', 'Paddy Bug']
        
        return jsonify({
            'status': 'healthy',
            'model_loaded': model is not None,
            'classes': class_names,
            'model_classes': model_classes,
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