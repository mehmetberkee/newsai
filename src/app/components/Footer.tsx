import React from "react";

function Footer() {
  return (
    <footer className="bg-white py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="flex flex-col gap-4 items-start">
            <img src="/logo.svg" alt="N3WS Logo" className="h-8" />
            <div className="flex gap-4">
              <a href="#" aria-label="Twitter">
                <img src="/x.svg" alt="" className="h-6 w-6" />
              </a>
              <a href="#" aria-label="Instagram">
                <img src="/instagram.svg" alt="" className="h-6 w-6" />
              </a>
              <a href="#" aria-label="YouTube">
                <img src="/youtube.svg" alt="" className="h-6 w-6" />
              </a>
              <a href="#" aria-label="LinkedIn">
                <img src="/linkedin.svg" alt="" className="h-6 w-6" />
              </a>
            </div>
          </div>

          {/* Company */}
          <div>
            <h3 className="font-bold mb-4">Company</h3>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-gray-600 hover:text-gray-900">
                  About
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-600 hover:text-gray-900">
                  Contact
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-600 hover:text-gray-900">
                  Media
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-600 hover:text-gray-900">
                  Updates
                </a>
              </li>
            </ul>
          </div>

          {/* Product */}
          <div>
            <h3 className="font-bold mb-4">Product</h3>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-gray-600 hover:text-gray-900">
                  Overview
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-600 hover:text-gray-900">
                  How it works
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-600 hover:text-gray-900">
                  How to search
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-600 hover:text-gray-900">
                  Support
                </a>
              </li>
            </ul>
          </div>

          {/* Download App */}
          <div>
            <h3 className="font-bold mb-4 text-center">
              Download the N3WS app
            </h3>
            <div className="flex flex-col items-center gap-3">
              <a href="#">
                <img
                  src="/appstore.svg"
                  alt="Download on App Store"
                  className="h-10"
                />
              </a>
              <a href="#">
                <img
                  src="/googleplay.svg"
                  alt="Get it on Google Play"
                  className="h-10"
                />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
