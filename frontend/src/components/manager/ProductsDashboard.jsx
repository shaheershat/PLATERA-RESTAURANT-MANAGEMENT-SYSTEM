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
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [isEditItemOpen, setIsEditItemOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [newItem, setNewItem] = useState({
    name: '',
    category: 'Food',
    price: '',
    imageUrl: '',
  });
  const [editedItem, setEditedItem] = useState({
    name: '',
    category: '',
    price: '',
    imageUrl: '',
  });

  // Function to filter products based on the active category
  const filteredProducts =
    activeCategory === 'All'
      ? productsData
      : productsData.filter((product) => product.category === activeCategory);

  // Handle form input changes for new item
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewItem((prev) => ({ ...prev, [name]: value }));
  };

  // Handle form input changes for edited item
  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditedItem((prev) => ({ ...prev, [name]: value }));
  };

  // Handle add item submission
  const handleAddItem = (e) => {
    e.preventDefault();
    const newProduct = {
      id: productsData.length + 1,
      name: newItem.name,
      status: 'In Stock',
      category: newItem.category,
      price: parseFloat(newItem.price),
      imageUrl: newItem.imageUrl || 'https://placehold.co/60x60/FDBA00/FFFFFF?text=New',
    };
    productsData.push(newProduct);
    setIsAddItemOpen(false);
    setNewItem({ name: '', category: 'Food', price: '', imageUrl: '' });
  };

  // Handle edit item submission
  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (selectedProduct) {
      const index = productsData.findIndex((p) => p.id === selectedProduct.id);
      if (index !== -1) {
        productsData[index] = {
          ...productsData[index],
          name: editedItem.name,
          category: editedItem.category,
          price: parseFloat(editedItem.price),
          imageUrl: editedItem.imageUrl || productsData[index].imageUrl,
        };
        setIsEditItemOpen(false);
        setSelectedProduct(null);
        setEditedItem({ name: '', category: '', price: '', imageUrl: '' });
      }
    }
  };

  // Handle delete confirmation
  const handleDeleteConfirm = () => {
    if (selectedProduct) {
      const index = productsData.findIndex((p) => p.id === selectedProduct.id);
      if (index !== -1) {
        productsData.splice(index, 1);
        setIsDeleteConfirmOpen(false);
        setSelectedProduct(null);
      }
    }
  };

  // Handle cancel delete
  const handleDeleteCancel = () => {
    setIsDeleteConfirmOpen(false);
    setSelectedProduct(null);
  };

  return (
    <div className="flex bg-gray-100">
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
          <button
            onClick={() => setIsAddItemOpen(true)}
            className="px-6 py-2 rounded-full bg-[#EB5757] text-white font-medium hover:bg-red-600 transition-colors shadow-md"
          >
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
                <button
                  onClick={() => {
                    setSelectedProduct(product);
                    setEditedItem({ ...product });
                    setIsEditItemOpen(true);
                  }}
                  className="text-green-500 hover:text-green-700 transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => {
                    setSelectedProduct(product);
                    setIsDeleteConfirmOpen(true);
                  }}
                  className="text-red-500 hover:text-red-700 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Add Item Modal */}
        {isAddItemOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg w-[600px]">
              <h2 className="text-xl font-semibold mb-4 text-[#5C4033]">Add Item</h2>
              <form onSubmit={handleAddItem} className="space-y-4">
                <div className="flex space-x-4">
                  <div className="w-1/2">
                    <label className="block text-sm font-medium text-gray-700">Upload Image</label>
                    <div className="mt-1 flex items-center justify-center w-full h-[210px] border-2 border-[#5C4033] border-dashed rounded-lg bg-gray-50">
                      <span className="text-gray-500">Upload Image</span>
                      <input
                        type="text"
                        name="imageUrl"
                        value={newItem.imageUrl}
                        onChange={handleInputChange}
                        className="hidden"
                      />
                    </div>
                  </div>
                  <div className="w-1/2 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Name</label>
                      <input
                        type="text"
                        name="name"
                        value={newItem.name}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border-2 border-[#5C4033] rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-[#5C4033]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Category</label>
                      <select
                        name="category"
                        value={newItem.category}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border-2 border-[#5C4033] rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-[#5C4033]"
                      >
                        <option value="Food">Food</option>
                        <option value="Drinks">Drinks</option>
                        <option value="Others">Others</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Price</label>
                      <input
                        type="number"
                        name="price"
                        value={newItem.price}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border-2 border-[#5C4033] rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-[#5C4033]"
                        step="0.01"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex justify-end space-x-4 mt-6">
                  <button
                    type="button"
                    onClick={() => setIsAddItemOpen(false)}
                    className="px-4 py-2 bg-gray-200 rounded-lg border-2 border-[#5C4033] text-[#5C4033] hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#5C4033] text-white rounded-lg hover:bg-[#4A3226] transition-colors"
                  >
                    Add
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Item Modal */}
{isEditItemOpen && selectedProduct && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white p-6 rounded-lg shadow-lg w-[600px]">
      <h2 className="text-xl font-semibold mb-4 text-[#5C4033]">Edit Item</h2>
      <form onSubmit={handleSaveEdit} className="space-y-4">
        <div className="flex space-x-4">
          <div className="w-1/2">
            <label className="block text-sm font-medium text-gray-700">Change Image</label>
            <img
              src={editedItem.imageUrl || selectedProduct.imageUrl}
              alt={editedItem.name || selectedProduct.name}
              className="mt-1 w-full h-[210px] object-cover rounded-lg"
            />
            <div className="mt-2 text-[#5C4033]">Change Image</div>
          </div>
          <div className="w-1/2 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Name</label>
              <input
                type="text"
                name="name"
                value={editedItem.name}
                onChange={handleEditInputChange}
                className="mt-1 block w-full border-2 border-[#5C4033] rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-[#5C4033]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Category</label>
              <select
                name="category"
                value={editedItem.category}
                onChange={handleEditInputChange}
                className="mt-1 block w-full border-2 border-[#5C4033] rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-[#5C4033]"
              >
                <option value="Food">Food</option>
                <option value="Drinks">Drinks</option>
                <option value="Others">Others</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Price</label>
              <input
                type="number"
                name="price"
                value={editedItem.price}
                onChange={handleEditInputChange}
                className="mt-1 block w-full border-2 border-[#5C4033] rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-[#5C4033]"
                step="0.01"
              />
            </div>
          </div>
        </div>
        <div className="flex justify-end space-x-4 mt-6">
          <button
            type="button"
            onClick={() => setIsEditItemOpen(false)}
            className="px-4 py-2 bg-gray-200 rounded-lg border-2 border-[#5C4033] text-[#5C4033] hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-[#5C4033] text-white rounded-lg hover:bg-[#4A3226] transition-colors"
          >
            Save
          </button>
        </div>
      </form>
    </div>
  </div>
)}

        {/* Delete Confirmation Modal */}
        {isDeleteConfirmOpen && selectedProduct && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg w-72 text-center">
              <p className="text-lg mb-4">Do you want to delete this product?</p>
              <div className="flex justify-center space-x-4">
                <button
                  onClick={handleDeleteCancel}
                  className="px-4 py-2 bg-gray-200 rounded-lg border-2 border-[#5C4033] text-[#5C4033] hover:bg-gray-300 transition-colors"
                >
                  No
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  className="px-4 py-2 bg-[#5C4033] text-white rounded-lg hover:bg-[#4A3226] transition-colors"
                >
                  Yes
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductsDashboard;