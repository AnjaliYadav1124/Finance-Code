import React, { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import "./DashboardTable.css";

const DashboardTable = ({ data, refresh }) => {
  const [expanded, setExpanded] = useState(null);
  const [lots, setLots] = useState({});
  const [segmentFilter, setSegmentFilter] = useState("All");

  const handleLotsChange = async (symbol, value) => {
    const token = localStorage.getItem("token");
    const newLots = parseInt(value) || 1;
    setLots((prev) => ({ ...prev, [symbol]: newLots }));

    try {
      await axios.post(
        "http://localhost:5000/api/set-lots",
        { symbol, lots: newLots },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Lots updated");
      refresh();
    } catch (err) {
      toast.error("Failed to update lots");
      console.error("Failed to update lots", err);
    }
  };

  const fetchExtraInfo = async (symbol) => {
    const token = localStorage.getItem("token");
    const exchange = "NSE";
    const fullSymbol = `${exchange}:${symbol}`;

    try {
      const res = await axios.get(
        `http://localhost:5000/api/quote?symbol=${fullSymbol}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = res.data;
      return data[fullSymbol] || Object.values(data)[0];
    } catch (err) {
      console.error("Error fetching quote info:", err);
      return null;
    }
  };

  const toggleExpand = async (symbol) => {
    if (expanded?.symbol === symbol) {
      setExpanded(null);
    } else {
      const info = await fetchExtraInfo(symbol);
      setExpanded({ symbol, info });
    }
  };

  const getSegment = (symbol) => {
    if (symbol.includes("FUT")) return "Futures";
    if (symbol.includes("CE") || symbol.includes("PE")) return "Options";
    return "Cash";
  };

  const filteredData = data.filter((stock) => {
    const segment = getSegment(stock.symbol);
    return segmentFilter === "All" || segment === segmentFilter;
  });

  return (
    <div className="table-wrapper">
      <div className="filters" style={{ marginBottom: "12px" }}>
        <label htmlFor="segment-filter" style={{ marginRight: "8px" }}>
          Filter by Segment:
        </label>
        <select
          id="segment-filter"
          value={segmentFilter}
          onChange={(e) => setSegmentFilter(e.target.value)}
        >
          <option value="All">All</option>
          <option value="Cash">Cash</option>
          <option value="Futures">Futures</option>
          <option value="Options">Options</option>
        </select>
      </div>

      <table className="dashboard-table">
        <thead>
          <tr>
            <th>Instrument</th>
            <th>Segment</th>
            <th>Buy Price</th>
            <th>Lots</th>
            <th>Investment</th>
            <th>Current Value</th>
            <th>P&L</th>
            <th>More</th>
          </tr>
        </thead>
        <tbody>
          {filteredData.map((stock) => {
            const lot = lots[stock.symbol] || stock.lots || 1;
            const ltp = stock.last_price;
            const investment = (stock.buy_price * lot).toFixed(2);
            const value = (ltp * lot).toFixed(2);
            const pnl = (value - investment).toFixed(2);
            const isProfit = pnl >= 0;
            const segment = getSegment(stock.symbol);

            return (
              <React.Fragment key={stock.symbol}>
                <tr>
                  <td>{stock.symbol}</td>
                  <td><span className="muted">{segment}</span></td>
                  <td>₹{stock.buy_price}</td>
                  <td>
                    <input
                      type="number"
                      value={lot}
                      min="1"
                      onChange={(e) =>
                        handleLotsChange(stock.symbol, e.target.value)
                      }
                    />
                  </td>
                  <td>₹{investment}</td>
                  <td>₹{value}</td>
                  <td className={isProfit ? "profit" : "loss"}>
                    {isProfit ? "▲" : "▼"} ₹{Math.abs(pnl)}
                  </td>
                  <td>
                    <button onClick={() => toggleExpand(stock.symbol)}>
                      {expanded?.symbol === stock.symbol ? "▲" : "▼"}
                    </button>
                  </td>
                </tr>
                {expanded?.symbol === stock.symbol && (
                  <tr className="expand-row">
                    <td colSpan="8">
                      {expanded.info ? (
                        <div className="expand-info">
                          <p><strong>Open:</strong> ₹{expanded.info.ohlc?.open}</p>
                          <p><strong>High:</strong> ₹{expanded.info.ohlc?.high}</p>
                          <p><strong>Low:</strong> ₹{expanded.info.ohlc?.low}</p>
                          <p><strong>Close:</strong> ₹{expanded.info.ohlc?.close}</p>
                          <p><strong>Required Margin:</strong> ₹{expanded.info.margin?.initial || "N/A"}</p>
                        </div>
                      ) : (
                        <p>Loading...</p>
                      )}
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default DashboardTable;
