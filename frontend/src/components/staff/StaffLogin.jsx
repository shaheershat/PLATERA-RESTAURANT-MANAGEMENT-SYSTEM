import React, { useState } from "react";

const StaffLogin = () => {
  const [code, setCode] = useState("");

  const handleNumberClick = (num) => {
    setCode(code + num);
  };

  const handleBackspace = () => {
    setCode(code.slice(0, -1));
  };

  return (
    <div
      className="h-screen w-screen flex justify-center items-center bg-cover bg-center"
      style={{ backgroundImage: "url('/staff-login-bg.jpg')" }} // save background in public/
    >
      <div className="bg-black bg-opacity-60 p-8 rounded-2xl text-white w-96">
        <h2 className="text-center text-lg mb-4">Enter Your Employee Code</h2>

        {/* Input Box */}
        <div className="bg-gray-800 rounded-md p-3 text-center text-xl tracking-widest mb-6">
          {code || "••••"}
        </div>

        {/* Number Pad */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, ".", 0].map((num, i) => (
            <button
              key={i}
              onClick={() => handleNumberClick(num.toString())}
              className="bg-gray-200 text-black p-4 rounded-lg font-semibold hover:bg-gray-300"
            >
              {num}
            </button>
          ))}

          {/* Backspace Button */}
          <button
            onClick={handleBackspace}
            className="bg-gray-500 text-white p-4 rounded-lg font-bold hover:bg-gray-600"
          >
            ⌫
          </button>
        </div>

        {/* Buttons */}
        <button className="w-full bg-teal-600 hover:bg-teal-700 p-3 rounded-lg font-semibold mb-3">
          Login
        </button>
        <div className="flex gap-3">
          <button className="flex-1 bg-gray-700 hover:bg-gray-800 p-3 rounded-lg font-semibold">
            Clock In
          </button>
          <button className="flex-1 bg-gray-700 hover:bg-gray-800 p-3 rounded-lg font-semibold">
            Clock Out
          </button>
        </div>
      </div>
    </div>
  );
};

export default StaffLogin;
