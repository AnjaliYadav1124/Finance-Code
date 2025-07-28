from flask import Flask, request
from flask_cors import CORS
import collections
import collections.abc
collections.Callable = collections.abc.Callable
from auth import auth_bp
from routes.dashboard import dashboard_bp
from routes.quote import quote_bp
from routes.watchlist import watchlist_bp
from routes.search import search_bp
from routes.historical import historical_bp
from routes.orders import orders_bp

from instrument_master import (
    load_instruments,
    refresh_instrument_master,
    start_scheduler
)

from ticker import socketio, start_ticker

# Initialize
load_instruments()        # Optional initial load
start_scheduler()

app = Flask(__name__)
CORS(app)

# Register Blueprints
app.register_blueprint(search_bp)
app.register_blueprint(auth_bp)
app.register_blueprint(dashboard_bp)
app.register_blueprint(quote_bp)
app.register_blueprint(watchlist_bp)
app.register_blueprint(historical_bp)
app.register_blueprint(orders_bp)

# Routes
@app.route("/api/load-instruments")
def load_instr():
    load_instruments()
    return "Loaded manually"

@app.route("/api/subscribe")
def subscribe_stream():
    user_id = request.args.get("user_id")
    start_ticker(user_id)
    return "Subscribed to live data"

# Debug: Print all routes
for rule in app.url_map.iter_rules():
    print(rule)

if __name__ == "__main__":
    socketio.init_app(app)
    socketio.run(app, debug=True)

