import React, { useState } from 'react';

// Mock data for the staff list
const staffData = [
  {
    id: 1,
    name: 'John Doe',
    role: 'Chef',
    status: 'Active',
    salary: 5000.0,
    email: 'john.doe@example.com',
  },
  {
    id: 2,
    name: 'Jane Smith',
    role: 'Waiter',
    status: 'Active',
    salary: 3000.0,
    email: 'jane.smith@example.com',
  },
  {
    id: 3,
    name: 'Mike Johnson',
    role: 'Manager',
    status: 'Active',
    salary: 7000.0,
    email: 'mike.johnson@example.com',
  },
  {
    id: 4,
    name: 'Sarah Lee',
    role: 'Bartender',
    status: 'Inactive',
    salary: 3500.0,
    email: 'sarah.lee@example.com',
  },
];

const ManagerStaffs = () => {
  const [activeRole, setActiveRole] = useState('All');
  const [isAddStaffOpen, setIsAddStaffOpen] = useState(false);
  const [isEditStaffOpen, setIsEditStaffOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [newStaff, setNewStaff] = useState({
    name: '',
    role: 'Chef',
    salary: '',
    email: '',
  });
  const [editedStaff, setEditedStaff] = useState({
    name: '',
    role: '',
    salary: '',
    email: '',
  });

  // Function to filter staff based on the active role
  const filteredStaff =
    activeRole === 'All'
      ? staffData
      : staffData.filter((staff) => staff.role === activeRole);

  // Handle form input changes for new staff
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewStaff((prev) => ({ ...prev, [name]: value }));
  };

  // Handle form input changes for edited staff
  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditedStaff((prev) => ({ ...prev, [name]: value }));
  };

  // Handle add staff submission
  const handleAddStaff = (e) => {
    e.preventDefault();
    const newStaffMember = {
      id: staffData.length + 1,
      name: newStaff.name,
      role: newStaff.role,
      status: 'Active',
      salary: parseFloat(newStaff.salary),
      email: newStaff.email,
    };
    staffData.push(newStaffMember);
    setIsAddStaffOpen(false);
    setNewStaff({ name: '', role: 'Chef', salary: '', email: '' });
  };

  // Handle edit staff submission
  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (selectedStaff) {
      const index = staffData.findIndex((s) => s.id === selectedStaff.id);
      if (index !== -1) {
        staffData[index] = {
          ...staffData[index],
          name: editedStaff.name,
          role: editedStaff.role,
          salary: parseFloat(editedStaff.salary),
          email: editedStaff.email,
        };
        setIsEditStaffOpen(false);
        setSelectedStaff(null);
        setEditedStaff({ name: '', role: '', salary: '', email: '' });
      }
    }
  };

  // Handle delete confirmation
  const handleDeleteConfirm = () => {
    if (selectedStaff) {
      const index = staffData.findIndex((s) => s.id === selectedStaff.id);
      if (index !== -1) {
        staffData.splice(index, 1);
        setIsDeleteConfirmOpen(false);
        setSelectedStaff(null);
      }
    }
  };

  // Handle cancel delete
  const handleDeleteCancel = () => {
    setIsDeleteConfirmOpen(false);
    setSelectedStaff(null);
  };

  return (
    <div className="flex bg-gray-100">
      {/* Main Content only */}
      <div className="flex-1 p-4 overflow-y-auto">
        {/* Header and search bar */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-semibold text-black">Staff</h1>
        </div>

        {/* Role filter and add button */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex space-x-2 text-sm bg-gray-200 p-2 rounded-full">
            {['All', 'Chef', 'Waiter', 'Manager', 'Bartender'].map((role) => (
              <button
                key={role}
                onClick={() => setActiveRole(role)}
                className={`px-4 py-2 rounded-full font-medium transition-colors ${
                  activeRole === role
                    ? 'bg-[#5C4033] text-white'
                    : 'text-[#5C4033]'
                }`}
              >
                {role}
              </button>
            ))}
            <div className="relative">
              <input
                type="text"
                placeholder="Search Staff"
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
            onClick={() => setIsAddStaffOpen(true)}
            className="px-6 py-2 rounded-full bg-[#EB5757] text-white font-medium hover:bg-red-600 transition-colors shadow-md"
          >
            Add Staff
          </button>
        </div>

        {/* Staff List/Table */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-6 gap-4 p-4 font-bold text-gray-500 border-b border-gray-200">
            <div className="col-span-2">Name</div>
            <div>Role</div>
            <div>Status</div>
            <div>Salary</div>
            <div className="text-center">Action</div>
          </div>

          {/* Staff rows */}
          {filteredStaff.map((staff) => (
            <div
              key={staff.id}
              className="grid grid-cols-6 gap-4 items-center p-4 border-b border-gray-200 last:border-b-0"
            >
              <div className="col-span-2 flex items-center space-x-4">
                <span className="font-medium text-gray-800">{staff.name}</span>
              </div>
              <div className="text-gray-600">{staff.role}</div>
              <div>
                <span className={staff.status === 'Active' ? 'text-green-500' : 'text-red-500'} font-medium>
                  {staff.status}
                </span>
              </div>
              <div className="text-gray-800 font-medium">
                ${staff.salary.toFixed(2)}
              </div>
              <div className="flex justify-center space-x-2">
                <button
                  onClick={() => {
                    setSelectedStaff(staff);
                    setEditedStaff({ ...staff });
                    setIsEditStaffOpen(true);
                  }}
                  className="text-green-500 hover:text-green-700 transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => {
                    setSelectedStaff(staff);
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

        {/* Add Staff Modal */}
        {isAddStaffOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg w-96">
              <h2 className="text-xl font-semibold mb-4 text-[#5C4033]">Add Staff</h2>
              <form onSubmit={handleAddStaff} className="space-y-4">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Name</label>
                    <input
                      type="text"
                      name="name"
                      value={newStaff.name}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border-2 border-[#5C4033] rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-[#5C4033]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Role</label>
                    <select
                      name="role"
                      value={newStaff.role}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border-2 border-[#5C4033] rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-[#5C4033]"
                    >
                      <option value="Chef">Chef</option>
                      <option value="Waiter">Waiter</option>
                      <option value="Manager">Manager</option>
                      <option value="Bartender">Bartender</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Salary</label>
                    <input
                      type="number"
                      name="salary"
                      value={newStaff.salary}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border-2 border-[#5C4033] rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-[#5C4033]"
                      step="0.01"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <input
                      type="email"
                      name="email"
                      value={newStaff.email}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border-2 border-[#5C4033] rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-[#5C4033]"
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-4 mt-6">
                  <button
                    type="button"
                    onClick={() => setIsAddStaffOpen(false)}
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

        {/* Edit Staff Modal */}
        {isEditStaffOpen && selectedStaff && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg w-96">
              <h2 className="text-xl font-semibold mb-4 text-[#5C4033]">Edit Staff</h2>
              <form onSubmit={handleSaveEdit} className="space-y-4">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Name</label>
                    <input
                      type="text"
                      name="name"
                      value={editedStaff.name}
                      onChange={handleEditInputChange}
                      className="mt-1 block w-full border-2 border-[#5C4033] rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-[#5C4033]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Role</label>
                    <select
                      name="role"
                      value={editedStaff.role}
                      onChange={handleEditInputChange}
                      className="mt-1 block w-full border-2 border-[#5C4033] rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-[#5C4033]"
                    >
                      <option value="Chef">Chef</option>
                      <option value="Waiter">Waiter</option>
                      <option value="Manager">Manager</option>
                      <option value="Bartender">Bartender</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Salary</label>
                    <input
                      type="number"
                      name="salary"
                      value={editedStaff.salary}
                      onChange={handleEditInputChange}
                      className="mt-1 block w-full border-2 border-[#5C4033] rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-[#5C4033]"
                      step="0.01"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <input
                      type="email"
                      name="email"
                      value={editedStaff.email}
                      onChange={handleEditInputChange}
                      className="mt-1 block w-full border-2 border-[#5C4033] rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-[#5C4033]"
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-4 mt-6">
                  <button
                    type="button"
                    onClick={() => setIsEditStaffOpen(false)}
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
        {isDeleteConfirmOpen && selectedStaff && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg w-72 text-center">
              <p className="text-lg mb-4">Do you want to delete this staff?</p>
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

export default ManagerStaffs;