// app/place-order/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, ShoppingCart, Loader, ArrowLeft } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
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

export default function PlaceOrder() {
  const router = useRouter();
  const [isPlacingOrder, setIsPlacingOrder] = useState(true);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderFailed, setOrderFailed] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orderId, setOrderId] = useState<string>("");
  const [hasPlacedOrder, setHasPlacedOrder] = useState(false);

  useEffect(() => {
    placeOrderAfterLogin();
  }, []);

  // ✅ FIX: Generate unique cart hash to detect duplicates
  const generateCartHash = (cartItems: CartItem[]): string => {
    return cartItems
      .map(item => `${item.item._id}-${item.quantity}`)
      .sort()
      .join('|');
  };

  const placeOrderAfterLogin = async () => {
    // ✅ FIX: Prevent duplicate order placement with multiple checks
    if (hasPlacedOrder) {
      console.log("Order already placed, preventing duplicate");
      return;
    }

    try {
      // Get cart data from localStorage
      const redirectData = localStorage.getItem('loginRedirect');
      if (!redirectData) {
        toast.error("No order data found");
        router.push('/');
        return;
      }

      const { cart: savedCart } = JSON.parse(redirectData);
      
      // Validate cart data
      if (!savedCart || !Array.isArray(savedCart) || savedCart.length === 0) {
        toast.error("Cart is empty");
        router.push('/');
        return;
      }

      setCart(savedCart);

      // ✅ FIX: Enhanced duplicate detection with cart hash
      const currentCartHash = generateCartHash(savedCart);
      const recentOrder = localStorage.getItem('recentOrder');
      
      if (recentOrder) {
        const recentOrderData = JSON.parse(recentOrder);
        // Check if the same cart was recently placed (within 2 minutes)
        const timeDiff = Date.now() - recentOrderData.timestamp;
        const isSameCart = recentOrderData.cartHash === currentCartHash;
        
        if (timeDiff < 120000 && isSameCart) { // 2 minutes window
          console.log("Duplicate order detected, redirecting to success");
          toast.success("Order was already placed successfully!");
          setOrderSuccess(true);
          setOrderId(recentOrderData.orderId);
          setIsPlacingOrder(false);
          setHasPlacedOrder(true);
          return;
        }
      }

      // ✅ FIX: Immediate flag to prevent duplicate API calls
      setHasPlacedOrder(true);

      // ✅ FIX: Prepare order data with server-side validation
      const orderData = {
        items: savedCart.map((cartItem: CartItem) => ({
          item: cartItem.item._id,
          quantity: cartItem.quantity,
        })),
        // Add client-side identifier for duplicate detection
        clientTimestamp: Date.now(),
        cartHash: currentCartHash
      };

      console.log("Placing order with data:", orderData);

      // Place the order
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
        // ✅ FIX: Reset placement flag on failure to allow retry
        setHasPlacedOrder(false);
        throw new Error(data.message || "Failed to place order");
      }

      // ✅ FIX: Verify the order was created with correct items
      if (data.order && data.order.items) {
        const placedItemsCount = data.order.items.reduce((total: number, item: any) => total + item.quantity, 0);
        const originalItemsCount = savedCart.reduce((total, item) => total + item.quantity, 0);
        
        if (placedItemsCount !== originalItemsCount) {
          console.warn(`Item count mismatch: Original ${originalItemsCount}, Placed ${placedItemsCount}`);
        }
      }

      setOrderSuccess(true);
      setOrderId(data.order?._id || "");
      
      // ✅ FIX: Store recent order info with enhanced data
      localStorage.setItem('recentOrder', JSON.stringify({
        orderId: data.order?._id,
        timestamp: Date.now(),
        cartHash: currentCartHash,
        itemCount: savedCart.reduce((total, item) => total + item.quantity, 0)
      }));

      // ✅ FIX: Clear cart data only after successful order
      localStorage.removeItem('loginRedirect');
      localStorage.removeItem('canteenCart');

      toast.success(`Order placed successfully! ${savedCart.length} item(s)`);

    } catch (error: any) {
      console.error("Order placement error:", error);
      setOrderFailed(true);
      // ✅ FIX: Reset placement flag on error
      setHasPlacedOrder(false);
      toast.error(error.message || "Failed to place order");
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const handleDashboardRedirect = () => {
    router.push('/student');
  };

  const getTotalPrice = () => {
    return cart.reduce((total, cartItem) => total + (cartItem.item.price * cartItem.quantity), 0);
  };

  const getTotalItems = () => {
    return cart.reduce((total, cartItem) => total + cartItem.quantity, 0);
  };

  // ✅ FIX: Add retry function with proper cleanup
  const handleRetry = () => {
    // Clear any existing order data
    localStorage.removeItem('recentOrder');
    setHasPlacedOrder(false);
    setOrderFailed(false);
    setIsPlacingOrder(true);
    
    // Small delay to ensure state reset
    setTimeout(() => {
      placeOrderAfterLogin();
    }, 500);
  };

  if (isPlacingOrder) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center">
        <Toaster position="top-right" />
        <div className="text-center max-w-md mx-auto p-8">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-500 mx-auto mb-6"></div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Placing Your Order</h2>
          <p className="text-gray-600 mb-4">Processing your delicious meal...</p>
          <div className="bg-white rounded-2xl p-6 border border-gray-200">
            <p className="text-sm text-gray-600">
              Ordering {getTotalItems()} item{getTotalItems() !== 1 ? 's' : ''} from your cart
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (orderSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center">
        <Toaster position="top-right" />
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="text-green-600" size={40} />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Order Confirmed! 🎉</h2>
          <p className="text-gray-600 mb-6">
            Your delicious meal is being prepared with care.
          </p>
          
          {orderId && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
              <p className="text-green-800 font-medium">
                Order ID: <span className="font-bold">#{orderId.slice(-8).toUpperCase()}</span>
              </p>
              <p className="text-green-700 text-sm mt-1">
                {getTotalItems()} item{getTotalItems() !== 1 ? 's' : ''} • ₹{getTotalPrice().toFixed(2)}
              </p>
            </div>
          )}

          <div className="bg-white rounded-2xl p-6 border border-gray-200 mb-6">
            <h3 className="font-semibold text-gray-900 mb-4 text-lg">Order Summary</h3>
            <div className="space-y-3 mb-4">
              {cart.map((cartItem, index) => (
                <div key={`${cartItem.item._id}-${index}`} className="flex justify-between items-center">
                  <div className="text-left">
                    <span className="text-gray-700 font-medium">{cartItem.item.name}</span>
                    <span className="text-gray-500 text-sm ml-2">× {cartItem.quantity}</span>
                  </div>
                  <span className="font-semibold">₹{cartItem.item.price * cartItem.quantity}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-gray-200 pt-4">
              <div className="flex justify-between items-center font-bold text-lg">
                <span>Total Amount:</span>
                <span className="text-green-600">₹{getTotalPrice().toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleDashboardRedirect}
              className="w-full bg-green-500 text-white py-4 px-6 rounded-xl font-semibold text-lg hover:bg-green-600 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Track My Orders
            </button>
            <Link
              href="/"
              className="w-full bg-gray-100 text-gray-700 py-3 px-6 rounded-xl font-semibold hover:bg-gray-200 transition-all duration-200 border border-gray-300 block text-center"
            >
              Order More Food
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (orderFailed) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center">
        <Toaster position="top-right" />
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShoppingCart className="text-red-600" size={40} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Order Issue</h2>
          <p className="text-gray-600 mb-6">We encountered a problem placing your order.</p>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
            <p className="text-yellow-800 text-sm">
              💡 <strong>Tip:</strong> Check if you have duplicate items in your cart
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleRetry}
              className="w-full bg-green-500 text-white py-3 px-6 rounded-xl font-semibold hover:bg-green-600 transition-colors duration-300"
            >
              Try Placing Order Again
            </button>
            <button
              onClick={() => router.push('/')}
              className="w-full bg-blue-500 text-white py-3 px-6 rounded-xl font-semibold hover:bg-blue-600 transition-colors duration-300"
            >
              Review Cart & Try Again
            </button>
            <Link
              href="/student"
              className="w-full bg-gray-500 text-white py-3 px-6 rounded-xl font-semibold hover:bg-gray-600 transition-colors duration-300 block text-center"
            >
              Go to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return null;
}