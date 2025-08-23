import { useState, useEffect, useCallback } from 'react';
import { staffApi } from '../services/api';
import { toast } from 'react-toastify';

export function useStaffData() {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeRole, setActiveRole] = useState('All');

  // Transform staff data to consistent format
  const transformStaffData = (user) => {
    const staffProfile = user.staff_profile || {};
    
    // Get position from either user object or staff_profile, with fallback
    const position = user.position || staffProfile.position || 'Staff';
    
    // Get salary, converting to number if it's a string
    let salary = 0;
    if (user.salary !== undefined) {
      salary = typeof user.salary === 'string' ? parseFloat(user.salary) : user.salary;
    } else if (staffProfile.salary !== undefined) {
      salary = typeof staffProfile.salary === 'string' ? parseFloat(staffProfile.salary) : staffProfile.salary;
    }
    
    // Format hire date
    const hireDate = user.hire_date || staffProfile.hire_date || new Date().toISOString().split('T')[0];
    
    return {
      id: user.id,
      username: user.username || '',
      email: user.email || '',
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      role: user.role || user.user_type || 'STAFF',
      position,
      salary,
      is_active: user.is_active !== undefined ? user.is_active : true,
      hire_date: hireDate,
      phone_number: user.phone_number || staffProfile.phone_number || '',
      address: user.address || staffProfile.address || '',
      staff_profile: staffProfile
    };
  };

  // Fetch staff data
  const fetchStaff = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching staff members...');
      const response = await staffApi.getStaffMembers({ 
        user_type: 'STAFF',
        is_active: true // Only fetch active staff by default
      });
      
      console.log('Raw staff API response:', response);
      
      // Handle different response formats
      let responseData = [];
      if (response?.data?.results) {
        // Paginated response
        responseData = response.data.results;
      } else if (Array.isArray(response?.data)) {
        // Direct array response
        responseData = response.data;
      } else if (Array.isArray(response)) {
        // Raw array response
        responseData = response;
      }
      
      console.log('Processing staff data:', responseData);
      
      // Transform the data to match the expected format
      const staffData = responseData.map(transformStaffData);
      
      console.log('Processed staff data:', staffData);
      setStaff(staffData);
      return staffData;
    } catch (err) {
      console.error('Error fetching staff:', err);
      const errorMessage = err.response?.data?.detail || 
                         err.response?.data?.error || 
                         err.message || 
                         'Failed to load staff data';
      setError(errorMessage);
      toast.error(errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial data load
  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  // Filter staff by active role - ensure we always return an array
  const filteredStaff = useMemo(() => {
    try {
      // Ensure staff is an array
      const staffArray = Array.isArray(staff) ? staff : [];
      
      // If no role is selected or 'All' is selected, return all staff
      if (!activeRole || activeRole === 'All') {
        return [...staffArray];
      }
      
      // Filter by role with case-insensitive comparison
      const filtered = staffArray.filter(member => {
        if (!member || !member.role) return false;
        return member.role.toString().toLowerCase() === activeRole.toString().toLowerCase();
      });
      
      // Ensure we return an array
      return Array.isArray(filtered) ? filtered : [];
    } catch (error) {
      console.error('Error filtering staff:', error);
      return [];
    }
  }, [staff, activeRole]);
  
  // Debug logs
  useEffect(() => {
    console.log('Staff data:', {
      staff,
      activeRole,
      filteredStaff,
      isStaffArray: Array.isArray(staff),
      isFilteredStaffArray: Array.isArray(filteredStaff)
    });
  }, [staff, filteredStaff, activeRole]);

  // Add new staff member
  const addStaff = async (staffData) => {
    try {
      const response = await staffApi.createStaffMember(staffData);
      await fetchStaff(); // Refresh the list
      return response;
    } catch (error) {
      console.error('Error adding staff:', error);
      throw error;
    }
  };

  // Update a single staff member
  const updateStaffMember = useCallback(async (id, updateData) => {
    try {
      setLoading(true);
      const response = await staffApi.updateStaffMember(id, updateData);
      setStaff(prevStaff => {
        return prevStaff.map(staffMember => {
          if (staffMember.id === id) {
            // Merge the existing staff member with the updated data
            return transformStaffData({
              ...staffMember,
              ...response.data,
              staff_profile: {
                ...staffMember.staff_profile,
                ...(response.data.staff_profile || {})
              }
            });
          }
          return staffMember;
        });
      });
      return response.data;
    } catch (error) {
      console.error('Error updating staff member:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Delete staff member
  const deleteStaff = async (id) => {
    try {
      await staffApi.deleteStaffMember(id);
      await fetchStaff(); // Refresh the list
    } catch (error) {
      console.error('Error deleting staff:', error);
      throw error;
    }
  };

  return {
    staff,
    loading,
    error,
    activeRole,
    setActiveRole,
    filteredStaff,
    fetchStaff,
    updateStaffMember,
    deleteStaff,
    addStaff,
    refresh: fetchStaff
  };
}

export default useStaffData;
