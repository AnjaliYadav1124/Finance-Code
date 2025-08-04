import React, { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import "./SideBar.css";
import TradeModal from "./TradeModal";

const SideBar = ({ watchlist, refresh, dashboardData }) => {
  const [summary, setSummary] = useState({ investment: 0, return_pct: 0 });
  const [selectedSymbol, setSelectedSymbol] = useState(null);

  // ✅ Compute total investment and returns
  useEffect(() => {
    if (!dashboardData || dashboardData.length === 0) return;

    const totalInvestment = dashboardData.reduce((sum, s) => sum + s.investment, 0);
    const totalCurrent = dashboardData.reduce((sum, s) => sum + s.current_value, 0);
    const pnl = totalCurrent - totalInvestment;
    const return_pct = totalInvestment > 0 ? (pnl / totalInvestment) * 100 : 0;

    setSummary({
      investment: totalInvestment.toFixed(2),
      return_pct: return_pct.toFixed(2),
    });
  }, [dashboardData]);

  // ✅ Remove item from watchlist
  const handleRemove = async (symbol) => {
    const token = localStorage.getItem("token");
    try {
      await axios.delete(`http://localhost:5000/api/watchlist?symbol=${symbol}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Removed from watchlist!");
      refresh();
    } catch (err) {
      toast.error("Failed to remove from watchlist.");
      console.error("Error removing from watchlist", err);
    }
  };

  return (
    <div className="sidebar">
      <div className="summary">
        <h2>Investment Summary</h2>
        <p><strong>Investment:</strong> ₹{summary.investment}</p>
        <p>
          <strong>P&L:</strong>{" "}
          <span className={summary.return_pct >= 0 ? "profit" : "loss"}>
            {summary.return_pct}%
          </span>
        </p>
      </div>

      <div className="watchlist">
        <h3>Your Watchlist</h3>
        {watchlist.length === 0 ? (
          <p className="muted">No items yet</p>
        ) : (
          <ul>
            {watchlist.map((item, index) => {
              let tag = "";
              if (item.segment?.startsWith("FUT")) tag = "Futures";
              else if (item.segment?.startsWith("OPT")) tag = "Options";
              else tag = "Cash";

              return (
                <li
                  key={index}
                  className="watchlist-item"
                  onClick={() => setSelectedSymbol(item)}
                >
                  <span>
                    {item.symbol} ({item.exchange}){" "}
                    <span className="muted">[{tag}]</span>
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation(); // prevent modal open
                      handleRemove(item.symbol);
                    }}
                  >
                    ✕
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* ✅ Trade Modal */}
      {selectedSymbol && (
        <TradeModal
          symbol={selectedSymbol.symbol}
          exchange={selectedSymbol.exchange}
          onClose={() => setSelectedSymbol(null)}
        />
      )}
    </div>
  );
};

export default SideBar;
