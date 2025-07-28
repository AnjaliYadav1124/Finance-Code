from flask import Blueprint, request, jsonify
from instrument_master import instrument_data

search_bp = Blueprint('search', __name__)

@search_bp.route("/api/search")
def search_stocks():
    query = request.args.get("q", "").upper()
    results = [
        i for i in instrument_data
        if query in i["tradingsymbol"].upper()
        and i["instrument_type"] in ["EQ", "FUT", "OPT"]
        and i["exchange"] in ["NSE", "BSE", "MCX"]
    ]
    return jsonify(results[:20])  # Limit to 20 results
