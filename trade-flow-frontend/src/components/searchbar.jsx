import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import "./searchbar.css";
import toast from "react-hot-toast";
import TradeModal from "./TradeModal";
import CalculatorModal from "./CalculatorModal";

const SearchBar = ({ onAddToWatchlist, setDashboardData }) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [recent, setRecent] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [segment, setSegment] = useState(""); // NEW: EQ / FUT / OPT

  const [calcSymbol, setCalcSymbol] = useState(null);
  const dropdownRef = useRef();

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("recent_searches") || "[]");
    setRecent(saved);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // 🔍 Live search suggestions while typing
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!query.trim()) {
        setResults([]);
        setShowDropdown(false);
        return;
      }

      try {
        const res = await axios.get(`http://localhost:5000/api/search?q=${query}`);
        let filtered = res.data;

        if (segment) {
          filtered = filtered.filter((item) =>
            item.instrument_type.startsWith(segment)
          );
        }

        setResults(filtered);
        setShowDropdown(true);
      } catch (err) {
        console.error("Live search failed:", err);
      }
    };

    fetchSuggestions();
  }, [query, segment]);

  const handleSearch = async (symbolToSearch, exchangeToUse) => {
    const token = localStorage.getItem("token");
    let symbol = symbolToSearch || query;
    let exchange = exchangeToUse || "NSE";

    if (!symbol.trim()) return;

    if (symbol.includes(" (") && symbol.includes(")")) {
      const parts = symbol.split(" (");
      symbol = parts[0];
      exchange = parts[1].replace(")", "");
    }

    const fullSymbol = `${exchange}:${symbol}`;

    try {
      const quoteRes = await axios.get(
        `http://localhost:5000/api/quote?symbol=${fullSymbol}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const quote = quoteRes.data[fullSymbol] || Object.values(quoteRes.data)[0];

      if (!quote) {
        toast.error("Symbol not found");
        return;
      }

      const fakeHolding = {
        symbol: symbol,
        buy_price: quote.last_price,
        quantity: 0,
        lots: 1,
        investment: 0,
        current_value: 0,
        pnl: 0,
        last_price: quote.last_price,
        return_pct: 0,
        day_change: quote.last_price - quote.ohlc.close,
        day_change_pct:
          ((quote.last_price - quote.ohlc.close) / quote.ohlc.close) * 100,
      };

      setDashboardData([fakeHolding]);
      setShowDropdown(false);

      const updated = [symbol, ...recent.filter((q) => q !== symbol)].slice(0, 5);
      setRecent(updated);
      localStorage.setItem("recent_searches", JSON.stringify(updated));
    } catch (error) {
      toast.error("Quote fetch failed");
      console.error("Quote fetch error:", error);
    }
  };

  const handleAdd = async (symbol, exchange, segment) => {
    const token = localStorage.getItem("token");
    try {
      await axios.post(
        "http://localhost:5000/api/watchlist",
        { symbol, exchange, segment }, // ✅ include segment
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Added to watchlist!");
      onAddToWatchlist();
      handleSearch(symbol, exchange);
    } catch {
      toast.error("Already added or error");
    }
  };

  return (
    <div className="search-container" ref={dropdownRef}>
      <div className="search-input-group">
        <input
          type="text"
          placeholder="Search stocks..."
          value={query}
          onChange={(e) => setQuery(e.target.value.toUpperCase())}
          onFocus={() => setShowDropdown(true)}
        />
        <select value={segment} onChange={(e) => setSegment(e.target.value)}>
          <option value="">All</option>
          <option value="EQ">Cash</option>
          <option value="FUT">Futures</option>
          <option value="OPT">Options</option>
        </select>
        <button onClick={() => handleSearch()}>Search</button>
      </div>

      {calcSymbol && (
        <CalculatorModal
          symbol={calcSymbol.symbol}
          exchange={calcSymbol.exchange}
          onClose={() => setCalcSymbol(null)}
        />
      )}

      {showDropdown && (
        <div className="dropdown">
          {results.length > 0 ? (
            results.map((stock) => {
              const display = `${stock.tradingsymbol} (${stock.exchange})`;
              return (
                <div
                  key={stock.instrument_token}
                  className="dropdown-item"
                  onClick={() => {
                    setQuery(display);
                    handleSearch(stock.tradingsymbol, stock.exchange);
                  }}
                >
                  <span>
                    {display} <span className="muted">[{stock.instrument_type}]</span>
                  </span>
                  <div style={{ display: "flex", gap: "6px" }}>
                    <button
                      className="add-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAdd(stock.tradingsymbol, stock.exchange, stock.instrument_type);
                      }}
                    >
                      Add
                    </button>
                    <button
                      className="calc-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        setCalcSymbol({
                          symbol: stock.tradingsymbol,
                          exchange: stock.exchange,
                        });
                        setShowDropdown(false);
                      }}
                    >
                      📈
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <>
              <div className="dropdown-item muted">No results. Recent:</div>
              {recent.map((item, idx) => (
                <div
                  key={idx}
                  className="dropdown-item recent"
                  onClick={() => {
                    setQuery(item);
                    handleSearch(item);
                  }}
                >
                  {item}
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
