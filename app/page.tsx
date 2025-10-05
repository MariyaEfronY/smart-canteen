"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

export default function Home() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Handle scroll effect for navbar
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMenuOpen]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      {/* Enhanced Navigation Bar */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? "bg-white shadow-lg border-b border-gray-200" 
          : "bg-white"
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 lg:h-20">
            {/* Logo */}
            <Link 
              href="/" 
              className="flex items-center space-x-3 group"
              onClick={() => setIsMenuOpen(false)}
            >
              <div className="w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-300">
                <span className="text-white text-lg lg:text-xl">🍔</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xl lg:text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                  Campus Canteen
                </span>
                <span className="text-xs text-gray-500 hidden sm:block">Delicious & Fast</span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-8">
              <Link 
                href="/" 
                className="text-gray-700 hover:text-green-600 font-medium transition-colors duration-200 relative group"
              >
                Home
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-green-500 group-hover:w-full transition-all duration-300"></span>
              </Link>
              <Link 
                href="/menu" 
                className="text-gray-700 hover:text-green-600 font-medium transition-colors duration-200 relative group"
              >
                Menu
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-green-500 group-hover:w-full transition-all duration-300"></span>
              </Link>
              <Link 
                href="/about" 
                className="text-gray-700 hover:text-green-600 font-medium transition-colors duration-200 relative group"
              >
                About
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-green-500 group-hover:w-full transition-all duration-300"></span>
              </Link>
              <Link 
                href="/contact" 
                className="text-gray-700 hover:text-green-600 font-medium transition-colors duration-200 relative group"
              >
                Contact
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-green-500 group-hover:w-full transition-all duration-300"></span>
              </Link>
            </div>

            {/* Desktop Auth Buttons */}
            <div className="hidden lg:flex items-center space-x-4">
              <Link 
                href="/login" 
                className="px-6 py-2.5 text-green-600 font-semibold rounded-lg hover:bg-green-50 transition-all duration-200 border border-transparent hover:border-green-200"
              >
                Sign In
              </Link>
              <Link 
                href="/signup" 
                className="px-6 py-2.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
              >
                Get Started
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-all duration-200"
              aria-label="Toggle menu"
            >
              <div className="w-6 h-6 relative">
                <span className={`absolute left-0 top-1 w-6 h-0.5 bg-gray-700 transition-all duration-300 ${
                  isMenuOpen ? "rotate-45 top-3 bg-gray-700" : ""
                }`}></span>
                <span className={`absolute left-0 top-3 w-6 h-0.5 bg-gray-700 transition-all duration-300 ${
                  isMenuOpen ? "opacity-0" : ""
                }`}></span>
                <span className={`absolute left-0 top-5 w-6 h-0.5 bg-gray-700 transition-all duration-300 ${
                  isMenuOpen ? "-rotate-45 top-3 bg-gray-700" : ""
                }`}></span>
              </div>
            </button>
          </div>
        </div>

        {/* Mobile Menu Overlay - Solid Background */}
        <div className={`lg:hidden fixed inset-0 z-40 transition-all duration-300 ${
          isMenuOpen 
            ? "opacity-100 pointer-events-auto" 
            : "opacity-0 pointer-events-none"
        }`}>
          {/* Solid Background Overlay */}
          <div 
            className="absolute inset-0 bg-white"
            onClick={() => setIsMenuOpen(false)}
          ></div>
          
          {/* Menu Content - Solid White Background */}
          <div className="absolute inset-0 flex flex-col bg-white">
            {/* Header */}
            <div className="flex-shrink-0 flex justify-between items-center p-6 border-b border-gray-200 bg-white">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-white text-xl">🍔</span>
                </div>
                <div>
                  <span className="text-2xl font-bold text-gray-900 block">Campus Canteen</span>
                  <span className="text-gray-500 text-sm">Delicious & Fast</span>
                </div>
              </div>
              <button
                onClick={() => setIsMenuOpen(false)}
                className="p-3 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors duration-200"
                aria-label="Close menu"
              >
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Navigation Links - Solid Cards */}
            <div className="flex-1 p-6 space-y-3 overflow-y-auto">
              <Link 
                href="/" 
                className="flex items-center space-x-4 p-4 rounded-xl bg-gray-50 hover:bg-green-50 transition-all duration-200 group border border-gray-200 hover:border-green-200 hover:shadow-md"
                onClick={() => setIsMenuOpen(false)}
              >
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center group-hover:bg-green-100 transition-colors duration-200 shadow-sm">
                  <span className="text-xl">🏠</span>
                </div>
                <div className="flex-1">
                  <span className="font-bold text-gray-900 text-lg block">Home</span>
                  <span className="text-gray-500 text-sm">Back to homepage</span>
                </div>
                <div className="text-gray-400 group-hover:text-green-500">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
              
              <Link 
                href="/menu" 
                className="flex items-center space-x-4 p-4 rounded-xl bg-gray-50 hover:bg-green-50 transition-all duration-200 group border border-gray-200 hover:border-green-200 hover:shadow-md"
                onClick={() => setIsMenuOpen(false)}
              >
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center group-hover:bg-green-100 transition-colors duration-200 shadow-sm">
                  <span className="text-xl">📋</span>
                </div>
                <div className="flex-1">
                  <span className="font-bold text-gray-900 text-lg block">Menu</span>
                  <span className="text-gray-500 text-sm">Browse our dishes</span>
                </div>
                <div className="text-gray-400 group-hover:text-green-500">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
              
              <Link 
                href="/about" 
                className="flex items-center space-x-4 p-4 rounded-xl bg-gray-50 hover:bg-green-50 transition-all duration-200 group border border-gray-200 hover:border-green-200 hover:shadow-md"
                onClick={() => setIsMenuOpen(false)}
              >
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center group-hover:bg-green-100 transition-colors duration-200 shadow-sm">
                  <span className="text-xl">ℹ️</span>
                </div>
                <div className="flex-1">
                  <span className="font-bold text-gray-900 text-lg block">About</span>
                  <span className="text-gray-500 text-sm">Learn about us</span>
                </div>
                <div className="text-gray-400 group-hover:text-green-500">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
              
              <Link 
                href="/contact" 
                className="flex items-center space-x-4 p-4 rounded-xl bg-gray-50 hover:bg-green-50 transition-all duration-200 group border border-gray-200 hover:border-green-200 hover:shadow-md"
                onClick={() => setIsMenuOpen(false)}
              >
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center group-hover:bg-green-100 transition-colors duration-200 shadow-sm">
                  <span className="text-xl">📞</span>
                </div>
                <div className="flex-1">
                  <span className="font-bold text-gray-900 text-lg block">Contact</span>
                  <span className="text-gray-500 text-sm">Get in touch</span>
                </div>
                <div className="text-gray-400 group-hover:text-green-500">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            </div>

            {/* Auth Buttons - Solid Background */}
            <div className="flex-shrink-0 p-6 space-y-4 border-t border-gray-200 bg-gray-50">
              <Link 
                href="/login" 
                className="w-full px-6 py-4 bg-white text-green-600 font-bold rounded-xl hover:bg-green-50 transition-all duration-200 border border-green-200 text-center block text-lg hover:shadow-md"
                onClick={() => setIsMenuOpen(false)}
              >
                🔐 Sign In
              </Link>
              <Link 
                href="/signup" 
                className="w-full px-6 py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 text-center block text-lg"
                onClick={() => setIsMenuOpen(false)}
              >
                🚀 Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="pt-24 lg:pt-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Hero Section */}
          <div className="text-center py-8 md:py-12">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 mb-6 md:mb-8 leading-tight">
              Welcome to{" "}
              <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                Campus Canteen
              </span>{" "}
              🍕
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl text-gray-600 mb-8 md:mb-12 max-w-3xl mx-auto leading-relaxed">
              Discover delicious meals, order with ease, and enjoy campus dining like never before. 
              Browse our menu, place orders, and track your food in real-time.
            </p>
          </div>
          
          {/* Features Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mb-12 sm:mb-16">
            <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300 hover:scale-105">
              <div className="text-3xl sm:text-4xl mb-4">🍔</div>
              <h3 className="text-xl sm:text-2xl font-semibold mb-3 text-gray-800">Wide Menu Selection</h3>
              <p className="text-gray-600 leading-relaxed text-base sm:text-lg">
                Choose from a variety of delicious meals and snacks prepared fresh daily
              </p>
            </div>
            
            <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300 hover:scale-105">
              <div className="text-3xl sm:text-4xl mb-4">⚡</div>
              <h3 className="text-xl sm:text-2xl font-semibold mb-3 text-gray-800">Quick Ordering</h3>
              <p className="text-gray-600 leading-relaxed text-base sm:text-lg">
                Order your food in seconds with our streamlined and intuitive process
              </p>
            </div>
            
            <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300 hover:scale-105">
              <div className="text-3xl sm:text-4xl mb-4">📱</div>
              <h3 className="text-xl sm:text-2xl font-semibold mb-3 text-gray-800">Real-time Tracking</h3>
              <p className="text-gray-600 leading-relaxed text-base sm:text-lg">
                Track your order status from preparation to delivery in real-time
              </p>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pb-12 sm:pb-16">
            <Link 
              href="/signup" 
              className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 text-lg text-center"
            >
              Get Started Free
            </Link>
            <Link 
              href="/login" 
              className="w-full sm:w-auto px-8 py-4 bg-white text-green-600 border border-green-200 font-semibold rounded-xl hover:bg-green-50 transition-all duration-200 text-lg text-center"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}