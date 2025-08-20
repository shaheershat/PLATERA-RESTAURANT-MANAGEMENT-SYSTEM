import React from "react";

export default function MenuCard({ image, title, price, stock }) {
  return (
    <div className="bg-[#1F2937] rounded-lg p-4 text-center text-white shadow-md">
      <img src={image} alt={title} className="w-24 h-24 mx-auto rounded-full mb-4" />
      <h3 className="font-semibold">{title}</h3>
      <p className="text-gray-400">${price}</p>
      <p className="text-sm text-gray-500">{stock} Bowls available</p>
    </div>
  );
}
