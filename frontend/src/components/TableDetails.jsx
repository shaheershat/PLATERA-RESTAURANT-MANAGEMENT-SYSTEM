import React from "react";
import { BrowserRouter as Router, Routes, Route, Link, Outlet, useNavigate, useParams } from "react-router-dom";

function TableDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Dummy data for illustration
  const waiter = "Shaheer";
  const time = "12:35";
  const menuTabs = ["Hot Dishes", "Cold Dishes", "Soup", "Grill", "App"];
  const menuItems = Array(8).fill({
    name: "Spicy seasoned sea...",
    price: "$ 4,58",
    img: "https://via.placeholder.com/40", // Replace with real image
  });
  const orderItems = Array(4).fill({
    name: "Spicy seasoned sea...",
    price: "$ 2.29",
    qty: 2,
    img: "https://via.placeholder.com/40",
  });
  const total = "$ 21,03";

  return (
    <div className="flex h-screen bg-[#181F2A]">
      {/* Sidebar */}


      {/* Main Content */}
      <main className="flex-1 flex flex-col px-12 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <button onClick={() => navigate(-1)} className="text-white opacity-70 hover:opacity-100">&larr; Back</button>
        </div>

        {/* Content */}
        <div className="flex bg-[#232B3E] rounded-2xl overflow-hidden flex-1">
          {/* Menu Section */}
          <section className="w-1/2 bg-white p-8 flex flex-col">
            <h2 className="text-2xl font-bold mb-4 text-[#232B3E]">Menu</h2>
            {/* Search */}
            <input
              type="text"
              placeholder="Search for food, coffee, etc.."
              className="mb-4 px-4 py-2 rounded-lg border border-gray-200 focus:outline-none"
            />
            {/* Tabs */}
            <div className="flex gap-4 mb-4">
              {menuTabs.map((tab, idx) => (
                <button
                  key={tab}
                  className={`pb-2 font-semibold ${idx === 0 ? "border-b-2 border-[#FF6B57] text-[#FF6B57]" : "text-gray-500"}`}
                >
                  {tab}
                </button>
              ))}
            </div>
            {/* Menu Items */}
            <div className="flex flex-col gap-3 overflow-y-auto">
              {menuItems.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between bg-[#F5F6FA] rounded-lg px-4 py-2">
                  <div className="flex items-center gap-3">
                    <img src={item.img} alt="" className="w-10 h-10 rounded-full" />
                    <span className="font-medium text-[#232B3E]">{item.name}</span>
                  </div>
                  <span className="font-bold text-[#232B3E]">{item.price}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Order Section */}
          <section className="w-1/2 bg-[#232B3E] p-8 flex flex-col">
            <div className="flex justify-between items-center mb-2">
              <div>
                <div className="text-xl font-bold text-white">Table-{id}</div>
                <div className="text-gray-400 text-sm">Waiter: {waiter}</div>
              </div>
              <div className="text-white text-lg">{time}</div>
            </div>
            {/* Current Order */}
            <div className="bg-[#2D3446] rounded-xl p-6 flex-1 flex flex-col">
              <div className="font-semibold text-white mb-4">Current order</div>
              <div className="flex flex-col gap-3 mb-4 overflow-y-auto">
                {orderItems.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-[#232B3E] rounded-lg px-4 py-2">
                    <div className="flex items-center gap-3">
                      <img src={item.img} alt="" className="w-10 h-10 rounded-full" />
                      <div>
                        <div className="text-white font-medium">{item.name}</div>
                        <div className="text-gray-400 text-xs">{item.price}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="text-white px-2">-</button>
                      <span className="text-white">{item.qty}</span>
                      <button className="text-white px-2">+</button>
                    </div>
                    <span className="text-white font-bold">{item.price}</span>
                    <button className="text-gray-400 hover:text-red-500">
                      🗑️
                    </button>
                  </div>
                ))}
              </div>
              {/* Order Note */}
              <textarea
                placeholder="Order Note"
                className="w-full rounded-lg p-2 mb-4 bg-[#232B3E] border border-gray-600 text-white resize-none"
                rows={2}
              />
              {/* Total and Send */}
              <div className="flex justify-between items-center mt-auto">
                <span className="text-white text-lg font-bold">Total</span>
                <span className="text-white text-lg font-bold">{total}</span>
              </div>
              <button className="mt-6 bg-[#FF6B57] text-white py-3 rounded-lg font-semibold hover:bg-[#ff3b1d]">
                Send to kitchen
              </button>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

export default TableDetails;