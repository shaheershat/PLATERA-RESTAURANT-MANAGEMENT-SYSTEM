import { useState, useEffect, useCallback } from 'react';
import { staffApi } from '../services/api';
import { toast } from 'react-toastify';

export function useStaffData() {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeRole, setActiveRole] = useState('All');

  // Fetch staff data
  const fetchStaff = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await staffApi.getStaffMembers();
      const staffData = Array.isArray(response?.data) 
        ? response.data 
        : Array.isArray(response?.data?.results) 
          ? response.data.results 
          : [];
      
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

  // Update staff member
  const updateStaff = async (id, staffData) => {
    try {
      const response = await staffApi.updateStaffMember(id, staffData);
      await fetchStaff(); // Refresh the list
      return response;
    } catch (error) {
      console.error('Error updating staff:', error);
      throw error;
    }
  };

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
    filteredStaff,
    loading,
    error,
    activeRole,
    setActiveRole,
    addStaff,
    updateStaff,
    deleteStaff,
    refresh: fetchStaff
  };
}

export default useStaffData;
