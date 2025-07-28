import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import "./CalculatorModal.css";

const CalculatorModal = ({ symbol, exchange, onClose }) => {
  const [ltp, setLtp] = useState(0);
  const [inputs, setInputs] = useState({
    leverage: 2,
    lotMargin: 71220,
    lotSize: 10,
    lots: 1,
    sgbRate: 9653.34,
    initialCapital: 100000,
    sgbQty: 1036,
    sgbMarginPct: 0.9,
    cagr: 0.125,
  });
  const [projections, setProjections] = useState([]);

  const token = localStorage.getItem("token");

  const fetchQuote = useCallback(async () => {
    try {
      const fullSymbol = `${exchange}:${symbol}`;
      const res = await axios.get(`http://localhost:5000/api/quote?symbol=${fullSymbol}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const quote = res.data[fullSymbol] || Object.values(res.data)[0];
      setLtp(quote.last_price || 0);
    } catch (err) {
      console.error("Quote fetch failed:", err);
    }
  }, [symbol, exchange, token]);

  useEffect(() => {
    fetchQuote();
  }, [fetchQuote]);

  // Auto update dependent fields (Opening rates)
  useEffect(() => {
    setInputs((prev) => ({
      ...prev,
      oneGm: ltp,
      tenGm: ltp * 10,
      hundredGm: ltp * 100,
    }));
  }, [ltp]);

  const runProjection = useCallback(() => {
    const cap = inputs.initialCapital;
    const lev = inputs.leverage;
    const cagr = inputs.cagr;
    // const lots = inputs.lots;

    const results = [];
    for (let year = 0; year <= 3; year++) {
    //   const marginRequired = inputs.lotMargin * lots;
      const usableCapital = cap * lev;
      const profit = usableCapital * Math.pow(cagr, year);
      const netWorth = cap + profit;
      const growth = ((netWorth - cap) / cap) * 100;

      results.push({
        year,
        netWorth: netWorth.toFixed(2),
        growthPct: growth.toFixed(2),
      });
    }
    setProjections(results);
  }, [inputs]);

  useEffect(() => {
    runProjection();
  }, [runProjection, ltp]);

  const handleChange = (key, val) => {
    setInputs((prev) => ({
      ...prev,
      [key]: parseFloat(val) || 0,
    }));
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>Projection Calculator: {symbol} ({exchange})</h2>

        <div className="grid">
          <label>Leverage</label>
          <input type="number" value={inputs.leverage} onChange={(e) => handleChange("leverage", e.target.value)} />

          <label>Lots</label>
          <input type="number" value={inputs.lots} onChange={(e) => handleChange("lots", e.target.value)} />

          <label>Margin (1 lot)</label>
          <input type="number" value={inputs.lotMargin} onChange={(e) => handleChange("lotMargin", e.target.value)} />

          <label>Lot Size (in gms)</label>
          <input type="number" value={inputs.lotSize} onChange={(e) => handleChange("lotSize", e.target.value)} />

          <label>Opening Rate (1gm)</label>
          <input type="number" value={ltp.toFixed(2)} disabled />

          <label>Opening Rate (10gms)</label>
          <input type="number" value={(ltp * 10).toFixed(2)} disabled />

          <label>Opening Rate (100gms)</label>
          <input type="number" value={(ltp * 100).toFixed(2)} disabled />

          <label>SGB Opening Rate</label>
          <input type="number" value={inputs.sgbRate} onChange={(e) => handleChange("sgbRate", e.target.value)} />

          <label>Initial Capital</label>
          <input type="number" value={inputs.initialCapital} onChange={(e) => handleChange("initialCapital", e.target.value)} />

          <label>SGB Quantity</label>
          <input type="number" value={inputs.sgbQty} onChange={(e) => handleChange("sgbQty", e.target.value)} />

          <label>Margin on SGB (%)</label>
          <input type="number" value={inputs.sgbMarginPct} onChange={(e) => handleChange("sgbMarginPct", e.target.value)} />

          <label>SGB CAGR (1yr)</label>
          <input type="number" step="0.01" value={inputs.cagr} onChange={(e) => handleChange("cagr", e.target.value)} />
        </div>

        <h3>Projection (3 years)</h3>
        <table className="proj-table">
          <thead>
            <tr>
              <th>Year</th>
              <th>Net Worth (₹)</th>
              <th>Growth (%)</th>
            </tr>
          </thead>
          <tbody>
            {projections.map((p, i) => (
              <tr key={i}>
                <td>{p.year}</td>
                <td>₹{p.netWorth}</td>
                <td>{p.growthPct}%</td>
              </tr>
            ))}
          </tbody>
        </table>

        <p style={{ marginTop: "12px" }}>
          <strong>Total Margin Required:</strong>{" "}
          ₹{(inputs.lotMargin * inputs.lots).toFixed(2)}
        </p>

        <div className="btns">
          <button onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};

export default CalculatorModal;
