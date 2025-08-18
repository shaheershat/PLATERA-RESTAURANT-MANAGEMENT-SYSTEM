// src/components/Navbar.js
import React from "react";

export default function Navbar() {
  return (
    <nav className="w-full bg-[#0f172a] border-b border-white/10 px-6 h-14 flex items-center justify-between">
      {/* Left: Logo + Brand */}
      <div className="flex items-center gap-3">
        <img src="/logo.png" alt="Platera" className="w-9 h-9 rounded-full" />
        <span className="text-white font-extrabold text-xl tracking-wide">
          PLATERA
        </span>
      </div>

      {/* Right: Divider + Profile */}
      <div className="flex items-center gap-3 text-white">
        <div className="h-6 w-px bg-white/30 mx-2" />
        <img
          src="/avatar.png"
          alt="User"
          className="w-9 h-9 rounded-full ring-1 ring-white/20"
        />
        <div className="leading-tight">
          <div className="font-semibold">Shaheer</div>
          <div className="text-xs text-white/60 -mt-0.5">Waiter</div>
        </div>
        <svg
          viewBox="0 0 24 24"
          className="w-4 h-4 text-white/70"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </div>
    </nav>
  );
}
