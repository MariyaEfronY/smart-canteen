// app/place-order/page.tsx 
"use client";

import { useEffect, useState, useRef, JSX } from "react";
import { useRouter } from "next/navigation";
import { 
  CheckCircle, 
  ShoppingCart, 
  Loader, 
  ArrowLeft, 
  AlertCircle, 
  Clock, 
  Package, 
  Utensils,
  MapPin,
  User,
  Shield
} from "lucide-react";

interface CartItem {
  item: {
    _id: string;
    name: string;
    price: number;
    imageUrl: string;
    estimatedTime?: number;
  };
  quantity: number;
}

interface OrderResponse {
  message: string;
  order: {
    _id: string;
    orderNumber: string;
    items: any[];
    totalAmount: number;
    status: string;
    createdAt: string;
    role: string;
    estimatedReadyTime?: string;
  };
}

interface UserInfo {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'staff' | 'admin';
  dno?: string;
  staffId?: string;
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
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [estimatedReadyTime, setEstimatedReadyTime] = useState<string>("");

  // Enhanced refs for better state management
  const orderPlacedRef = useRef(false);
  const orderInProgressRef = useRef(false);
  const orderIdentifierRef = useRef<string | null>(null);
  const retryCountRef = useRef(0);
  const maxRetries = 3;

