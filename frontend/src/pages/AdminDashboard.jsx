import React, { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
// FiMenu is not currently used
import { useAuth } from '../contexts/AuthContext';
import Sidebar from '../components/manager/Sidebar';

const AdminDashboard = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/admin/login');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar onNavigate={() => {}} />
      <div className="flex-1 overflow-auto">
        <Outlet />
      </div>
    </div>
  );
};

export default AdminDashboard;
