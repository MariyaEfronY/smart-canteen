"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, ShoppingCart, Loader } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

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
  const [cart, setCart] = useState<CartItem[]>([]);

  useEffect(() => {
    placeOrderAfterLogin();
  }, []);

  const placeOrderAfterLogin = async () => {
    try {
      // Get cart data from localStorage
      const redirectData = localStorage.getItem('loginRedirect');
      if (!redirectData) {
        toast.error("No order data found");
        router.push('/');
        return;
      }

      const { cart: savedCart } = JSON.parse(redirectData);
      setCart(savedCart);

      if (!savedCart || savedCart.length === 0) {
        toast.error("Cart is empty");
        router.push('/');
        return;
      }

      // Prepare order data matching your backend
      const orderData = {
        items: savedCart.map((cartItem: CartItem) => ({
          item: cartItem.item._id, // ✅ Match backend expectation
          quantity: cartItem.quantity,
        })),
      };

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

      // Order successful
      setOrderSuccess(true);
      toast.success("Order placed successfully!");
      
      // Clear cart and redirect data
      localStorage.removeItem('loginRedirect');
      localStorage.removeItem('canteenCart');

      // Redirect to dashboard after delay
      setTimeout(() => {
        router.push('/student'); // Will be redirected based on actual role
      }, 2000);

    } catch (error: any) {
      console.error("Order placement error:", error);
      toast.error(error.message || "Failed to place order");
      
      // Redirect back to main page on error
      setTimeout(() => {
        router.push('/');
      }, 2000);
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const getTotalPrice = () => {
    return cart.reduce((total, cartItem) => total + (cartItem.item.price * cartItem.quantity), 0);
  };

  if (isPlacingOrder) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center">
        <Toaster position="top-right" />
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-500 mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Placing Your Order</h2>
          <p className="text-gray-600">Please wait while we process your order...</p>
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
            Redirecting you to your dashboard...
          </p>
          <div className="bg-white rounded-2xl p-6 border border-gray-200 mb-6">
            <h3 className="font-semibold text-gray-900 mb-4">Order Summary</h3>
            <div className="space-y-3">
              {cart.map((cartItem, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span className="text-gray-700">{cartItem.item.name} × {cartItem.quantity}</span>
                  <span className="font-semibold">₹{cartItem.item.price * cartItem.quantity}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-gray-200 mt-4 pt-4">
              <div className="flex justify-between items-center font-bold text-lg">
                <span>Total:</span>
                <span className="text-green-600">₹{getTotalPrice().toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center">
      <Toaster position="top-right" />
      <div className="text-center">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <ShoppingCart className="text-red-600" size={40} />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Order Failed</h2>
        <p className="text-gray-600 mb-6">There was an issue placing your order.</p>
        <button
          onClick={() => router.push('/')}
          className="bg-green-500 text-white px-6 py-3 rounded-xl hover:bg-green-600 transition-colors duration-300"
        >
          Return to Home
        </button>
      </div>
    </div>
  );
}