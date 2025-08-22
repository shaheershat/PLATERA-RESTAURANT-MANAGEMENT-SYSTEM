import { useState, useEffect, useMemo } from 'react';
import { staffApi } from '../../services/api';
import { toast } from 'react-toastify';

type ChangeEvent = React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>;
type FormEvent = React.FormEvent<HTMLFormElement>;

interface StaffMember {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  position: string;
  salary: number;
  phone_number: string;
  address: string;
  hire_date: string;
  is_active: boolean;
  [key: string]: any; // Add index signature to allow dynamic property access
}

const ManagerStaffs: React.FC = () => {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeRole, setActiveRole] = useState<string>('All');
  const [isAddStaffOpen, setIsAddStaffOpen] = useState<boolean>(false);
  const [isEditStaffOpen, setIsEditStaffOpen] = useState<boolean>(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState<boolean>(false);
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  interface StaffFormData {
    first_name: string;
    last_name: string;
    email: string;
    username: string;
    password: string;
    password2: string;
    position: string;
    salary: string | number;
    hire_date: string;
    phone_number: string;
    address: string;
    is_active: boolean;
    role?: string; // Add optional role field
  }

  const [newStaff, setNewStaff] = useState<StaffFormData>({
    first_name: '',
    last_name: '',
    email: '',
    username: '',
    password: '',
    password2: '',
    position: 'Waiter',
    salary: '',
    hire_date: new Date().toISOString().split('T')[0],
    phone_number: '',
    address: '',
    is_active: true
  });

  // Fetch staff data
  useEffect(() => {
    const fetchStaff = async () => {
      try {
        setLoading(true);
        const response = await staffApi.getStaffMembers();
        setStaff(response.data);
      } catch (err) {
        console.error('Error fetching staff:', err);
        setError('Failed to load staff data');
        toast.error('Failed to load staff data');
      } finally {
        setLoading(false);
      }
    };

    fetchStaff();
  }, []);

  // Filter staff based on active role - ensure it's always an array
  const filteredStaff = useMemo(() => {
    try {
      // Ensure staff is an array
      const staffArray = Array.isArray(staff) ? staff : [];
      
      // If no role is selected or 'All' is selected, return all staff
      if (!activeRole || activeRole === 'All') {
        return [...staffArray];
      }
      
      // Filter by role with case-insensitive comparison
      return staffArray.filter(member => {
        if (!member || !member.role) return false;
        return member.role.toString().toLowerCase() === activeRole.toString().toLowerCase();
      });
    } catch (error) {
      console.error('Error filtering staff:', error);
      return [];
    }
  }, [staff, activeRole]);

  // Handle input changes for new staff
  const handleInputChange = (e: ChangeEvent) => {
    const { name, value, type } = e.target as HTMLInputElement;
    setNewStaff(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }));
  };

  // Handle input changes for editing staff
  const handleEditInputChange = (e: ChangeEvent) => {
    if (!selectedStaff) return;
    
    const { name, value, type } = e.target as HTMLInputElement;
    setSelectedStaff({
      ...selectedStaff,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    });
  };

  // Handle checkbox changes
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target as HTMLInputElement;
    if (name === 'is_active' && selectedStaff) {
      setSelectedStaff({
        ...selectedStaff,
        [name]: checked
      });
    }
  };

  // Add new staff member
  const handleAddStaff = async (e: FormEvent) => {
    e.preventDefault();
    
    // Check if passwords match
    if (newStaff.password !== newStaff.password2) {
      toast.error('Passwords do not match');
      return;
    }

    try {
      setLoading(true);
      
      // Prepare staff data for the API
      const staffData = {
        username: newStaff.username || newStaff.email.split('@')[0],
        email: newStaff.email,
        password: newStaff.password,
        password2: newStaff.password2,
        first_name: newStaff.first_name,
        last_name: newStaff.last_name,
        phone_number: newStaff.phone_number,
        address: newStaff.address,
        position: newStaff.position,
        salary: typeof newStaff.salary === 'string' ? parseFloat(newStaff.salary) || 0 : newStaff.salary,
        hire_date: newStaff.hire_date
      };
      
      // Create the staff member
      try {
        await staffApi.createStaffMember(staffData);
        
        // Refresh the staff list
        const staffResponse = await staffApi.getStaffMembers();
        setStaff(staffResponse.data);
        
        // Reset the form
        setIsAddStaffOpen(false);
        setNewStaff({
          first_name: '',
          last_name: '',
          email: '',
          username: '',
          password: '',
          password2: '',
          position: 'Waiter',
          salary: 0,
          phone_number: '',
          address: '',
          hire_date: new Date().toISOString().split('T')[0],
          is_active: true
        });
        
        toast.success('Staff member added successfully');
      } catch (err: any) {
        // Handle validation errors from the backend
        if (err.response?.data) {
          const errorData = err.response.data;
          
          // Handle specific field errors
          if (errorData.email) {
            // Email already exists
            toast.error('A user with this email already exists. Please use a different email address.');
          } else if (errorData.username) {
            // Username already exists
            toast.error('This username is already taken. Please choose a different one.');
          } else if (errorData.error) {
            // General error message
            toast.error(errorData.error);
          } else if (typeof errorData === 'object') {
            // Handle other field-specific errors
            const errorMessages = Object.entries(errorData).map(([field, errors]) => {
              if (Array.isArray(errors)) {
                return `${field}: ${errors.join(', ')}`;
              }
              return `${field}: ${errors}`;
            });
            toast.error(errorMessages.join('\n'));
          } else {
            // Fallback error message
            toast.error('Failed to add staff member. Please check the form for errors.');
          }
        } else {
          // Network or other errors
          toast.error(err.message || 'Failed to connect to the server. Please try again.');
        }
        throw err; // Re-throw to be caught by the outer catch
      }
    } catch (err: any) {
      console.error('Error adding staff:', err);
      const errorMessage = err.response?.data?.error || 
                         Object.values(err.response?.data || {}).flat().join(' ') || 
                         'Failed to add staff member';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Update staff member
  const handleEditStaff = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedStaff) return;
    
    try {
      setLoading(true);
      const { id, ...updateData } = selectedStaff;
      const response = await staffApi.updateStaffMember(id, updateData);
      
      setStaff(staff.map(staffMember => 
        staffMember.id === selectedStaff.id ? response.data : staffMember
      ));
      
      setIsEditStaffOpen(false);
      setSelectedStaff(null);
      toast.success('Staff member updated successfully');
    } catch (err: any) {
      console.error('Error updating staff:', err);
      toast.error(err.response?.data?.error || 'Failed to update staff member');
    } finally {
      setLoading(false);
    }
  };

  // Delete staff member
  const handleDeleteStaff = async () => {
    if (!selectedStaff) return;
    
    try {
      setLoading(true);
      await staffApi.deleteStaffMember(selectedStaff.id);
      setStaff(staff.filter(staffMember => staffMember.id !== selectedStaff.id));
      setIsDeleteConfirmOpen(false);
      setSelectedStaff(null);
      toast.success('Staff member deleted successfully');
    } catch (err: any) {
      console.error('Error deleting staff:', err);
      toast.error(err.response?.data?.error || 'Failed to delete staff member');
    } finally {
      setLoading(false);
    }
  };

  // Open edit modal
  const handleEditClick = (staffMember: StaffMember) => {
    setSelectedStaff({ ...staffMember });
    setIsEditStaffOpen(true);
  };

  // Open delete confirmation
  const handleDeleteClick = (staffMember: StaffMember) => {
    setSelectedStaff(staffMember);
    setIsDeleteConfirmOpen(true);
  };

  // Loading state
  if (loading && staff.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen" key="loading">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#5C4033]"></div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-[#5C4033]">Staff Management</h1>
        <button
          onClick={() => setIsAddStaffOpen(true)}
          className="bg-[#5C4033] text-white px-4 py-2 rounded-lg hover:bg-[#4A3226] transition-colors"
        >
          Add Staff
        </button>
      </div>

      {/* Role Filter */}
      <div className="flex space-x-2 mb-6 overflow-x-auto pb-2">
        {['All', 'WAITER', 'CHEF', 'MANAGER', 'BARTENDER', 'HOST', 'CASHIER'].map((role) => (
          <button
            key={role}
            onClick={() => setActiveRole(role)}
            className={`px-4 py-2 rounded-lg whitespace-nowrap ${
              activeRole === role
                ? 'bg-[#5C4033] text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {role}
          </button>
        ))}
      </div>

      {/* Staff Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Position
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Salary
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {/* Loading state */}
              {loading && (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                    Loading staff data...
                  </td>
                </tr>
              )}
              
              {/* Error state */}
              {error && !loading && (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-red-500">
                    Error: {error}
                    <button 
                      onClick={() => window.location.reload()}
                      className="ml-2 px-3 py-1 bg-gray-100 rounded hover:bg-gray-200"
                    >
                      Retry
                    </button>
                  </td>
                </tr>
              )}
              
              {/* Empty state */}
              {!loading && !error && (!Array.isArray(filteredStaff) || filteredStaff.length === 0) && (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                    No staff members found
                  </td>
                </tr>
              )}
              
              {/* Staff rows */}
              {!loading && !error && Array.isArray(filteredStaff) && filteredStaff.length > 0 && filteredStaff.map((staffMember) => (
                <tr key={staffMember.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                        <span className="text-gray-600 font-medium">
                          {`${staffMember.first_name?.[0] || ''}${staffMember.last_name?.[0] || ''}`.toUpperCase() || 'U'}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {`${staffMember.first_name || ''} ${staffMember.last_name || ''}`.trim()}
                        </div>
                        <div className="text-sm text-gray-500">{staffMember.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{staffMember.position || 'N/A'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      staffMember.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {staffMember.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${staffMember.salary.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleEditClick(staffMember)}
                      className="text-indigo-600 hover:text-indigo-900 mr-4"
                      disabled={loading}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteClick(staffMember)}
                      className="text-red-600 hover:text-red-900"
                      disabled={loading}
                    >
                      {loading ? 'Deleting...' : 'Delete'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Staff Modal */}
      {isAddStaffOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4 text-[#5C4033]">Add New Staff Member</h2>
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
                  <label className="block text-sm font-medium text-gray-700">Email *</label>
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
                  <label className="block text-sm font-medium text-gray-700">Username *</label>
                  <input
                    type="text"
                    name="username"
                    value={newStaff.username}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border-2 border-[#5C4033] rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-[#5C4033]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Password *</label>
                  <input
                    type="password"
                    name="password"
                    value={newStaff.password}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border-2 border-[#5C4033] rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-[#5C4033]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Confirm Password *</label>
                  <input
                    type="password"
                    name="password2"
                    value={newStaff.password2}
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
                    name="position"
                    value={newStaff.position}
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
                    rows={2}
                    className="mt-1 block w-full border-2 border-[#5C4033] rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-[#5C4033]"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-4 mt-6">
                <button
                  type="button"
                  onClick={() => setIsAddStaffOpen(false)}
                  className="px-4 py-2 bg-gray-200 rounded-lg border-2 border-[#5C4033] text-[#5C4033] hover:bg-gray-300 transition-colors"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#5C4033] text-white rounded-lg hover:bg-[#4A3226] transition-colors"
                  disabled={loading}
                >
                  {loading ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Staff Modal */}
      {isEditStaffOpen && selectedStaff && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4 text-[#5C4033]">
              Edit Staff: {selectedStaff.first_name} {selectedStaff.last_name}
            </h2>
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
                    rows={2}
                    className="mt-1 block w-full border-2 border-[#5C4033] rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-[#5C4033]"
                  />
                </div>
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="is_active"
                      checked={selectedStaff.is_active || false}
                      onChange={handleCheckboxChange}
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
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#5C4033] text-white rounded-lg hover:bg-[#4A3226] transition-colors"
                  disabled={loading}
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteConfirmOpen && selectedStaff && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96">
            <h2 className="text-xl font-semibold mb-4 text-[#5C4033]">Confirm Delete</h2>
            <p className="mb-6">
              Are you sure you want to delete {selectedStaff.first_name} {selectedStaff.last_name}? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setIsDeleteConfirmOpen(false)}
                className="px-4 py-2 bg-gray-200 rounded-lg border-2 border-[#5C4033] text-[#5C4033] hover:bg-gray-300 transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteStaff}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                disabled={loading}
              >
                {loading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagerStaffs;