  // Calculate estimated ready time based on cart items
  const calculateEstimatedTime = (items: CartItem[]) => {
    const maxTime = Math.max(...items.map(item => item.item.estimatedTime || 20));
    const readyTime = new Date(Date.now() + maxTime * 60000);
    return readyTime.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  useEffect(() => {
    if (orderPlacedRef.current || orderInProgressRef.current) {
      console.log("🛑 Blocked duplicate order placement");
      return;
    }

    const processOrder = async () => {
      const savedCart = localStorage.getItem('loginRedirect');
      console.log("🔍 Checking for pending order...");

      if (!savedCart) {
        console.log("❌ No pending order found");
        router.push('/');
        return;
      }

      try {
        const parsedData = JSON.parse(savedCart);
        console.log("📦 Processing order data:", {
          items: parsedData.cart?.length,
          fromOrder: parsedData.fromOrder
        });

        const savedCartData = parsedData.cart;
        
        if (!savedCartData || savedCartData.length === 0) {
          console.log("🛒 Empty cart detected");
          router.push('/');
          return;
        }

        // Set cart and calculate estimated time
        setCart(savedCartData);
        setEstimatedReadyTime(calculateEstimatedTime(savedCartData));

        // Detect user info with retry mechanism
        await detectUserInfo();

        // Generate unique order identifier
        if (!orderIdentifierRef.current) {
          orderIdentifierRef.current = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        }

        // Prevent admin from ordering
        if (userInfo?.role === 'admin') {
          console.log("❌ Admin user attempted to place order");
          setErrorMessage("Admins cannot place orders. Please use a student or staff account.");
          setOrderFailed(true);
          setIsPlacingOrder(false);
          return;
        }

        await placeOrder(savedCartData);
      } catch (error) {
        console.error('❌ Error processing order:', error);
        handleOrderError("Failed to process your order. Please try again.");
      }
    };

    processOrder();
  }, [router]);

  const detectUserInfo = async (): Promise<void> => {
    try {
      console.log("🔍 Detecting user information...");

      // Check localStorage first
      const userInfoStr = localStorage.getItem('userInfo');
      if (userInfoStr) {
        const cachedUserInfo = JSON.parse(userInfoStr);
        if (cachedUserInfo.role) {
          setUserInfo(cachedUserInfo);
          console.log("👤 User info from cache:", cachedUserInfo);
          return;
        }
      }

      // Fetch fresh user data from API
      const response = await fetch('/api/auth/me', {
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.user) {
          const userData = {
            id: data.user.id,
            name: data.user.name,
            email: data.user.email,
            role: data.user.role,
            dno: data.user.dno,
            staffId: data.user.staffId
          };
          setUserInfo(userData);
          localStorage.setItem('userInfo', JSON.stringify(userData));
          console.log("✅ User info from API:", userData);
        }
      } else {
        throw new Error('Failed to fetch user info');
      }
    } catch (error) {
      console.error('❌ Error detecting user info:', error);
      // Set default student role as fallback
      setUserInfo({
        id: 'unknown',
        name: 'User',
        email: '',
        role: 'student'
      });
    }
  };

  const placeOrder = async (cartItems: CartItem[]): Promise<void> => {
    if (orderPlacedRef.current || orderInProgressRef.current) {
      return;
    }

    orderInProgressRef.current = true;

    if (!cartItems || cartItems.length === 0) {
      handleOrderError("Your cart is empty");
      return;
    }

    // Prevent admin ordering on frontend as well
    if (userInfo?.role === 'admin') {
      handleOrderError("Admins cannot place orders. Please use a student or staff account.");
      return;
    }

    try {
      setIsPlacingOrder(true);
      setOrderFailed(false);
      setErrorMessage("");
      setProgress(5);

      console.log("🛒 Starting order placement...");

      // Process cart items
      const uniqueCart = cartItems.reduce((acc: CartItem[], current) => {
        const existing = acc.find(item => item.item._id === current.item._id);
        if (existing) {
          existing.quantity += current.quantity;
        } else {
          acc.push({ ...current });
        }
        return acc;
      }, []);

      console.log("✅ Processed cart items:", uniqueCart.length);
      setProgress(25);

      // Prepare order payload
      const orderPayload = {
        items: uniqueCart.map(cartItem => ({
          item: cartItem.item._id,
          quantity: cartItem.quantity,
          price: cartItem.item.price,
          name: cartItem.item.name
        })),
        clientTimestamp: Date.now(),
        orderIdentifier: orderIdentifierRef.current,
        estimatedReadyTime: estimatedReadyTime
      };

      console.log("📤 Sending order to server...");
      setProgress(50);

      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(orderPayload),
      });

      const data = await response.json();
      console.log("📥 Server response:", data);

      if (!response.ok) {
        throw new Error(data.message || `Order failed with status: ${response.status}`);
      }

      setProgress(85);

      // Finalize order success
      orderPlacedRef.current = true;
      orderInProgressRef.current = false;
      retryCountRef.current = 0;

      setOrderData(data);
      setOrderSuccess(true);
      setProgress(100);

      // Cleanup
      localStorage.removeItem('loginRedirect');
      localStorage.removeItem('canteenCart');
      
      console.log("🎉 Order completed successfully!");

    } catch (error: any) {
      console.error("❌ Order placement failed:", error);
      
      if (retryCountRef.current < maxRetries) {
        retryCountRef.current++;
        console.log(`🔄 Retrying order (${retryCountRef.current}/${maxRetries})...`);
        setTimeout(() => placeOrder(cartItems), 2000);
      } else {
        handleOrderError(error.message || "Order failed. Please try again.");
      }
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const handleOrderError = (message: string) => {
    setErrorMessage(message);
    setOrderFailed(true);
    setIsPlacingOrder(false);
    orderInProgressRef.current = false;
  };

  const getTotalPrice = (): number => {
    return cart.reduce((total, cartItem) => total + (cartItem.item.price * cartItem.quantity), 0);
  };

  const getTotalItems = (): number => {
    return cart.reduce((total, cartItem) => total + cartItem.quantity, 0);
  };

  const getDashboardRoute = (): string => {
    const role = userInfo?.role || 'student';
    
    const routes = {
      student: '/student',
      staff: '/staff',
      admin: '/admin'
    };

    console.log(`🎯 Routing to: ${routes[role]} (Role: ${role})`);
    return routes[role];
  };

  const getDashboardName = (): string => {
    const role = userInfo?.role || 'student';
    
    const names = {
      student: 'Student Dashboard',
      staff: 'Staff Dashboard',
      admin: 'Admin Dashboard'
    };

    return names[role];
  };

  const handleRetry = (): void => {
    orderPlacedRef.current = false;
    orderInProgressRef.current = false;
    retryCountRef.current = 0;
    
    setOrderFailed(false);
    setIsPlacingOrder(true);
    setProgress(0);
    
    setTimeout(() => placeOrder(cart), 1000);
  };

  const handleBackToMenu = (): void => {
    router.push('/');
  };

  const handleViewOrders = (): void => {
    const route = getDashboardRoute();
    router.push(route);
  };

  const handleContactSupport = (): void => {
    router.push('/contact');
  };

  const getRoleIcon = (): JSX.Element => {
    const role = userInfo?.role;
    
    switch (role) {
      case 'staff':
        return <Shield className="w-4 h-4" />;
      case 'admin':
        return <User className="w-4 h-4" />;
      default:
        return <User className="w-4 h-4" />;
    }
  };

  const getRoleColor = (): string => {
    const role = userInfo?.role;
    
    switch (role) {
      case 'staff':
        return 'from-blue-500 to-blue-600';
      case 'admin':
        return 'from-purple-500 to-purple-600';
      default:
        return 'from-green-500 to-green-600';
    }
  };

  // Enhanced Loading State
  if (isPlacingOrder) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md w-full animate-fade-in">
          {/* User Info Badge */}
          {userInfo && (
            <div className={`mb-6 inline-flex items-center gap-2 bg-gradient-to-r ${getRoleColor()} text-white px-4 py-2 rounded-full shadow-lg`}>
              {getRoleIcon()}
              <span className="text-sm font-medium">
                {userInfo.name} • {userInfo.role?.toUpperCase()}
              </span>
            </div>
          )}

          {/* Animated Progress */}
          <div className="mb-8">
            <div className="w-full bg-white/80 backdrop-blur-sm rounded-full h-4 mb-4 overflow-hidden shadow-inner border">
              <div 
                className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 h-4 rounded-full transition-all duration-300 ease-out shadow-lg"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-600 font-medium">
              <span>Processing</span>
              <span>{progress}%</span>
              <span>Complete</span>
            </div>
          </div>

          {/* Animated Icon */}
          <div className="relative mb-8">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center mx-auto shadow-2xl animate-pulse">
              <Package className="text-white w-10 h-10" />
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-400 rounded-full border-4 border-white animate-bounce" />
            <div className="absolute -bottom-2 -left-2 w-6 h-6 bg-yellow-400 rounded-full border-4 border-white animate-ping" />
          </div>
          
          <h1 className="text-4xl font-black text-gray-900 mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Creating Your Order
          </h1>
          
          <div className="space-y-6">
            {/* Order Summary */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-white shadow-xl">
              <div className="flex items-center justify-center gap-3 mb-4">
                <Utensils className="text-blue-500 w-5 h-5" />
                <span className="font-bold text-gray-800 text-lg">Order Summary</span>
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Items</span>
                  <span className="font-bold text-gray-900 bg-blue-100 px-3 py-1 rounded-full">
                    {getTotalItems()} items
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Amount</span>
                  <span className="font-bold text-green-600 text-xl">
                    ₹{getTotalPrice().toFixed(2)}
                  </span>
                </div>
                
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500 flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    Estimated Ready
                  </span>
                  <span className="font-semibold text-orange-500">{estimatedReadyTime}</span>
                </div>
              </div>
            </div>

            {/* Progress Steps */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 border border-white">
              <div className="space-y-3">
                {[
                  { label: "Validating items", done: progress >= 20 },
                  { label: "Processing payment", done: progress >= 40 },
                  { label: "Confirming order", done: progress >= 60 },
                  { label: "Notifying kitchen", done: progress >= 80 },
                  { label: "Finalizing", done: progress >= 95 }
                ].map((step, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                      step.done 
                        ? 'bg-green-500 text-white' 
                        : 'bg-gray-200 text-gray-400'
                    }`}>
                      {step.done ? '✓' : index + 1}
                    </div>
                    <span className={`text-sm ${
                      step.done ? 'text-green-600 font-medium' : 'text-gray-500'
                    }`}>
                      {step.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Enhanced Success State
  if (orderSuccess && orderData) {
    const dashboardName = getDashboardName();
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md w-full animate-scale-in">
          {/* Success Animation */}
          <div className="relative mb-8">
            <div className="w-28 h-28 bg-gradient-to-br from-green-400 to-emerald-600 rounded-3xl flex items-center justify-center mx-auto shadow-2xl animate-bounce">
              <CheckCircle className="text-white w-12 h-12" />
            </div>
            <div className="absolute -top-2 -right-2 w-10 h-10 bg-yellow-400 rounded-full border-4 border-white animate-ping" />
            <div className="absolute -bottom-2 -left-2 w-8 h-8 bg-blue-400 rounded-full border-4 border-white animate-pulse" />
          </div>
          
          <h1 className="text-5xl font-black text-gray-900 mb-4 bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
            Order Confirmed!
          </h1>

          {/* User Badge */}
          {userInfo && (
            <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-semibold mb-6 shadow-lg border">
              <span className="text-gray-700">
                Ordered by <span className="font-bold text-green-600">{userInfo.name}</span>
              </span>
            </div>
          )}

          <p className="text-gray-600 mb-8 text-lg font-medium">
            Your delicious meal is being prepared with care! 🍕
          </p>
          
          {/* Order Details Card */}
          <div className="bg-gradient-to-br from-green-500 to-emerald-600 text-white rounded-3xl p-7 mb-7 shadow-2xl transform hover:scale-[1.02] transition-all duration-300">
            <div className="flex items-center justify-center gap-3 mb-5">
              <CheckCircle className="text-white w-6 h-6" />
              <span className="font-bold text-xl">Order Details</span>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="font-medium">Order Number</span>
                <span className="font-black text-yellow-300 text-xl">
                  {orderData.order.orderNumber || `#${orderData.order._id?.slice(-8).toUpperCase()}`}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="font-medium">Total Items</span>
                <span className="font-bold">{getTotalItems()} items</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="font-medium">Total Amount</span>
                <span className="font-bold text-2xl">₹{getTotalPrice().toFixed(2)}</span>
              </div>
              
              <div className="flex justify-between items-center text-sm">
                <span>Status</span>
                <span className="font-bold bg-white/20 px-3 py-1 rounded-full">
                  🟢 {orderData.order.status.toUpperCase()}
                </span>
              </div>
            </div>
          </div>

          {/* Enhanced Action Buttons */}
          <div className="space-y-4">
            <button
              onClick={handleViewOrders}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white py-5 px-8 rounded-2xl font-black text-lg transition-all duration-300 shadow-2xl hover:shadow-3xl transform hover:scale-105 flex items-center justify-center gap-3 group"
            >
              <CheckCircle className="w-6 h-6 group-hover:scale-110 transition-transform" />
              View on {dashboardName}
            </button>
            
            <button
              onClick={handleBackToMenu}
              className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white py-4 px-8 rounded-2xl font-bold transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-105 flex items-center justify-center gap-3 group"
            >
              <Utensils className="w-5 h-5 group-hover:scale-110 transition-transform" />
              Order More Food
            </button>
            
            <div className="flex gap-3">
              <button
                onClick={() => window.print()}
                className="flex-1 bg-white hover:bg-gray-50 text-gray-700 py-3 px-4 rounded-xl font-semibold transition-all duration-200 border border-gray-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2 group"
              >
                <span className="group-hover:scale-110 transition-transform">📄</span>
                Print
              </button>
              
              <button
                onClick={() => navigator.share?.({ 
                  title: 'My Campus Canteen Order', 
                  text: `I just ordered ${getTotalItems()} items totaling ₹${getTotalPrice().toFixed(2)} from Campus Canteen! 🍕` 
                })}
                className="flex-1 bg-white hover:bg-gray-50 text-gray-700 py-3 px-4 rounded-xl font-semibold transition-all duration-200 border border-gray-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2 group"
              >
                <span className="group-hover:scale-110 transition-transform">📱</span>
                Share
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Enhanced Error State
  if (orderFailed) {
    const dashboardName = getDashboardName();
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-amber-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md w-full animate-shake">
          {/* Error Animation */}
          <div className="relative mb-8">
            <div className="w-28 h-28 bg-gradient-to-br from-red-400 to-orange-500 rounded-3xl flex items-center justify-center mx-auto shadow-2xl">
              <AlertCircle className="text-white w-12 h-12" />
            </div>
            <div className="absolute -top-2 -right-2 w-10 h-10 bg-yellow-400 rounded-full border-4 border-white animate-pulse" />
          </div>
          
          <h1 className="text-4xl font-black text-gray-900 mb-4 bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
            Order Issue
          </h1>
          
          {/* Error Details */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-white shadow-xl mb-7">
            <p className="text-gray-700 mb-4 text-lg font-semibold">{errorMessage}</p>
            
            {errorMessage?.toLowerCase().includes('duplicate') && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-yellow-600">💡</span>
                  </div>
                  <div className="text-left">
                    <p className="text-yellow-800 font-bold text-sm">Duplicate Order</p>
                    <p className="text-yellow-700 text-xs mt-1">
                      Check your dashboard - this order might already be processing.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {errorMessage?.toLowerCase().includes('admin') && (
              <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Shield className="w-4 h-4 text-purple-600" />
                  </div>
                  <div className="text-left">
                    <p className="text-purple-800 font-bold text-sm">Admin Account</p>
                    <p className="text-purple-700 text-xs mt-1">
                      Admin accounts are for management only. Please use a student or staff account to place orders.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Enhanced Action Buttons */}
          <div className="space-y-3">
            {!errorMessage?.toLowerCase().includes('admin') && (
              <button
                onClick={handleRetry}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white py-4 px-6 rounded-xl font-bold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center gap-3 group"
              >
                <Loader className="w-5 h-5 group-hover:rotate-180 transition-transform" />
                Try Again ({maxRetries - retryCountRef.current} left)
              </button>
            )}
            
            <button
              onClick={handleBackToMenu}
              className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white py-3 px-6 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center gap-3 group"
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              Back to Menu
            </button>
            
            <button
              onClick={handleViewOrders}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white py-3 px-6 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center gap-3 group"
            >
              <span className="group-hover:scale-110 transition-transform">📊</span>
              View {dashboardName}
            </button>
            
            <button
              onClick={handleContactSupport}
              className="w-full bg-white hover:bg-gray-50 text-gray-700 py-3 px-6 rounded-xl font-semibold transition-all duration-200 border border-gray-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-3 group"
            >
              <span className="group-hover:scale-110 transition-transform">📞</span>
              Contact Support
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Default Loading State
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-slate-50 to-blue-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-20 h-20 bg-gradient-to-r from-gray-400 to-blue-400 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl">
          <Loader className="text-white w-8 h-8 animate-spin" />
        </div>
        <p className="text-gray-600 font-medium text-lg">Preparing order system...</p>
      </div>
    </div>
  );
}