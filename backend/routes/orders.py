# orders.py (with export endpoint for orders)

from flask import Blueprint, request, jsonify, g, Response
from kite_client import get_kite
from auth import require_auth
import csv
import io

orders_bp = Blueprint('orders', __name__)

@orders_bp.route("/api/orders")
@require_auth
def get_orders():
    kite = get_kite(g.user_id)
    return jsonify(kite.orders())

@orders_bp.route("/api/trades")
@require_auth
def get_trades():
    kite = get_kite(g.user_id)
    return jsonify(kite.trades())

@orders_bp.route("/api/orders/place", methods=["POST"])
@require_auth
def place_order():
    kite = get_kite(g.user_id)
    data = request.json

    try:
        symbol = data["symbol"]
        exchange = data.get("exchange", "NSE")
        quantity = int(data["quantity"])
        transaction_type = data["transaction_type"]
        order_type = data.get("order_type", "MARKET")
        product = data.get("product", "CNC")
        price = data.get("price")

        from instrument_master import instrument_data
        match = next((i for i in instrument_data if i["tradingsymbol"] == symbol and i["exchange"] == exchange), None)
        if not match:
            return jsonify({"error": "Invalid symbol or exchange"}), 400

        order_args = {
            "tradingsymbol": symbol,
            "exchange": exchange,
            "transaction_type": transaction_type,
            "quantity": quantity,
            "order_type": order_type,
            "product": product,
        }
        if order_type in ["LIMIT", "SL", "SL-M"] and price:
            order_args["price"] = float(price)

        order_id = kite.place_order(variety=kite.VARIETY_REGULAR, **order_args)
        return jsonify({"message": "Order placed successfully", "order_id": order_id})

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@orders_bp.route("/api/export/orders")
@require_auth
def export_orders():
    kite = get_kite(g.user_id)
    orders = kite.orders()
    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=orders[0].keys())
    writer.writeheader()
    for row in orders:
        writer.writerow(row)
    output.seek(0)
    return Response(output, mimetype='text/csv', headers={"Content-Disposition": "attachment; filename=orders.csv"})
