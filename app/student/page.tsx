"use client";

import { useState, useEffect, useRef } from "react";
import { 
  Clock, CheckCircle, XCircle, ChefHat, Package, LogOut, User, 
  CreditCard, Utensils, RefreshCw, GraduationCap, BookOpen, Bell, 
  Wifi, WifiOff, Search, Star, MapPin, Phone, MessageCircle,
  Truck, Smile, Heart, Download, Eye, EyeOff
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { useRouter } from "next/navigation";

interface OrderItem {
  item: {
    _id: string;
    name: string;
    price: number;
    imageUrl: string;
    category?: string;
  };
  quantity: number;
}

interface Order {
  _id: string;
  userId: string;
  userName: string;
  userDetails?: {
    staffId?: string;
    studentId?: string;
    department?: string;
  };
  role: "student" | "staff";
  items: OrderItem[];
  totalAmount: number;
  status: "pending" | "preparing" | "ready" | "completed" | "cancelled";
  createdAt: string;
  updatedAt: string;
  estimatedReadyTime?: string;
  preparationTime?: number;
}

interface UserStats {
  totalOrders: number;
  totalSpent: number;
  favoriteCategory: string;
  averageRating: number;
}

export default function StudentDashboard() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<"online" | "offline">("online");
  const [searchTerm, setSearchTerm] = useState("");
  const [showCompleted, setShowCompleted] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [userStats, setUserStats] = useState<UserStats>({
    totalOrders: 0,
    totalSpent: 0,
    favoriteCategory: "None",
    averageRating: 0
  });
  
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastFetchTimeRef = useRef<number>(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    audioRef.current = new Audio('/notification-sound.mp3');
    audioRef.current.volume = 0.2;
  }, []);

  const fetchOrders = async (showToast = true) => {
    try {
      setIsRefreshing(true);
      
      const response = await fetch('/api/orders/student', {
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch student orders: ${response.status}`);
      }
      
      const ordersData = await response.json();
      setOrders(ordersData);
      lastFetchTimeRef.current = Date.now();
      
      calculateUserStats(ordersData);
      
      if (showToast && !isLoading) {
        toast.success(`Orders updated! Found ${ordersData.length} orders`);
      }
    } catch (error) {
      console.error("Error fetching student orders:", error);
      if (showToast) {
        toast.error("Failed to load orders");
      }
      
      setTimeout(() => fetchOrders(false), 5000);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const calculateUserStats = (ordersData: Order[]) => {
    const totalOrders = ordersData.length;
    const totalSpent = ordersData
      .filter(order => order.status === "completed")
      .reduce((sum, order) => sum + order.totalAmount, 0);
    
    const categoryCount = ordersData.flatMap(order => 
      order.items.map(item => item.item.category || 'Uncategorized')
    ).reduce((acc: {[key: string]: number}, category) => {
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {});
    
    const favoriteCategory = Object.keys(categoryCount).length > 0 
      ? Object.keys(categoryCount).reduce((a, b) => categoryCount[a] > categoryCount[b] ? a : b)
      : "None";

    setUserStats({
      totalOrders,
      totalSpent,
      favoriteCategory,
      averageRating: 4.5
    });
  };

  const silentRefresh = async () => {
    try {
      const response = await fetch("/api/orders/student", {
        credentials: "include",
        headers: {
          'Cache-Control': 'no-cache',
          'X-Silent-Refresh': 'true'
        }
      });
      
      if (response.ok) {
        const ordersData = await response.json();
        setOrders(ordersData);
        lastFetchTimeRef.current = Date.now();
        
        checkForStatusChanges(ordersData);
      }
    } catch (error) {
      console.error("Silent refresh failed:", error);
    }
  };

  const checkForStatusChanges = (newOrders: Order[]) => {
    if (orders.length === 0) return;

    newOrders.forEach(newOrder => {
      const oldOrder = orders.find(order => order._id === newOrder._id);
      if (oldOrder && oldOrder.status !== newOrder.status) {
        showStatusChangeNotification(oldOrder, newOrder);
      }
    });
  };

  const showStatusChangeNotification = (oldOrder: Order, newOrder: Order) => {
    const statusMessages = {
      "pending": "Order placed and waiting for confirmation",
      "preparing": "Your order is being prepared! 👨‍🍳",
      "ready": "Your order is ready for pickup! 🎉",
      "completed": "Order completed! Enjoy your meal! 😋",
      "cancelled": "Order has been cancelled"
    };

    const message = statusMessages[newOrder.status as keyof typeof statusMessages];
    if (message && autoRefresh) {
      toast.success(`Order #${newOrder._id.slice(-8)}: ${message}`, {
        duration: 5000,
        icon: '🎯'
      });
      audioRef.current?.play().catch(() => {});
    }
  };

  const setupConnectionListener = () => {
    const handleOnline = () => {
      setConnectionStatus("online");
      toast.success("Connection restored - Live updates enabled");
      setupAutoRefresh();
      fetchOrders(false);
    };

    const handleOffline = () => {
      setConnectionStatus("offline");
      toast.error("Connection lost - Live updates paused");
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  };

  const setupAutoRefresh = () => {
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
      refreshIntervalRef.current = null;
    }

    if (autoRefresh && connectionStatus === "online") {
      refreshIntervalRef.current = setInterval(() => {
        const now = Date.now();
        if (now - lastFetchTimeRef.current > 2000) {
          silentRefresh();
        }
      }, 5000);
    }
  };

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

  const handleManualRefresh = () => {
    fetchOrders(true);
    setupAutoRefresh();
  };

  const toggleAutoRefresh = () => {
    setAutoRefresh(!autoRefresh);
    toast.success(!autoRefresh ? "Live updates enabled 🔄" : "Live updates disabled ⏸️");
  };

  const handleCancelOrder = async (orderId: string) => {
    if (!confirm("Are you sure you want to cancel this order? This action cannot be undone.")) return;

    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: "cancelled" }),
      });

      if (response.ok) {
        toast.success("Order cancelled successfully!");
        fetchOrders(false);
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || "Failed to cancel order");
      }
    } catch (error) {
      console.error("Error cancelling order:", error);
      toast.error("Error cancelling order");
    }
  };

  const handleReorder = async (order: Order) => {
    try {
      const cartItems = order.items.map(item => ({
        item: {
          _id: item.item._id,
          name: item.item.name,
          price: item.item.price,
          imageUrl: item.item.imageUrl,
          category: item.item.category
        },
        quantity: item.quantity
      }));

      localStorage.setItem('canteenCart', JSON.stringify(cartItems));
      toast.success("Items added to cart! Redirecting to menu...");
      setTimeout(() => router.push('/'), 1500);
    } catch (error) {
      console.error("Error reordering:", error);
      toast.error("Failed to reorder");
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
        return { 
          icon: Clock, 
          color: "text-yellow-600 bg-yellow-100 border border-yellow-200", 
          label: "Pending",
          description: "We've received your order and are preparing it",
          emoji: "⏳"
        };
      case "preparing":
        return { 
          icon: ChefHat, 
          color: "text-blue-600 bg-blue-100 border border-blue-200", 
          label: "Preparing",
          description: "Our chefs are cooking your delicious meal",
          emoji: "👨‍🍳"
        };
      case "ready":
        return { 
          icon: Package, 
          color: "text-green-600 bg-green-100 border border-green-200", 
          label: "Ready for Pickup",
          description: "Your order is ready! Come pick it up",
          emoji: "🎉"
        };
      case "completed":
        return { 
          icon: CheckCircle, 
          color: "text-emerald-600 bg-emerald-100 border border-emerald-200", 
          label: "Completed",
          description: "Order completed successfully",
          emoji: "✅"
        };
      case "cancelled":
        return { 
          icon: XCircle, 
          color: "text-red-600 bg-red-100 border border-red-200", 
          label: "Cancelled",
          description: "This order has been cancelled",
          emoji: "❌"
        };
      default:
        return { 
          icon: Clock, 
          color: "text-gray-600 bg-gray-100 border border-gray-200", 
          label: "Unknown",
          description: "Unknown order status",
          emoji: "❓"
        };
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

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  const getEstimatedTime = (order: Order) => {
    if (order.status === "completed" || order.status === "cancelled") return null;
    
    const created = new Date(order.createdAt).getTime();
    const now = Date.now();
    const elapsed = (now - created) / (1000 * 60);
    
    if (order.status === "pending") {
      return `Estimated: ${Math.max(1, 15 - Math.floor(elapsed))}min left`;
    } else if (order.status === "preparing") {
      return `Estimated: ${Math.max(1, 10 - Math.floor(elapsed))}min left`;
    }
    
    return null;
  };

  const popularCategories = orders.flatMap(order => 
    order.items.map(item => item.item.category || 'Uncategorized')
  ).reduce((acc: {[key: string]: number}, category) => {
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {});

  const filteredOrders = orders.filter(order => {
    if (activeTab !== "all" && order.status !== activeTab) return false;
    
    if (searchTerm && !order.userName.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !order._id.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !order.userDetails?.studentId?.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    if (selectedCategory !== "all") {
      const hasCategoryItem = order.items.some(item => 
        item.item.category?.toLowerCase() === selectedCategory.toLowerCase()
      );
      if (!hasCategoryItem) return false;
    }
    
    return true;
  }).sort((a, b) => {
    switch (sortBy) {
      case "newest":
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case "oldest":
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      case "amount":
        return b.totalAmount - a.totalAmount;
      case "items":
        return b.items.reduce((sum, item) => sum + item.quantity, 0) - 
               a.items.reduce((sum, item) => sum + item.quantity, 0);
      default:
        return 0;
    }
  });

  const stats = {
    total: orders.length,
    pending: orders.filter(order => order.status === "pending").length,
    preparing: orders.filter(order => order.status === "preparing").length,
    completed: orders.filter(order => order.status === "completed").length,
    cancelled: orders.filter(order => order.status === "cancelled").length,
  };

  const recentActivity = orders.filter(order => {
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    return new Date(order.updatedAt) > tenMinutesAgo;
  });

  useEffect(() => {
    fetchUserData();
    fetchOrders();
    setupAutoRefresh();
    setupConnectionListener();

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    setupAutoRefresh();
  }, [autoRefresh]);

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

      {connectionStatus === "offline" && (
        <div className="bg-red-500 text-white py-2 px-4 text-center">
          <div className="flex items-center justify-center gap-2">
            <WifiOff size={16} />
            <span className="text-sm font-medium">You're offline - Live updates paused</span>
          </div>
        </div>
      )}

      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-2xl relative overflow-hidden rounded-[16px]">
        <div className="absolute inset-0 bg-black opacity-5"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-6 gap-4">
            <div className="flex items-center space-x-4">
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
                {user?.studentId && (
                  <p className="text-indigo-200 text-sm">Student ID: {user.studentId}</p>
                )}
                <div className="flex items-center gap-2 mt-1">
                  <div className={`w-2 h-2 rounded-full ${autoRefresh ? 'bg-green-400 animate-pulse' : 'bg-yellow-400'}`}></div>
                  <span className="text-xs text-indigo-200">
                    {autoRefresh ? 'Live updates active' : 'Live updates paused'}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                onClick={toggleAutoRefresh}
                className={`flex-1 sm:flex-none px-4 py-3 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 text-sm sm:text-base shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 border border-white border-opacity-20 ${
                  autoRefresh 
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600' 
                    : 'bg-gradient-to-r from-gray-500 to-gray-600 text-white hover:from-gray-600 hover:to-gray-700'
                }`}
              >
                {autoRefresh ? <Wifi size={18} /> : <WifiOff size={18} />}
                <span className="hidden sm:inline">Auto</span>
              </button>

              <button
                onClick={handleManualRefresh}
                disabled={isRefreshing}
                className="flex-1 sm:flex-none bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-4 py-3 sm:py-3 rounded-xl hover:from-cyan-600 hover:to-blue-600 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 text-sm sm:text-base shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 border border-white border-opacity-20"
              >
                <RefreshCw size={18} className={isRefreshing ? "animate-spin" : ""} />
                <span>Refresh</span>
              </button>

              <button
                onClick={() => setShowHelp(!showHelp)}
                className="flex-1 sm:flex-none bg-gradient-to-r from-orange-500 to-amber-500 text-white px-4 py-3 rounded-xl hover:from-orange-600 hover:to-amber-600 transition-all duration-300 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 text-sm sm:text-base border border-white border-opacity-20"
              >
                <MessageCircle size={18} />
                <span>Help</span>
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

      {showHelp && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-blue-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Phone className="text-blue-600" size={20} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Contact Support</h3>
                  <p className="text-gray-600 text-sm mt-1">Call: +1-555-CANTEEN</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <MapPin className="text-green-600" size={20} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Pickup Location</h3>
                  <p className="text-gray-600 text-sm mt-1">Main Campus Canteen, Building A</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Clock className="text-purple-600" size={20} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Operating Hours</h3>
                  <p className="text-gray-600 text-sm mt-1">8:00 AM - 8:00 PM</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-xs sm:text-sm font-semibold">Total Orders</p>
                <p className="text-xl sm:text-3xl font-bold text-indigo-600">{userStats.totalOrders}</p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-xl flex items-center justify-center">
                <CreditCard className="text-indigo-600" size={20} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-xs sm:text-sm font-semibold">Total Spent</p>
                <p className="text-xl sm:text-3xl font-bold text-green-600">₹{userStats.totalSpent.toFixed(2)}</p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl flex items-center justify-center">
                <Star className="text-green-600" size={20} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-xs sm:text-sm font-semibold">Favorite Category</p>
                <p className="text-xl sm:text-2xl font-bold text-orange-600 capitalize">{userStats.favoriteCategory}</p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-orange-100 to-red-100 rounded-xl flex items-center justify-center">
                <Heart className="text-orange-600" size={20} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-xs sm:text-sm font-semibold">Your Rating</p>
                <p className="text-xl sm:text-3xl font-bold text-yellow-600">{userStats.averageRating}/5</p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-yellow-100 to-amber-100 rounded-xl flex items-center justify-center">
                <Star className="text-yellow-600" size={20} />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-gray-100">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 flex-1 w-full">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search orders by name, ID, or student ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                />
              </div>

              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
              >
                <option value="all">All Categories</option>
                {Object.keys(popularCategories).map(category => (
                  <option key={category} value={category}>
                    {category} ({popularCategories[category]})
                  </option>
                ))}
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="amount">Highest Amount</option>
                <option value="items">Most Items</option>
              </select>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowCompleted(!showCompleted)}
                className="flex items-center gap-2 px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors duration-200"
              >
                {showCompleted ? <EyeOff size={16} /> : <Eye size={16} />}
                {showCompleted ? 'Hide Completed' : 'Show Completed'}
              </button>

              <button
                onClick={() => {
                  const dataStr = JSON.stringify(orders, null, 2);
                  const dataBlob = new Blob([dataStr], { type: 'application/json' });
                  const url = URL.createObjectURL(dataBlob);
                  const link = document.createElement('a');
                  link.href = url;
                  link.download = `my-orders-${new Date().toISOString().split('T')[0]}.json`;
                  link.click();
                }}
                className="flex items-center gap-2 px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl transition-colors duration-200"
              >
                <Download size={16} />
                Export
              </button>

              <button
                onClick={() => router.push('/')}
                className="w-full sm:w-auto bg-gradient-to-r from-green-500 to-emerald-500 text-white px-8 py-3 rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 text-center font-semibold border border-white border-opacity-20 flex items-center justify-center gap-2"
              >
                <Utensils size={18} />
                Order More Food
              </button>
            </div>
          </div>
        </div>

        {recentActivity.length > 0 && autoRefresh && (
          <div className="mb-6 bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-2xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <Bell size={16} className="text-white" />
              </div>
              <div>
                <p className="text-blue-800 font-semibold text-sm">
                  Live Updates Active
                </p>
                <p className="text-blue-600 text-xs">
                  {recentActivity.length} orders updated recently • Auto-refresh every 5 seconds
                </p>
              </div>
            </div>
          </div>
        )}

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
                <p className="text-gray-600 text-sm">
                  {autoRefresh ? 'Live tracking enabled • ' : ''}
                  Last updated: {getTimeAgo(new Date(lastFetchTimeRef.current).toISOString())}
                </p>
              </div>
            </div>
            <div className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg ${
              autoRefresh 
                ? 'bg-green-100 text-green-800 border border-green-200' 
                : 'bg-gray-100 text-gray-600'
            }`}>
              <div className={`w-2 h-2 rounded-full ${autoRefresh ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
              <span>{autoRefresh ? 'Live Tracking' : 'Manual Updates'}</span>
            </div>
          </div>

          <div className="border-b border-gray-200 bg-gray-50">
            <div className="px-4 sm:px-6 flex space-x-2 sm:space-x-6 overflow-x-auto">
              {[
                { id: "all", label: "All Orders", count: stats.total, icon: CreditCard },
                { id: "pending", label: "Pending", count: stats.pending, icon: Clock },
                { id: "preparing", label: "Preparing", count: stats.preparing, icon: ChefHat },
                { id: "ready", label: "Ready", count: orders.filter(o => o.status === "ready").length, icon: Package },
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
                  className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-8 py-4 rounded-xl hover:from-indigo-600 hover:to-purple-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-semibold flex items-center gap-2 mx-auto"
                >
                  <Utensils size={20} />
                  Browse Menu & Order Now
                </button>
              </div>
            ) : (
              <div className="space-y-4 sm:space-y-6">
                {filteredOrders.map((order) => {
                  if (!showCompleted && order.status === "completed") return null;

                  const statusInfo = getStatusInfo(order.status);
                  const StatusIcon = statusInfo.icon;
                  const statusColor = statusInfo.color;
                  const statusLabel = statusInfo.label;
                  const statusDescription = statusInfo.description;
                  const statusIcon = statusInfo.emoji;

                  const estimatedTime = getEstimatedTime(order);

                  return (
                    <div
                      key={order._id}
                      className="border border-gray-200 rounded-2xl p-4 sm:p-6 hover:shadow-lg transition-all duration-300 bg-white group relative overflow-hidden"
                    >
                      <div className={`absolute inset-0 opacity-5 ${
                        order.status === 'completed' ? 'bg-green-500' :
                        order.status === 'cancelled' ? 'bg-red-500' :
                        order.status === 'ready' ? 'bg-emerald-500' :
                        order.status === 'preparing' ? 'bg-blue-500' : 'bg-yellow-500'
                      }`}></div>
                      
                      {(order.status === 'pending' || order.status === 'preparing') && autoRefresh && (
                        <div className="absolute -top-2 -right-2 w-4 h-4 bg-green-500 rounded-full animate-pulse border-2 border-white"></div>
                      )}
                      
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-start mb-4 gap-3 relative z-10">
                        <div className="flex-1">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                            <span className="text-base sm:text-lg font-bold text-gray-900 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                              Order #{order._id.slice(-8).toUpperCase()}
                            </span>
                            <span className={`px-3 py-1.5 rounded-full text-xs sm:text-sm font-semibold ${statusColor} flex items-center gap-1 w-fit border`}>
                              <StatusIcon size={14} />
                              {statusLabel}
                            </span>
                            {estimatedTime && (
                              <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-bold border border-orange-200">
                                ⏰ {estimatedTime}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600 mb-2">
                            <Clock size={12} />
                            <span>Placed: {formatDate(order.createdAt)}</span>
                            {order.updatedAt !== order.createdAt && (
                              <>
                                <span>•</span>
                                <span>Updated: {getTimeAgo(order.updatedAt)}</span>
                              </>
                            )}
                          </div>
                          {order.userDetails?.studentId && (
                            <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600 mb-1">
                              <MapPin size={12} />
                              <span>Student ID: {order.userDetails.studentId}</span>
                            </div>
                          )}
                          <p className="text-sm text-gray-500 flex items-center gap-1">
                            <span className="text-lg">{statusIcon}</span>
                            {statusDescription}
                          </p>
                        </div>
                        <div className="w-full sm:w-auto text-left sm:text-right relative z-10">
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
                          {order.status === "completed" && (
                            <button
                              onClick={() => handleReorder(order)}
                              className="mt-2 text-indigo-600 hover:text-indigo-700 text-xs sm:text-sm font-medium transition-colors duration-300 flex items-center gap-1 group"
                            >
                              <RefreshCw size={14} />
                              Reorder
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="border-t border-gray-100 pt-4 relative z-10">
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
                                  <div className="flex items-center gap-2 mt-1">
                                    <p className="text-gray-600 text-xs sm:text-sm">
                                      ₹{orderItem.item.price} × {orderItem.quantity}
                                    </p>
                                    {orderItem.item.category && (
                                      <span className="px-2 py-1 bg-gray-100 rounded-full text-xs text-gray-600">
                                        {orderItem.item.category}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <p className="font-bold text-gray-900 text-sm sm:text-base bg-gray-100 px-3 py-1 rounded-lg">
                                ₹{(orderItem.item.price * orderItem.quantity).toFixed(2)}
                              </p>
                            </div>
                          ))}
                        </div>

                        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-100">
                          {order.status === "ready" && (
                            <button
                              onClick={() => toast.success("We've notified the staff you're on your way!")}
                              className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-semibold transition-colors duration-200 flex items-center gap-2"
                            >
                              <Truck size={14} />
                              On My Way!
                            </button>
                          )}
                          {order.status === "completed" && (
                            <>
                              <button
                                onClick={() => toast.success("Thanks for your feedback!")}
                                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-semibold transition-colors duration-200 flex items-center gap-2"
                              >
                                <Smile size={14} />
                                Rate Order
                              </button>
                              <button
                                onClick={() => handleReorder(order)}
                                className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-sm font-semibold transition-colors duration-200 flex items-center gap-2"
                              >
                                <RefreshCw size={14} />
                                Order Again
                              </button>
                            </>
                          )}
                          {order.status === "cancelled" && (
                            <button
                              onClick={() => router.push('/')}
                              className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-semibold transition-colors duration-200 flex items-center gap-2"
                            >
                              <Utensils size={14} />
                              Try Again
                            </button>
                          )}
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