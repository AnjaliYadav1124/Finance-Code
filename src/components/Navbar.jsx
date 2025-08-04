// Navbar.jsx
import React from "react";
import { Link, useLocation } from "react-router-dom";
import "./Navbar.css";

const Navbar = () => {
  const location = useLocation();

  return (
    <nav className="custom-navbar">
      <div className="navbar-left">
        <h1>TradeFlow</h1>
      </div>

      <div className="navbar-center-wrapper">
        <ul className="navbar-center">
          <li className={location.pathname === "/dashboard" ? "active" : ""}>
            <Link to="/dashboard">Dashboard</Link>
          </li>
          <li className={location.pathname === "/AllVendors" ? "active" : ""}>
            <Link to="/vendors">All Vendors</Link>
          </li>
          <li className={location.pathname === "/vendor" ? "active" : ""}>
            <Link to="/vendor">Vendor</Link>
          </li>
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;
