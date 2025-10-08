// app/student/page.tsx
"use client";

import { useState, useEffect } from "react";
import { Clock, CheckCircle, XCircle, ChefHat, Package, LogOut, User, CreditCard, Utensils, RefreshCw, GraduationCap, BookOpen } from "lucide-react";
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
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    fetchUserData();
    fetchOrders();
  }, []);

  const fetchUserData = async () => {
    try {
      const response = await fetch("/api/auth/me", {
        credentials: "include"
      });
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
      setIsRefreshing(true);
      const response = await fetch("/api/orders", {
        credentials: "include",
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      
      if (response.ok) {
        const ordersData = await response.json();
        console.log("Fetched orders:", ordersData);
        setOrders(ordersData);
      } else if (response.status === 401) {
        toast.error("Please login again");
        router.push("/login");
      } else {
        toast.error("Failed to fetch orders");
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast.error("Error loading orders");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    if (!confirm("Are you sure you want to cancel this order?")) return;

    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: "cancelled" }),
      });

      if (response.ok) {
        toast.success("Order cancelled successfully!");
        fetchOrders();
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || "Failed to cancel order");
      }
    } catch (error) {
      console.error("Error cancelling order:", error);
      toast.error("Error cancelling order");
    }
  };

  const handleLogout = async () => {
    try {
      const response = await fetch("/api/auth/logout", { 
        method: "POST",
        credentials: "include"
      });
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
        return { icon: Clock, color: "text-yellow-600 bg-yellow-100 border border-yellow-200", label: "Pending" };
      case "preparing":
        return { icon: ChefHat, color: "text-blue-600 bg-blue-100 border border-blue-200", label: "Preparing" };
      case "ready":
        return { icon: Package, color: "text-green-600 bg-green-100 border border-green-200", label: "Ready for Pickup" };
      case "completed":
        return { icon: CheckCircle, color: "text-emerald-600 bg-emerald-100 border border-emerald-200", label: "Completed" };
      case "cancelled":
        return { icon: XCircle, color: "text-red-600 bg-red-100 border border-red-200", label: "Cancelled" };
      default:
        return { icon: Clock, color: "text-gray-600 bg-gray-100 border border-gray-200", label: "Unknown" };
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
    cancelled: orders.filter(order => order.status === "cancelled").length,
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-5"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-6 gap-4">
            <div className="flex items-center space-x-4">
              {/* Student Logo */}
              <div className="relative">
                <div className="w-14 h-14 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-2xl transform rotate-6 border-2 border-white border-opacity-30">
                  <GraduationCap size={28} className="text-white" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-400 rounded-full border-2 border-white flex items-center justify-center">
                  <BookOpen size={10} className="text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-white to-yellow-100 bg-clip-text text-transparent">
                  Student Dashboard
                </h1>
                <p className="text-indigo-200 text-sm sm:text-base">
                  Welcome back, <span className="font-semibold text-white">{user?.name || "Student"}! 👋</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                onClick={fetchOrders}
                disabled={isRefreshing}
                className="flex-1 sm:flex-none bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-4 py-3 sm:py-3 rounded-xl hover:from-cyan-600 hover:to-blue-600 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 text-sm sm:text-base shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 border border-white border-opacity-20"
              >
                <RefreshCw size={18} className={isRefreshing ? "animate-spin" : ""} />
                <span>Refresh</span>
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 sm:flex-none bg-gradient-to-r from-red-500 to-pink-500 text-white px-4 py-3 sm:px-6 sm:py-3 rounded-xl hover:from-red-600 hover:to-pink-600 transition-all duration-300 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 text-sm sm:text-base border border-white border-opacity-20"
              >
                <LogOut size={18} />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-2 lg:grid-cols-5 md:grid-cols-3 gap-4 sm:gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-xs sm:text-sm font-semibold">Total Orders</p>
                <p className="text-xl sm:text-3xl font-bold text-indigo-600">{stats.total}</p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-xl flex items-center justify-center">
                <CreditCard className="text-indigo-600" size={20} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-xs sm:text-sm font-semibold">Pending</p>
                <p className="text-xl sm:text-3xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-yellow-100 to-orange-100 rounded-xl flex items-center justify-center">
                <Clock className="text-yellow-600" size={20} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-xs sm:text-sm font-semibold">Preparing</p>
                <p className="text-xl sm:text-3xl font-bold text-blue-600">{stats.preparing}</p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-xl flex items-center justify-center">
                <ChefHat className="text-blue-600" size={20} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-xs sm:text-sm font-semibold">Completed</p>
                <p className="text-xl sm:text-3xl font-bold text-green-600">{stats.completed}</p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl flex items-center justify-center">
                <CheckCircle className="text-green-600" size={20} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-xs sm:text-sm font-semibold">Cancelled</p>
                <p className="text-xl sm:text-3xl font-bold text-red-600">{stats.cancelled}</p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-red-100 to-pink-100 rounded-xl flex items-center justify-center">
                <XCircle className="text-red-600" size={20} />
              </div>
            </div>
          </div>
        </div>

        {/* Orders Section */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
          <div className="px-4 sm:px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center">
                <Utensils className="text-white" size={20} />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-800">
                  My Orders
                </h2>
                <p className="text-gray-600 text-sm">Track and manage your food orders</p>
              </div>
            </div>
            <button
              onClick={() => router.push('/')}
              className="w-full sm:w-auto bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-3 rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 text-center font-semibold border border-white border-opacity-20"
            >
              🍕 Order More Food
            </button>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200 bg-gray-50">
            <div className="px-4 sm:px-6 flex space-x-2 sm:space-x-6 overflow-x-auto">
              {[
                { id: "all", label: "All Orders", count: stats.total, icon: Package },
                { id: "pending", label: "Pending", count: stats.pending, icon: Clock },
                { id: "preparing", label: "Preparing", count: stats.preparing, icon: ChefHat },
                { id: "ready", label: "Ready", count: orders.filter(o => o.status === "ready").length, icon: CheckCircle },
                { id: "completed", label: "Completed", count: stats.completed, icon: CheckCircle },
                { id: "cancelled", label: "Cancelled", count: stats.cancelled, icon: XCircle },
              ].map((tab) => {
                const IconComponent = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-3 px-3 sm:px-4 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap transition-all duration-300 flex items-center gap-2 rounded-t-lg ${
                      activeTab === tab.id
                        ? "border-indigo-500 text-indigo-600 bg-white shadow-sm"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-white hover:bg-opacity-50"
                    }`}
                  >
                    <IconComponent size={16} />
                    <span className="hidden sm:inline">{tab.label}</span>
                    <span className="sm:hidden">{tab.label.slice(0, 3)}</span>
                    <span className={`py-0.5 px-2 rounded-full text-xs font-bold ${
                      activeTab === tab.id 
                        ? "bg-indigo-100 text-indigo-600" 
                        : "bg-gray-200 text-gray-700"
                    }`}>
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Orders List */}
          <div className="p-4 sm:p-6">
            {isRefreshing ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
                <p className="text-gray-500 text-lg">Refreshing orders...</p>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Package className="text-indigo-500" size={40} />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">
                  {activeTab === "all" ? "No orders yet" : `No ${activeTab} orders`}
                </h3>
                <p className="text-gray-500 text-base sm:text-lg mb-6 max-w-md mx-auto">
                  {activeTab === "all" 
                    ? "Start your first order and enjoy delicious meals from our campus kitchen!"
                    : `You don't have any ${activeTab} orders at the moment.`}
                </p>
                <button
                  onClick={() => router.push('/')}
                  className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-8 py-4 rounded-xl hover:from-indigo-600 hover:to-purple-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-semibold"
                >
                  🍽️ Browse Menu & Order Now
                </button>
              </div>
            ) : (
              <div className="space-y-4 sm:space-y-6">
                {filteredOrders.map((order) => {
                  const StatusIcon = getStatusInfo(order.status).icon;
                  const statusColor = getStatusInfo(order.status).color;
                  const statusLabel = getStatusInfo(order.status).label;

                  return (
                    <div
                      key={order._id}
                      className="border border-gray-200 rounded-2xl p-4 sm:p-6 hover:shadow-lg transition-all duration-300 bg-white group"
                    >
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-start mb-4 gap-3">
                        <div className="flex-1">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                            <span className="text-base sm:text-lg font-bold text-gray-900 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                              Order #{order._id.slice(-8).toUpperCase()}
                            </span>
                            <span className={`px-3 py-1.5 rounded-full text-xs sm:text-sm font-semibold ${statusColor} flex items-center gap-1 w-fit border`}>
                              <StatusIcon size={14} />
                              {statusLabel}
                            </span>
                          </div>
                          <p className="text-gray-600 text-xs sm:text-sm flex items-center gap-1">
                            <Clock size={12} />
                            Placed on {formatDate(order.createdAt)}
                          </p>
                        </div>
                        <div className="w-full sm:w-auto text-left sm:text-right">
                          <p className="text-xl sm:text-2xl font-bold text-green-600">
                            ₹{order.totalAmount.toFixed(2)}
                          </p>
                          {order.status === "pending" && (
                            <button
                              onClick={() => handleCancelOrder(order._id)}
                              className="mt-2 text-red-600 hover:text-red-700 text-xs sm:text-sm font-medium transition-colors duration-300 flex items-center gap-1 group"
                            >
                              <XCircle size={14} />
                              Cancel Order
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="border-t border-gray-100 pt-4">
                        <h4 className="font-semibold text-gray-900 mb-3 text-sm sm:text-base flex items-center gap-2">
                          <Utensils size={16} />
                          Order Items:
                        </h4>
                        <div className="space-y-3">
                          {order.items.map((orderItem, index) => (
                            <div key={index} className="flex items-center justify-between group-hover:bg-gray-50 p-2 rounded-lg transition-colors duration-200">
                              <div className="flex items-center gap-3">
                                <img
                                  src={orderItem.item.imageUrl || "/placeholder-food.jpg"}
                                  alt={orderItem.item.name}
                                  className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl object-cover border border-gray-200 shadow-sm"
                                />
                                <div>
                                  <p className="font-semibold text-gray-900 text-sm sm:text-base">{orderItem.item.name}</p>
                                  <p className="text-gray-600 text-xs sm:text-sm">
                                    ₹{orderItem.item.price} × {orderItem.quantity}
                                  </p>
                                </div>
                              </div>
                              <p className="font-bold text-gray-900 text-sm sm:text-base bg-gray-100 px-3 py-1 rounded-lg">
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