from kiteconnect import KiteConnect
import os
from dotenv import load_dotenv
from apscheduler.schedulers.background import BackgroundScheduler


load_dotenv()

kite = KiteConnect(api_key=os.getenv("KITE_API_KEY"))

instrument_data = []

def load_instruments():
    global instrument_data
    try:
        print("Loading instruments...")
        instrument_data.extend(kite.instruments())  # this will block until it downloads
        print(f"Loaded {len(instrument_data)} instruments")
    except Exception as e:
        print("❌ Failed to load instruments:", e)

def refresh_instrument_master():
    global instrument_data
    instrument_data = kite.instruments()

def start_scheduler():
    scheduler = BackgroundScheduler()
    scheduler.add_job(refresh_instrument_master, 'interval', hours=24)
    scheduler.start()