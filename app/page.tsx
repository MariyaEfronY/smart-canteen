"use client";

import Link from "next/link";
import { useState } from "react";

export default function Home() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="text-center px-4 sm:px-6 lg:px-8">
      {/* Mobile Header with Burger Menu */}
      <div className="sm:hidden fixed top-0 left-0 right-0 bg-white shadow-md z-50">
        <div className="flex justify-between items-center p-4">
          <h1 className="text-xl font-bold text-green-600">Campus Canteen</h1>
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 rounded-md text-gray-600 hover:text-green-600 hover:bg-gray-100 transition-colors"
            aria-label="Toggle menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu Dropdown */}
        {isMenuOpen && (
          <div className="absolute top-full left-0 right-0 bg-white shadow-lg border-t border-gray-200">
            <div className="flex flex-col p-4 space-y-3">
              <Link 
                href="/signup" 
                className="bg-green-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors duration-200 text-center"
                onClick={() => setIsMenuOpen(false)}
              >
                Get Started
              </Link>
              <Link 
                href="/login" 
                className="bg-white text-green-600 border border-green-600 px-4 py-3 rounded-lg font-semibold hover:bg-green-50 transition-colors duration-200 text-center"
                onClick={() => setIsMenuOpen(false)}
              >
                Sign In
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Main Content with adjusted padding for mobile header */}
      <div className="max-w-4xl mx-auto pt-16 sm:pt-0">
        {/* Header Section */}
        <div className="pt-8 pb-6 md:pt-12 md:pb-8">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4 md:mb-6">
            Welcome to <span className="text-green-600">Campus Canteen</span> 🍕
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-gray-600 mb-6 md:mb-8 max-w-2xl mx-auto leading-relaxed">
            Discover delicious meals, order with ease, and enjoy campus dining like never before. 
            Browse our menu, place orders, and track your food in real-time.
          </p>
        </div>
        
        {/* Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-12">
          <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md border border-gray-200">
            <div className="text-2xl sm:text-3xl mb-3 sm:mb-4">🍔</div>
            <h3 className="text-base sm:text-lg font-semibold mb-2">Wide Menu Selection</h3>
            <p className="text-sm sm:text-base text-gray-600">Choose from a variety of delicious meals and snacks</p>
          </div>
          
          <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md border border-gray-200">
            <div className="text-2xl sm:text-3xl mb-3 sm:mb-4">⚡</div>
            <h3 className="text-base sm:text-lg font-semibold mb-2">Quick Ordering</h3>
            <p className="text-sm sm:text-base text-gray-600">Order your food in seconds with our streamlined process</p>
          </div>
          
          <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md border border-gray-200">
            <div className="text-2xl sm:text-3xl mb-3 sm:mb-4">📱</div>
            <h3 className="text-base sm:text-lg font-semibold mb-2">Real-time Tracking</h3>
            <p className="text-sm sm:text-base text-gray-600">Track your order status from preparation to delivery</p>
          </div>
        </div>

        {/* CTA Buttons - Hidden on mobile, shown on larger screens */}
        <div className="hidden sm:flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center pb-8 sm:pb-12">
          <Link 
            href="/signup" 
            className="w-full sm:w-auto bg-green-600 text-white px-6 sm:px-8 py-3 rounded-lg text-base sm:text-lg font-semibold hover:bg-green-700 transition-colors duration-200 text-center"
          >
            Get Started
          </Link>
          <Link 
            href="/login" 
            className="w-full sm:w-auto bg-white text-green-600 border border-green-600 px-6 sm:px-8 py-3 rounded-lg text-base sm:text-lg font-semibold hover:bg-green-50 transition-colors duration-200 text-center"
          >
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}