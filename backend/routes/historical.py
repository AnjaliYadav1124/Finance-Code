# historical.py (secured with @require_auth)

from flask import Blueprint, request, jsonify, g
from kite_client import get_kite
from instrument_master import instrument_data
from datetime import datetime, timedelta
from auth import require_auth

historical_bp = Blueprint('historical', __name__)

def get_token_by_symbol(symbol):
    for inst in instrument_data:
        if inst["tradingsymbol"] == symbol and inst["exchange"] in ["NSE", "BSE", "NFO"]:
            return inst["instrument_token"]
    return None

@historical_bp.route("/api/historical")
@require_auth
def historical_data():
    symbol = request.args.get("symbol")
    interval = request.args.get("interval", "5minute")
    days = int(request.args.get("days", 5))

    token = get_token_by_symbol(symbol)
    if not token:
        return jsonify({"error": "Invalid symbol"}), 400

    kite = get_kite(g.user_id)
    to_date = datetime.now()
    from_date = to_date - timedelta(days=days)

    data = kite.historical_data(token, from_date, to_date, interval)
    return jsonify(data)
