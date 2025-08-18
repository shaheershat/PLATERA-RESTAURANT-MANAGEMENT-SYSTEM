// src/pages/Menu.js
import React from "react";

const Menu = () => {
  const dishes = [
    {
      name: "Spicy seasoned seafood noodles",
      price: 2.29,
      stock: "20 Bowls available",
      image: "/food1.jpg",
    },
    {
      name: "Salted Pasta with mushroom sauce",
      price: 2.69,
      stock: "11 Bowls available",
      image: "/food2.jpg",
    },
    {
      name: "Beef dumpling in hot and sour soup",
      price: 2.99,
      stock: "16 Bowls available",
      image: "/food3.jpg",
    },
  ];

  return (
    <div>
      {/* Top Bar */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex space-x-6 text-gray-400">
          {["Hot Dishes", "Cold Dishes", "Soup", "Grill", "Appetizer", "Dessert"].map(
            (cat, i) => (
              <button
                key={i}
                className={`pb-2 ${
                  i === 0
                    ? "border-b-2 border-orange-500 text-orange-400"
                    : "hover:text-white"
                }`}
              >
                {cat}
              </button>
            )
          )}
        </div>
        <input
          type="text"
          placeholder="Search for food, coffee..."
          className="bg-gray-800 p-2 rounded-lg text-sm w-64"
        />
      </div>

      {/* Dish Cards */}
      <div className="grid grid-cols-4 gap-6">
        {dishes.map((dish, i) => (
          <div
            key={i}
            className="bg-gray-800 p-4 rounded-xl shadow hover:shadow-lg"
          >
            <img
              src={dish.image}
              alt={dish.name}
              className="w-full h-32 object-cover rounded-lg mb-3"
            />
            <h3 className="font-semibold">{dish.name}</h3>
            <p className="text-orange-400 font-bold">${dish.price.toFixed(2)}</p>
            <p className="text-xs text-gray-400">{dish.stock}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Menu;
