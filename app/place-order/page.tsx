// app/place-order/page.tsx - SIMPLIFIED & CORRECTED VERSION
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, ShoppingCart, Loader, ArrowLeft, AlertCircle } from "lucide-react";
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

  useEffect(() => {
    const savedCart = localStorage.getItem('loginRedirect');
    if (!savedCart) {
      console.log("No cart data found, redirecting to home");
      router.push('/');
      return;
    }

    try {
      const { cart: savedCartData } = JSON.parse(savedCart);
      if (!savedCartData || savedCartData.length === 0) {
        console.log("Empty cart, redirecting to home");
        router.push('/');
        return;
      }
      
      console.log("Cart data found:", savedCartData.length, "items");
      setCart(savedCartData);
      placeOrder(savedCartData);
    } catch (error) {
      console.error('Error parsing cart data:', error);
      router.push('/');
    }
  }, [router]);

  const placeOrder = async (cartItems: CartItem[]) => {
    if (!cartItems || cartItems.length === 0) {
      setErrorMessage("Cart is empty");
      setOrderFailed(true);
      setIsPlacingOrder(false);
      return;
    }

    try {
      setIsPlacingOrder(true);
      setOrderFailed(false);
      setErrorMessage("");

      console.log("Placing order with items:", cartItems);

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

      console.log("After duplicate removal:", uniqueCart);

      const orderPayload = {
        items: uniqueCart.map(cartItem => ({
          item: cartItem.item._id,
          quantity: cartItem.quantity,
        })),
        clientTimestamp: Date.now(),
        orderIdentifier: `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      };

      console.log("Sending order payload:", orderPayload);

      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(orderPayload),
      });

      const data = await response.json();
      console.log("Order response:", data);

      if (!response.ok) {
        throw new Error(data.message || `Failed to place order: ${response.status}`);
      }

      // Success - store the complete order data
      setOrderData(data);
      setOrderSuccess(true);
      
      // Clean up localStorage
      localStorage.removeItem('loginRedirect');
      localStorage.removeItem('canteenCart');
      
      console.log("Order placed successfully, cart cleared");
      
    } catch (error: any) {
      console.error("Order placement error:", error);
      setErrorMessage(error.message || "Failed to place order. Please try again.");
      setOrderFailed(true);
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
    setOrderFailed(false);
    setIsPlacingOrder(true);
    // Retry with current cart
    setTimeout(() => placeOrder(cart), 1000);
  };

  const handleBackToMenu = () => {
    router.push('/');
  };

  const handleViewOrders = () => {
    // Redirect to student dashboard or home since we don't have my-orders page
    router.push('/student');
  };

  // Loading state
  if (isPlacingOrder) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md w-full">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-500 mx-auto mb-6"></div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Placing Your Order</h2>
          <p className="text-gray-600 mb-6">We're preparing your delicious meal...</p>
          
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Items:</span>
                <span className="font-semibold">{getTotalItems()} items</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total Amount:</span>
                <span className="font-semibold text-green-600">₹{getTotalPrice().toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Success state
  if (orderSuccess && orderData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md w-full">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="text-green-600" size={40} />
          </div>
          
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Order Confirmed! 🎉</h2>
          <p className="text-gray-600 mb-6">
            Your order has been placed successfully and is being prepared.
          </p>
          
          {/* Order Details */}
          <div className="bg-green-50 border border-green-200 rounded-2xl p-6 mb-6">
            <div className="flex items-center justify-center gap-2 mb-3">
              <CheckCircle className="text-green-600" size={20} />
              <span className="font-semibold text-green-800">Order Details</span>
            </div>
            <p className="text-green-800 font-medium mb-2">
              Order #: <span className="font-bold">
                {orderData.order?.orderNumber || orderData.order?._id?.slice(-8).toUpperCase() || 'N/A'}
              </span>
            </p>
            <p className="text-green-700 text-sm">
              {getTotalItems()} items • ₹{getTotalPrice().toFixed(2)}
            </p>
          </div>

          {/* Order Summary */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm mb-6">
            <h3 className="font-semibold text-gray-900 mb-4 text-lg">Order Summary</h3>
            <div className="space-y-3 max-h-60 overflow-y-auto mb-4">
              {cart.map((cartItem, index) => (
                <div key={`${cartItem.item._id}-${index}`} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                  <div className="text-left flex-1">
                    <span className="text-gray-700 font-medium block">{cartItem.item.name}</span>
                    <span className="text-gray-500 text-sm">× {cartItem.quantity}</span>
                  </div>
                  <span className="font-semibold text-gray-900">
                    ₹{(cartItem.item.price * cartItem.quantity).toFixed(2)}
                  </span>
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

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleViewOrders}
              className="w-full bg-green-500 text-white py-4 px-6 rounded-xl font-semibold text-lg hover:bg-green-600 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              View Dashboard
            </button>
            <button
              onClick={handleBackToMenu}
              className="w-full bg-white text-gray-700 py-3 px-6 rounded-xl font-semibold hover:bg-gray-50 transition-all duration-200 border border-gray-300"
            >
              Order More Food
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (orderFailed) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md w-full">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="text-red-600" size={40} />
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Order Failed</h2>
          <p className="text-gray-600 mb-2">{errorMessage}</p>
          
          {errorMessage?.toLowerCase().includes('duplicate') && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
              <p className="text-yellow-800 text-sm">
                💡 <strong>Tip:</strong> It seems this order was already placed. Check your dashboard.
              </p>
            </div>
          )}

          <div className="space-y-3">
            <button
              onClick={handleRetry}
              className="w-full bg-green-500 text-white py-3 px-6 rounded-xl font-semibold hover:bg-green-600 transition-colors duration-300"
            >
              Try Again
            </button>
            <button
              onClick={handleBackToMenu}
              className="w-full bg-blue-500 text-white py-3 px-6 rounded-xl font-semibold hover:bg-blue-600 transition-colors duration-300"
            >
              Back to Menu
            </button>
            <button
              onClick={handleViewOrders}
              className="w-full bg-gray-500 text-white py-3 px-6 rounded-xl font-semibold hover:bg-gray-600 transition-colors duration-300"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Default loading state
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center">
      <div className="text-center">
        <Loader className="animate-spin text-green-500 mx-auto mb-4" size={32} />
        <p className="text-gray-600">Loading order...</p>
      </div>
    </div>
  );
}