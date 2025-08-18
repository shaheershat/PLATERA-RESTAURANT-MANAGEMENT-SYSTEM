import React from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Utensils,
  Users,
  Settings,
  BarChart3,
  LogOut,
} from "lucide-react"; // Lucide icons

const Sidebar = () => {
  return (
    <div className="w-20 bg-white shadow-lg flex flex-col items-center py-6 space-y-8">
      {/* Top Logo as Image */}
      <div className="mb-4">
        <img
          src="/logo.png" // put your logo in public/logo.png
          alt="Logo"
          className="w-10 h-10 rounded-full object-cover"
        />
      </div>

      {/* Navigation Links */}
      <div className="space-y-6">
        {/* Dashboard */}
        <NavLink
          to="/manager-dashboard"
          className={({ isActive }) =>
            `flex justify-center items-center w-20 h-12 transition-colors duration-200 ${
              isActive
                ? "bg-[#5C4033] text-white font-bold"
                : "text-[#5C4033]  hover:bg-gray-100 font-bold"
            }`
          }
        >
          <LayoutDashboard size={24} />
        </NavLink>

        {/* Items */}
        <NavLink
          to="/manager-items"
          className={({ isActive }) =>
            `flex justify-center items-center w-20 h-12 transition-colors duration-200 ${
              isActive
                ? "bg-[#5C4033] text-white font-bold"
                : "text-[#5C4033]  hover:bg-gray-100 font-bold"
            }`
          }
        >
          <Utensils size={24} />
        </NavLink>

        {/* Staffs */}
        <NavLink
          to="/staffs"
          className={({ isActive }) =>
            `flex justify-center items-center w-20 h-12 transition-colors duration-200 ${
              isActive
                ? "bg-[#5C4033] text-white font-bold"
                : "text-[#5C4033]  hover:bg-gray-100 font-bold"
            }`
          }
        >
          <Users size={24} />
        </NavLink>

        {/* Settings */}
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `flex justify-center items-center w-20 h-12 transition-colors duration-200 ${
              isActive
                ? "bg-[#5C4033] text-white font-bold"
                : "text-[#5C4033]  hover:bg-gray-100 font-bold"
            }`
          }
        >
          <Settings size={24} />
        </NavLink>

        {/* Reports */}
        <NavLink
          to="/reports"
          className={({ isActive }) =>
            `flex justify-center items-center w-20 h-12 transition-colors duration-200 ${
              isActive
                ? "bg-[#5C4033] text-white font-bold"
                : "text-[#5C4033]  hover:bg-gray-100 font-bold"
            }`
          }
        >
          <BarChart3 size={24} />
        </NavLink>
      </div>

      {/* Spacer to push logout to bottom */}
      <div className="flex-1"></div>

      {/* Logout */}
      <button className="flex justify-center items-center w-12 h-12 text-[#5C4033] hover:bg-gray-100 font-bold transition-colors duration-200">
        <LogOut size={24} />
      </button>
    </div>
  );
};

export default Sidebar;