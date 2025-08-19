import React, { useState, useRef } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css'; // Import CSS for DatePicker
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import * as XLSX from 'xlsx';
import { useReactToPrint } from 'react-to-print';

// Enhanced dummy sales data
const mockSalesData = [
  // Today's sales (August 18, 2025)
  { id: 1, date: new Date('2025-08-18'), item: 'Chicken Popeyes', category: 'Food', quantity: 10, price: 30 },
  { id: 2, date: new Date('2025-08-18'), item: 'Grill Sandwich', category: 'Food', quantity: 5, price: 30 },
  { id: 3, date: new Date('2025-08-18'), item: 'Bison Burger', category: 'Food', quantity: 8, price: 50 },
  { id: 4, date: new Date('2025-08-18'), item: 'Fresh Orange Juice', category: 'Drinks', quantity: 15, price: 5 },
  { id: 5, date: new Date('2025-08-18'), item: 'Vegetable Salad', category: 'Others', quantity: 6, price: 20 },

  // Last 7 days (Weekly)
  { id: 6, date: new Date('2025-08-17'), item: 'Chicken Popeyes', category: 'Food', quantity: 12, price: 30 },
  { id: 7, date: new Date('2025-08-17'), item: 'Iced Coffee', category: 'Drinks', quantity: 10, price: 8 },
  { id: 8, date: new Date('2025-08-16'), item: 'Grill Salmon', category: 'Food', quantity: 7, price: 45 },
  { id: 9, date: new Date('2025-08-15'), item: 'Fresh Lemonade', category: 'Drinks', quantity: 8, price: 6 },
  { id: 10, date: new Date('2025-08-14'), item: 'Greek Salad', category: 'Others', quantity: 4, price: 25 },

  // Last 30 days (Monthly)
  { id: 11, date: new Date('2025-07-25'), item: 'Beef Steak', category: 'Food', quantity: 5, price: 60 },
  { id: 12, date: new Date('2025-07-20'), item: 'Chocolate Cake', category: 'Food', quantity: 9, price: 15 },
  { id: 13, date: new Date('2025-07-18'), item: 'Iced Tea', category: 'Drinks', quantity: 12, price: 7 },
  { id: 14, date: new Date('2025-07-10'), item: 'Fruit Platter', category: 'Others', quantity: 3, price: 35 },

  // Last year (Yearly)
  { id: 15, date: new Date('2024-12-15'), item: 'Pasta Alfredo', category: 'Food', quantity: 6, price: 40 },
  { id: 16, date: new Date('2024-09-01'), item: 'Mango Smoothie', category: 'Drinks', quantity: 14, price: 10 },
  { id: 17, date: new Date('2024-08-20'), item: 'Caesar Salad', category: 'Others', quantity: 7, price: 22 },

  // Additional data for custom range testing
  { id: 18, date: new Date('2025-08-10'), item: 'Grill Chicken', category: 'Food', quantity: 11, price: 35 },
  { id: 19, date: new Date('2025-07-05'), item: 'Cappuccino', category: 'Drinks', quantity: 9, price: 12 },
  { id: 20, date: new Date('2025-06-15'), item: 'Quinoa Bowl', category: 'Others', quantity: 5, price: 28 },
];

