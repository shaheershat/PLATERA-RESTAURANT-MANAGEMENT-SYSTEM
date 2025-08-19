// src/components/tables/SquareTable.js
import React from "react";
import Chair from './Chair';


export default function SquareTable({ status, name }) {
  // Chair positions (top, bottom, left, right)
  const chairs = [
    { x: 80, y: 15, rotation: 0 }, // Top
    { x: 80, y: 137, rotation: 180 }, // Bottom
    { x: 20, y: 80, rotation: -90 }, // Left
    { x: 147, y: 80, rotation: 90 }, // Right
  ];

  return (
    <svg viewBox="0 0 200 200" width="180" height="180">
      {/* Table */}
      <rect
        x="60"
        y="60"
        width="80"
        height="80"
        rx="6"
        ry="6"
        fill="#e6e6e6"
        stroke="#333"
        strokeWidth="2"
      />

      {/* Chairs (dynamic) */}
      {chairs.map((chair, i) => (
        <Chair key={i} {...chair} />
      ))}

      {/* Labels */}
      <text
        x="100"
        y="105"
        textAnchor="middle"
        fontSize="16"
        fill="#333"
      >
        {name}
      </text>
      <text
        x="100"
        y="125"
        textAnchor="middle"
        fontSize="12"
        fill="#666"
      >
        {status}
      </text>
    </svg>
  );
}
