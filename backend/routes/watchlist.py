# watchlist.py (secured with @require_auth)

from flask import Blueprint, request, jsonify, g
from db import get_db_connection
from auth import require_auth

watchlist_bp = Blueprint('watchlist', __name__)

@watchlist_bp.route("/api/watchlist", methods=["GET"])
@require_auth
def get_watchlist():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM watchlist WHERE user_id = %s", (g.user_id,))
    rows = cursor.fetchall()
    cursor.close()
    conn.close()
    return jsonify(rows)

@watchlist_bp.route("/api/watchlist", methods=["POST"])
@require_auth
def add_to_watchlist():
    data = request.json
    symbol = data["symbol"]
    exchange = data["exchange"]
    segment = data.get("segment", "NSE")

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO watchlist (user_id, symbol, exchange, segment) VALUES (%s, %s, %s, %s)",
        (g.user_id, symbol, exchange, segment)
    )
    conn.commit()
    cursor.close()
    conn.close()
    return jsonify({"message": "Added to watchlist"})

@watchlist_bp.route("/api/watchlist", methods=["DELETE"])
@require_auth
def delete_from_watchlist():
    symbol = request.args.get("symbol")
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM watchlist WHERE user_id = %s AND symbol = %s", (g.user_id, symbol))
    conn.commit()
    cursor.close()
    conn.close()
    return jsonify({"message": "Removed from watchlist"})
