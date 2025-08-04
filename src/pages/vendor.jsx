import React, { useState } from "react";
import axios from "axios";
import DashboardTable from "../components/DashboardTable";
import SideBar from "../components/SideBar";
import Navbar from "../components/Navbar";
import toast from "react-hot-toast";
import "./vendor.css";

const Vendor = () => {
  const [searchUserId, setSearchUserId] = useState("");
  const [holdings, setHoldings] = useState([]);
  const [vendorDashboardData, setVendorDashboardData] = useState([]);
  const [viewedUserId, setViewedUserId] = useState("");
  const [loading, setLoading] = useState(false);

  const [symbol, setSymbol] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [exchange, setExchange] = useState("NSE");
  const [buyPrice, setBuyPrice] = useState("");
  const [quantity, setQuantity] = useState("");
  const [segment, setSegment] = useState("");

  const [email, setEmail] = useState("");
  const [contact, setContact] = useState("");
  const [addUserId, setAddUserId] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);

  const token = localStorage.getItem("token");

  const handleSearch = async () => {
    if (!searchUserId.trim()) return toast.error("Please enter a user ID.");

    setLoading(true);
    try {
      const response = await axios.get(
        `http://localhost:5000/api/vendor/holdings/${searchUserId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const holdingsData = response.data;
      setHoldings(holdingsData);
      setVendorDashboardData(holdingsData);
      setViewedUserId(searchUserId);

      toast.success(holdingsData.length === 0 ? "User found. No holdings yet." : "Holdings loaded.");
    } catch (err) {
      console.error("Holdings fetch failed:", err);
      setHoldings([]);
      setVendorDashboardData([]);
      setViewedUserId("");
      toast.error("User not found.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddStock = async () => {
    if (!symbol || !buyPrice || !quantity || !exchange || !viewedUserId) {
      return toast.error("Please fill all fields");
    }

    try {
      const fullSymbol = `${exchange}:${symbol}`;
      const quoteRes = await axios.get(
        `http://localhost:5000/api/quote?symbol=${fullSymbol}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const quote = quoteRes.data[fullSymbol] || Object.values(quoteRes.data)[0];
      const ltp = quote?.last_price || buyPrice;

      await axios.post(
        `http://localhost:5000/api/vendor/${viewedUserId}/add-stock`,
        {
          symbol,
          exchange,
          quantity: parseInt(quantity),
          buy_price: parseFloat(ltp),
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success("Stock added to vendor");
      setSymbol("");
      setExchange("NSE");
      setBuyPrice("");
      setQuantity("");
      setSegment("");
      setSuggestions([]);
      handleSearch();
    } catch {
      toast.error("Failed to add stock");
    }
  };

  const handleRemoveStock = async (symbol) => {
    try {
      await axios.delete(
        `http://localhost:5000/api/vendor/${viewedUserId}/remove-stock`,
        {
          data: { symbol },
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      toast.success("Stock removed.");
      handleSearch();
    } catch (err) {
      console.error("Delete failed:", err);
      toast.error("Delete failed.");
    }
  };

  const handleReset = () => {
    setSearchUserId("");
    setViewedUserId("");
    setHoldings([]);
    setVendorDashboardData([]);
    setEmail("");
    setContact("");
    setAddUserId("");
    setSymbol("");
    setExchange("NSE");
    setQuantity("");
    setBuyPrice("");
    setSegment("");
    setSuggestions([]);
    toast.success("Reset successful");
  };

  const handleAddUser = async () => {
    try {
      await axios.post(
        "http://localhost:5000/api/vendor/add-user",
        { email, contact_number: contact, user_id: addUserId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("User added successfully.");
      setEmail("");
      setContact("");
      setAddUserId("");
      setShowAddForm(false);
    } catch {
      toast.error("Failed to add user.");
    }
  };

  const fetchSuggestions = async (input) => {
    if (!input) return setSuggestions([]);
    try {
      const res = await axios.get(`http://localhost:5000/api/search?q=${input}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSuggestions(res.data.slice(0, 5));
    } catch {
      setSuggestions([]);
    }
  };

  const handleSymbolSelect = async (selected) => {
    setSymbol(selected.tradingsymbol);
    setExchange(selected.exchange);
    setQuantity(1);
    setSegment(selected.instrument_type);

    try {
      const fullSymbol = `${selected.exchange}:${selected.tradingsymbol}`;
      const res = await axios.get(`http://localhost:5000/api/quote?symbol=${fullSymbol}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const quote = res.data[fullSymbol] || Object.values(res.data)[0];
      const price = quote?.last_price || "";
      setBuyPrice(price);
    } catch (err) {
      console.error("Failed to fetch price:", err);
      toast.error("Failed to fetch price");
      setBuyPrice("");
    }

    setSuggestions([]);
  };

  const estimatedInvestment = buyPrice && quantity
    ? (parseFloat(buyPrice) * parseInt(quantity)).toFixed(2)
    : null;

  const readableSegment = segment === "EQ"
    ? "Cash"
    : segment.startsWith("FUT")
    ? "Futures"
    : segment.startsWith("OPT")
    ? "Options"
    : "";

  return (
    <>
      <Navbar />
      <div className="dashboard-wrapper">
        <SideBar
          watchlist={[]}
          refresh={() => {}}
          dashboardData={vendorDashboardData}
          customTitle={viewedUserId ? `User ${viewedUserId}'s Investment` : "Investment"}
        />

        <main className="dashboard-content">
          <div className="search-bar-wrapper" style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
            <input
              placeholder="🔍 Search by User ID"
              value={searchUserId}
              onChange={(e) => setSearchUserId(e.target.value)}
              style={{ padding: "10px", borderRadius: "6px", border: "1px solid #ccc", minWidth: "200px" }}
            />
            <button onClick={handleSearch}>Search Holdings</button>
            <button onClick={() => setShowAddForm(true)}>➕ Add User</button>
            <button onClick={handleReset} className="reset-button">Clear All</button>
          </div>

          {viewedUserId && (
            <div style={{ margin: "1rem 0" }}>
              <h3>Add Stock</h3>
              <input
                placeholder="Search Symbol"
                value={symbol}
                onChange={(e) => {
                  setSymbol(e.target.value);
                  fetchSuggestions(e.target.value);
                }}
                style={{ marginRight: "10px" }}
              />
              {suggestions.length > 0 && (
                <div style={{
                  background: "#fff",
                  border: "1px solid #ccc",
                  padding: "5px",
                  borderRadius: "4px",
                  position: "absolute",
                  zIndex: 10
                }}>
                  {suggestions.map((s, i) => (
                    <div
                      key={i}
                      onClick={() => handleSymbolSelect(s)}
                      style={{ padding: "5px", cursor: "pointer" }}
                    >
                      {s.tradingsymbol} ({s.exchange})
                    </div>
                  ))}
                </div>
              )}
              <select value={exchange} onChange={(e) => setExchange(e.target.value)}>
                <option value="NSE">NSE</option>
                <option value="BSE">BSE</option>
                <option value="MCX">MCX</option>
              </select>
              <input
                type="number"
                placeholder="Quantity"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
              <input
                type="number"
                placeholder="Buy Price"
                value={buyPrice}
                onChange={(e) => setBuyPrice(e.target.value)}
              />
              <button onClick={handleAddStock}>Add Stock</button>

              {(segment || estimatedInvestment) && (
                <div style={{ marginTop: "10px", fontSize: "14px" }}>
                  {segment && (
                    <p><strong>Segment:</strong> {readableSegment}</p>
                  )}
                  {estimatedInvestment && (
                    <p><strong>Estimated Investment:</strong> ₹{estimatedInvestment}</p>
                  )}
                </div>
              )}
            </div>
          )}

          {loading ? (
            <p>Loading...</p>
          ) : (
            <DashboardTable
              data={holdings}
              refresh={handleSearch}
              showDelete={(row) => row.source === "Manual"}
              onDelete={(symbol) => handleRemoveStock(symbol)}
              showCalculator={true}
            />
          )}

          {showAddForm && (
            <div className="modal-backdrop">
              <div className="modal-content">
                <h3>Add Vendor User</h3>
                <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
                <input placeholder="Contact Number" value={contact} onChange={(e) => setContact(e.target.value)} />
                <input placeholder="User ID" value={addUserId} onChange={(e) => setAddUserId(e.target.value)} />
                <div style={{ marginTop: "1rem" }}>
                  <button onClick={handleAddUser}>Add</button>
                  <button onClick={() => setShowAddForm(false)} style={{ marginLeft: "10px", backgroundColor: "#ccc" }}>
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </>
  );
};

export default Vendor;
