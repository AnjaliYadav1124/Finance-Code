# dashboard.py (enhanced with % return, day change + CSV export)

from flask import Blueprint, request, jsonify, g, Response
from kite_client import get_kite
from auth import require_auth
from db import get_db_connection
import csv
import io


dashboard_bp = Blueprint('dashboard', __name__)


@dashboard_bp.route("/api/holdings")
@require_auth
def holdings():
    kite = get_kite(g.user_id)
    return jsonify(kite.holdings())

@dashboard_bp.route("/api/positions")
@require_auth
def positions():
    kite = get_kite(g.user_id)
    return jsonify(kite.positions())

@dashboard_bp.route("/api/margins")
@require_auth
def margins():
    kite = get_kite(g.user_id)
    return jsonify(kite.margins()["equity"])

@dashboard_bp.route("/api/dashboard/summary")
@require_auth
def dashboard_summary():
    kite = get_kite(g.user_id)
    holdings = kite.holdings()

    conn = get_db_connection()
    cursor = conn.cursor()  # ✅ CORRECT, DictCursor already set in db.py
    cursor.execute("SELECT symbol, lots FROM holding_config WHERE user_id = %s", (g.user_id,))
    lots_map = {row["symbol"]: row["lots"] for row in cursor.fetchall()}
    cursor.close()
    conn.close()

    result = []
    for h in holdings:
        symbol = h["tradingsymbol"]
        buy_price = h["average_price"]
        quantity = h["quantity"]
        lots = lots_map.get(symbol) or 1

        ltp = h["last_price"]
        prev_close = h.get("close_price", 0)

        # investment = round(buy_price * quantity, 2)
        # current_value = round(ltp * quantity, 2)
        investment = round(buy_price * lots, 2)
        current_value = round(ltp * lots, 2)

        pnl = round(current_value - investment, 2)
        lots = lots_map.get(symbol)

        return_pct = round(((ltp - buy_price) / buy_price) * 100, 2) if buy_price > 0 else None
        day_change = round(ltp - prev_close, 2) if prev_close > 0 else None
        day_change_pct = round((ltp - prev_close) / prev_close * 100, 2) if prev_close > 0 else None

        result.append({
            "symbol": symbol,
            "buy_price": buy_price,
            "quantity": quantity,
            "lots": lots,
            "investment": investment,
            "last_price": ltp,
            "current_value": current_value,
            "pnl": pnl,
            "return_pct": return_pct,
            "day_change": day_change,
            "day_change_pct": day_change_pct
        })

    return jsonify(result)

@dashboard_bp.route("/api/set-lots", methods=["POST"])
@require_auth
def set_lots():
    data = request.json
    symbol = data["symbol"]
    lots = int(data["lots"])

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO holding_config (user_id, symbol, lots)
        VALUES (%s, %s, %s)
        ON DUPLICATE KEY UPDATE lots = %s
    """, (g.user_id, symbol, lots, lots))
    conn.commit()
    cursor.close()
    conn.close()
    return jsonify({"message": "Lots updated successfully"})

@dashboard_bp.route("/api/export/holdings")
@require_auth
def export_holdings():
    kite = get_kite(g.user_id)
    holdings = kite.holdings()

    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=holdings[0].keys())
    writer.writeheader()
    for row in holdings:
        writer.writerow(row)

    output.seek(0)
    return Response(output, mimetype='text/csv', headers={"Content-Disposition": "attachment; filename=holdings.csv"})
