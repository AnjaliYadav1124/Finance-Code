import React, { useEffect, useState } from "react";
import axios from "axios";
import Navbar from "../components/Navbar";
import "./AllVendors.css";

const AllVendors = () => {
  const [vendors, setVendors] = useState([]);

  const fetchVendors = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await axios.get("http://localhost:5000/api/vendor/all", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setVendors(res.data);
    } catch (err) {
      console.error("Failed to fetch vendors", err);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, []);

  return (
    <div>
      <Navbar />
      <div className="dashboard-content">
        <h2>All Vendors</h2>
        <table className="dashboard-table">
          <thead>
            <tr>
              <th>User ID</th>
              <th>Email</th>
              <th>Contact</th>
              <th>Total Investment</th>
            </tr>
          </thead>
          <tbody>
            {vendors.map((vendor, index) => (
              <tr key={index}>
                <td>{vendor.user_id}</td>
                <td>{vendor.email}</td>
                <td>{vendor.contact_number}</td>
                <td>₹{vendor.investment.toLocaleString("en-IN")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AllVendors;
