"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ShoppingCart, CheckCircle, ArrowLeft } from "lucide-react";
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

// ✅ Main wrapper component with Suspense
export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center text-gray-500">Loading checkout...</div>}>
      <CheckoutPageInner />
    </Suspense>
  );
}

// ✅ Inner component containing your full logic
function CheckoutPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Load pending order cart from localStorage
    const pendingCart = localStorage.getItem("pendingOrderCart");
    if (pendingCart) {
      setCart(JSON.parse(pendingCart));
    } else {
      toast.error("No pending order found");
      router.push("/");
    }
  }, [router]);

  const getTotalPrice = () => {
    return cart.reduce((total, cartItem) => total + cartItem.item.price * cartItem.quantity, 0);
  };

  const getTotalItems = () => {
    return cart.reduce((total, cartItem) => total + cartItem.quantity, 0);
  };

  const placeOrder = async () => {
    if (cart.length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    setIsLoading(true);
    try {
      const orderData = {
        items: cart.map((item) => ({
          itemId: item.item._id,
          quantity: item.quantity,
        })),
        totalAmount: getTotalPrice(),
      };

      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(orderData),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.message || "Failed to place order");

      toast.success("Order placed successfully!");

      // Clear local storage
      localStorage.removeItem("pendingOrderCart");
      localStorage.removeItem("pendingOrderTotal");

      // Redirect to orders page
      setTimeout(() => {
        window.location.href = "/orders";
      }, 1500);
    } catch (error: any) {
      console.error("Order error:", error);
      toast.error(error.message || "Failed to place order");
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ Empty cart state
  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShoppingCart className="text-gray-400" size={32} />
          </div>
          <p className="text-gray-500 text-lg mb-4">No pending order found</p>
          <button
            onClick={() => router.push("/")}
            className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600"
          >
            Back to Menu
          </button>
        </div>
      </div>
    );
  }

  // ✅ Checkout Page Layout
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <Toaster position="top-right" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft size={20} />
            Back to Menu
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Complete Your Order</h1>
          <div className="w-20"></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Order Summary */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Order Summary</h2>

              <div className="space-y-4">
                {cart.map((cartItem) => (
                  <div
                    key={cartItem.item._id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <img
                        src={cartItem.item.imageUrl}
                        alt={cartItem.item.name}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                      <div>
                        <h3 className="font-semibold text-gray-900">{cartItem.item.name}</h3>
                        <p className="text-green-600 font-bold">₹{cartItem.item.price}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-600">Qty: {cartItem.quantity}</p>
                      <p className="font-semibold text-gray-900">
                        ₹{(cartItem.item.price * cartItem.quantity).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Total */}
              <div className="border-t border-gray-200 mt-6 pt-6">
                <div className="flex justify-between items-center text-lg font-bold">
                  <span>Total Amount:</span>
                  <span className="text-green-600 text-xl">₹{getTotalPrice().toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Checkout Panel */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 sticky top-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Complete Order</h3>

              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-green-800 text-sm text-center">
                    {"✅ You're logged in and ready to order!"}
                  </p>
                </div>

                <button
                  onClick={placeOrder}
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white py-4 px-6 rounded-xl font-semibold text-lg hover:from-green-600 hover:to-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Placing Order...
                    </>
                  ) : (
                    <>
                      <CheckCircle size={20} />
                      Place Order
                    </>
                  )}
                </button>

                <p className="text-gray-500 text-sm text-center">
                  By placing this order, you agree to our terms and conditions
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
