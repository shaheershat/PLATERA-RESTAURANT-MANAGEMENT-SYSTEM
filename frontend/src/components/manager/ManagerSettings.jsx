import React, { useState } from 'react';

// Reusable component for form fields
const FormField = ({ label, type = 'text', value, onChange, placeholder = '', disabled = false, error }) => (
  <div className="w-full">
    <label className="block text-gray-700 text-sm font-semibold mb-2">{label}</label>
    <input
      type={type}
      className={`w-full px-4 py-2 border rounded-xl bg-white border-gray-300 focus:outline-none focus:border-orange-500 transition-colors duration-200 ${
        disabled ? 'bg-gray-100' : ''
      } ${error ? 'border-red-500' : ''}`}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
    />
    {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
  </div>
);

// Custom Modal component to replace alert()
const CustomModal = ({ message, onClose }) => {
  if (!message) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-80 text-center">
        <h3 className="text-lg font-semibold mb-4">Notification</h3>
        <p className="mb-6">{message}</p>
        <button
          onClick={onClose}
          className="px-4 py-2 bg-[#EB5757] text-white rounded-md hover:bg-red-600 transition-colors"
        >
          OK
        </button>
      </div>
    </div>
  );
};

// Main Settings Page Component
const SettingsPage = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [data, setData] = useState({
    firstName: 'Saul',
    lastName: 'Goodmate',
    email: 'saulanan@gmail.com',
    phone: '1234567890',
    dob: '23-12-2025',
    position: 'Manager',
    username: 'Saulanan',
    password: '********',
  });
  const [errors, setErrors] = useState({});
  const [modalMessage, setModalMessage] = useState('');

  // Handle field changes
  const handleChange = (field, value) => {
    setData((prev) => ({
      ...prev,
      [field]: value,
    }));
    setErrors((prev) => ({
      ...prev,
      [field]: '',
    }));
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};
    if (!data.firstName) newErrors.firstName = 'First Name is required';
    if (!data.email) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) newErrors.email = 'Invalid email format';
    if (!data.phone) newErrors.phone = 'Phone is required';
    else if (!/^\d{10}$/.test(data.phone)) newErrors.phone = 'Invalid phone number';
    if (!data.username) newErrors.username = 'Username is required';
    if (data.password && data.password.length < 8) newErrors.password = 'Password must be at least 8 characters';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle save
  const handleSave = () => {
    if (validateForm()) {
      setIsEditing(false);
      setModalMessage(`Changes saved successfully!`);
    } else {
      setModalMessage('Please correct the errors in the form.');
    }
  };

  const handleLogout = () => {
    setModalMessage('You have been logged out!');
  };

  return (
    <div className="font-inter bg-gray-100 flex flex-col ">
      {/* Top Header */}
      <header className="p-2 flex items-center space-x-4">
        <h1 className="text-3xl font-semibold text-gray-800">Settings</h1>
      </header>

      <div className="flex-grow flex p-8 gap-8">
        {/* Left Panel - Sidebar */}
        <div className="bg-white p-6 rounded-xl border-black border-2 w-[600px] flex-shrink-0 flex flex-col">
          <div className="flex flex-col items-center text-center mb-8">
            <div className="relative mb-4">
              <img
                src="https://placehold.co/120x120/5C4033/FFFFFF?text=Saul"
                alt="Profile"
                className="w-60 h-60 rounded-full mb-8 object-cover border-4 border-gray-200"
              />
              <button
                className="absolute bottom-2 right-2 p-2 bg-[#EB5757] rounded-full shadow-lg"
                onClick={() => setModalMessage('Change profile picture')}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                  />
                </svg>
              </button>
            </div>
            <h3 className="text-xl font-medium text-gray-800">{data.firstName} {data.lastName}</h3>
            <p className="text-gray-500 mb-[50px] text-sm">{data.position}</p>
          </div>
          <div className="mt-[100px] text-center">
            <button
              className="text-[#EB5757] font-semibold text-lg hover:text-red-600 transition-colors duration-200"
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>
        </div>

        {/* Right Panel - Dynamic Content */}
        <div className="flex-1 flex flex-col gap-y-4">
          <div className="bg-white p-8 rounded-xl w-full max-w-4xl">
            <h2 className="text-2xl font-bold text-gray-800 mb-8">Personal Information & Login Credentials</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              <FormField
                label="First Name"
                value={data.firstName}
                onChange={(e) => handleChange('firstName', e.target.value)}
                disabled={!isEditing}
                error={errors.firstName}
              />
              <FormField
                label="Last Name"
                value={data.lastName}
                onChange={(e) => handleChange('lastName', e.target.value)}
                disabled={!isEditing}
                error={errors.lastName}
              />
              <FormField
                label="Email"
                value={data.email}
                onChange={(e) => handleChange('email', e.target.value)}
                disabled={!isEditing}
                error={errors.email}
              />
              <FormField
                label="Phone Number"
                value={data.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                disabled={!isEditing}
                error={errors.phone}
              />
              <FormField
                label="DOB"
                value={data.dob}
                onChange={(e) => handleChange('dob', e.target.value)}
                disabled={!isEditing}
                error={errors.dob}
              />
              <FormField
                label="Position"
                value={data.position}
                onChange={(e) => handleChange('position', e.target.value)}
                disabled={!isEditing}
                error={errors.position}
              />
            </div>
            
            <h3 className="text-xl font-bold text-gray-800 my-6">Login & Password</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              <FormField
                label="Username"
                value={data.username}
                onChange={(e) => handleChange('username', e.target.value)}
                disabled={!isEditing}
                error={errors.username}
              />
              <FormField
                label="Password"
                type="password"
                value={data.password}
                onChange={(e) => handleChange('password', e.target.value)}
                disabled={!isEditing}
                error={errors.password}
                placeholder="Enter new password"
              />
            </div>
          </div>
          <div className="mt-auto flex justify-end w-full">
            {isEditing ? (
              <button
                className="px-8 py-3 bg-[#EB5757] text-white font-medium rounded-full shadow-md hover:bg-red-600 transition-colors duration-200"
                onClick={handleSave}
              >
                Save Changes
              </button>
            ) : (
              <button
                className="px-8 py-3 bg-[#EB5757] text-white font-medium rounded-full shadow-md hover:bg-red-600 transition-colors duration-200"
                onClick={() => setIsEditing(true)}
              >
                Edit Settings
              </button>
            )}
          </div>
        </div>
      </div>
      <CustomModal message={modalMessage} onClose={() => setModalMessage('')} />
    </div>
  );
};

// Main App component for demonstration
const App = () => {
    return (
        <SettingsPage />
    )
}

export default App;
