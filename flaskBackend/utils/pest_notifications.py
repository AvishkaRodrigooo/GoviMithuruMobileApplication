import os
import requests
import json
from datetime import datetime, timedelta
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
import pytz

class OneSignalNotifier:
    """Handle push notifications via OneSignal"""
    
    def __init__(self):
        self.app_id = os.getenv('ONESIGNAL_APP_ID')
        self.api_key = os.getenv('ONESIGNAL_REST_API_KEY')
        self.base_url = "https://onesignal.com/api/v1"
        self.scheduler = BackgroundScheduler(timezone=pytz.timezone('Asia/Colombo'))
        self.scheduler.start()
        
    def send_notification(self, user_ids, headings, contents, data=None):
        """Send push notification to specific users"""
        if not self.app_id or not self.api_key:
            print("OneSignal credentials not configured")
            return False
        
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Basic {self.api_key}"
        }
        
        payload = {
            "app_id": self.app_id,
            "include_player_ids": user_ids if isinstance(user_ids, list) else [user_ids],
            "headings": {"en": headings},
            "contents": {"en": contents},
            "data": data or {},
            "priority": 10
        }
        
        try:
            response = requests.post(
                f"{self.base_url}/notifications",
                headers=headers,
                json=payload,
                timeout=10
            )
            result = response.json()
            print(f"Notification sent: {result}")
            return result.get('id') is not None
        except Exception as e:
            print(f"Failed to send notification: {e}")
            return False
    
    def send_to_segment(self, segment, headings, contents, data=None):
        """Send notification to all users in a segment"""
        if not self.app_id or not self.api_key:
            return False
        
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Basic {self.api_key}"
        }
        
        payload = {
            "app_id": self.app_id,
            "included_segments": [segment],
            "headings": {"en": headings},
            "contents": {"en": contents},
            "data": data or {},
            "priority": 10
        }
        
        try:
            response = requests.post(
                f"{self.base_url}/notifications",
                headers=headers,
                json=payload,
                timeout=10
            )
            return response.status_code == 200
        except Exception as e:
            print(f"Failed to send segment notification: {e}")
            return False
    
    def send_pest_alert(self, user_id, pest_name, risk_level, district):
        """Send pest alert notification"""
        headings = f"⚠️ Pest Alert: {pest_name}"
        
        if risk_level == 'High':
            contents = f"High risk of {pest_name} detected in {district}. Take immediate action!"
        elif risk_level == 'Medium':
            contents = f"Medium risk of {pest_name} in {district}. Monitor your fields closely."
        else:
            contents = f"Low risk of {pest_name} in {district}. Continue regular monitoring."
        
        data = {
            "type": "pest_alert",
            "pest": pest_name,
            "risk": risk_level,
            "district": district,
            "timestamp": datetime.now().isoformat()
        }
        
        return self.send_notification(user_id, headings, contents, data)
    
    def send_forecast_update(self, user_id, forecast_data):
        """Send daily forecast update"""
        pest = forecast_data.get('predicted_pest', 'pests')
        risk = forecast_data.get('risk_level', 'Medium')
        
        headings = f"🌾 Daily Pest Forecast"
        contents = f"Today's forecast: {risk} risk of {pest}. Check details in app."
        
        return self.send_notification(user_id, headings, contents, forecast_data)
    
    def schedule_daily_forecast(self, user_id, hour=6, minute=0):
        """Schedule daily forecast notifications"""
        trigger = CronTrigger(hour=hour, minute=minute, timezone=pytz.timezone('Asia/Colombo'))
        
        def job_func():
            # This will be called daily at specified time
            # You'll need to implement fetching the user's latest forecast
            print(f"Scheduled forecast for user {user_id}")
        
        self.scheduler.add_job(
            job_func,
            trigger,
            id=f"forecast_{user_id}",
            replace_existing=True
        )
        
        return True
    
    def cancel_scheduled(self, user_id):
        """Cancel scheduled notifications for user"""
        try:
            self.scheduler.remove_job(f"forecast_{user_id}")
            return True
        except:
            return False

# Singleton instance
notifier = OneSignalNotifier()