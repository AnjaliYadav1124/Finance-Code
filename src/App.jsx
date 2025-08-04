import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Vendor from "./pages/vendor";
import Dashboard from "./pages/Dashboard";
import AllVendors from "./pages/AllVendors";
import { Toaster } from "react-hot-toast";

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/vendors" element={<AllVendors />} />
        <Route path="/vendor" element={<Vendor />} />
        <Route path="*" element={<Navigate to="/vendor" />} />
      </Routes>
      <Toaster position="top-right" />
    </>
  );
}

export default App;
