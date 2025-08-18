import React from "react";
import Chair from './Chair';

export default function RectangleTable({ status, name }) {
  // Chair positions (left and right sides, centered)
  const chairYs = [40, 100, 155, 200]; // evenly spaced along the table
  const leftChairs = chairYs.map((y) => ({
    x: 5, // closer to the table edge
    y,
    rotation: -90,
  }));
  const rightChairs = chairYs.map((y) => ({
    x: 128, // closer to the table edge
    y,
    rotation: 90,
  }));



  const chairs = [...leftChairs, ...rightChairs];

  return (
    <svg viewBox="0 0 170 280" width="180" height="360">
      {/* Table (vertical) */}
      <rect
        x="40"
        y="40"
        width="90"
        height="200"
        rx="6"
        ry="6"
        fill="#e6e6e6"
        stroke="#333"
        strokeWidth="2"
      />

      {/* Chairs */}
      {chairs.map((chair, i) => (
        <Chair key={i} {...chair} />
      ))}

      {/* Labels (rotated for vertical table) */}
      <g transform="rotate(90 85 140)">
        <text
          x="85"
          y="130"
          textAnchor="middle"
          fontSize="16"
          fill="#333"
        >
          {name}
        </text>
        <text
          x="85"
          y="150"
          textAnchor="middle"
          fontSize="12"
          fill="#666"
        >
          {status}
        </text>
      </g>
    </svg>
  );
}