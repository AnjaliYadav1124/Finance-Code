import React, { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import CalculatorModal from "./CalculatorModal";
import "./DashboardTable.css";

const DashboardTable = ({ data, refresh, showCalculator = false, onDelete, showDelete }) => {
  const [calcSymbol, setCalcSymbol] = useState(null);
  const [rows, setRows] = useState([]);

  useEffect(() => {
    const initialized = data.map((stock) => {
      const lots = stock.lots || 1;
      const ltp = stock.last_price || stock.current_value / stock.quantity || 1;
      const buyPrice = stock.buy_price;
      const investment = buyPrice * lots;
      const currentValue = ltp * lots;
      const pnl = currentValue - investment;
      const span = stock.span_margin || 0;
      const exposure = stock.exposure_margin || 0;
      const totalMargin = stock.margin_required || 0;
      const leverage = totalMargin > 0 ? (currentValue / totalMargin).toFixed(2) : "N/A";

      return {
        ...stock,
        lots,
        buy_price: buyPrice,
        last_price: ltp,
        investment,
        current_value: currentValue,
        pnl,
        span_margin: span,
        exposure_margin: exposure,
        margin_required: totalMargin,
        leverage,
      };
    });
    setRows(initialized);
  }, [data]);

  const handleChange = (index, field, value) => {
    const updated = [...rows];
    const row = { ...updated[index] };
    const num = parseFloat(value) || 0;
    row[field] = num;

    if (field === "lots") {
      row.investment = row.buy_price * row.lots;
      row.current_value = row.last_price * row.lots;
    } else if (field === "buy_price") {
      row.investment = row.buy_price * row.lots;
    } else if (field === "investment") {
      row.buy_price = row.lots > 0 ? row.investment / row.lots : 0;
    } else if (field === "current_value") {
      row.last_price = row.lots > 0 ? row.current_value / row.lots : 0;
    }

    row.pnl = row.current_value - row.investment;
    row.leverage = row.margin_required > 0 ? (row.current_value / row.margin_required).toFixed(2) : "N/A";

    updated[index] = row;
    setRows(updated);
  };

  const handleLotsSave = async (symbol, lots) => {
    const token = localStorage.getItem("token");
    try {
      await axios.post(
        "http://localhost:5000/api/set-lots",
        { symbol, lots },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Lots updated");
      refresh();
    } catch (err) {
      toast.error("Failed to update lots");
      console.error("Failed to update lots", err);
    }
  };

  return (
    <div className="table-wrapper">
      <table className="dashboard-table">
        <thead>
          <tr>
            <th>Instrument</th>
            <th>Buy Price</th>
            <th>Lots</th>
            <th>Investment</th>
            <th>Current Value</th>
            <th>P&L</th>
            <th>Required Margin</th>
            {showCalculator && <th>📈 Calculate</th>}
            {onDelete && <th>❌</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((stock, index) => {
            const isProfit = stock.pnl >= 0;
            return (
              <tr key={stock.symbol}>
                <td>{stock.symbol}</td>

                <td>
                  <input
                    type="number"
                    value={stock.buy_price.toFixed(2)}
                    onChange={(e) => handleChange(index, "buy_price", e.target.value)}
                  />
                </td>

                <td>
                  <input
                    type="number"
                    value={stock.lots}
                    min="1"
                    onChange={(e) => handleChange(index, "lots", e.target.value)}
                    onBlur={() => handleLotsSave(stock.symbol, stock.lots)}
                  />
                </td>

                <td>
                  <input
                    type="number"
                    value={stock.investment.toFixed(2)}
                    onChange={(e) => handleChange(index, "investment", e.target.value)}
                  />
                </td>

                <td>
                  <input
                    type="number"
                    value={stock.current_value.toFixed(2)}
                    onChange={(e) => handleChange(index, "current_value", e.target.value)}
                  />
                </td>

                <td className={isProfit ? "profit" : "loss"}>
                  {isProfit ? "▲" : "▼"} ₹{Math.abs(stock.pnl).toFixed(2)}
                </td>

                <td>
                  <strong>₹{stock.margin_required.toLocaleString("en-IN")}</strong>
                  <br />
                  <small>SPAN: ₹{stock.span_margin.toLocaleString("en-IN")}</small>
                  <br />
                  <small>EXP: ₹{stock.exposure_margin.toLocaleString("en-IN")}</small>
                  <br />
                  <small>Leverage: {stock.leverage}×</small>
                </td>

                {showCalculator && (
                  <td>
                    <button
                      className="calc-btn"
                      onClick={() =>
                        setCalcSymbol({
                          symbol: stock.symbol,
                          exchange: stock.exchange || "NSE",
                        })
                      }
                    >
                      📈
                    </button>
                  </td>
                )}

                {onDelete && showDelete?.(stock) && (
                  <td>
                    <button onClick={() => onDelete(stock)}>❌</button>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>

      {calcSymbol && (
        <CalculatorModal
          symbol={calcSymbol.symbol}
          exchange={calcSymbol.exchange}
          onClose={() => setCalcSymbol(null)}
        />
      )}
    </div>
  );
};

export default DashboardTable;
