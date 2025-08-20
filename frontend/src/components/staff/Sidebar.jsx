// src/components/Sidebar.js
import React from "react";
import { FaUtensils, FaChair } from "react-icons/fa";
import { NavLink } from "react-router-dom";

export default function Sidebar() {
  const base =
    "flex items-center gap-2 cursor-pointer px-3 py-2 rounded-lg";
  const active =
    "bg-white text-black";
  const idle =
    "hover:bg-white/10 text-white";

  return (
    <aside className="w-56 h-full bg-[#0f172a] border-r border-white/10 p-4">
      <ul className="space-y-2">
        <li>
          <NavLink
            to="/menu"
            className={({ isActive }) => `${base} ${isActive ? active : idle}`}
          >
            <FaUtensils />
            <span>Menu</span>
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/tables"
            className={({ isActive }) => `${base} ${isActive ? active : idle}`}
          >
            <FaChair />
            <span>Tables</span>
          </NavLink>
        </li>
      </ul>
    </aside>
  );
}
