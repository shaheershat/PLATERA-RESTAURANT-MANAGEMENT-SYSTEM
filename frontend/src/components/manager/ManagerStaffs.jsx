import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useStaffData } from '../../hooks/useStaffData';

const ManagerStaffs = () => {
  // Use the useStaffData hook to manage staff data
  const {
    staff,
    loading,
    error,
    activeRole,
    setActiveRole,
    filteredStaff,
    fetchStaff,
    addStaff,
    updateStaff,
    deleteStaff
  } = useStaffData();
  
  // Local state for UI controls and form data
  const [isAddStaffOpen, setIsAddStaffOpen] = useState(false);
  const [isEditStaffOpen, setIsEditStaffOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [newStaff, setNewStaff] = useState({
    first_name: '',
    last_name: '',
    email: '',
    role: 'WAITER',
    position: 'Waiter',
    salary: '',
    phone_number: '',
    address: '',
    hire_date: new Date().toISOString().split('T')[0],
    is_active: true
  });

  // Fetch staff data
  useEffect(() => {
    const fetchStaff = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('Fetching staff data...');
        
        // Log the API call details
        console.log('Calling staffApi.getStaffMembers()');
        const response = await staffApi.getStaffMembers();
        console.log('Staff API Response:', response);
        
        // Log the response structure
        console.log('Response data type:', typeof response?.data);
        console.log('Response data keys:', response?.data ? Object.keys(response.data) : 'No data');
        
        // Handle different response formats
        let staffData = [];
        if (Array.isArray(response?.data)) {
          staffData = response.data;
        } else if (response?.data?.results) {
          // Handle paginated response
          staffData = response.data.results;
        } else if (response?.data) {
          // If data exists but isn't an array, wrap it in an array
          staffData = [response.data];
        }
        
        console.log('Processed staff data:', staffData);
        // Save to localStorage for persistence
        localStorage.setItem('staffData', JSON.stringify(staffData || []));
        setStaff(staffData || []);
      } catch (err) {
        console.error('Error fetching staff:', err);
        const errorMessage = err.response?.data?.detail || err.response?.data?.error || err.message || 'Failed to load staff data';
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchStaff();
  }, []);
  const [editedStaff, setEditedStaff] = useState({
    first_name: '',
    last_name: '',
    email: '',
    role: 'WAITER',
    position: '',
    salary: '',
    phone_number: '',
    address: '',
    hire_date: new Date().toISOString().split('T')[0],
    is_active: true
  });

  // Ensure we always have an array for rendering, even if something went wrong
  const displayStaff = Array.isArray(filteredStaff) ? filteredStaff : [];
  
  // Debug logs
  useEffect(() => {
    console.log('Rendering with staff data:', {
      staff,
      filteredStaff,
      displayStaff,
      activeRole,
      isStaffArray: Array.isArray(staff),
      isFilteredStaffArray: Array.isArray(filteredStaff)
    });
  }, [staff, filteredStaff, activeRole]);

  // Handle form input changes for new staff
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewStaff((prev) => ({ ...prev, [name]: value }));
  };

  // Handle form input changes for edited staff
  const handleEditInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSelectedStaff({
      ...selectedStaff,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  // Handle add staff submission
  const handleAddStaff = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const response = await staffApi.createStaffMember(newStaff);
      setStaff([...staff, response.data]);
      setIsAddStaffOpen(false);
      setNewStaff({
        first_name: '',
        last_name: '',
        email: '',
        role: 'WAITER',
        position: 'Waiter',
        salary: '',
        phone_number: '',
        address: '',
        hire_date: new Date().toISOString().split('T')[0],
        is_active: true
      });
      toast.success('Staff member added successfully');
    } catch (err) {
      console.error('Error adding staff:', err);
      toast.error(err.response?.data?.error || 'Failed to add staff member');
    } finally {
      setLoading(false);
    }
  };

  // Handle edit staff submission
  const handleEditStaff = async (e) => {
    e.preventDefault();
    if (!selectedStaff) return;
    
    try {
      setLoading(true);
      const { id, ...updateData } = selectedStaff;
      const response = await staffApi.updateStaffMember(id, updateData);
      
      setStaff(staff.map(staff => 
        staff.id === selectedStaff.id ? response.data : staff
      ));
      
      setIsEditStaffOpen(false);
      setSelectedStaff(null);
      toast.success('Staff member updated successfully');
    } catch (err) {
      console.error('Error updating staff:', err);
      toast.error(err.response?.data?.error || 'Failed to update staff member');
    } finally {
      setLoading(false);
    }
  };

  // Handle delete confirmation
  const handleDeleteStaff = async () => {
    if (!selectedStaff) return;
    
    try {
      setLoading(true);
      await staffApi.deleteStaffMember(selectedStaff.id);
      
      setStaff(staff.filter(staff => staff.id !== selectedStaff.id));
      setIsDeleteConfirmOpen(false);
      setSelectedStaff(null);
      toast.success('Staff member deleted successfully');
    } catch (err) {
      console.error('Error deleting staff:', err);
      toast.error(err.response?.data?.error || 'Failed to delete staff member');
    } finally {
      setLoading(false);
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

          {/* Loading state */}
          {loading && (
            <div className="p-4 text-center text-gray-500">
              Loading staff data...
            </div>
          )}
          
          {/* Error state */}
          {error && !loading && (
            <div className="p-4 text-center text-red-500">
              Error: {error}
              <button 
                onClick={fetchStaff}
                className="ml-2 px-3 py-1 bg-gray-100 rounded hover:bg-gray-200"
              >
                Retry
              </button>
            </div>
          )}
          
          {/* Empty state */}
          {!loading && !error && displayStaff.length === 0 && (
            <div className="p-4 text-center text-gray-500">
              No staff members found
            </div>
          )}
          
          {/* Staff rows */}
          {!loading && !error && displayStaff.length > 0 && displayStaff.map((staffMember) => (
            <div
              key={staffMember.id}
              className="grid grid-cols-6 gap-4 items-center p-4 border-b border-gray-200 last:border-b-0"
            >
              <div className="col-span-2 flex items-center space-x-4">
                <span className="font-medium text-gray-800">{`${staffMember.first_name || ''} ${staffMember.last_name || ''}`.trim()}</span>
              </div>
              <div className="text-gray-600">{staffMember.role}</div>
              <div>
                <span className={staffMember.is_active ? 'text-green-500' : 'text-red-500'} font-medium>
                  {staffMember.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="text-gray-800 font-medium">
                ${parseFloat(staffMember.salary || 0).toFixed(2)}
              </div>
              <div className="flex justify-center space-x-2">
                <button
                  onClick={() => {
                    setSelectedStaff(staffMember);
                    setIsEditStaffOpen(true);
                  }}
                  className="text-green-500 hover:text-green-700 transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => {
                    setSelectedStaff(staffMember);
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">First Name</label>
                    <input
                      type="text"
                      name="first_name"
                      value={newStaff.first_name}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border-2 border-[#5C4033] rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-[#5C4033]"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Last Name</label>
                    <input
                      type="text"
                      name="last_name"
                      value={newStaff.last_name}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border-2 border-[#5C4033] rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-[#5C4033]"
                      required
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
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                    <input
                      type="tel"
                      name="phone_number"
                      value={newStaff.phone_number}
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
                      required
                    >
                      <option value="WAITER">Waiter</option>
                      <option value="CHEF">Chef</option>
                      <option value="MANAGER">Manager</option>
                      <option value="BARTENDER">Bartender</option>
                      <option value="HOST">Host/Hostess</option>
                      <option value="CASHIER">Cashier</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Position</label>
                    <input
                      type="text"
                      name="position"
                      value={newStaff.position}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border-2 border-[#5C4033] rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-[#5C4033]"
                      required
                    />
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
                      min="0"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Hire Date</label>
                    <input
                      type="date"
                      name="hire_date"
                      value={newStaff.hire_date}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border-2 border-[#5C4033] rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-[#5C4033]"
                      required
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Address</label>
                    <textarea
                      name="address"
                      value={newStaff.address}
                      onChange={handleInputChange}
                      rows="2"
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
              <form onSubmit={handleEditStaff} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">First Name</label>
                    <input
                      type="text"
                      name="first_name"
                      value={selectedStaff.first_name || ''}
                      onChange={handleEditInputChange}
                      className="mt-1 block w-full border-2 border-[#5C4033] rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-[#5C4033]"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Last Name</label>
                    <input
                      type="text"
                      name="last_name"
                      value={selectedStaff.last_name || ''}
                      onChange={handleEditInputChange}
                      className="mt-1 block w-full border-2 border-[#5C4033] rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-[#5C4033]"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <input
                      type="email"
                      name="email"
                      value={selectedStaff.email || ''}
                      onChange={handleEditInputChange}
                      className="mt-1 block w-full border-2 border-[#5C4033] rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-[#5C4033]"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                    <input
                      type="tel"
                      name="phone_number"
                      value={selectedStaff.phone_number || ''}
                      onChange={handleEditInputChange}
                      className="mt-1 block w-full border-2 border-[#5C4033] rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-[#5C4033]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Role</label>
                    <select
                      name="role"
                      value={selectedStaff.role || 'WAITER'}
                      onChange={handleEditInputChange}
                      className="mt-1 block w-full border-2 border-[#5C4033] rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-[#5C4033]"
                      required
                    >
                      <option value="WAITER">Waiter</option>
                      <option value="CHEF">Chef</option>
                      <option value="MANAGER">Manager</option>
                      <option value="BARTENDER">Bartender</option>
                      <option value="HOST">Host/Hostess</option>
                      <option value="CASHIER">Cashier</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Position</label>
                    <input
                      type="text"
                      name="position"
                      value={selectedStaff.position || ''}
                      onChange={handleEditInputChange}
                      className="mt-1 block w-full border-2 border-[#5C4033] rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-[#5C4033]"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Salary</label>
                    <input
                      type="number"
                      name="salary"
                      value={selectedStaff.salary || ''}
                      onChange={handleEditInputChange}
                      className="mt-1 block w-full border-2 border-[#5C4033] rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-[#5C4033]"
                      step="0.01"
                      min="0"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Hire Date</label>
                    <input
                      type="date"
                      name="hire_date"
                      value={selectedStaff.hire_date || new Date().toISOString().split('T')[0]}
                      onChange={handleEditInputChange}
                      className="mt-1 block w-full border-2 border-[#5C4033] rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-[#5C4033]"
                      required
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Address</label>
                    <textarea
                      name="address"
                      value={selectedStaff.address || ''}
                      onChange={handleEditInputChange}
                      rows="2"
                      className="mt-1 block w-full border-2 border-[#5C4033] rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-[#5C4033]"
                    />
                  </div>
                  <div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        name="is_active"
                        checked={selectedStaff.is_active || false}
                        onChange={(e) =>
                          setSelectedStaff({
                            ...selectedStaff,
                            is_active: e.target.checked,
                          })
                        }
                        className="rounded border-[#5C4033] text-[#5C4033] focus:ring-[#5C4033]"
                      />
                      <span className="ml-2 text-sm text-gray-700">Active</span>
                    </label>
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