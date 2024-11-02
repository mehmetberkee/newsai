import React from "react";

const Navbar = () => {
  return (
    <nav className="flex items-center justify-between gap-8 px-4 py-2 bg-white border-b border-gray-200">
      <div className="flex items-center space-x-2">
        <div className="w-8 h-8 flex items-center justify-center font-bold">
          <img alt="logo" src="/logo.svg" />
        </div>
      </div>
      <input
        type="text"
        placeholder="Ask our AI about news topics"
        className="w-full rounded-full px-4 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
      />
      <div className="flex items-center space-x-2 w-[250px] justify-end">
        <button className="px-3 py-1.5 bg-[#E3E3E3] rounded-xl text-gray-600 hover:bg-gray-100">
          Login
        </button>
        <button className="px-3 py-1.5 bg-green-600 text-white hover:bg-green-700 rounded-xl">
          Join for free
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
