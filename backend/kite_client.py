# kite_client.py
from kiteconnect import KiteConnect
import os
from db import get_db_connection

def get_kite(user_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT access_token FROM users WHERE user_id = %s", (user_id,))
    result = cursor.fetchone()
    cursor.close()
    conn.close()

    if not result:
        raise Exception("User not found or not authenticated")

    kite = KiteConnect(api_key=os.getenv("KITE_API_KEY"))
    kite.set_access_token(result["access_token"])

    # ✅ Try a simple API call to validate token
    try:
        kite.profile()
    except Exception:
        raise Exception("Access token invalid or expired. Please login again.")

    return kite
