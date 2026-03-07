from flask import Blueprint, request, jsonify, current_app
import google.generativeai as genai
import os
import traceback
from datetime import datetime
import time

gemini_bp = Blueprint('gemini', __name__, url_prefix='/api/gemini')

# Configure Gemini API
GEMINI_API_KEY = 'AIzaSyD3f0os2ci9v_zydmXuItLWYutbbnCDEVM'  # Your API key
genai.configure(api_key=GEMINI_API_KEY)

# Available models for reference
AVAILABLE_MODELS = {
    'flash': 'gemini-1.5-flash',
    'pro': 'gemini-1.5-pro',
    'legacy': 'gemini-1.0-pro'
}

# Rate limiting simple store
request_counts = {}

def check_rate_limit(ip_address):
    """Simple rate limiting - 30 requests per minute"""
    now = time.time()
    if ip_address in request_counts:
        # Clean old requests
        request_counts[ip_address] = [t for t in request_counts[ip_address] if now - t < 60]
        if len(request_counts[ip_address]) >= 30:
            return False
        request_counts[ip_address].append(now)
    else:
        request_counts[ip_address] = [now]
    return True

@gemini_bp.route('/chat', methods=['POST'])
def chat():
    """
    Endpoint for Gemini AI chat
    """
    # Get client IP for rate limiting
    client_ip = request.remote_addr
    
    # Optional rate limiting
    # if not check_rate_limit(client_ip):
    #     return jsonify({
    #         'success': False,
    #         'error': 'Rate limit exceeded. Please try again later.'
    #     }), 429
    
    try:
        data = request.json
        prompt = data.get('prompt', '')
        language = data.get('language', 'en')
        context = data.get('context', {})
        model_type = data.get('model', 'flash')  # Allow client to choose model

        if not prompt:
            return jsonify({'success': False, 'error': 'No prompt provided'}), 400

        # Select model based on request or default to flash
        model_name = AVAILABLE_MODELS.get(model_type, AVAILABLE_MODELS['flash'])
        
        # Initialize the model
        model = genai.GenerativeModel(model_name)

        # Create system prompt based on language with enhanced instructions
        if language == 'en':
            system_prompt = """You are an expert agricultural assistant specializing in rice farming in Sri Lanka. 
            
            **Your Role:**
            - Provide accurate, practical advice about pest management, fertilizers, diseases, and farming practices
            - Keep responses clear, concise, and helpful for farmers
            - Use bullet points and emojis for better readability
            - Focus on Sri Lankan context, varieties (BG series), and local practices
            - Include specific recommendations when possible (variety names, chemical names, application rates)
            - Mention organic alternatives when relevant
            
            **Format your responses with:**
            - 🔍 **Identification** (for pests/diseases)
            - 🌱 **Cultural Control**
            - 🛡️ **Biological Control** 
            - 🧪 **Chemical Control** (if threshold exceeded)
            - 📊 **Thresholds/Action Levels**
            - 💡 **Pro Tips**
            
            **Always prioritize:**
            - Integrated Pest Management (IPM) approaches
            - Safety of farmers and environment
            - Cost-effective solutions
            - Local availability of inputs"""
        else:
            system_prompt = """ඔබ ශ්‍රී ලංකාවේ වී වගාව පිළිබඳ විශේෂඥ කෘෂිකර්ම සහායකයෙකි. 
            
            **ඔබේ කාර්යභාරය:**
            - පළිබෝධ කළමනාකරණය, පොහොර, රෝග, සහ ගොවිතැන් පිළිවෙත් පිළිබඳ නිවැරදි, ප්‍රායෝගික උපදෙස් ලබා දෙන්න
            - ගොවීන්ට පැහැදිලි සහ ප්‍රයෝජනවත් පිළිතුරු තබා ගන්න
            - වඩා හොඳ කියවීමේ හැකියාව සඳහා බුලට් පොයින්ට් සහ ඉමොජි භාවිතා කරන්න
            - ශ්‍රී ලංකානු සන්දර්භය, ප්‍රභේද (BG මාලාව), සහ දේශීය පිළිවෙත් කෙරෙහි අවධානය යොමු කරන්න
            - හැකි විට විශේෂිත නිර්දේශ ඇතුළත් කරන්න (ප්‍රභේද නම්, රසායනික නම්, යෙදුම් ප්‍රමාණ)
            - අදාළ විට කාබනික විකල්ප සඳහන් කරන්න
            
            **ඔබේ පිළිතුරු මෙලෙස හැඩතල ගන්වන්න:**
            - 🔍 **හඳුනාගැනීම** (පළිබෝධ/රෝග සඳහා)
            - 🌱 **සංස්කෘතික පාලනය**
            - 🛡️ **ජීව විද්‍යාත්මක පාලනය**
            - 🧪 **රසායනික පාලනය** (සීමාව ඉක්මවූ විට)
            - 📊 **සීමාවන්/ක්‍රියාකාරී මට්ටම්**
            - 💡 **ප්‍රයෝජනවත් උපදෙස්**
            
            **සැමවිටම ප්‍රමුඛත්වය දෙන්න:**
            - ඒකාබද්ධ පළිබෝධ කළමනාකරණ (IPM) ප්‍රවේශයන්
            - ගොවීන්ගේ සහ පරිසරයේ ආරක්ෂාව
            - ලාභදායී විසඳුම්
            - දේශීයව ලබා ගත හැකි යෙදවුම්"""

        # Add context about detected pest if available
        if context.get('detectedPest'):
            if language == 'en':
                system_prompt += f"\n\nThe user has detected **{context['detectedPest']}** in their field. Provide comprehensive information about managing this specific pest, including identification, thresholds, and control measures."
            else:
                system_prompt += f"\n\nපරිශීලකයා ඔවුන්ගේ කෙතේ **{context['detectedPest']}** හඳුනාගෙන ඇත. මෙම විශේෂිත පළිබෝධය කළමනාකරණය කිරීම පිළිබඳ සවිස්තරාත්මක තොරතුරු සපයන්න, හඳුනාගැනීම, සීමාවන්, සහ පාලන ක්‍රම ඇතුළත් කරන්න."

        # Add crop stage context if available
        if context.get('cropStage'):
            if language == 'en':
                system_prompt += f"\n\nThe crop is at **{context['cropStage']}** stage. Tailor your advice accordingly."
            else:
                system_prompt += f"\n\nබෝගය **{context['cropStage']}** අවධියේ පවතී. ඒ අනුව ඔබේ උපදෙස් සකස් කරන්න."

        # Add district context if available
        if context.get('district'):
            if language == 'en':
                system_prompt += f"\n\nThis is for **{context['district']}** district. Consider local conditions if relevant."
            else:
                system_prompt += f"\n\nමෙය **{context['district']}** දිස්ත්‍රික්කය සඳහාය. අදාළ නම් ප්‍රාදේශීය තත්ත්වයන් සලකා බලන්න."

        # Generate response
        full_prompt = f"{system_prompt}\n\n**Question:** {prompt}\n\n**Answer:**"
        
        # Set generation config for better responses
        generation_config = {
            'temperature': 0.7,
            'top_p': 0.95,
            'top_k': 40,
            'max_output_tokens': 2048,
        }
        
        response = model.generate_content(
            full_prompt,
            generation_config=generation_config
        )

        # Log successful request
        print(f"✅ Gemini API request successful at {datetime.now().isoformat()}")
        print(f"   Language: {language}, Model: {model_name}")

        return jsonify({
            'success': True,
            'data': response.text,
            'language': language,
            'model_used': model_name,
            'timestamp': datetime.now().isoformat()
        })

    except Exception as e:
        # Log full error details
        error_msg = str(e)
        print(f"❌ Gemini API Error at {datetime.now().isoformat()}:")
        print(traceback.format_exc())
        
        # Check for common errors
        if 'API key' in error_msg.lower():
            error_msg = "Invalid API key. Please check your Gemini API configuration."
        elif 'quota' in error_msg.lower() or 'rate limit' in error_msg.lower():
            error_msg = "API quota exceeded. Please try again later."
        elif 'model' in error_msg.lower() and 'not found' in error_msg.lower():
            error_msg = "Model not available. Please check the model name."
        
        return jsonify({
            'success': False,
            'error': error_msg,
            'timestamp': datetime.now().isoformat()
        }), 500

@gemini_bp.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'message': 'Gemini API is ready',
        'available_models': AVAILABLE_MODELS,
        'timestamp': datetime.now().isoformat()
    })

@gemini_bp.route('/models', methods=['GET'])
def list_models():
    """List available Gemini models"""
    try:
        models = genai.list_models()
        model_list = []
        for m in models:
            model_list.append({
                'name': m.name,
                'display_name': m.display_name,
                'supported_methods': m.supported_generation_methods
            })
        return jsonify({
            'success': True,
            'models': model_list
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@gemini_bp.route('/test', methods=['GET'])
def test():
    """Simple test endpoint"""
    return jsonify({
        'success': True,
        'message': 'Gemini endpoint is working',
        'timestamp': datetime.now().isoformat()
    })