import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import {
  LayoutDashboard,
  Utensils,
  Users,
  Settings,
  BarChart3,
  LogOut,
} from "lucide-react"; // Lucide icons

const Sidebar = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/admin/login');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  return (
    <div className="w-20 bg-white shadow-lg flex flex-col items-center py-6 space-y-8">
      {/* Top Logo as Image */}
      <div className="mb-4">
        <NavLink to="/manager/dashboard">
          <img
            src="/logo.png"
            alt="Logo"
            className="w-10 h-10 rounded-full object-cover"
          />
        </NavLink>
      </div>

      {/* Navigation Links */}
      <div className="space-y-6">
        {/* Dashboard */}
        <NavLink
          to="/manager/dashboard"
          className={({ isActive }) =>
            `flex justify-center items-center w-20 h-12 transition-colors duration-200 ${
              isActive
                ? "bg-[#5C4033] text-white font-bold"
                : "text-[#5C4033]  hover:bg-gray-100 font-bold"
            }`
          }
          title="Dashboard"
        >
          <LayoutDashboard size={24} />
        </NavLink>

        {/* Items */}
        <NavLink
          to="/manager/items"
          className={({ isActive }) =>
            `flex justify-center items-center w-20 h-12 transition-colors duration-200 ${
              isActive
                ? "bg-[#5C4033] text-white font-bold"
                : "text-[#5C4033]  hover:bg-gray-100 font-bold"
            }`
          }
          title="Menu Items"
        >
          <Utensils size={24} />
        </NavLink>

        {/* Staffs */}
        <NavLink
          to="/manager/staff"
          className={({ isActive }) =>
            `flex justify-center items-center w-20 h-12 transition-colors duration-200 ${
              isActive
                ? "bg-[#5C4033] text-white font-bold"
                : "text-[#5C4033]  hover:bg-gray-100 font-bold"
            }`
          }
          title="Staff"
        >
          <Users size={24} />
        </NavLink>

        {/* Reports */}
        <NavLink
          to="/manager/reports"
          className={({ isActive }) =>
            `flex justify-center items-center w-20 h-12 transition-colors duration-200 ${
              isActive
                ? "bg-[#5C4033] text-white font-bold"
                : "text-[#5C4033]  hover:bg-gray-100 font-bold"
            }`
          }
          title="Reports"
        >
          <BarChart3 size={24} />
        </NavLink>

        {/* Inventory */}
        <NavLink
          to="/manager/inventory"
          className={({ isActive }) =>
            `flex justify-center items-center w-20 h-12 transition-colors duration-200 ${
              isActive
                ? "bg-[#5C4033] text-white font-bold"
                : "text-[#5C4033] hover:bg-gray-100 font-bold"
            }`
          }
          title="Inventory"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 512 512"
            className="w-6 h-6 font-bold"
            fill="currentColor"
          >
            <g>
              <path d="M506,476h-40V146h5c2.762,0,5-2.238,5-5v-30c0-2.762-2.238-5-5-5h-5V81c0-2.099-1.311-3.975-3.282-4.695l-205-75 
                c-1.109-0.406-2.326-0.406-3.436,0l-205,75C47.311,77.025,46,78.901,46,81v25h-5c-2.762,0-5,2.238-5,5v30c0,2.762,2.238,5,5,5h5 
                v330H6c-2.762,0-5,2.238-5,5v25c0,2.762,2.238,5,5,5h500c2.762,0,5-2.238,5-5v-25C511,478.238,508.762,476,506,476z M221,476h-90 
                v-15h90V476z M221,451h-90v-65h25v25c0,4.481,5.555,6.727,8.647,3.42l3.854-4.11l3.854,4.11c1.967,2.099,5.315,2.113,7.296-0.001 
                l3.849-4.107c1.023,1.089,3.423,3.659,3.91,4.159c3.137,3.245,8.589,0.951,8.589-3.471v-25h25V451z M219.647,314.42l3.854-4.11 
                l3.854,4.11c1.967,2.099,5.315,2.113,7.296-0.001l3.849-4.107l3.852,4.108c3.062,3.269,8.647,1.097,8.647-3.42v-25h25v65h-90v-65 
                h25v25C211,315.46,216.544,317.739,219.647,314.42z M276,361v15c-30.309,0-56.721,0-90,0v-15H276z M321,476h-90v-15h90V476z 
                M321,451h-90v-65h25c0.001,5.192-0.006,24.326,0.008,25.078c0.067,4.419,5.557,6.64,8.64,3.342l3.854-4.11l3.854,4.11 
                c1.967,2.099,5.315,2.113,7.296-0.001l3.849-4.107c1.023,1.089,3.423,3.659,3.91,4.159c3.068,3.18,8.589,1.038,8.589-3.471v-25 
                h25V451z M381,476h-50v-95c0-2.762-2.238-5-5-5c-10.584,0-30.1,0-40,0v-95c0-2.762-2.238-5-5-5c-10.407,0-90.368,0-100,0 
                c-2.762,0-5,2.238-5,5v95c-14.095,0-30.95,0-45,0V256h250V476z M381,246H131v-10h250V246z M381,226H131v-10h250V226z M456,476 
                h-65V216h5c2.762,0,5-2.238,5-5v-30c0-2.762-2.238-5-5-5H116c-2.762,0-5,2.238-5,5v30c0,2.762,2.238,5,5,5h5 
                c0,7.151,0,252.151,0,260H56V146h400V476z M456,106H56V84.495l200-73.171l200,73.171V106z"></path> 
              <path d="M211 46c0 2.762 2.238 5 5 5h80c2.762 0 5-2.238 5-5 0-2.762-2.238-5-5-5h-80C213.238 41 211 43.238 211 46zM296 61h-80c-2.762 
                0-5 2.238-5 5 0 2.762 2.238 5 5 5h80c2.762 0 5-2.238 5-5C301 63.238 298.762 61 296 61zM296 81h-80c-2.762 0-5 2.238-5 
                5s2.238 5 5 5h80c2.762 0 5-2.238 5-5S298.762 81 296 81z"></path>
            </g>
          </svg>
        </NavLink>
      </div>

      {/* Spacer to push logout to bottom */}
      <div className="flex-1"></div>

      {/* Settings */}
      <NavLink
        to="/manager/settings"
        className={({ isActive }) =>
          `flex justify-center items-center w-20 h-12 transition-colors duration-200 ${
            isActive
              ? "bg-[#5C4033] text-white font-bold"
              : "text-[#5C4033]  hover:bg-gray-100 font-bold"
          }`
        }
        title="Settings"
      >
        <Settings size={24} />
      </NavLink>

      {/* Logout */}
      <button 
        onClick={handleLogout}
        className="flex justify-center items-center w-20 h-12 text-[#5C4033] hover:bg-gray-100 font-bold transition-colors duration-200"
        title="Logout"
      >
        <LogOut size={24} />
      </button>
    </div>
  );
};

export default Sidebar;