const ManagerReports = () => {
  const [period, setPeriod] = useState('today');
  const [startDate, setStartDate] = useState(new Date('2025-08-18')); // Current date
  const [endDate, setEndDate] = useState(new Date('2025-08-18')); // Current date
  const [category, setCategory] = useState('All');
  const componentRef = useRef();

  // Handle period change and set date range
  const handlePeriodChange = (selectedPeriod) => {
    setPeriod(selectedPeriod);
    const today = new Date('2025-08-18'); // Current date based on system time
    let newStart = new Date(today);
    let newEnd = new Date(today);
    if (selectedPeriod === 'today') {
      newStart.setHours(0, 0, 0, 0);
      newEnd.setHours(23, 59, 59, 999);
    } else if (selectedPeriod === 'weekly') {
      newStart.setDate(today.getDate() - 7);
    } else if (selectedPeriod === 'monthly') {
      newStart.setMonth(today.getMonth() - 1);
    } else if (selectedPeriod === 'yearly') {
      newStart.setFullYear(today.getFullYear() - 1);
    }
    setStartDate(newStart);
    setEndDate(newEnd);
  };

  // Filter sales data based on date range and category
  const filteredSales = mockSalesData.filter((sale) => {
    const saleDate = new Date(sale.date);
    const dateMatch = saleDate >= startDate && saleDate <= endDate;
    const categoryMatch = category === 'All' || sale.category === category;
    return dateMatch && categoryMatch;
  });

  // Compute category-wise sales for graph
  const categorySales = filteredSales.reduce((acc, sale) => {
    const total = sale.quantity * sale.price;
    if (!acc[sale.category]) acc[sale.category] = 0;
    acc[sale.category] += total;
    return acc;
  }, {});
  const graphData = Object.keys(categorySales).map((cat) => ({ category: cat, sales: categorySales[cat] }));

  // Compute most sold items
  const mostSold = filteredSales.reduce((acc, sale) => {
    if (!acc[sale.item]) acc[sale.item] = { quantity: 0, revenue: 0 };
    acc[sale.item].quantity += sale.quantity;
    acc[sale.item].revenue += sale.quantity * sale.price;
    return acc;
  }, {});
  const mostSoldList = Object.keys(mostSold)
    .map((item) => ({ item, ...mostSold[item] }))
    .sort((a, b) => b.quantity - a.quantity);

  // Handle Print
  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
    documentTitle: 'Sales_Report',
  });

  // Handle Export to Excel
  const handleExportExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet([
      ...filteredSales.map((sale) => ({
        Date: sale.date.toISOString().split('T')[0],
        Item: sale.item,
        Category: sale.category,
        Quantity: sale.quantity,
        Price: sale.price,
        Total: sale.quantity * sale.price,
      })),
      {},
      { 'Most Sold Items': '' },
      ...mostSoldList.map((item) => ({
        Item: item.item,
        Quantity: item.quantity,
        Revenue: item.revenue,
      })),
    ]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sales Report');
    XLSX.writeFile(workbook, 'Sales_Report.xlsx');
  };

  return (
    <div className="flex bg-gray-100 p-2" ref={componentRef}>
      <div className="w-full flex flex-col gap-8">
        {/* Header */}
        <h1 className="text-3xl font-semibold text-black">Reports</h1>

        {/* Filters */}
        <div className="bg-white p-3 rounded-xl flex flex-col sm:flex-row sm:items-end gap-2">
        <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700">Period</label>
            <select
            value={period}
            onChange={(e) => handlePeriodChange(e.target.value)}
            className="mt-1 block w-full border-2 border-[#5C4033] rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-[#5C4033]"
            >
            <option value="today">Today</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
            <option value="custom">Custom</option>
            </select>
        </div>
        {period === 'custom' && (
            <>
            <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700">Start Date</label>
                <DatePicker
                selected={startDate}
                onChange={(date) => setStartDate(date)}
                className="mt-1 block w-full border-2 border-[#5C4033] rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-[#5C4033]"
                />
            </div>
            <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700">End Date</label>
                <DatePicker
                selected={endDate}
                onChange={(date) => setEndDate(date)}
                className="mt-1 block w-full border-2 border-[#5C4033] rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-[#5C4033]"
                />
            </div>
            </>
        )}
        <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700">Category</label>
            <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="mt-1 block w-full border-2 border-[#5C4033] rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-[#5C4033]"
            >
            <option value="All">All</option>
            <option value="Drinks">Drinks</option>
            <option value="Food">Food</option>
            <option value="Others">Others</option>
            </select>
        </div>
        {/* Action Buttons */}
        <div className="flex justify-end space-x-2">
            <button
            onClick={handlePrint}
            className="px-6 py-2 bg-[#5C4033] text-white rounded-full font-medium hover:bg-[#4A3226] transition-colors shadow-md"
            >
            Print
            </button>
            <button
            onClick={handleExportExcel}
            className="px-6 py-2 bg-[#EB5757] text-white rounded-full font-medium hover:bg-red-600 transition-colors shadow-md"
            >
            Download Excel
            </button>
        </div>
        </div>

        {/* Main Content Layout */}
        <div className="flex flex-col md:flex-row gap-8">
          {/* Today's Sold Items (Large Rectangle with Scroll) */}
          <div className="bg-white rounded-xl flex-1 overflow-y-auto" style={{ maxHeight: '650px' }}>
            <h2 className="text-xl pl-[30px] py-6 font-semibold text-gray-800 mb-4 sticky top-0 bg-white p-4 py-2">Today's Sold Items</h2>
            <div className="grid grid-cols-5 gap-4 p-4 font-bold text-gray-500 border-b border-gray-200">
              <div>Date</div>
              <div>Item</div>
              <div>Category</div>
              <div>Quantity</div>
              <div>Total</div>
            </div>
            <div className="overflow-y-auto">
              {filteredSales.map((sale) => (
                <div key={sale.id} className="grid grid-cols-5 gap-4 items-center p-4 border-b border-gray-200 last:border-b-0">
                  <div className="text-gray-600">{sale.date.toISOString().split('T')[0]}</div>
                  <div className="font-medium text-gray-800">{sale.item}</div>
                  <div className="text-gray-600">{sale.category}</div>
                  <div className="text-gray-600">{sale.quantity}</div>
                  <div className="text-gray-800 font-medium">${(sale.quantity * sale.price).toFixed(2)}</div>
                </div>
              ))}
              {filteredSales.length === 0 && <p className="p-4 text-gray-500">No sales data available.</p>}
            </div>
          </div>

          {/* Right Side (Graph and Most Sold Items) */}
          <div className="w-full md:w-1/2 flex flex-col  gap-8">
            {/* Graph for Category Wise Sales */}
            <div className="bg-white p-6 rounded-xl flex justify-center h-[400px]">
              <div className="w-full">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Category Wise Sales</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={graphData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="sales" fill="#5C4033" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Most Sold Items */}
            <div className="bg-white rounded-xl overflow-y-auto h-[215px]">
              <h2 className="text-xl font-semibold sticky bg-white top-0 pl-[30px] py-6 text-gray-800 mb-4">Most Sold Items</h2>
              <div className="grid grid-cols-3 gap-4 p-4 font-bold text-gray-500 border-b border-gray-200">
                <div>Item</div>
                <div>Quantity</div>
                <div>Revenue</div>
              </div>
              {mostSoldList.map((item) => (
                <div key={item.item} className="grid grid-cols-3 gap-4 items-center p-4 border-b border-gray-200 last:border-b-0">
                  <div className="font-medium text-gray-800">{item.item}</div>
                  <div className="text-gray-600">{item.quantity}</div>
                  <div className="text-gray-800 font-medium">${item.revenue.toFixed(2)}</div>
                </div>
              ))}
              {mostSoldList.length === 0 && <p className="p-4 text-gray-500">No data available.</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagerReports;