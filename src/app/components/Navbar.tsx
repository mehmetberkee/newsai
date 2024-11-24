"use client";

import React, { useState } from "react";
import Link from "next/link";
import LoginPopup from "./LoginPopup";
import SignupPopup from "./SignupPopup";
import { UserCircleIcon } from "@heroicons/react/24/outline";
import { useSession, signOut } from "next-auth/react";
import Image from "next/image";
import ProfilePopup from "./ProfilePopup";
import { useRouter } from "next/navigation";

const Navbar = () => {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const [showSignupPopup, setShowSignupPopup] = useState(false);
  const [showProfilePopup, setShowProfilePopup] = useState(false);

  const handleInputClick = () => {
    if (!session) {
      setShowLoginPopup(true);
    }
  };

  const handleSwitchToSignup = () => {
    setShowLoginPopup(false);
    setShowSignupPopup(true);
  };

  const handleSwitchToLogin = () => {
    setShowSignupPopup(false);
    setShowLoginPopup(true);
  };

  return (
    <>
      <nav className="flex flex-col sm:flex-row items-center gap-4 sm:gap-8 px-2 sm:px-4 py-2 bg-white border-b border-gray-200">
        <div className="flex items-center w-full justify-between sm:w-auto">
          <Link href={"/"}>
            <div className="w-8 h-8 flex items-center justify-center font-bold">
              <img alt="logo" src="/logo.svg" />
            </div>
          </Link>
          <div className="flex items-center gap-2 sm:hidden">
            {status === "loading" ? (
              <div className="h-8 w-8 animate-pulse bg-gray-200 rounded-full" />
            ) : session ? (
              <div className="flex items-center gap-2 flex-wrap justify-center">
                <button
                  onClick={() => router.push("/profile")}
                  className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-xl hover:bg-gray-200 text-sm"
                >
                  {session.user?.image ? (
                    <img
                      src={session.user.image}
                      alt="Profile"
                      width={20}
                      height={20}
                      className="rounded-full"
                    />
                  ) : (
                    <UserCircleIcon className="h-5 w-5 text-gray-600" />
                  )}
                  <span className="text-sm text-gray-600">
                    {session.user?.name || session.user?.email}
                  </span>
                </button>
                <button
                  onClick={() => signOut()}
                  className="px-3 py-1.5 bg-red-100 text-red-600 hover:bg-red-200 rounded-xl text-sm"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => setShowLoginPopup(true)}
                  className="px-3 py-1.5 bg-[#E3E3E3] rounded-xl text-gray-600 hover:bg-gray-100 text-sm"
                >
                  Login
                </button>
                <button
                  onClick={() => setShowSignupPopup(true)}
                  className="px-3 py-1.5 bg-green-600 text-white hover:bg-green-700 rounded-xl text-sm"
                >
                  Join for free
                </button>
              </div>
            )}
          </div>
        </div>
        <input
          type="text"
          placeholder={
            session
              ? "Ask our AI about news topics"
              : "Please login to ask questions"
          }
          className={`hidden sm:block w-full rounded-full px-4 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent ${
            !session ? "bg-gray-50 cursor-not-allowed" : ""
          }`}
          onClick={handleInputClick}
          disabled={!session}
        />
        <div className="hidden sm:flex items-center space-x-2 w-full sm:w-[250px] justify-center sm:justify-end">
          {status === "loading" ? (
            <div className="h-8 w-8 animate-pulse bg-gray-200 rounded-full" />
          ) : session ? (
            <div className="flex items-center gap-2 flex-wrap justify-center">
              <button
                onClick={() => router.push("/profile")}
                className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-xl hover:bg-gray-200 text-sm"
              >
                {session.user?.image ? (
                  <img
                    src={session.user.image}
                    alt="Profile"
                    width={20}
                    height={20}
                    className="rounded-full"
                  />
                ) : (
                  <UserCircleIcon className="h-5 w-5 text-gray-600" />
                )}
                <span className="text-sm text-gray-600">
                  {session.user?.name || session.user?.email}
                </span>
              </button>
              <button
                onClick={() => signOut()}
                className="px-3 py-1.5 bg-red-100 text-red-600 hover:bg-red-200 rounded-xl text-sm"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="flex gap-2 flex-wrap justify-center">
              <button
                onClick={() => setShowLoginPopup(true)}
                className="px-3 py-1.5 bg-[#E3E3E3] rounded-xl text-gray-600 hover:bg-gray-100 text-sm"
              >
                Login
              </button>
              <button
                onClick={() => setShowSignupPopup(true)}
                className="px-3 py-1.5 bg-green-600 text-white hover:bg-green-700 rounded-xl text-sm"
              >
                Join for free
              </button>
            </div>
          )}
        </div>
      </nav>

      {showLoginPopup && (
        <LoginPopup
          onClose={() => setShowLoginPopup(false)}
          onSwitchToSignup={handleSwitchToSignup}
        />
      )}

      {showSignupPopup && (
        <SignupPopup
          onClose={() => setShowSignupPopup(false)}
          onSwitchToLogin={handleSwitchToLogin}
        />
      )}

      {showProfilePopup && (
        <ProfilePopup onClose={() => setShowProfilePopup(false)} />
      )}
    </>
  );
};

export default Navbar;
