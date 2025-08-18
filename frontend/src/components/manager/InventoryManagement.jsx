import React, { useState } from 'react';

// Inline SVG icons to keep the code self-contained
const icons = {
  Plus: (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14" /><path d="M12 5v14" />
    </svg>
  ),
  Search: (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
    </svg>
  ),
  Calculator: (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="16" height="20" x="4" y="2" rx="2" /><line x1="8" x2="16" y1="6" y2="6" /><line x1="8" x2="16" y1="10" y2="10" /><path d="M8 14h.01" /><path d="M12 14h.01" /><path d="M16 14h.01" /><path d="M8 18h.01" /><path d="M12 18h.01" /><path d="M16 18h.01" />
    </svg>
  ),
  Trash: (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
    </svg>
  ),
  Add: (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5v14" /><path d="M5 12h14" />
    </svg>
  ),
};

// Custom Modal component
const CustomModal = ({ title, onClose, children }) => {
  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white text-gray-900 rounded-xl border border-black shadow-xl p-8 w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-semibold text-gray-900">{title}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-black transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18" /><path d="m6 6 12 12" />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

// Mock inventory data
const initialInventoryData = [
  { id: 1, item: 'Sugar', totalStock: 10, stockLeft: 5, unit: 'kg' },
  { id: 2, item: 'Flour', totalStock: 20, stockLeft: 15, unit: 'kg' },
  { id: 3, item: 'Butter', totalStock: 8, stockLeft: 6, unit: 'kg' },
  { id: 4, item: 'Milk', totalStock: 50, stockLeft: 40, unit: 'L' },
  { id: 5, item: 'Eggs', totalStock: 200, stockLeft: 150, unit: 'units' },
  { id: 6, item: 'Salt', totalStock: 5, stockLeft: 4.5, unit: 'kg' },
  { id: 7, item: 'Oil', totalStock: 15, stockLeft: 12, unit: 'L' },
  { id: 8, item: 'Tomatoes', totalStock: 20, stockLeft: 0, unit: 'kg' },
  { id: 9, item: 'Chocolate', totalStock: 10, stockLeft: 5, unit: 'kg' },
  { id: 10, item: 'Cocoa Powder', totalStock: 20, stockLeft: 15, unit: 'kg' },
  { id: 11, item: 'Yeast', totalStock: 8, stockLeft: 6, unit: 'kg' },
  { id: 12, item: 'Vanilla Extract', totalStock: 50, stockLeft: 40, unit: 'L' },
  { id: 13, item: 'Baking Soda', totalStock: 200, stockLeft: 150, unit: 'units' },
];

const ManagerInventory = () => {
  const [inventoryData, setInventoryData] = useState(initialInventoryData);
  const [searchTerm, setSearchTerm] = useState('');
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showAddStockModal, setShowAddStockModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [updateForm, setUpdateForm] = useState({ totalStock: '', todaysUsed: '' });
  const [addStockForm, setAddStockForm] = useState({ newStock: '' });
  const [modalMessage, setModalMessage] = useState('');

  // Filter items based on search term
  const filteredItems = inventoryData.filter((item) =>
    item.item.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle update form input changes
  const handleUpdateChange = (e) => {
    const { name, value } = e.target;
    setUpdateForm((prev) => ({ ...prev, [name]: value }));
  };

  // Handle add stock form input changes
  const handleAddStockChange = (e) => {
    const { name, value } = e.target;
    setAddStockForm((prev) => ({ ...prev, [name]: value }));
  };

  // Handle initial stock update
  const handleUpdateSubmit = () => {
    if (!selectedItem) return;

    const totalStockValue = parseFloat(updateForm.totalStock) || 0;
    const todaysUsedValue = parseFloat(updateForm.todaysUsed) || 0;

    if (todaysUsedValue > totalStockValue) {
      setModalMessage(`Usage (${todaysUsedValue} ${selectedItem.unit}) cannot exceed total stock (${totalStockValue} ${selectedItem.unit}).`);
      return;
    }

    const updatedStockLeft = totalStockValue - todaysUsedValue;

    const updatedInventory = inventoryData.map((item) =>
      item.id === selectedItem.id
        ? {
            ...item,
            totalStock: totalStockValue,
            stockLeft: updatedStockLeft,
          }
        : item
    );

    setInventoryData(updatedInventory);
    setShowUpdateModal(false);
    setSelectedItem(null);
    setUpdateForm({ totalStock: '', todaysUsed: '' });
    setModalMessage(`${selectedItem.item} stock updated successfully!`);
  };

  // Handle add new stock
  const handleAddStockSubmit = () => {
    if (!selectedItem) return;

    const newStockValue = parseFloat(addStockForm.newStock) || 0;

    const updatedInventory = inventoryData.map((item) =>
      item.id === selectedItem.id
        ? {
            ...item,
            totalStock: item.totalStock + newStockValue,
            stockLeft: item.stockLeft + newStockValue,
          }
        : item
    );

    setInventoryData(updatedInventory);
    setShowAddStockModal(false);
    setSelectedItem(null);
    setAddStockForm({ newStock: '' });
    setModalMessage(`${selectedItem.item} stock added successfully!`);
  };

  // Handle delete item
  const handleDeleteItem = (id) => {
    const updatedInventory = inventoryData.filter((item) => item.id !== id);
    setInventoryData(updatedInventory);
    setModalMessage('Item deleted successfully!');
  };

  return (
    <div className="flex-1 p-6 flex flex-col space-y-4 rounded-lg bg-white text-gray-900 font-inter">
      {/* Header and Action Buttons */}
      <div className="bg-white p-6 rounded-xl flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex-1 w-full md:w-auto">
          <h1 className="text-3xl font-bold text-gray-900">Ingredient Inventory</h1>
          <p className="text-gray-600 mt-1">Manage and track your ingredient stock.</p>
        </div>
        <button
          onClick={() => setModalMessage('Add new item functionality is not yet implemented.')}
          className="w-full md:w-auto px-8 py-3 bg-[#5C4033] text-white rounded-full font-medium flex items-center justify-center gap-2 hover:bg-gray-800 transition-colors shadow-md"
        >
          <icons.Plus size={20} />
          Add New Item
        </button>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-6 rounded-xl flex flex-col sm:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-500">
            <icons.Search size={20} />
          </div>
          <input
            type="text"
            placeholder="Search item..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full rounded-lg bg-white border border-black text-gray-900 pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-black transition-colors placeholder-gray-500"
          />
        </div>
      </div>

        {/* Inventory List/Table */}
        <div className="flex-1 flex flex-col bg-white pl-6 pr-6 rounded-xl shadow-lg overflow-y-auto" style={{ height: '645px' }}>
        {/* Header Row */}
        <div className="sticky top-0 bg-white p-4 grid grid-cols-5 gap-4 items-center border-b border-black z-10">
            <div className="col-span-1 font-semibold text-gray-900">Item</div>
            <div className="text-center sm:text-left font-semibold text-gray-900">Total Stock Bought</div>
            <div className="text-center sm:text-left font-semibold text-gray-900">Total Stock Left</div>
            {/* FIX: Actions header spans 2 columns + right aligned */}
            <div className="col-span-2 pr-8 text-right font-semibold text-gray-900">Actions</div>
        </div>

        {/* Items List */}
        <div className="space-y-4 pt-4 h-[580px]">
            {filteredItems.length > 0 ? (
            filteredItems.map((item) => (
                <div key={item.id} className="grid grid-cols-5 gap-4 items-center p-4 rounded-lg bg-gray-100 shadow-inner">
                <div className="col-span-1 flex items-center space-x-4">
                    <h3 className="font-semibold text-gray-900">{item.item}</h3>
                </div>
                <div className="text-center sm:text-left">
                    <span className="font-medium text-gray-700">{item.totalStock} {item.unit}</span>
                </div>
                <div className="text-center sm:text-left">
                    <span className={`font-medium ${item.stockLeft <= 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {item.stockLeft} {item.unit}
                    </span>
                </div>
                {/* FIX: col-span-2 matches header, right aligned */}
                <div className="flex justify-end space-x-2 col-span-2">
                    <button
                    onClick={() => {
                        setSelectedItem(item);
                        setUpdateForm({ totalStock: item.totalStock, todaysUsed: '' });
                        setShowUpdateModal(true);
                    }}
                    className="p-2 rounded-full bg-gray-300 text-gray-900 hover:bg-gray-400 transition-colors"
                    title="Update Stock"
                    >
                    <icons.Calculator size={16} />
                    </button>
                    <button
                    onClick={() => {
                        setSelectedItem(item);
                        setAddStockForm({ newStock: '' });
                        setShowAddStockModal(true);
                    }}
                    className="p-2 rounded-full bg-blue-500 text-white hover:bg-blue-600 transition-colors"
                    title="Add Stock"
                    >
                    <icons.Add size={16} />
                    </button>
                    <button
                    onClick={() => handleDeleteItem(item.id)}
                    className="p-2 rounded-full bg-red-600 text-white hover:bg-red-500 transition-colors"
                    title="Delete Item"
                    >
                    <icons.Trash size={16} />
                    </button>
                </div>
                </div>
            ))
            ) : (
            <p className="p-4 text-gray-500 text-center">No items found matching your criteria.</p>
            )}
        </div>
        </div>


      {/* Update Stock Modal */}
      {showUpdateModal && selectedItem && (
        <CustomModal title={`Update Stock for ${selectedItem.item}`} onClose={() => setShowUpdateModal(false)}>
          <div className="space-y-4">
            <div>
              <label htmlFor="totalStock" className="block text-sm font-medium text-gray-600">
                Total Stock Bought ({selectedItem.unit})
              </label>
              <input
                type="number"
                id="totalStock"
                name="totalStock"
                value={updateForm.totalStock}
                onChange={handleUpdateChange}
                className="mt-1 block w-full rounded-lg bg-white border border-black text-gray-900 p-2 focus:outline-none focus:ring-2 focus:ring-black placeholder-gray-500"
                placeholder={`e.g., 10 ${selectedItem.unit}`}
              />
            </div>
            <div>
              <label htmlFor="todaysUsed" className="block text-sm font-medium text-gray-600">
                Used Today ({selectedItem.unit})
              </label>
              <input
                type="number"
                id="todaysUsed"
                name="todaysUsed"
                value={updateForm.todaysUsed}
                onChange={handleUpdateChange}
                className="mt-1 block w-full rounded-lg bg-white border border-black text-gray-900 p-2 focus:outline-none focus:ring-2 focus:ring-black placeholder-gray-500"
                placeholder={`e.g., 2 ${selectedItem.unit}`}
              />
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <button
              onClick={handleUpdateSubmit}
              className="px-6 py-2 bg-black text-white rounded-full font-medium hover:bg-gray-800 transition-colors shadow-md"
            >
              Okay
            </button>
          </div>
        </CustomModal>
      )}

      {/* Add Stock Modal */}
      {showAddStockModal && selectedItem && (
        <CustomModal title={`Add Stock for ${selectedItem.item}`} onClose={() => setShowAddStockModal(false)}>
          <div className="space-y-4">
            <div>
              <label htmlFor="newStock" className="block text-sm font-medium text-gray-600">
                New Stock to Add ({selectedItem.unit})
              </label>
              <input
                type="number"
                id="newStock"
                name="newStock"
                value={addStockForm.newStock}
                onChange={handleAddStockChange}
                className="mt-1 block w-full rounded-lg bg-white border border-black text-gray-900 p-2 focus:outline-none focus:ring-2 focus:ring-black placeholder-gray-500"
                placeholder={`e.g., 5 ${selectedItem.unit}`}
              />
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <button
              onClick={handleAddStockSubmit}
              className="px-6 py-2 bg-black text-white rounded-full font-medium hover:bg-gray-800 transition-colors shadow-md"
            >
              Okay
            </button>
          </div>
        </CustomModal>
      )}

      {/* General Message Modal */}
      {modalMessage && (
        <CustomModal title="Notification" onClose={() => setModalMessage('')}>
          <p className="text-gray-700 text-center mb-4">{modalMessage}</p>
          <div className="flex justify-center">
            <button
              onClick={() => setModalMessage('')}
              className="px-6 py-2 bg-black text-white rounded-full font-medium hover:bg-gray-800 transition-colors shadow-md"
            >
              OK
            </button>
          </div>
        </CustomModal>
      )}
    </div>
  );
};

export default ManagerInventory;