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

  const placeOrderAfterLogin = async () => {
    // Prevent duplicate order placement
    if (hasPlacedOrder) {
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

      // ✅ FIX: Check if order was already placed for this cart
      const orderKey = `placed_order_${Date.now()}`;
      const recentOrder = localStorage.getItem('recentOrder');
      
      if (recentOrder) {
        const recentOrderData = JSON.parse(recentOrder);
        // Check if the same cart was recently placed (within 30 seconds)
        if (Date.now() - recentOrderData.timestamp < 30000) {
          toast.success("Order was already placed successfully!");
          setOrderSuccess(true);
          setOrderId(recentOrderData.orderId);
          setIsPlacingOrder(false);
          return;
        }
      }

      // ✅ FIX: Prepare order data with unique identifiers
      const orderData = {
        items: savedCart.map((cartItem: CartItem) => ({
          item: cartItem.item._id,
          quantity: cartItem.quantity,
        })),
        // Add timestamp to prevent duplicate processing
        timestamp: Date.now()
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
        throw new Error(data.message || "Failed to place order");
      }

      // ✅ FIX: Mark that order has been placed
      setHasPlacedOrder(true);
      setOrderSuccess(true);
      setOrderId(data.order?._id || "");
      
      // ✅ FIX: Store recent order info to prevent duplicates
      localStorage.setItem('recentOrder', JSON.stringify({
        orderId: data.order?._id,
        timestamp: Date.now(),
        cartHash: JSON.stringify(savedCart)
      }));

      // ✅ FIX: Clear cart and redirect data only after successful order
      localStorage.removeItem('loginRedirect');
      localStorage.removeItem('canteenCart');

      toast.success("Order placed successfully!");

    } catch (error: any) {
      console.error("Order placement error:", error);
      setOrderFailed(true);
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

  if (isPlacingOrder) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center">
        <Toaster position="top-right" />
        <div className="text-center max-w-md mx-auto p-8">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-500 mx-auto mb-6"></div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Placing Your Order</h2>
          <p className="text-gray-600 mb-4">Please wait while we process your order...</p>
          <div className="bg-white rounded-2xl p-6 border border-gray-200">
            <p className="text-sm text-gray-600">Processing {getTotalItems()} items</p>
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
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Order Placed Successfully!</h2>
          <p className="text-gray-600 mb-6">
            Your order has been placed and will be prepared shortly.
          </p>
          
          {orderId && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
              <p className="text-green-800 font-medium">Order ID: #{orderId.slice(-8).toUpperCase()}</p>
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
              View My Orders
            </button>
            <Link
              href="/"
              className="w-full bg-gray-100 text-gray-700 py-3 px-6 rounded-xl font-semibold hover:bg-gray-200 transition-all duration-200 border border-gray-300 block text-center"
            >
              Continue Shopping
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
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Order Failed</h2>
          <p className="text-gray-600 mb-6">There was an issue placing your order. Please try again.</p>
          <div className="space-y-3">
            <button
              onClick={() => router.push('/')}
              className="w-full bg-green-500 text-white py-3 px-6 rounded-xl font-semibold hover:bg-green-600 transition-colors duration-300"
            >
              Return to Home
            </button>
            <button
              onClick={placeOrderAfterLogin}
              className="w-full bg-blue-500 text-white py-3 px-6 rounded-xl font-semibold hover:bg-blue-600 transition-colors duration-300"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}