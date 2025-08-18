import React, { useState } from 'react';

// Mock data for the products list
const productsData = [
  {
    id: 1,
    name: 'Chicken Popeyes',
    status: 'In Stock',
    category: 'Food',
    price: 30.0,
    imageUrl: 'https://placehold.co/60x60/FDBA00/FFFFFF?text=Popeyes',
  },
  {
    id: 2,
    name: 'Grilled Salmon',
    status: 'In Stock',
    category: 'Food',
    price: 45.0,
    imageUrl: 'https://placehold.co/60x60/EB5757/FFFFFF?text=Salmon',
  },
  {
    id: 3,
    name: 'Fresh Orange Juice',
    status: 'In Stock',
    category: 'Drinks',
    price: 5.0,
    imageUrl: 'https://placehold.co/60x60/2D2D2D/FFFFFF?text=Juice',
  },
  {
    id: 4,
    name: 'Beef Steak',
    status: 'In Stock',
    category: 'Food',
    price: 60.0,
    imageUrl: 'https://placehold.co/60x60/FDBA00/FFFFFF?text=Steak',
  },
  {
    id: 5,
    name: 'Iced Coffee',
    status: 'In Stock',
    category: 'Drinks',
    price: 8.0,
    imageUrl: 'https://placehold.co/60x60/EB5757/FFFFFF?text=Coffee',
  },
  {
    id: 6,
    name: 'Vegetable Salad',
    status: 'In Stock',
    category: 'Others',
    price: 20.0,
    imageUrl: 'https://placehold.co/60x60/2D2D2D/FFFFFF?text=Salad',
  },
  {
    id: 7,
    name: 'Chocolate Cake',
    status: 'In Stock',
    category: 'Food',
    price: 15.0,
    imageUrl: 'https://placehold.co/60x60/FDBA00/FFFFFF?text=Cake',
  },
];

const ProductsDashboard = () => {
  const [activeCategory, setActiveCategory] = useState('All');

  // Function to filter products based on the active category
  const filteredProducts =
    activeCategory === 'All'
      ? productsData
      : productsData.filter((product) => product.category === activeCategory);

  return (
    <div className="flex bg-gray-100 ">
      {/* Main Content only */}
      <div className="flex-1 p-1 overflow-y-auto">
        {/* Header and search bar */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-semibold text-black">Products</h1>
        </div>

        {/* Category filter and add button */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex space-x-2 text-sm bg-gray-200 p-2 rounded-full">
            {['All', 'Drinks', 'Food', 'Others'].map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`px-4 py-2 rounded-full font-medium transition-colors ${
                  activeCategory === category
                    ? 'bg-[#5C4033] text-white'
                    : 'text-[#5C4033]'
                }`}
              >
                {category}
              </button>
            ))}
            <div className="relative">
            <input
              type="text"
              placeholder="Search Product"
              className="pl-10 pr-4 py-2 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#5C4033]"
            />
            <svg
              className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M12.9 14.32a8 8 0 111.414-1.414l5.36 5.36-1.414 1.414-5.36-5.36zM8 14A6 6 0 108 2a6 6 0 000 12z"></path>
            </svg>
          </div>
          </div>
          
          <button className="px-6 py-2 rounded-full bg-[#EB5757] text-white font-medium hover:bg-red-600 transition-colors shadow-md">
            Add Items
          </button>
        </div>

        {/* Products List/Table */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-6 gap-4 p-4 font-bold text-gray-500 border-b border-gray-200">
            <div className="col-span-2">Product</div>
            <div>Status</div>
            <div>Category</div>
            <div>Price</div>
            <div className="text-center">Action</div>
          </div>

          {/* Product rows */}
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className="grid grid-cols-6 gap-4 items-center p-4 border-b border-gray-200 last:border-b-0"
            >
              <div className="col-span-2 flex items-center space-x-4">
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-16 h-16 rounded-xl object-cover"
                />
                <span className="font-medium text-gray-800">
                  {product.name}
                </span>
              </div>
              <div>
                <span className="text-green-500 font-medium">
                  {product.status}
                </span>
              </div>
              <div className="text-gray-600">{product.category}</div>
              <div className="text-gray-800 font-medium">
                ${product.price.toFixed(2)}
              </div>
              <div className="flex justify-center space-x-2">
                <button className="text-green-500 hover:text-green-700 transition-colors">
                  Edit
                </button>
                <button className="text-red-500 hover:text-red-700 transition-colors">
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProductsDashboard;
