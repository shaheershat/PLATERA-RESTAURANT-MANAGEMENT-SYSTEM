// src/App.js
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import ManagerLogin from "./components/ManagerLogin";
import StaffLogin from "./components/StaffLogin";
import Menu from "./components/Menu";
import TablesPage from "./components/TablesPage";
import TableDetails from "./components/TableDetails";
import Layout from "./components/Layout";

function App() {
  return (
    <Router>
      <Routes>
        {/* No Navbar for login pages */}
        <Route path="/manager-login" element={<ManagerLogin />} />
        <Route path="/staff-login" element={<StaffLogin />} />

        {/* Navbar applied to these routes */}
        <Route element={<Layout />}>
          <Route path="/menu" element={<Menu />} />
          <Route path="/tables" element={<TablesPage />} />
          <Route path="/tables/:id" element={<TableDetails />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
