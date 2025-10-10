// app/place-order/page.tsx 
"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, ShoppingCart, Loader, ArrowLeft, AlertCircle, Clock, Package, Utensils } from "lucide-react";
import Link from "next/link";

interface CartItem {
  item: {
    _id: string;
    name: string;
    price: number;
    imageUrl: string;
  };
  quantity: number;
}

interface OrderResponse {
  message: string;
  order: {
    _id: string;
    orderNumber?: string;
    items: any[];
    totalAmount: number;
    status: string;
    createdAt?: string;
    role?: string; // ✅ ADDED: Role from order response
  };
}

export default function PlaceOrder() {
  const router = useRouter();
  const [isPlacingOrder, setIsPlacingOrder] = useState(true);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderFailed, setOrderFailed] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orderData, setOrderData] = useState<OrderResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [progress, setProgress] = useState(0);
  const [userRole, setUserRole] = useState<'student' | 'staff' | 'admin' | null>(null);

  // ✅ CRITICAL FIX: Use refs to track order placement state
  const orderPlacedRef = useRef(false);
  const orderInProgressRef = useRef(false);
  const orderIdentifierRef = useRef<string | null>(null);

  useEffect(() => {
    // ✅ CRITICAL FIX: Prevent duplicate order placement
    if (orderPlacedRef.current || orderInProgressRef.current) {
      console.log("🛑 Blocked duplicate useEffect execution");
      return;
    }

    const savedCart = localStorage.getItem('loginRedirect');
    console.log("🔍 Retrieved loginRedirect data:", savedCart);
    
    if (!savedCart) {
      console.log("❌ No cart data found, redirecting to home");
      router.push('/');
      return;
    }

    try {
      const parsedData = JSON.parse(savedCart);
      console.log("📦 Parsed redirect data:", parsedData);
      
      const savedCartData = parsedData.cart;
      const userType = parsedData.userType || parsedData.role;

      // ✅ ADDED: Detect user role for proper redirection
      if (userType) {
        setUserRole(userType);
        console.log("🎯 User role detected:", userType);
      } else {
        console.log("⚠️ No user role found, detecting from API...");
        detectUserRole();
      }

      if (!savedCartData || savedCartData.length === 0) {
        console.log("🛒 Empty cart, redirecting to home");
        router.push('/');
        return;
      }
      
      console.log("✅ Cart data found:", savedCartData.length, "items");
      setCart(savedCartData);
      
      // ✅ Generate unique order identifier once
      if (!orderIdentifierRef.current) {
        orderIdentifierRef.current = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      }
      
      placeOrder(savedCartData);
    } catch (error) {
      console.error('❌ Error parsing cart data:', error);
      router.push('/');
    }
  }, [router]);

  // ✅ ADDED: Function to detect user role
  const detectUserRole = async () => {
    try {
      console.log("🔍 Detecting user role...");
      
      // Method 1: Check localStorage for user info
      const userInfo = localStorage.getItem('userInfo');
      if (userInfo) {
        const userData = JSON.parse(userInfo);
        if (userData.role) {
          setUserRole(userData.role);
          console.log("👤 User role from localStorage:", userData.role);
          return;
        }
      }

      // Method 2: Make API call to get current user
      const response = await fetch('/api/auth/me', {
        credentials: 'include',
      });
      
      if (response.ok) {
        const userData = await response.json();
        if (userData.role) {
          setUserRole(userData.role);
          localStorage.setItem('userInfo', JSON.stringify(userData));
          console.log("👤 User role from API:", userData.role);
        }
      } else {
        console.log("⚠️ Could not fetch user data from API, defaulting to student");
        setUserRole('student');
      }
    } catch (error) {
      console.error('❌ Error detecting user role:', error);
      // Default to student if cannot detect
      setUserRole('student');
    }
  };

  // ✅ ADDED: Role-based redirection function
  const getDashboardRoute = () => {
    console.log("🎯 Getting dashboard route for role:", userRole);
    
    if (userRole === 'staff') {
      console.log("🚀 Redirecting to STAFF dashboard");
      return '/staff';
    } else if (userRole === 'admin') {
      console.log("🚀 Redirecting to ADMIN dashboard");
      return '/admin';
    } else {
      console.log("🚀 Redirecting to STUDENT dashboard");
      return '/student';
    }
  };

  // ✅ ADDED: Get dashboard name for display
  const getDashboardName = () => {
    if (userRole === 'staff') {
      return 'Staff Dashboard';
    } else if (userRole === 'admin') {
      return 'Admin Dashboard';
    } else {
      return 'Student Dashboard';
    }
  };

  // Progress animation
  useEffect(() => {
    if (isPlacingOrder && !orderPlacedRef.current) {
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) return 90;
          return prev + 10;
        });
      }, 500);
      return () => clearInterval(interval);
    }
  }, [isPlacingOrder]);

  const placeOrder = async (cartItems: CartItem[]) => {
    // ✅ CRITICAL FIX: Check if order is already placed or in progress
    if (orderPlacedRef.current) {
      console.log("🛑 Order already placed, skipping");
      return;
    }

    if (orderInProgressRef.current) {
      console.log("🛑 Order already in progress, skipping");
      return;
    }

    // ✅ Set flag immediately to block duplicate calls
    orderInProgressRef.current = true;

    if (!cartItems || cartItems.length === 0) {
      setErrorMessage("Cart is empty");
      setOrderFailed(true);
      setIsPlacingOrder(false);
      orderInProgressRef.current = false;
      return;
    }

    try {
      setIsPlacingOrder(true);
      setOrderFailed(false);
      setErrorMessage("");
      setProgress(10);

      console.log("🛒 Placing order with items:", cartItems);

      // Remove duplicates from cart
      const uniqueCart = cartItems.reduce((acc: CartItem[], current) => {
        const existing = acc.find(item => item.item._id === current.item._id);
        if (existing) {
          existing.quantity += current.quantity;
        } else {
          acc.push({ ...current });
        }
        return acc;
      }, []);

      console.log("✅ After duplicate removal:", uniqueCart);
      setProgress(30);

      const orderPayload = {
        items: uniqueCart.map(cartItem => ({
          item: cartItem.item._id,
          quantity: cartItem.quantity,
        })),
        clientTimestamp: Date.now(),
        orderIdentifier: orderIdentifierRef.current
      };

      console.log("📤 Sending order payload:", orderPayload);
      setProgress(60);

      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(orderPayload),
      });

      const data = await response.json();
      console.log("📥 Order response:", data);
      setProgress(90);

      if (!response.ok) {
        throw new Error(data.message || `Failed to place order: ${response.status}`);
      }

      // ✅ CRITICAL FIX: Extract role from order response if available
      if (data.order && data.order.role) {
        console.log("🎯 User role detected from order response:", data.order.role);
        setUserRole(data.order.role);
        localStorage.setItem('userInfo', JSON.stringify({ role: data.order.role }));
      }

      // ✅ CRITICAL FIX: Mark order as placed to prevent duplicates
      orderPlacedRef.current = true;
      orderInProgressRef.current = false;

      // Success - store the complete order data
      setOrderData(data);
      setOrderSuccess(true);
      setProgress(100);
      
      // Clean up localStorage
      localStorage.removeItem('loginRedirect');
      localStorage.removeItem('canteenCart');
      
      console.log("🎉 Order placed successfully, cart cleared");
      
    } catch (error: any) {
      console.error("❌ Order placement error:", error);
      setErrorMessage(error.message || "Failed to place order. Please try again.");
      setOrderFailed(true);
      setProgress(0);
      // ✅ Reset progress flag on error
      orderInProgressRef.current = false;
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const getTotalPrice = () => {
    return cart.reduce((total, cartItem) => total + (cartItem.item.price * cartItem.quantity), 0);
  };

  const getTotalItems = () => {
    return cart.reduce((total, cartItem) => total + cartItem.quantity, 0);
  };

  const handleRetry = () => {
    // ✅ Reset flags for retry
    orderPlacedRef.current = false;
    orderInProgressRef.current = false;
    
    setOrderFailed(false);
    setIsPlacingOrder(true);
    setProgress(0);
    // Retry with current cart
    setTimeout(() => placeOrder(cart), 1000);
  };

  const handleBackToMenu = () => {
    router.push('/');
  };

  // ✅ FIXED: Role-based redirection with proper role detection
  const handleViewOrders = () => {
    // Use the detected user role from state
    const dashboardRoute = getDashboardRoute();
    console.log(`🎯 FINAL REDIRECTION: Going to ${dashboardRoute} (User role: ${userRole})`);
    router.push(dashboardRoute);
  };

  // ✅ ADDED: Alternative redirection that uses order data role
  const handleViewOrdersFromOrderData = () => {
    if (orderData && orderData.order && orderData.order.role) {
      // Use role from order response (most accurate)
      const roleFromOrder = orderData.order.role;
      console.log(`🎯 Using role from order data: ${roleFromOrder}`);
      
      let dashboardRoute = '/student';
      if (roleFromOrder === 'staff') {
        dashboardRoute = '/staff';
      } else if (roleFromOrder === 'admin') {
        dashboardRoute = '/admin';
      }
      
      console.log(`🎯 FINAL REDIRECTION: Going to ${dashboardRoute} (Role from order: ${roleFromOrder})`);
      router.push(dashboardRoute);
    } else {
      // Fallback to detected user role
      handleViewOrders();
    }
  };

  const handleContactSupport = () => {
    router.push('/contact');
  };

  // Enhanced Loading state with progress
  if (isPlacingOrder) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md w-full animate-fade-in">
          {/* User Role Indicator */}
          {userRole && (
            <div className="mb-4 inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full border border-gray-200 shadow-sm">
              <span className="text-sm font-medium text-gray-700">
                Ordering as: <span className="font-bold capitalize">{userRole}</span>
              </span>
            </div>
          )}

          {/* Animated Progress Bar */}
          <div className="mb-8">
            <div className="w-full bg-gray-200 rounded-full h-3 mb-4 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-600 font-medium">
              {progress < 30 && "🔄 Preparing your order..."}
              {progress >= 30 && progress < 60 && "📦 Processing items..."}
              {progress >= 60 && progress < 90 && "🚀 Finalizing order..."}
              {progress >= 90 && "🎉 Almost done..."}
            </p>
          </div>

          {/* Animated Icon */}
          <div className="relative mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto shadow-2xl animate-pulse">
              <Package className="text-white" size={32} />
            </div>
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-400 rounded-full border-4 border-white animate-bounce"></div>
          </div>
          
          <h2 className="text-3xl font-black text-gray-900 mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Processing Your Order
          </h2>
          <p className="text-gray-600 mb-8 text-lg font-medium">
            Hang tight! We're preparing your delicious meal with care 🍕
          </p>
          
          {/* Order Summary Card */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 shadow-xl mb-6 transform hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Utensils className="text-blue-500" size={20} />
              <span className="font-bold text-gray-800 text-lg">Order Preview</span>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 font-medium">Items Count:</span>
                <span className="font-bold text-gray-900 bg-blue-100 px-3 py-1 rounded-full text-sm">
                  {getTotalItems()} items
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-600 font-medium">Total Amount:</span>
                <span className="font-bold text-green-600 text-lg">
                  ₹{getTotalPrice().toFixed(2)}
                </span>
              </div>
              
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Estimated Time:</span>
                <span className="font-semibold text-orange-500">15-20 mins</span>
              </div>
            </div>
          </div>

          {/* Fun Facts */}
          <div className="bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-200 rounded-xl p-4">
            <p className="text-orange-800 text-sm font-medium">
              💡 <strong>Did you know?</strong> Our chefs are preparing your meal fresh right now!
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Enhanced Success state
  if (orderSuccess && orderData) {
    const dashboardName = getDashboardName();
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md w-full animate-scale-in">
          {/* Success Animation */}
          <div className="relative mb-8">
            <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-2xl animate-bounce">
              <CheckCircle className="text-white" size={40} />
            </div>
            <div className="absolute -top-1 -right-1 w-8 h-8 bg-yellow-400 rounded-full border-4 border-white animate-ping"></div>
          </div>
          
          <h2 className="text-4xl font-black text-gray-900 mb-4 bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
            Order Confirmed! 🎉
          </h2>

          {/* User Role Badge */}
          {userRole && (
            <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-semibold mb-4">
              <span>Order placed as: <span className="font-bold capitalize">{userRole}</span></span>
            </div>
          )}

          <p className="text-gray-600 mb-8 text-lg font-medium">
            Your delicious meal is being prepared with love and care!
          </p>
          
          {/* Order Details Card */}
          <div className="bg-gradient-to-br from-green-500 to-emerald-500 text-white rounded-2xl p-6 mb-6 shadow-2xl transform hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-center gap-3 mb-4">
              <CheckCircle className="text-white" size={24} />
              <span className="font-bold text-lg">Order Details</span>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-medium">Order Number:</span>
                <span className="font-black text-yellow-300 text-lg">
                  #{orderData.order?._id?.slice(-8).toUpperCase() || 'N/A'}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="font-medium">Items:</span>
                <span className="font-bold">{getTotalItems()} items</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="font-medium">Total Amount:</span>
                <span className="font-bold text-2xl">₹{getTotalPrice().toFixed(2)}</span>
              </div>
              
              <div className="flex justify-between items-center text-sm">
                <span>Status:</span>
                <span className="font-bold bg-white/20 px-3 py-1 rounded-full">
                  🟢 {orderData.order?.status || 'Pending'}
                </span>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-xl mb-8 transform hover:shadow-2xl transition-all duration-300">
            <h3 className="font-bold text-gray-900 mb-4 text-xl flex items-center justify-center gap-2">
              <ShoppingCart className="text-blue-500" size={20} />
              Order Summary
            </h3>
            
            <div className="space-y-4 max-h-80 overflow-y-auto mb-6 custom-scrollbar">
              {cart.map((cartItem, index) => (
                <div 
                  key={`${cartItem.item._id}-${index}`} 
                  className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl hover:bg-blue-50 transition-all duration-300 group"
                >
                  <img
                    src={cartItem.item.imageUrl || "/placeholder-food.jpg"}
                    alt={cartItem.item.name}
                    className="w-16 h-16 object-cover rounded-lg group-hover:scale-110 transition-transform duration-300"
                  />
                  
                  <div className="flex-1 text-left">
                    <h4 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                      {cartItem.item.name}
                    </h4>
                    <p className="text-gray-600 text-sm">
                      Quantity: <span className="font-bold">{cartItem.quantity}</span>
                    </p>
                  </div>
                  
                  <div className="text-right">
                    <p className="font-bold text-gray-900 text-lg">
                      ₹{(cartItem.item.price * cartItem.quantity).toFixed(2)}
                    </p>
                    <p className="text-gray-500 text-sm">₹{cartItem.item.price} each</p>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="border-t border-gray-200 pt-4">
              <div className="flex justify-between items-center font-black text-xl">
                <span className="text-gray-700">Total Amount:</span>
                <span className="text-green-600 bg-green-50 px-4 py-2 rounded-xl">
                  ₹{getTotalPrice().toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Next Steps */}
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 mb-6">
            <h4 className="font-bold text-blue-900 mb-3 flex items-center justify-center gap-2">
              <Clock className="text-blue-500" size={20} />
              What's Next?
            </h4>
            <div className="space-y-2 text-sm text-blue-800">
              <p>✅ Your order has been received</p>
              <p>👨‍🍳 Our chefs are preparing your meal</p>
              <p>⏱️ Estimated ready time: 15-20 minutes</p>
              <p>📱 You'll get updates on your dashboard</p>
              <p className="font-semibold mt-2">🎯 Go to: {dashboardName}</p>
            </div>
          </div>

          {/* Enhanced Action Buttons - USING ORDER DATA ROLE */}
          <div className="space-y-4">
            <button
              onClick={handleViewOrdersFromOrderData} 
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-4 px-8 rounded-xl font-black text-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-300 shadow-2xl hover:shadow-3xl transform hover:scale-105 flex items-center justify-center gap-3"
            >
              <CheckCircle size={20} />
              Go to {dashboardName}
            </button>
            
            <button
              onClick={handleBackToMenu}
              className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white py-3 px-8 rounded-xl font-bold hover:from-blue-600 hover:to-cyan-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center gap-3"
            >
              <Utensils size={18} />
              Order More Food
            </button>
            
            <div className="flex gap-3">
              <button
                onClick={() => window.print()}
                className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-xl font-semibold hover:bg-gray-200 transition-all duration-200 border border-gray-300 flex items-center justify-center gap-2"
              >
                📄 Print Receipt
              </button>
              
              <button
                onClick={() => navigator.share?.({ 
                  title: 'My Order', 
                  text: `I just ordered ${getTotalItems()} items from Campus Canteen!` 
                })}
                className="flex-1 bg-purple-100 text-purple-700 py-3 px-4 rounded-xl font-semibold hover:bg-purple-200 transition-all duration-200 border border-purple-300 flex items-center justify-center gap-2"
              >
                📱 Share
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Enhanced Error state
  if (orderFailed) {
    const dashboardName = getDashboardName();
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md w-full animate-shake">
          {/* Error Animation */}
          <div className="relative mb-8">
            <div className="w-24 h-24 bg-gradient-to-br from-red-400 to-orange-500 rounded-full flex items-center justify-center mx-auto shadow-2xl">
              <AlertCircle className="text-white" size={40} />
            </div>
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full border-4 border-white animate-pulse"></div>
          </div>
          
          <h2 className="text-3xl font-black text-gray-900 mb-4 bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
            Order Issue 🚨
          </h2>
          
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 shadow-xl mb-6">
            <p className="text-gray-700 mb-4 text-lg font-semibold">{errorMessage}</p>
            
            {errorMessage?.toLowerCase().includes('duplicate') && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-yellow-600 text-sm">💡</span>
                  </div>
                  <div className="text-left">
                    <p className="text-yellow-800 font-bold text-sm">Duplicate Order Detected</p>
                    <p className="text-yellow-700 text-xs mt-1">
                      It seems this order was already placed. Check your dashboard for order status.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {errorMessage?.toLowerCase().includes('unavailable') && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-blue-600 text-sm">🍕</span>
                  </div>
                  <div className="text-left">
                    <p className="text-blue-800 font-bold text-sm">Item Availability</p>
                    <p className="text-blue-700 text-xs mt-1">
                      Some items in your cart might be temporarily unavailable. Please review your order.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Enhanced Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleRetry}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white py-4 px-6 rounded-xl font-bold hover:from-green-600 hover:to-emerald-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center gap-3"
            >
              <Loader size={20} />
              Try Again
            </button>
            
            <button
              onClick={handleBackToMenu}
              className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white py-3 px-6 rounded-xl font-semibold hover:from-blue-600 hover:to-cyan-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center gap-3"
            >
              <ArrowLeft size={18} />
              Back to Menu
            </button>
            
            <button
              onClick={handleViewOrdersFromOrderData} 
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 px-6 rounded-xl font-semibold hover:from-purple-600 hover:to-pink-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center gap-3"
            >
              📊 View {dashboardName}
            </button>
            
            <button
              onClick={handleContactSupport}
              className="w-full bg-gray-100 text-gray-700 py-3 px-6 rounded-xl font-semibold hover:bg-gray-200 transition-all duration-200 border border-gray-300 flex items-center justify-center gap-3"
            >
              📞 Contact Support
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Default loading state
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 flex items-center justify-center">
      <div className="text-center animate-pulse">
        <div className="w-16 h-16 bg-gradient-to-r from-gray-400 to-blue-400 rounded-full flex items-center justify-center mx-auto mb-4">
          <Loader className="text-white animate-spin" size={28} />
        </div>
        <p className="text-gray-600 font-medium">Initializing order system...</p>
      </div>
    </div>
  );
}

// Add custom styles for scrollbar
const styles = `
  .custom-scrollbar::-webkit-scrollbar {
    width: 6px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: #f1f5f9;
    border-radius: 10px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 10px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
  }
  
  @keyframes fade-in {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  @keyframes scale-in {
    from { opacity: 0; transform: scale(0.9); }
    to { opacity: 1; transform: scale(1); }
  }
  
  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-5px); }
    75% { transform: translateX(5px); }
  }
  
  .animate-fade-in {
    animation: fade-in 0.6s ease-out;
  }
  
  .animate-scale-in {
    animation: scale-in 0.5s ease-out;
  }
  
  .animate-shake {
    animation: shake 0.5s ease-in-out;
  }
`;

// Add styles to head
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement("style");
  styleSheet.innerText = styles;
  document.head.appendChild(styleSheet);
}