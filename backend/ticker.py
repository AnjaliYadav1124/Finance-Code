# ticker.py (enhanced to include Watchlist symbols)

from kiteconnect import KiteTicker
from kite_client import get_kite
import os
from flask_socketio import SocketIO
import threading
from db import get_db_connection

socketio = SocketIO(cors_allowed_origins="*")

def start_ticker(user_id):
    kite = get_kite(user_id)
    access_token = kite.access_token
    api_key = os.getenv("KITE_API_KEY")

    instrument_tokens = get_instrument_tokens(kite, user_id)
    kws = KiteTicker(api_key, access_token)

    def on_ticks(ws, ticks):
        for tick in ticks:
            socketio.emit(f"tick:{user_id}", tick)

    def on_connect(ws, response):
        print("WS connected")
        ws.subscribe(instrument_tokens)
        ws.set_mode(ws.MODE_LTP, instrument_tokens)

    def on_close(ws, code, reason):
        print("WS closed")

    kws.on_ticks = on_ticks
    kws.on_connect = on_connect
    kws.on_close = on_close

    threading.Thread(target=kws.connect).start()

def get_instrument_tokens(kite, user_id):
    tokens = set()
    # Holdings
    for h in kite.holdings():
        tokens.add(h['instrument_token'])
    # Positions
    for p in kite.positions().get("day", []):
        tokens.add(p['instrument_token'])

    # Watchlist
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT symbol, exchange FROM watchlist WHERE user_id = %s", (user_id,))
    watchlist_items = cursor.fetchall()
    cursor.close()
    conn.close()

    from instrument_master import instrument_data
    for item in watchlist_items:
        match = next((i for i in instrument_data if i["tradingsymbol"] == item["symbol"] and i["exchange"] == item["exchange"]), None)
        if match:
            tokens.add(match["instrument_token"])

    return list(tokens)
