import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { authApi as auth } from '../services/api';

const StaffLogin = () => {
  const [staffId, setStaffId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Trim and validate staff ID
    const trimmedId = staffId.trim();
    if (!trimmedId) {
      setError('Please enter a valid staff ID');
      return;
    }

    setError('');
    setLoading(true);

    try {
      console.log('Attempting staff login with ID:', trimmedId);
      
      // Call the staff login API
      const response = await auth.staffLogin(trimmedId);
      console.log('Login response:', response);
      
      if (!response || !response.user) {
        throw new Error('Invalid response from server');
      }
      
      console.log('Login successful, user data:', response.user);
      
      // Ensure tokens are stored in localStorage
      if (response.access) {
        localStorage.setItem('access_token', response.access);
      }
      if (response.refresh) {
        localStorage.setItem('refresh_token', response.refresh);
      }
      
      // Update auth context with user data
      await login(response.user);
      
      // Check for redirect URL in query params
      const searchParams = new URLSearchParams(window.location.search);
      const redirectTo = searchParams.get('redirect') || '/staff/dashboard';
      
      console.log('Redirecting to:', redirectTo);
      navigate(redirectTo);
      
    } catch (error) {
      console.error('Staff login failed:', error);
      
      // Clear any stored tokens on error
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      
      // Handle different error cases
      let errorMessage = 'Failed to log in. Please try again.';
      
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        if (error.response.status === 400 || error.response.status === 401) {
          errorMessage = error.response.data?.error || error.response.data?.staff_id || 'Invalid staff ID or password';
        } else if (error.response.status >= 500) {
          errorMessage = 'Server error. Please try again later.';
        }
      } else if (error.request) {
        // The request was made but no response was received
        errorMessage = 'No response from server. Please check your connection.';
      } else if (error.message) {
        // Something happened in setting up the request
        errorMessage = error.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Staff Login
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enter your staff ID to access your dashboard
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="staff-id" className="sr-only">Staff ID</label>
              <input
                id="staff-id"
                name="staffId"
                type="text"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Staff ID"
                value={staffId}
                onChange={(e) => setStaffId(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
        </form>
        <div className="text-center">
          <button
            onClick={() => navigate('/manager-login')}
            className="text-sm text-indigo-600 hover:text-indigo-500"
          >
            Manager Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default StaffLogin;
