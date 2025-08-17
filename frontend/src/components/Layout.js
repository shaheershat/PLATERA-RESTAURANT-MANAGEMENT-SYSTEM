// src/components/Layout.js
import React from "react";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import { Outlet } from "react-router-dom";

export default function Layout() {
  return (
    <div className="flex flex-col h-screen bg-[#0f172a] text-white">
      {/* ✅ Navbar on top (full width) */}
      <Navbar />

      {/* Main content row: Sidebar + Page Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar (left) */}
        <Sidebar />

        {/* Page Content (right) */}
        <main className="flex-1 overflow-y-auto p-6 bg-[#0f172a]">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
