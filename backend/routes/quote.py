# quote.py (secured with @require_auth)

from flask import Blueprint, request, jsonify, g
from kite_client import get_kite
from auth import require_auth

quote_bp = Blueprint('quote', __name__)

@quote_bp.route("/api/quote")
@require_auth
def quote():
    symbol = request.args.get("symbol")
    kite = get_kite(g.user_id)
    return jsonify(kite.quote([symbol]))
