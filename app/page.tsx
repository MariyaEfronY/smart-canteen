"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Plus, Minus, ShoppingCart, Search, Filter, Clock, Star } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

interface MenuItem {
  _id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string;
  status: "available" | "unavailable";
}

interface CartItem {
  item: MenuItem;
  quantity: number;
}

export default function Home() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [showCart, setShowCart] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

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

  // Fetch menu items only
  useEffect(() => {
    fetchMenuItems();
  }, []);

  const fetchMenuItems = async () => {
    try {
      const response = await fetch("/api/items/all");
      if (response.ok) {
        const data = await response.json();
        setMenuItems(data);
      } else {
        toast.error("Failed to load menu items");
      }
    } catch (error) {
      console.error("Error fetching menu items:", error);
      toast.error("Failed to load menu items");
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ SIMPLIFIED: Anyone can add to cart, but need to login to order
  const addToCart = (item: MenuItem) => {
    if (item.status !== "available") {
      toast.error("This item is currently unavailable");
      return;
    }

    setCart(prevCart => {
      const existingItem = prevCart.find(cartItem => cartItem.item._id === item._id);
      if (existingItem) {
        return prevCart.map(cartItem =>
          cartItem.item._id === item._id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
      } else {
        return [...prevCart, { item, quantity: 1 }];
      }
    });
    toast.success(`Added ${item.name} to cart!`);
  };

  const removeFromCart = (itemId: string) => {
    setCart(prevCart => prevCart.filter(item => item.item._id !== itemId));
    toast.success("Item removed from cart");
  };

  const updateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      removeFromCart(itemId);
      return;
    }
    setCart(prevCart =>
      prevCart.map(item =>
        item.item._id === itemId ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const getTotalPrice = () => {
    return cart.reduce((total, cartItem) => total + (cartItem.item.price * cartItem.quantity), 0);
  };

  const getTotalItems = () => {
    return cart.reduce((total, cartItem) => total + cartItem.quantity, 0);
  };

  // Filter menu items
  const filteredItems = menuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ["all", ...new Set(menuItems.map(item => item.category))];

// ✅ SIMPLIFIED: Check authentication only when placing order
const placeOrder = async () => {
  if (cart.length === 0) {
    toast.error("Your cart is empty");
    return;
  }

  try {
    const orderData = {
      items: cart.map(item => ({
        itemId: item.item._id,
        quantity: item.quantity,
      })),
      totalAmount: getTotalPrice(),
    };

    const response = await fetch("/api/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(orderData),
    });

    const data = await response.json();
    
    if (!response.ok) {
      if (response.status === 401) {
        // ✅ Save cart to localStorage before redirecting to login
        localStorage.setItem('pendingOrderCart', JSON.stringify(cart));
        localStorage.setItem('pendingOrderTotal', getTotalPrice().toString());
        setShowLoginPrompt(true);
        throw new Error("Please login to place an order");
      }
      throw new Error(data.message || "Failed to place order");
    }

    toast.success("Order placed successfully!");
    
    // ✅ Clear both current cart and pending order data
    setCart([]);
    localStorage.removeItem('canteenCart');
    localStorage.removeItem('pendingOrderCart');
    localStorage.removeItem('pendingOrderTotal');
    
    setShowCart(false);
    
    // Redirect to orders page
    setTimeout(() => {
      window.location.href = "/orders";
    }, 1500);
  } catch (error: any) {
    console.error("Order error:", error);
    toast.error(error.message || "Failed to place order");
  }
};
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      <Toaster position="top-right" />

{/* Login Prompt Modal */}
{showLoginPrompt && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
    <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
      <div className="text-center">
        <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">🔐</span>
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Login Required</h3>
        <p className="text-gray-600 mb-4">
          Please login to place your order with {getTotalItems()} items (₹{getTotalPrice()})
        </p>
        <div className="bg-green-50 border border-green-200 rounded-xl p-3 mb-4">
          <p className="text-green-800 text-sm">
            🛒 Your cart items will be saved and ordered after login
          </p>
        </div>
        <div className="space-y-3">
          <Link
            href={{
              pathname: "/login",
              query: { 
                redirect: "/checkout",
                hasCart: "true",
                itemCount: getTotalItems().toString()
              }
            }}
            onClick={() => setShowLoginPrompt(false)}
            className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white py-3 px-6 rounded-xl font-semibold hover:from-green-600 hover:to-emerald-600 transition-all duration-200 block text-center"
          >
            Login & Place Order
          </Link>
          <Link
            href={{
              pathname: "/signup",
              query: { 
                redirect: "/checkout",
                hasCart: "true"
              }
            }}
            onClick={() => setShowLoginPrompt(false)}
            className="w-full bg-white text-green-600 border border-green-200 py-3 px-6 rounded-xl font-semibold hover:bg-green-50 transition-all duration-200 block text-center"
          >
            Create Account & Order
          </Link>
          <button
            onClick={() => setShowLoginPrompt(false)}
            className="w-full text-gray-500 py-3 px-6 rounded-xl font-semibold hover:bg-gray-100 transition-all duration-200"
          >
            Continue Browsing
          </button>
        </div>
      </div>
    </div>
  </div>
)}

      {/* Navigation Bar */}
      <nav className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
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
            </div>

            {/* Desktop Auth & Cart Buttons */}
            <div className="hidden lg:flex items-center space-x-4">
              {/* Cart Button - Always visible */}
              <button
                onClick={() => setShowCart(true)}
                className="relative p-2 text-gray-700 hover:text-green-600 transition-colors duration-200 group"
              >
                <ShoppingCart size={24} className="group-hover:scale-110 transition-transform duration-200" />
                {getTotalItems() > 0 && (
                  <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                    {getTotalItems()}
                  </span>
                )}
              </button>

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

        {/* Mobile Menu Overlay */}
        <div className={`lg:hidden fixed inset-0 z-40 transition-all duration-300 ${
          isMenuOpen 
            ? "opacity-100 pointer-events-auto" 
            : "opacity-0 pointer-events-none"
        }`}>
          <div className="absolute inset-0 bg-white">
            <div className="flex flex-col h-full">
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

              {/* Navigation Links */}
              <div className="flex-1 p-6 space-y-3 overflow-y-auto">
                {[
                  { href: "/", label: "Home", icon: "🏠", description: "Back to homepage" },
                  { href: "/menu", label: "Menu", icon: "📋", description: "Browse our dishes" },
                  { href: "/about", label: "About", icon: "ℹ️", description: "Learn about us" },
                ].map((link) => (
                  <Link 
                    key={link.href}
                    href={link.href} 
                    className="flex items-center space-x-4 p-4 rounded-xl bg-gray-50 hover:bg-green-50 transition-all duration-200 group border border-gray-200 hover:border-green-200 hover:shadow-md"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center group-hover:bg-green-100 transition-colors duration-200 shadow-sm">
                      <span className="text-xl">{link.icon}</span>
                    </div>
                    <div className="flex-1">
                      <span className="font-bold text-gray-900 text-lg block">{link.label}</span>
                      <span className="text-gray-500 text-sm">{link.description}</span>
                    </div>
                    <div className="text-gray-400 group-hover:text-green-500">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </Link>
                ))}
              </div>

              {/* Auth Buttons */}
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
        </div>
      </nav>

      {/* Main Content */}
      <div className="pt-24 lg:pt-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
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
              Browse our menu and add items to cart - login when you're ready to order!
            </p>

            {/* Quick Stats */}
            <div className="flex flex-wrap justify-center gap-6 mb-8">
              <div className="bg-white px-6 py-3 rounded-xl shadow-lg border border-gray-200">
                <div className="text-2xl font-bold text-green-600">{menuItems.length}</div>
                <div className="text-gray-600 text-sm">Menu Items</div>
              </div>
              <div className="bg-white px-6 py-3 rounded-xl shadow-lg border border-gray-200">
                <div className="text-2xl font-bold text-blue-600">{categories.length - 1}</div>
                <div className="text-gray-600 text-sm">Categories</div>
              </div>
              <div className="bg-white px-6 py-3 rounded-xl shadow-lg border border-gray-200">
                <div className="text-2xl font-bold text-purple-600">
                  {menuItems.filter(item => item.status === "available").length}
                </div>
                <div className="text-gray-600 text-sm">Available Now</div>
              </div>
            </div>
          </div>

          {/* Search and Filter Section */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search for dishes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-300"
                />
              </div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-300 bg-white"
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category === "all" ? "All Categories" : category.charAt(0).toUpperCase() + category.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Menu Items Grid */}
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
              {filteredItems.map((item) => (
                <div
                  key={item._id}
                  className="bg-white rounded-2xl shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300 hover:scale-105 group overflow-hidden"
                >
                  <div className="relative">
                    <img
                      src={item.imageUrl || "/placeholder-food.jpg"}
                      alt={item.name}
                      className="w-full h-48 object-cover rounded-t-2xl group-hover:scale-110 transition-transform duration-300"
                    />
                    {item.status === "unavailable" && (
                      <div className="absolute inset-0 bg-black bg-opacity-60 rounded-t-2xl flex items-center justify-center">
                        <span className="text-white font-bold text-lg bg-red-500 px-3 py-1 rounded-full">Unavailable</span>
                      </div>
                    )}
                    <div className="absolute top-3 right-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold shadow-lg ${
                        item.status === "available" 
                          ? "bg-green-500 text-white" 
                          : "bg-red-500 text-white"
                      }`}>
                        {item.status === "available" ? "Available" : "Unavailable"}
                      </span>
                    </div>
                  </div>
                  
                  <div className="p-4">
                    <h3 className="font-bold text-gray-900 text-lg mb-2 group-hover:text-green-700 transition-colors duration-300">
                      {item.name}
                    </h3>
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">{item.description}</p>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                        ₹{item.price}
                      </span>
                      <button
                        onClick={() => addToCart(item)}
                        disabled={item.status !== "available"}
                        className={`px-4 py-2 rounded-xl font-semibold transition-all duration-200 flex items-center gap-2 ${
                          item.status === "available"
                            ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600 transform hover:scale-105 shadow-lg hover:shadow-xl"
                            : "bg-gray-300 text-gray-500 cursor-not-allowed"
                        }`}
                      >
                        <Plus size={16} />
                        {item.status === "available" ? "Add to Cart" : "Unavailable"}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!isLoading && filteredItems.length === 0 && (
            <div className="text-center py-12">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search size={40} className="text-gray-400" />
              </div>
              <p className="text-gray-500 text-lg mb-2">No menu items found</p>
              <p className="text-gray-400 text-sm">Try adjusting your search or filter criteria</p>
            </div>
          )}

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

      {/* Shopping Cart Sidebar - Always visible */}
      {showCart && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div 
            className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm transition-opacity duration-300" 
            onClick={() => setShowCart(false)}
          ></div>
          <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl transform transition-transform duration-300">
            <div className="flex flex-col h-full">
              {/* Cart Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <ShoppingCart className="text-green-500" />
                  Your Cart
                </h2>
                <button
                  onClick={() => setShowCart(false)}
                  className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors duration-200 hover:scale-110"
                >
                  <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Cart Items */}
              <div className="flex-1 overflow-y-auto p-6">
                {cart.length === 0 ? (
                  <div className="text-center py-12">
                    <ShoppingCart size={64} className="mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500 text-lg mb-2">Your cart is empty</p>
                    <p className="text-gray-400 text-sm">Add some delicious items to get started!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {cart.map((cartItem) => (
                      <div 
                        key={cartItem.item._id} 
                        className="flex items-center space-x-4 bg-gray-50 p-4 rounded-xl border border-gray-200 hover:border-green-200 transition-all duration-300 group"
                      >
                        <img
                          src={cartItem.item.imageUrl || "/placeholder-food.jpg"}
                          alt={cartItem.item.name}
                          className="w-16 h-16 object-cover rounded-lg group-hover:scale-110 transition-transform duration-300"
                        />
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 group-hover:text-green-700 transition-colors duration-300">
                            {cartItem.item.name}
                          </h3>
                          <p className="text-green-600 font-bold">₹{cartItem.item.price}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => updateQuantity(cartItem.item._id, cartItem.quantity - 1)}
                            className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300 transition-colors duration-200 hover:scale-110"
                          >
                            <Minus size={16} />
                          </button>
                          <span className="font-semibold w-8 text-center bg-white px-2 py-1 rounded border">
                            {cartItem.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(cartItem.item._id, cartItem.quantity + 1)}
                            className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center hover:bg-green-600 transition-colors duration-200 hover:scale-110"
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                        <button
                          onClick={() => removeFromCart(cartItem.item._id)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors duration-200 hover:scale-110"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Cart Footer */}
              {cart.length > 0 && (
                <div className="border-t border-gray-200 p-6 space-y-4 bg-gradient-to-r from-gray-50 to-white">
                  <div className="flex justify-between items-center text-lg font-semibold">
                    <span>Total:</span>
                    <span className="text-green-600 text-xl">₹{getTotalPrice().toFixed(2)}</span>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <p className="text-blue-800 text-sm text-center">
                      💡 <strong>Tip:</strong> You'll need to login to place your order
                    </p>
                  </div>
                  <button
                    onClick={placeOrder}
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white py-4 px-6 rounded-xl font-semibold text-lg hover:from-green-600 hover:to-emerald-600 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    Place Order
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Floating Cart Button for Mobile - Always show when cart has items */}
      {cart.length > 0 && (
        <button
          onClick={() => setShowCart(true)}
          className="fixed bottom-6 right-6 z-40 lg:hidden bg-gradient-to-r from-green-500 to-emerald-500 text-white p-4 rounded-full shadow-2xl hover:shadow-3xl transform hover:scale-110 transition-all duration-300"
        >
          <div className="relative">
            <ShoppingCart size={24} />
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center font-bold">
              {getTotalItems()}
            </span>
          </div>
        </button>
      )}
    </div>
  );
}