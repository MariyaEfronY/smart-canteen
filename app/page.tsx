"use client";

import Link from "next/link";
import { useState, useEffect, useRef, useCallback } from "react";
import { Plus, Minus, ShoppingCart, Search } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { useRouter } from "next/navigation";

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
  item: {
    _id: string;
    name: string;
    price: number;
    imageUrl: string;
    status: "available" | "unavailable";
  };
  quantity: number;
}

// ✅ BULLETPROOF: Safe toast functions that won't cause render issues
const safeToast = {
  success: (message: string) => {
    // Use setTimeout to ensure toast happens outside React render cycle
    setTimeout(() => toast.success(message), 0);
  },
  error: (message: string) => {
    setTimeout(() => toast.error(message), 0);
  }
};

export default function Home() {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [showCart, setShowCart] = useState(false);

  // ✅ BULLETPROOF: Use refs to track state without causing re-renders
  const cartRef = useRef<CartItem[]>([]);
  const isAddingToCartRef = useRef(false);
  const lastActionRef = useRef<{ itemId: string; timestamp: number } | null>(null);

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

  // Fetch menu items
  useEffect(() => {
    fetchMenuItems();
  }, []);

  // ✅ BULLETPROOF: Cart loading with absolute uniqueness
  useEffect(() => {
    const savedCart = localStorage.getItem('canteenCart');
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart) as CartItem[];
        
        // Use Map for absolute uniqueness guarantee
        const cartMap = new Map();
        
        parsedCart.forEach((cartItem) => {
          if (cartItem?.item?._id && cartItem.quantity > 0) {
            cartMap.set(cartItem.item._id, cartItem);
          }
        });
        
        const uniqueCart = Array.from(cartMap.values());
        setCart(uniqueCart);
        cartRef.current = uniqueCart;
        
      } catch (error) {
        console.error('Error loading cart:', error);
        localStorage.removeItem('canteenCart');
      }
    }
  }, []);

  // ✅ BULLETPROOF: Keep ref in sync with state
  useEffect(() => {
    cartRef.current = cart;
  }, [cart]);

  // ✅ BULLETPROOF: Cart saving with debouncing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (cart.length > 0) {
        localStorage.setItem('canteenCart', JSON.stringify(cart));
      } else {
        localStorage.removeItem('canteenCart');
      }
    }, 100); // Small debounce to prevent excessive writes

    return () => clearTimeout(timeoutId);
  }, [cart]);

  const fetchMenuItems = async () => {
    try {
      const response = await fetch("/api/items/all");
      if (response.ok) {
        const data = await response.json();
        setMenuItems(data);
      } else {
        safeToast.error("Failed to load menu items");
      }
    } catch (error) {
      console.error("Error fetching menu items:", error);
      safeToast.error("Failed to load menu items");
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ BULLETPROOF: Add to cart with COMPLETE duplicate prevention
  const addToCart = useCallback((item: MenuItem) => {
    // ✅ FIX 1: Check if we're already processing an add operation
    if (isAddingToCartRef.current) {
      console.log("🛑 Blocked duplicate addToCart call - operation in progress");
      return;
    }

    // ✅ FIX 2: Check if this is the same item that was just added (within 500ms)
    const now = Date.now();
    if (lastActionRef.current && 
        lastActionRef.current.itemId === item._id && 
        now - lastActionRef.current.timestamp < 500) {
      console.log("🛑 Blocked rapid duplicate add for same item:", item.name);
      return;
    }

    // ✅ FIX 3: Set flags to block duplicate calls
    isAddingToCartRef.current = true;
    lastActionRef.current = { itemId: item._id, timestamp: now };

    if (item.status !== "available") {
      safeToast.error("This item is currently unavailable");
      isAddingToCartRef.current = false;
      return;
    }

    console.log("🛒 Processing addToCart for:", item.name);

    setCart(prevCart => {
      // Create a Map from current cart for guaranteed uniqueness
      const cartMap = new Map();
      
      // Add all existing items to the map
      prevCart.forEach(cartItem => {
        cartMap.set(cartItem.item._id, { ...cartItem });
      });
      
      // Handle the new item
      const itemId = item._id;
      
      if (cartMap.has(itemId)) {
        // Update existing item
        const existingItem = cartMap.get(itemId)!;
        const newQuantity = Math.min(existingItem.quantity + 1, 10);
        cartMap.set(itemId, {
          ...existingItem,
          quantity: newQuantity
        });
        safeToast.success(`Updated ${item.name} quantity to ${newQuantity}`);
      } else {
        // Add new item
        cartMap.set(itemId, { 
          item: {
            _id: item._id,
            name: item.name,
            price: item.price,
            imageUrl: item.imageUrl,
            status: item.status
          }, 
          quantity: 1 
        });
        safeToast.success(`Added ${item.name} to cart!`);
      }
      
      return Array.from(cartMap.values());
    });

    // ✅ FIX 4: Reset flags after state update is complete
    setTimeout(() => {
      isAddingToCartRef.current = false;
    }, 50);

  }, []);

  // ✅ BULLETPROOF: Remove from cart
  const removeFromCart = useCallback((itemId: string) => {
    setCart(prevCart => {
      const updatedCart = prevCart.filter(item => item.item._id !== itemId);
      safeToast.success("Item removed from cart");
      return updatedCart;
    });
  }, []);

  // ✅ BULLETPROOF: Update quantity
  const updateQuantity = useCallback((itemId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      removeFromCart(itemId);
      return;
    }
    
    if (newQuantity > 10) {
      safeToast.error("Maximum quantity per item is 10");
      return;
    }
    
    setCart(prevCart => {
      const updatedCart = prevCart.map(item =>
        item.item._id === itemId ? { ...item, quantity: newQuantity } : item
      );
      return updatedCart;
    });
  }, [removeFromCart]);

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

  // ✅ BULLETPROOF: Order placement
  const handlePlaceOrder = useCallback(() => {
    if (cart.length === 0) {
      safeToast.error("Your cart is empty");
      return;
    }

    // Validate cart items
    const validCart = cart.filter(cartItem => 
      cartItem.item.status === "available" && 
      cartItem.quantity > 0
    );
    
    if (validCart.length === 0) {
      safeToast.error("All items in your cart are currently unavailable");
      return;
    }

    // Use Map for final uniqueness check
    const finalCartMap = new Map();
    validCart.forEach(cartItem => {
      finalCartMap.set(cartItem.item._id, { ...cartItem });
    });
    
    const finalCart = Array.from(finalCartMap.values());

    // Save cart to localStorage before redirecting
    const redirectData = {
      redirectTo: '/place-order',
      message: 'Please complete your order after login',
      cart: finalCart,
      fromOrder: true,
      timestamp: Date.now(),
      orderIdentifier: `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
    
    localStorage.setItem('loginRedirect', JSON.stringify(redirectData));
    
    // Close cart and redirect to login
    setShowCart(false);
    
    // Use setTimeout to ensure this happens outside React's render cycle
    setTimeout(() => {
      router.push('/login');
    }, 0);
  }, [cart, router]);

  const clearCart = useCallback(() => {
    setCart([]);
    localStorage.removeItem('canteenCart');
    safeToast.success("Cart cleared successfully");
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 ">
      <Toaster position="top-right" />

{/* Navigation Bar */}
<nav
  className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-40 
  transition-all duration-500 rounded-full backdrop-blur-md
  max-w-7xl mx-auto w-[90%] 
  ${isScrolled 
    ? "bg-white/70 shadow-xl border border-gray-200" 
    : "bg-white/50 shadow-lg border border-gray-100"
  }`}
>
  <div className="px-4 sm:px-6 lg:px-8">
    <div className="flex justify-between items-center h-16 lg:h-20">
      
      {/* Logo */}
      <Link
        href="/"
        className="flex items-center space-x-3 group"
        onClick={() => setIsMenuOpen(false)}
      >
        <div className="w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-r from-green-500 to-emerald-500 
        rounded-xl flex items-center justify-center shadow-lg group-hover:scale-105 
        transition-transform duration-300">
          <span className="text-white text-lg lg:text-xl">🍔</span>
        </div>
        <div className="flex flex-col">
          <span className="text-xl lg:text-2xl font-bold bg-gradient-to-r 
          from-green-600 to-emerald-600 bg-clip-text text-transparent">
            Smart Canteen
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

            {/* Desktop Auth & Cart Buttons */}
            <div className="hidden lg:flex items-center space-x-4">
              {/* Cart Button */}
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

              {/* Auth Buttons */}
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
                    <span className="text-2xl font-bold text-gray-900 block">Smart Canteen</span>
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
                Smart Canteen
              </span>{" "}
              🍕
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl text-gray-600 mb-8 md:mb-12 max-w-3xl mx-auto leading-relaxed">
              Discover delicious meals, order with ease, and enjoy Smart dining like never before. 
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
                      {/* ✅ FIXED: Simple onClick without event parameter */}
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
                        Add to Cart
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
            {cart.length > 0 && (
              <button
                onClick={() => setShowCart(true)}
                className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 text-lg text-center"
              >
                View Cart ({getTotalItems()})
              </button>
            )}
            <Link 
              href="/signup" 
              className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 text-lg text-center"
            >
              Create Account
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

      {/* Shopping Cart Sidebar */}
      {showCart && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div 
            className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm transition-opacity duration-300" 
            onClick={() => setShowCart(false)}
          ></div>
          <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl transform transition-transform duration-300 flex flex-col">
            {/* Cart Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-white sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                  <ShoppingCart className="text-white" size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Your Cart</h2>
                  <p className="text-sm text-gray-500">
                    {cart.length} item{cart.length !== 1 ? 's' : ''} • ₹{getTotalPrice().toFixed(2)}
                  </p>
                </div>
              </div>
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
            <div className="flex-1 overflow-y-auto">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full px-6 text-center">
                  <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <ShoppingCart size={40} className="text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Your cart is empty</h3>
                  <p className="text-gray-500 mb-6">Add some delicious items to get started!</p>
                  <button
                    onClick={() => setShowCart(false)}
                    className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all duration-200"
                  >
                    Browse Menu
                  </button>
                </div>
              ) : (
                <div className="p-6 space-y-4">
                  {cart.map((cartItem) => (
                    <div 
                      key={cartItem.item._id} 
                      className="bg-white rounded-xl border border-gray-200 hover:border-green-200 transition-all duration-300 group hover:shadow-md"
                    >
                      <div className="flex gap-4 p-4">
                        <img
                          src={cartItem.item.imageUrl || "/placeholder-food.jpg"}
                          alt={cartItem.item.name}
                          className="w-20 h-20 object-cover rounded-lg group-hover:scale-105 transition-transform duration-300 flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 group-hover:text-green-700 transition-colors duration-300 truncate">
                            {cartItem.item.name}
                          </h3>
                          <p className="text-green-600 font-bold text-lg mb-2">₹{cartItem.item.price}</p>
                          
                          {/* Quantity Controls */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => updateQuantity(cartItem.item._id, cartItem.quantity - 1)}
                                className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-gray-200 transition-colors duration-200 hover:scale-110"
                              >
                                <Minus size={16} className="text-gray-600" />
                              </button>
                              <span className="font-semibold w-8 text-center bg-white px-3 py-1 rounded-lg border border-gray-300">
                                {cartItem.quantity}
                              </span>
                              <button
                                onClick={() => updateQuantity(cartItem.item._id, cartItem.quantity + 1)}
                                className="w-8 h-8 bg-green-500 text-white rounded-lg flex items-center justify-center hover:bg-green-600 transition-colors duration-200 hover:scale-110"
                              >
                                <Plus size={16} />
                              </button>
                            </div>
                            <button
                              onClick={() => removeFromCart(cartItem.item._id)}
                              className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors duration-200 hover:scale-110"
                              title="Remove item"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                          
                          {/* Item Total */}
                          <div className="mt-2 pt-2 border-t border-gray-100">
                            <p className="text-sm text-gray-600">
                              Item Total: <span className="font-semibold text-green-600">₹{(cartItem.item.price * cartItem.quantity).toFixed(2)}</span>
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Cart Footer */}
            {cart.length > 0 && (
              <div className="border-t border-gray-200 bg-white sticky bottom-0">
                <div className="p-6 space-y-4">
                  {/* Order Summary */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-lg">
                      <span className="text-gray-600">Subtotal:</span>
                      <span className="font-semibold">₹{getTotalPrice().toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center text-lg">
                      <span className="text-gray-600">Items:</span>
                      <span className="font-semibold">{getTotalItems()}</span>
                    </div>
                    <div className="border-t border-gray-200 pt-2">
                      <div className="flex justify-between items-center text-xl font-bold">
                        <span>Total:</span>
                        <span className="text-green-600">₹{getTotalPrice().toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Login Notice */}
                  <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-yellow-600 text-sm">💡</span>
                      </div>
                      <div>
                        <p className="text-yellow-800 text-sm font-medium">Login to place order</p>
                        <p className="text-yellow-700 text-xs mt-1">
                          You'll be redirected to login to complete your order
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-3">
                    <button
                      onClick={handlePlaceOrder}
                      className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white py-4 px-6 rounded-xl font-semibold text-lg hover:from-green-600 hover:to-emerald-600 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-3"
                    >
                      <ShoppingCart size={20} />
                      Place Order
                    </button>
                    
                    <button
                      onClick={() => setShowCart(false)}
                      className="w-full bg-gray-100 text-gray-700 py-3 px-6 rounded-xl font-semibold hover:bg-gray-200 transition-all duration-200 border border-gray-300"
                    >
                      Continue Shopping
                    </button>

                    <button
                      onClick={clearCart}
                      className="w-full text-red-500 py-2 px-6 rounded-xl font-semibold hover:bg-red-50 transition-all duration-200 border border-red-200"
                    >
                      Clear Cart
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Floating Cart Button for Mobile */}
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