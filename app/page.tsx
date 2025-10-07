"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

interface Item {
  _id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string;
  status: string;
}

export default function Home() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [items, setItems] = useState<Item[]>([]);
  const [cart, setCart] = useState<Item[]>([]);

  // Handle scroll effect for navbar
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Prevent body scroll when menu is open
  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? "hidden" : "unset";
  }, [isMenuOpen]);

  // ✅ Fetch menu items
  useEffect(() => {
    const fetchItems = async () => {
      try {
        const res = await fetch("/api/items/all");
        const data = await res.json();
        setItems(data);
      } catch (error) {
        console.error("Error fetching items:", error);
      }
    };
    fetchItems();
  }, []);

  // ✅ Handle Add to Cart
  const handleAddToCart = (item: Item) => {
    setCart((prev) => {
      const exists = prev.find((i) => i._id === item._id);
      if (exists) return prev; // avoid duplicates
      return [...prev, item];
    });
  };

  // ✅ Handle Booking (checkout simulation)
  const handleBookNow = () => {
    alert(`✅ You booked ${cart.length} item(s)!`);
    setCart([]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      {/* Navigation bar - unchanged */}
      {/* ... (your full navbar code remains same here) ... */}

      {/* Main Content */}
      <div className="pt-24 lg:pt-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
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

          {/* Feature Grid - unchanged */}
          {/* ... (keep your existing features grid here) ... */}

          {/* ✅ Menu Section */}
          <h2 className="text-3xl font-bold text-center mt-16 mb-8 text-gray-800">
            Today's Menu 🍽️
          </h2>

          {items.length === 0 ? (
            <p className="text-center text-gray-600 text-lg">Loading menu...</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {items.map((item) => (
                <div
                  key={item._id}
                  className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300"
                >
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-full h-48 object-cover"
                  />
                  <div className="p-5 flex flex-col justify-between h-full">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-800 mb-2">{item.name}</h3>
                      <p className="text-gray-600 mb-2">{item.description}</p>
                      <p className="text-green-600 font-semibold text-lg">₹{item.price}</p>
                      <p
                        className={`text-sm mt-1 ${
                          item.status === "available" ? "text-green-500" : "text-red-500"
                        }`}
                      >
                        {item.status === "available" ? "Available" : "Unavailable"}
                      </p>
                    </div>

                    <button
                      onClick={() => handleAddToCart(item)}
                      disabled={item.status === "unavailable"}
                      className={`mt-4 px-4 py-2 rounded-lg text-white font-semibold transition-all duration-200 ${
                        item.status === "unavailable"
                          ? "bg-gray-400 cursor-not-allowed"
                          : "bg-gradient-to-r from-green-500 to-emerald-500 hover:shadow-lg hover:scale-105"
                      }`}
                    >
                      Add to Cart
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ✅ Cart Section */}
          {cart.length > 0 && (
            <div className="mt-16 bg-white shadow-xl rounded-2xl p-6 border border-gray-200 max-w-3xl mx-auto">
              <h3 className="text-2xl font-bold mb-4 text-gray-800">🛒 Your Cart</h3>
              <ul className="divide-y divide-gray-200 mb-4">
                {cart.map((item) => (
                  <li key={item._id} className="flex justify-between py-3">
                    <span>{item.name}</span>
                    <span className="text-green-600 font-semibold">₹{item.price}</span>
                  </li>
                ))}
              </ul>
              <button
                onClick={handleBookNow}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold py-3 rounded-xl shadow-md hover:shadow-lg hover:scale-105 transition-all duration-200"
              >
                Confirm Booking ({cart.length})
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
