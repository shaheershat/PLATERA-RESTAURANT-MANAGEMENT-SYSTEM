import React from "react";

const ManagerLogin = () => {
  return (
    <div className="flex h-screen">
      {/* Left side - Form */}
      <div className="w-1/2 flex flex-col justify-center items-center bg-gray-900 text-white">
        <h1 className="text-4xl font-semibold mb-8">LOGIN</h1>
        <input
          type="text"
          placeholder="Username"
          className="mb-4 p-3 w-3/4 rounded bg-gray-800 border border-gray-700 placeholder-gray-400"
        />
        <input
          type="password"
          placeholder="Password"
          className="mb-6 p-3 w-3/4 rounded bg-gray-800 border border-gray-700 placeholder-gray-400"
        />
        <button className="w-3/4 bg-gray-800 hover:bg-gray-700 p-3 rounded font-semibold">
          Login
        </button>
      </div>

      {/* Right side - Image */}
      <div className="w-1/2">
        <img
          src="/manager-login.jpg" // save your image in public folder as manager-login.jpg
          alt="Manager Login"
          className="h-full w-full object-cover"
        />
      </div>
    </div>
  );
};

export default ManagerLogin;
