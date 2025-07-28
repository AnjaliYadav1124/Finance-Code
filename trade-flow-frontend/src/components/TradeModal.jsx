import React, { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import "./TradeModal.css";

const TradeModal = ({ symbol, exchange, onClose }) => {
  const [quote, setQuote] = useState(null);
  const [margins, setMargins] = useState(null);
  const [qty, setQty] = useState(1);
  const [price, setPrice] = useState("");
  const [orderType, setOrderType] = useState("LIMIT");
  const [product, setProduct] = useState("NRML");
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const fullSymbol = `${exchange}:${symbol}`;

        const [quoteRes, marginRes] = await Promise.all([
          axios.get(`http://localhost:5000/api/quote?symbol=${fullSymbol}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get("http://localhost:5000/api/margins", {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        const data = quoteRes.data[fullSymbol] || Object.values(quoteRes.data)[0];

        if (!data) throw new Error("Invalid quote response");

        setQuote(data);
        setPrice(data.last_price);
        setMargins(marginRes.data);

        const type = data.instrument_type;

        // ✅ Set order defaults based on instrument type
        if (type === "EQ") {
          setProduct("CNC");
          setOrderType("MARKET");
        } else if (type.startsWith("FUT") || type.startsWith("OPT")) {
          setProduct("NRML");
          setOrderType("LIMIT");
        }
      } catch (err) {
        toast.error("Failed to fetch trade data");
        console.error("TradeModal fetch error:", err);
      }
    };

    fetchData();
  }, [symbol, exchange, token]);

  const handlePlaceOrder = async () => {
    setLoading(true);
    try {
      await axios.post(
        "http://localhost:5000/api/orders/place",
        {
          symbol,
          exchange,
          quantity: qty,
          price: orderType === "LIMIT" ? price : undefined,
          order_type: orderType,
          product,
          transaction_type: "BUY",
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      toast.success("Order placed!");
      onClose();
    } catch (err) {
      toast.error("Order failed");
      console.error("Place order error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!quote || !margins) return null;

  const estimated = orderType === "LIMIT" ? price * qty : quote.last_price * qty;
  const availableFunds = (margins.available.cash || 0) + (margins.available.collateral || 0);

  return (
    <div className="trade-modal-overlay">
      <div className="trade-modal">
        <h2>
          {symbol} <span className="muted">{quote.instrument_type}</span>{" "}
          <small>({exchange})</small>
        </h2>
        <p>Last Price: ₹{quote.last_price}</p>

        <div className="form-row">
          <label>Qty:</label>
          <input
            type="number"
            value={qty}
            min="1"
            onChange={(e) => setQty(e.target.value)}
          />
        </div>

        {orderType === "LIMIT" && (
          <div className="form-row">
            <label>Price:</label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
          </div>
        )}

        <div className="form-row">
          <label>Order Type:</label>
          <select value={orderType} onChange={(e) => setOrderType(e.target.value)}>
            <option value="LIMIT">Limit</option>
            <option value="MARKET">Market</option>
          </select>
        </div>

        <div className="form-row">
          <label>Product:</label>
          <select value={product} onChange={(e) => setProduct(e.target.value)}>
            <option value="CNC">CNC (Delivery)</option>
            <option value="NRML">NRML (Overnight)</option>
            <option value="MIS">MIS (Intraday)</option>
          </select>
        </div>

        <div className="summary">
          <p>
            <strong>Estimated Required:</strong> ₹{estimated.toFixed(2)}
          </p>
          <p>
            <strong>Available Funds:</strong> ₹{availableFunds.toFixed(2)}
          </p>
        </div>

        <div className="buttons">
          <button onClick={handlePlaceOrder} disabled={loading}>
            {loading ? "Placing..." : "Buy"}
          </button>
          <button className="cancel-btn" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default TradeModal;
