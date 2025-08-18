// src/components/tables/Chair.js
import React from "react";

export default function Chair({ x, y, rotation = 0 }) {
  return (
    <g
      className="chair"
      transform={`translate(${x},${y}) rotate(${rotation},16,24)`}
    >
      <rect
        x="6"
        y="2"
        width="20"
        height="10"
        fill="#ffffffff"
        stroke="#ffffffff"
        strokeWidth="1.5"
      />
      <rect
        className="seat"
        x="4"
        y="14"
        width="24"
        height="10"
        stroke="#9a4848ff"
        strokeWidth="1.5"
      />
      <rect x="7" y="26" width="3" height="14" fill="#a33614dd" />
      <rect x="22" y="26" width="3" height="14" fill="#a33614dd" />
    </g>
  );
}
