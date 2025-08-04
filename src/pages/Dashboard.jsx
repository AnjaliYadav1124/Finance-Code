import React, { useState, useEffect } from "react";
import SearchBar from "../components/searchbar";
import SideBar from "../components/SideBar";
import DashboardTable from "../components/DashboardTable";
import axios from "axios";
import toast from "react-hot-toast";
import Navbar from "../components/Navbar";
import "./Dashboard.css";

const Dashboard = () => {
  const [watchlist, setWatchlist] = useState([]);
  const [dashboardData, setDashboardData] = useState([]);

  const fetchDashboardData = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await axios.get("http://localhost:5000/api/dashboard/summary", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDashboardData(res.data);
    } catch (err) {
      toast.error("Failed to load dashboard data");
      console.error("Dashboard data error:", err);
    }
  };

  const fetchWatchlist = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await axios.get("http://localhost:5000/api/watchlist", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setWatchlist(res.data);
    } catch (err) {
      toast.error("Failed to load watchlist");
      console.error("Watchlist fetch error:", err);
    }
  };

  useEffect(() => {
    const url = new URLSearchParams(window.location.search);
    const token = url.get("token");
    const userId = url.get("user_id");

    if (token && userId) {
      localStorage.setItem("token", token);
      localStorage.setItem("user_id", userId);
    }
  }, []);

  useEffect(() => {
    fetchWatchlist();
    fetchDashboardData();
  }, []);

  return (
    <>
      {/* ✅ Navbar added at top */}
      <Navbar />

      <div className="dashboard-wrapper">
        <SideBar
          watchlist={watchlist}
          refresh={fetchWatchlist}
          dashboardData={dashboardData}
        />
        <main className="dashboard-content">
          <div className="search-bar-wrapper">
            <SearchBar
              onAddToWatchlist={fetchWatchlist}
              setDashboardData={setDashboardData}
            />
            <button className="reset-button" onClick={fetchDashboardData}>
              Reset
            </button>
          </div>
          <DashboardTable
            data={dashboardData}
            refresh={fetchDashboardData}
          />
        </main>
      </div>
    </>
  );
};

export default Dashboard;
