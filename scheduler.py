from apscheduler.schedulers.background import BackgroundScheduler
import requests

def daily():
    requests.post("http://localhost:5000/predict", json={
        "district": "Kurunegala",
        "season": "Yala",
        "paddy_age": 53
    })

def start():
    s = BackgroundScheduler()
    s.add_job(daily, "cron", hour=6)
    s.start()
