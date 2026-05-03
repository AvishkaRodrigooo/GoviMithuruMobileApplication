import { BASE_URL } from '../utils/apiConfig';

// Gemini Service - Connects to Flask Backend
const API_URL = BASE_URL; // Dynamically detected API URL

export const geminiService = {
  // Get response from Gemini via Flask backend
  getResponse: async (prompt, language = 'en', context = {}) => {
    try {
      console.log('📡 Sending request to Gemini API...');
      
      const response = await fetch(`${API_URL}/api/gemini/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          language,
          context
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        console.log('✅ Gemini response received');
        return data.data;
      } else {
        console.error('❌ API Error:', data.error);
        return null;
      }
    } catch (error) {
      console.error('❌ Network Error:', error);
      return null;
    }
  },

  // Test connection to Flask backend
  testConnection: async () => {
    try {
      const response = await fetch(`${API_URL}/api/gemini/health`);
      const data = await response.json();
      return response.ok;
    } catch (error) {
      console.error('❌ Connection test failed:', error);
      return false;
    }
  },

  // Get response with streaming (if needed)
  getStreamingResponse: async (prompt, onChunk, language = 'en', context = {}) => {
    // Note: Streaming would require Server-Sent Events or WebSocket
    // For now, use regular response
    try {
      const response = await geminiService.getResponse(prompt, language, context);
      if (response) {
        onChunk(response);
      }
    } catch (error) {
      console.error('❌ Stream Error:', error);
    }
  },

  // Get pest-specific advice
  getPestAdvice: async (pestName, language = 'en') => {
    const prompt = language === 'en' 
      ? `Tell me about ${pestName} in rice farming. Include identification, symptoms, and management practices.`
      : `වී වගාවේ ${pestName} පිළිබඳ තොරතුරු දෙන්න. හඳුනාගැනීම, රෝග ලක්ෂණ, සහ කළමනාකරණ පිළිවෙත් ඇතුළත් කරන්න.`;
    
    return geminiService.getResponse(prompt, language, { pestName });
  },

  // Get fertilizer recommendations
  getFertilizerAdvice: async (cropStage, language = 'en') => {
    const prompt = language === 'en'
      ? `What are the fertilizer recommendations for rice at ${cropStage} stage? Include application rates and timing.`
      : `වී වගාවේ ${cropStage} අවධියේදී පොහොර නිර්දේශ මොනවාද? යෙදිය යුතු ප්‍රමාණ සහ කාලය ඇතුළත් කරන්න.`;
    
    return geminiService.getResponse(prompt, language, { cropStage });
  },

  // Get disease information
  getDiseaseInfo: async (diseaseName, language = 'en') => {
    const prompt = language === 'en'
      ? `Tell me about ${diseaseName} in rice. Include symptoms, causes, and control measures.`
      : `වී වගාවේ ${diseaseName} රෝගය ගැන තොරතුරු දෙන්න. රෝග ලක්ෂණ, හේතු, සහ පාලන ක්‍රම ඇතුළත් කරන්න.`;
    
    return geminiService.getResponse(prompt, language, { diseaseName });
  },

  // Get seasonal advice
  getSeasonalAdvice: async (season, district, language = 'en') => {
    const prompt = language === 'en'
      ? `What are the best practices for rice farming during ${season} season in ${district}, Sri Lanka? Include variety selection, pest management, and fertilizer recommendations.`
      : `ශ්‍රී ලංකාවේ ${district} දිස්ත්‍රික්කයේ ${season} වාරයේදී වී වගාව සඳහා හොඳම පිළිවෙත් මොනවාද? ප්‍රභේද තෝරාගැනීම, පළිබෝධ කළමනාකරණය, සහ පොහොර නිර්දේශ ඇතුළත් කරන්න.`;
    
    return geminiService.getResponse(prompt, language, { season, district });
  },

  // Get weather impact advice
  getWeatherAdvice: async (weatherCondition, cropStage, language = 'en') => {
    const prompt = language === 'en'
      ? `How does ${weatherCondition} weather affect rice at ${cropStage} stage? What precautions should farmers take?`
      : `${weatherCondition} කාලගුණය වී වගාවේ ${cropStage} අවධියට බලපාන්නේ කෙසේද? ගොවීන් ගත යුතු පූර්වාරක්ෂා මොනවාද?`;
    
    return geminiService.getResponse(prompt, language, { weatherCondition, cropStage });
  },

  // Translate text (using Gemini's multilingual capabilities)
  translateText: async (text, targetLanguage) => {
    const prompt = targetLanguage === 'si'
      ? `Translate this English text to Sinhala: "${text}"`
      : `මෙම සිංහල පාඨය ඉංග්‍රීසියට පරිවර්තනය කරන්න: "${text}"`;
    
    return geminiService.getResponse(prompt, targetLanguage);
  },

  // Get organic farming advice
  getOrganicAdvice: async (pestName, language = 'en') => {
    const prompt = language === 'en'
      ? `What are organic methods to control ${pestName} in rice farming? Include natural enemies, botanical pesticides, and cultural practices.`
      : `වී වගාවේ ${pestName} පාලනය සඳහා කාබනික ක්‍රම මොනවාද? ස්වභාවික සතුරන්, ශාකසාර පළිබෝධනාශක, සහ සංස්කෘතික පිළිවෙත් ඇතුළත් කරන්න.`;
    
    return geminiService.getResponse(prompt, language, { pestName });
  },

  // Get general farming tips
  getFarmingTips: async (topic, language = 'en') => {
    const prompt = language === 'en'
      ? `Give me practical farming tips about ${topic} in Sri Lankan rice cultivation.`
      : `ශ්‍රී ලංකානු වී වගාවේ ${topic} පිළිබඳ ප්‍රායෝගික ගොවිතැන් උපදෙස් දෙන්න.`;
    
    return geminiService.getResponse(prompt, language, { topic });
  }
};

// Also export a function to check if the service is available
export const checkGeminiAvailability = async () => {
  return await geminiService.testConnection();
};

// Export default for convenience
export default geminiService;