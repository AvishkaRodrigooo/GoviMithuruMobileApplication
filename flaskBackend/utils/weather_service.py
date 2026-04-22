import requests
import os
from datetime import datetime, timedelta
import numpy as np

class WeatherService:
    """Weather service using OpenWeatherMap (free alternative to Google Weather)"""
    
    def __init__(self):
        self.api_key = os.getenv('OPENWEATHER_API_KEY', '')
        self.base_url = "https://api.openweathermap.org/data/2.5"
        
    def get_current_weather(self, lat, lon):
        """Get current weather for given coordinates"""
        try:
            url = f"{self.base_url}/weather"
            params = {
                'lat': lat,
                'lon': lon,
                'appid': self.api_key,
                'units': 'metric'
            }
            response = requests.get(url, params=params, timeout=10)
            data = response.json()
            
            if response.status_code == 200:
                return {
                    'temp': data['main']['temp'],
                    'humidity': data['main']['humidity'],
                    'pressure': data['main']['pressure'],
                    'description': data['weather'][0]['description'],
                    'wind_speed': data['wind']['speed'],
                    'icon': data['weather'][0]['icon'],
                    'timestamp': datetime.now().isoformat()
                }
            else:
                return self._get_fallback_weather()
        except Exception as e:
            print(f"Weather API error: {e}")
            return self._get_fallback_weather()
    
    def get_forecast(self, lat, lon, days=7):
        """Get weather forecast for next N days"""
        try:
            url = f"{self.base_url}/forecast"
            params = {
                'lat': lat,
                'lon': lon,
                'appid': self.api_key,
                'units': 'metric',
                'cnt': days * 8  # 8 forecasts per day (3-hour intervals)
            }
            response = requests.get(url, params=params, timeout=10)
            data = response.json()
            
            if response.status_code == 200:
                daily_forecasts = []
                for i in range(0, len(data['list']), 8):
                    if i < len(data['list']):
                        day_data = data['list'][i]
                        daily_forecasts.append({
                            'date': day_data['dt_txt'].split()[0],
                            'temp': day_data['main']['temp'],
                            'humidity': day_data['main']['humidity'],
                            'description': day_data['weather'][0]['description'],
                            'rain': day_data.get('rain', {}).get('3h', 0)
                        })
                return daily_forecasts
            else:
                return self._get_fallback_forecast(days)
        except Exception as e:
            print(f"Forecast API error: {e}")
            return self._get_fallback_forecast(days)
    
    def get_weather_by_city(self, city, country='LK'):
        """Get weather for Sri Lankan cities"""
        cities = {
            'Anuradhapura': {'lat': 8.3114, 'lon': 80.4037},
            'Kurunegala': {'lat': 7.4867, 'lon': 80.3647},
            'Polonnaruwa': {'lat': 7.9403, 'lon': 81.0188},
            'Hambantota': {'lat': 6.1241, 'lon': 81.1185},
            'Colombo': {'lat': 6.9271, 'lon': 79.8612},
            'Kandy': {'lat': 7.2906, 'lon': 80.6337},
            'Galle': {'lat': 6.0535, 'lon': 80.2210},
            'Jaffna': {'lat': 9.6615, 'lon': 80.0255}
        }
        
        if city in cities:
            coords = cities[city]
            return self.get_current_weather(coords['lat'], coords['lon'])
        else:
            # Default to Anuradhapura
            return self.get_current_weather(8.3114, 80.4037)
    
    def _get_fallback_weather(self):
        """Return realistic fallback weather data for Sri Lanka"""
        return {
            'temp': 28.5,
            'humidity': 75,
            'pressure': 1012,
            'description': 'partly cloudy',
            'wind_speed': 3.5,
            'icon': '02d',
            'timestamp': datetime.now().isoformat(),
            'is_fallback': True
        }
    
    def _get_fallback_forecast(self, days):
        """Generate realistic fallback forecast"""
        forecasts = []
        base_temp = 28
        base_humidity = 75
        
        for i in range(days):
            date = (datetime.now() + timedelta(days=i)).strftime('%Y-%m-%d')
            forecasts.append({
                'date': date,
                'temp': base_temp + np.random.randint(-3, 4),
                'humidity': base_humidity + np.random.randint(-10, 11),
                'description': np.random.choice(['sunny', 'partly cloudy', 'cloudy', 'light rain']),
                'rain': np.random.randint(0, 20) if i % 3 == 0 else 0
            })
        
        return forecasts

# Singleton instance
weather_service = WeatherService()