"use client";

import { useState, useEffect } from "react";
import { Clock, CheckCircle, XCircle, ChefHat, Package, LogOut, User, CreditCard, Calendar, Utensils } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { useRouter } from "next/navigation";

interface OrderItem {
  item: {
    _id: string;
    name: string;
    price: number;
    imageUrl: string;
  };
  quantity: number;
}

interface Order {
  _id: string;
  userId: string;
  userName: string;
  role: "student" | "staff";
  items: OrderItem[];
  totalAmount: number;
  status: "pending" | "preparing" | "ready" | "completed" | "cancelled";
  createdAt: string;
  updatedAt: string;
}

export default function StudentDashboard() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    fetchUserData();
    fetchOrders();
  }, []);

  const fetchUserData = async () => {
    try {
      const response = await fetch("/api/auth/me");
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
        router.push("/login");
      }
    } catch (error) {
      console.error("Error fetching user:", error);
      router.push("/login");
    }
  };

  const fetchOrders = async () => {
  try {
    setIsLoading(true);
    const response = await fetch("/api/orders", {
      credentials: "include" // Important for session cookies
    });
    
    if (response.ok) {
      const ordersData = await response.json();
      setOrders(ordersData);
    } else if (response.status === 401) {
      // Redirect to login if unauthorized
      router.push("/login");
    } else {
      toast.error("Failed to fetch orders");
    }
  } catch (error) {
    console.error("Error fetching orders:", error);
    toast.error("Error loading orders");
  } finally {
    setIsLoading(false);
  }
};

  const handleCancelOrder = async (orderId: string) => {
    if (!confirm("Are you sure you want to cancel this order?")) return;

    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "cancelled" }),
      });

      if (response.ok) {
        toast.success("Order cancelled successfully!");
        fetchOrders();
      } else {
        toast.error("Failed to cancel order");
      }
    } catch (error) {
      console.error("Error cancelling order:", error);
      toast.error("Error cancelling order");
    }
  };

  const handleLogout = async () => {
    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      if (response.ok) {
        toast.success("Logged out successfully!");
        router.push("/");
      }
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Logout failed");
    }
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case "pending":
        return { icon: Clock, color: "text-yellow-600 bg-yellow-100", label: "Pending" };
      case "preparing":
        return { icon: ChefHat, color: "text-blue-600 bg-blue-100", label: "Preparing" };
      case "ready":
        return { icon: Package, color: "text-green-600 bg-green-100", label: "Ready for Pickup" };
      case "completed":
        return { icon: CheckCircle, color: "text-emerald-600 bg-emerald-100", label: "Completed" };
      case "cancelled":
        return { icon: XCircle, color: "text-red-600 bg-red-100", label: "Cancelled" };
      default:
        return { icon: Clock, color: "text-gray-600 bg-gray-100", label: "Unknown" };
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredOrders = orders.filter(order => {
    if (activeTab === "all") return true;
    return order.status === activeTab;
  });

  const stats = {
    total: orders.length,
    pending: orders.filter(order => order.status === "pending").length,
    preparing: orders.filter(order => order.status === "preparing").length,
    completed: orders.filter(order => order.status === "completed").length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-green-600 text-white shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center shadow-lg">
                <User size={24} className="text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Student Dashboard</h1>
                <p className="text-blue-200">
                  Welcome back, {user?.name || "Student"}!
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="bg-white bg-opacity-20 text-white px-6 py-3 rounded-xl hover:bg-opacity-30 transition-all duration-300 flex items-center gap-2"
            >
              <LogOut size={20} /> Logout
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-semibold">Total Orders</p>
                <p className="text-3xl font-bold text-blue-600">{stats.total}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <CreditCard className="text-blue-600" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-semibold">Pending</p>
                <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                <Clock className="text-yellow-600" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-semibold">Preparing</p>
                <p className="text-3xl font-bold text-blue-600">{stats.preparing}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <ChefHat className="text-blue-600" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-semibold">Completed</p>
                <p className="text-3xl font-bold text-green-600">{stats.completed}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <CheckCircle className="text-green-600" size={24} />
              </div>
            </div>
          </div>
        </div>

        {/* Orders Section */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
          <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
              <Utensils className="text-blue-500" size={28} />
              My Orders
            </h2>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200">
            <div className="px-6 flex space-x-8">
              {[
                { id: "all", label: "All Orders", count: orders.length },
                { id: "pending", label: "Pending", count: stats.pending },
                { id: "preparing", label: "Preparing", count: stats.preparing },
                { id: "ready", label: "Ready", count: orders.filter(o => o.status === "ready").length },
                { id: "completed", label: "Completed", count: stats.completed },
                { id: "cancelled", label: "Cancelled", count: orders.filter(o => o.status === "cancelled").length },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-all duration-300 ${
                    activeTab === tab.id
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  {tab.label}
                  <span className="ml-2 bg-gray-100 text-gray-900 py-0.5 px-2 rounded-full text-xs">
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Orders List */}
          <div className="p-6">
            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                <p className="text-gray-500 mt-4">Loading your orders...</p>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Package className="text-blue-500" size={40} />
                </div>
                <p className="text-gray-500 text-lg mb-4">
                  {activeTab === "all" ? "No orders found" : `No ${activeTab} orders`}
                </p>
                <button
                  onClick={() => router.push("/menu")}
                  className="bg-gradient-to-r from-blue-500 to-green-500 text-white px-8 py-3 rounded-xl hover:from-blue-600 hover:to-green-600 transition-all duration-300"
                >
                  Browse Menu
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {filteredOrders.map((order) => {
                  const StatusIcon = getStatusInfo(order.status).icon;
                  const statusColor = getStatusInfo(order.status).color;
                  const statusLabel = getStatusInfo(order.status).label;

                  return (
                    <div
                      key={order._id}
                      className="border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-all duration-300 bg-white"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-lg font-semibold text-gray-900">
                              Order #{order._id.slice(-8).toUpperCase()}
                            </span>
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColor} flex items-center gap-1`}>
                              <StatusIcon size={16} />
                              {statusLabel}
                            </span>
                          </div>
                          <p className="text-gray-600 text-sm">
                            Placed on {formatDate(order.createdAt)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-green-600">
                            ₹{order.totalAmount.toFixed(2)}
                          </p>
                          {order.status === "pending" && (
                            <button
                              onClick={() => handleCancelOrder(order._id)}
                              className="mt-2 text-red-600 hover:text-red-700 text-sm font-medium transition-colors duration-300"
                            >
                              Cancel Order
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="border-t border-gray-100 pt-4">
                        <h4 className="font-semibold text-gray-900 mb-3">Order Items:</h4>
                        <div className="space-y-3">
                          {order.items.map((orderItem, index) => (
                            <div key={index} className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <img
                                  src={orderItem.item.imageUrl}
                                  alt={orderItem.item.name}
                                  className="w-12 h-12 rounded-lg object-cover"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = "/placeholder-food.jpg";
                                  }}
                                />
                                <div>
                                  <p className="font-medium text-gray-900">{orderItem.item.name}</p>
                                  <p className="text-gray-600 text-sm">
                                    ₹{orderItem.item.price} × {orderItem.quantity}
                                  </p>
                                </div>
                              </div>
                              <p className="font-semibold text-gray-900">
                                ₹{(orderItem.item.price * orderItem.quantity).toFixed(2)}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}