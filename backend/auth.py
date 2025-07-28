# auth.py
from flask import Blueprint, redirect, request, jsonify, g
from db import get_db_connection
from kiteconnect import KiteConnect
from datetime import datetime, timedelta
import os, jwt, functools
from dotenv import load_dotenv
from urllib.parse import urlencode  # ✅ import this at the top

load_dotenv()

auth_bp = Blueprint('auth', __name__)
kite = KiteConnect(api_key=os.getenv("KITE_API_KEY"))
JWT_SECRET = os.getenv("JWT_SECRET", "default_secret")
JWT_EXPIRY_MINUTES = 60 * 24 * 7  # 7 days

@auth_bp.route("/login")
def login():
    return redirect(kite.login_url())


@auth_bp.route("/login/callback")
def callback():
    request_token = request.args.get("request_token")
    if not request_token:
        return "Login failed: No request token provided."

    try:
        data = kite.generate_session(request_token, api_secret=os.getenv("KITE_API_SECRET"))
        kite.set_access_token(data["access_token"])

        # Save user session
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO users (user_id, access_token, created_at)
            VALUES (%s, %s, %s)
            ON DUPLICATE KEY UPDATE access_token=%s, created_at=%s
        """, (
            data["user_id"], data["access_token"], datetime.utcnow(),
            data["access_token"], datetime.utcnow()
        ))
        conn.commit()
        cursor.close()
        conn.close()

        # Create JWT token
        jwt_expiry = datetime.utcnow() + timedelta(minutes=JWT_EXPIRY_MINUTES)
        token = jwt.encode({
            "user_id": data["user_id"],
            "exp": int(jwt_expiry.timestamp())
        }, JWT_SECRET, algorithm="HS256")

        # ✅ This is the key line:
        query = urlencode({
            "token": token,
            "user_id": data["user_id"]
        })
        print("LOGIN CALLBACK REDIRECT TO FRONTEND:")
        print(f"http://localhost:5173/dashboard?{query}")
        return redirect(f"http://localhost:5173/dashboard?{query}")

    except Exception as e:
        return f"Login failed: {str(e)}"


# JWT middleware
def require_auth(func):
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        token = None
        if 'Authorization' in request.headers:
            token = request.headers['Authorization'].replace("Bearer ", "")
        if not token:
            return jsonify({"error": "Token missing"}), 401
        try:
            payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
            g.user_id = payload['user_id']
        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Token expired"}), 401
        except jwt.InvalidTokenError:
            return jsonify({"error": "Invalid token"}), 401
        return func(*args, **kwargs)
    return wrapper
