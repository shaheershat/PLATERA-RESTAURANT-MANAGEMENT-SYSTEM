// frontend/src/components/Layout.js
import React from 'react';
import { Outlet } from 'react-router-dom';
import ManagerSidebar from './Sidebar'; // Import the manager sidebar

const Layout = () => {
  return (
    // min-h-screen sets the minimum height of the main container to the screen height.
    // The flex class enables a flexbox layout, arranging the sidebar and content side-by-side.
    <div className="flex min-h-screen bg-gray-100 ">
      {/* This layout will always use the ManagerSidebar */}
      <ManagerSidebar /> 
      <div className="flex-1 flex flex-col">
        <main className="flex-1 p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;