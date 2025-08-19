// src/App.js
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import ManagerLogin from "./components/ManagerLogin";
import StaffLogin from "./components/StaffLogin";
import Menu from "./components/Menu";
import TablesPage from "./components/TablesPage";
import TableDetails from "./components/TableDetails";
import Layout from "./components/Layout"
import ManagerLayout from "./components/manager/ManagerLayout"; // Import the new manager layout
import ManagerDashboard from "./components/manager/ManagerDashboard"; 
import ProductsDashboard from "./components/manager/ProductsDashboard"; 
import ManagerStaffs from "./components/manager/ManagerStaffs"; 
import ManagerSettings from "./components/manager/ManagerSettings"; 
import ManagerReports from "./components/manager/ManagerReports";
import InventoryManagement from "./components/manager/InventoryManagement"; // Import Inventory Management if needed

function App() {
  return (
    <Router>
      <Routes>
        {/* No Navbar for login pages */}
        <Route path="/manager-login" element={<ManagerLogin />} />
        <Route path="/staff-login" element={<StaffLogin />} />

        {/* Regular Layout for menu and tables */}
        <Route element={<Layout />}>
          <Route path="/menu" element={<Menu />} />
          <Route path="/tables" element={<TablesPage />} />
          <Route path="/tables/:id" element={<TableDetails />} />
        </Route>

        {/* Manager Layout for dashboard */}
        <Route element={<ManagerLayout />}>
          <Route path="/manager-dashboard" element={<ManagerDashboard />} />
          <Route path="/manager-items" element={<ProductsDashboard />} />
          <Route path="/manager-staffs" element={<ManagerStaffs />} />
          <Route path="/manager-settings" element={<ManagerSettings />} />
          <Route path="/manager-reports" element={<ManagerReports />} />
          <Route path="/manager-inventory" element={<InventoryManagement />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
