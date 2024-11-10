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
      <nav className="flex items-center justify-between gap-8 px-4 py-2 bg-white border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <Link href={"/"}>
            <div className="w-8 h-8 flex items-center justify-center font-bold">
              <img alt="logo" src="/logo.svg" />
            </div>
          </Link>
        </div>
        <input
          type="text"
          placeholder={
            session
              ? "Ask our AI about news topics"
              : "Please login to ask questions"
          }
          className={`w-full rounded-full px-4 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent ${
            !session ? "bg-gray-50 cursor-not-allowed" : ""
          }`}
          onClick={handleInputClick}
          disabled={!session}
        />
        <div className="flex items-center space-x-2 w-[250px] justify-end">
          {status === "loading" ? (
            <div className="h-8 w-8 animate-pulse bg-gray-200 rounded-full" />
          ) : session ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => router.push("/profile")}
                className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-xl hover:bg-gray-200"
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
                className="px-3 py-1.5 bg-red-100 text-red-600 hover:bg-red-200 rounded-xl"
              >
                Logout
              </button>
            </div>
          ) : (
            <>
              <button
                onClick={() => setShowLoginPopup(true)}
                className="px-3 py-1.5 bg-[#E3E3E3] rounded-xl text-gray-600 hover:bg-gray-100"
              >
                Login
              </button>
              <button
                onClick={() => setShowSignupPopup(true)}
                className="px-3 py-1.5 bg-green-600 text-white hover:bg-green-700 rounded-xl"
              >
                Join for free
              </button>
            </>
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
