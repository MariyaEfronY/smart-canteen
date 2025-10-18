"use client";

import { useState, useEffect } from "react";
import { 
  Plus, Edit, Trash2, Upload, X, LogOut, Menu, X as CloseIcon, 
  Calendar, Utensils, Package, ChefHat, CheckCircle, Clock, 
  XCircle, RefreshCw, DollarSign, Users, TrendingUp, Filter, Search,
  BarChart3, ShoppingBag, Eye, EyeOff, Download, Printer, Share2,
  MessageCircle, Bell, Settings, User, Shield, CreditCard
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { useRouter } from "next/navigation";

interface MenuItem {
  _id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string;
  status: "available" | "unavailable";
  createdAt: string;
}

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

export default function AdminDashboard() {
  const router = useRouter();
  const [items, setItems] = useState<MenuItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("dashboard");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [notificationCount, setNotificationCount] = useState(3);
  const [showNotifications, setShowNotifications] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    status: "available",
  });

  // ✅ Live refresh interval
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (autoRefresh && activeSection === "view-orders") {
      interval = setInterval(() => {
        fetchOrders();
      }, 10000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh, activeSection]);

  // ✅ Fetch all menu items
  const fetchItems = async () => {
    try {
      const response = await fetch("/api/items/all");
      if (!response.ok) throw new Error("Failed to fetch items");
      const data = await response.json();
      setItems(data || []);
    } catch (error) {
      console.error("Error fetching items:", error);
      toast.error("Failed to load menu items");
    }
  };

  // ✅ Fetch all orders for admin
  const fetchOrders = async () => {
    try {
      setIsRefreshing(true);
      const response = await fetch("/api/orders/admin", {
        credentials: "include",
      });
      
      if (response.ok) {
        const ordersData = await response.json();
        setOrders(ordersData);
        
        const pendingCount = ordersData.filter((order: Order) => 
          order.status === "pending" || order.status === "preparing"
        ).length;
        setNotificationCount(pendingCount);
        
      } else if (response.status === 401) {
        toast.error("Please login again");
        router.push("/login");
      } else if (response.status === 403) {
        toast.error("Admin/Staff access required");
        router.push("/");
      } else {
        toast.error("Failed to fetch orders");
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast.error("Error loading orders");
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchItems();
    fetchOrders();
  }, []);

  // ✅ Logout
  const handleLogout = async () => {
    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      if (response.ok) {
        toast.success("Logged out successfully!");
        router.push("/");
      } else {
        toast.error("Failed to logout");
      }
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Logout failed");
    }
  };

  // ✅ Image selection
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return;
    }
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload a valid image file");
      return;
    }

    setSelectedImage(file);
    setImagePreview(URL.createObjectURL(file));
  };

  // ✅ Form field updates
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // ✅ Add new item
  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedImage) return toast.error("Please select an image");

    const price = parseFloat(formData.price);
    if (!formData.name || !formData.description || !formData.category || isNaN(price)) {
      toast.error("All fields are required");
      return;
    }

    setIsLoading(true);
    const submitData = new FormData();
    submitData.append("name", formData.name);
    submitData.append("description", formData.description);
    submitData.append("price", price.toString());
    submitData.append("category", formData.category);
    submitData.append("status", formData.status);
    submitData.append("image", selectedImage);

    try {
      const response = await fetch("/api/items/add", {
        method: "POST",
        body: submitData,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to add item");

      toast.success("Item added successfully!");
      setIsModalOpen(false);
      resetForm();
      fetchItems();
      setActiveSection("menu-items");
    } catch (error: unknown) {
      toast.error(
        typeof error === "object" && error !== null && "message" in error
          ? (error as { message?: string }).message || "Error adding item"
          : "Error adding item"
      );
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ Delete item
  const handleDeleteItem = async (id: string) => {
    if (!confirm("Are you sure you want to delete this item?")) return;

    try {
      const response = await fetch(`/api/items/${id}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.message ?? "Failed to delete item");
      }
      toast.success("Item deleted successfully!");
      fetchItems();
    } catch (error: unknown) {
      toast.error(
        typeof error === "object" && error !== null && "message" in error
          ? (error as { message?: string }).message || "Error deleting item"
          : "Error deleting item"
      );
    }
  };

  // ✅ Update order status
  const handleOrderStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        toast.success(`Order status updated to ${newStatus}`);
        fetchOrders();
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || "Failed to update order");
      }
    } catch (error) {
      console.error("Error updating order:", error);
      toast.error("Error updating order");
    }
  };

  // ✅ Delete order (Admin only)
  const handleDeleteOrder = async (orderId: string) => {
    if (!confirm("Are you sure you want to delete this order? This action cannot be undone.")) return;

    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (response.ok) {
        toast.success("Order deleted successfully!");
        fetchOrders();
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || "Failed to delete order");
      }
    } catch (error) {
      console.error("Error deleting order:", error);
      toast.error("Error deleting order");
    }
  };

  const resetForm = () => {
    setFormData({ name: "", description: "", price: "", category: "", status: "available" });
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setSelectedImage(null);
    setImagePreview("");
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  const handleNavigation = (section: string) => {
    setActiveSection(section);
    setMobileMenuOpen(false);
    
    if (section === "add-menu") {
      setIsModalOpen(true);
    }
  };

  // ✅ Status configuration for orders
  const getStatusInfo = (status: string) => {
    switch (status) {
      case "pending":
        return { 
          icon: Clock, 
          color: "text-yellow-600 bg-yellow-100 border-yellow-200",
          label: "Pending",
          nextAction: "Start Preparing",
          nextStatus: "preparing"
        };
      case "preparing":
        return { 
          icon: ChefHat, 
          color: "text-blue-600 bg-blue-100 border-blue-200",
          label: "Preparing",
          nextAction: "Mark as Ready",
          nextStatus: "ready"
        };
      case "ready":
        return { 
          icon: Package, 
          color: "text-orange-600 bg-orange-100 border-orange-200",
          label: "Ready for Pickup",
          nextAction: "Complete Order",
          nextStatus: "completed"
        };
      case "completed":
        return { 
          icon: CheckCircle, 
          color: "text-green-600 bg-green-100 border-green-200",
          label: "Completed",
          nextAction: null,
          nextStatus: null
        };
      case "cancelled":
        return { 
          icon: XCircle, 
          color: "text-red-600 bg-red-100 border-red-200",
          label: "Cancelled",
          nextAction: null,
          nextStatus: null
        };
      default:
        return { 
          icon: Clock, 
          color: "text-gray-600 bg-gray-100 border-gray-200",
          label: "Unknown",
          nextAction: null,
          nextStatus: null
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

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  // ✅ Filter and search orders
  const filteredOrders = orders.filter(order => {
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    const matchesSearch = order.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order._id.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // ✅ Statistics
  const stats = {
    totalOrders: orders.length,
    pendingOrders: orders.filter(order => order.status === "pending").length,
    preparingOrders: orders.filter(order => order.status === "preparing").length,
    completedOrders: orders.filter(order => order.status === "completed").length,
    totalRevenue: orders
      .filter(order => order.status === "completed")
      .reduce((sum, order) => sum + order.totalAmount, 0),
    totalItems: items.length,
    categories: new Set(items.map((item) => item.category)).size,
    todayOrders: orders.filter(order => {
      const orderDate = new Date(order.createdAt);
      const today = new Date();
      return orderDate.toDateString() === today.toDateString();
    }).length
  };

  // ✅ Quick actions
  const quickActions = [
    {
      icon: Plus,
      label: "Add Menu Item",
      description: "Create new food item",
      action: () => handleNavigation("add-menu"),
      color: "bg-green-500 hover:bg-green-600"
    },
    {
      icon: RefreshCw,
      label: "Refresh Data",
      description: "Update all information",
      action: () => { fetchItems(); fetchOrders(); },
      color: "bg-blue-500 hover:bg-blue-600"
    },
    {
      icon: Download,
      label: "Export Report",
      description: "Download sales data",
      action: () => toast.success("Export feature coming soon!"),
      color: "bg-purple-500 hover:bg-purple-600"
    },
    {
      icon: Settings,
      label: "Settings",
      description: "Manage preferences",
      action: () => toast.success("Settings panel coming soon!"),
      color: "bg-gray-500 hover:bg-gray-600"
    }
  ];

  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  // ✅ Mobile-optimized render sections
  const renderSection = () => {
    switch (activeSection) {
      case "dashboard":
        return (
          <div className="space-y-4 md:space-y-6">
            {/* Mobile-optimized Stats Grid */}
            <div className="grid grid-cols-2 gap-3 md:grid-cols-2 lg:grid-cols-4 md:gap-6">
              <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl md:rounded-2xl p-4 md:p-6 shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-xs md:text-sm font-medium">Total Revenue</p>
                    <p className="text-lg md:text-2xl font-bold mt-1">₹{stats.totalRevenue.toFixed(2)}</p>
                    <p className="text-green-200 text-xs mt-1 md:mt-2">{stats.completedOrders} completed</p>
                  </div>
                  <DollarSign className="w-6 h-6 md:w-8 md:h-8 text-green-200" />
                </div>
              </div>

              <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl md:rounded-2xl p-4 md:p-6 shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-xs md:text-sm font-medium">{`Today's Orders`}</p>
                    <p className="text-lg md:text-2xl font-bold mt-1">{stats.todayOrders}</p>
                    <p className="text-blue-200 text-xs mt-1 md:mt-2">{stats.pendingOrders} pending</p>
                  </div>
                  <ShoppingBag className="w-6 h-6 md:w-8 md:h-8 text-blue-200" />
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl md:rounded-2xl p-4 md:p-6 shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-xs md:text-sm font-medium">Menu Items</p>
                    <p className="text-lg md:text-2xl font-bold mt-1">{stats.totalItems}</p>
                    <p className="text-purple-200 text-xs mt-1 md:mt-2">{stats.categories} categories</p>
                  </div>
                  <Utensils className="w-6 h-6 md:w-8 md:h-8 text-purple-200" />
                </div>
              </div>

              <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-xl md:rounded-2xl p-4 md:p-6 shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-100 text-xs md:text-sm font-medium">Active Orders</p>
                    <p className="text-lg md:text-2xl font-bold mt-1">{stats.pendingOrders + stats.preparingOrders}</p>
                    <p className="text-orange-200 text-xs mt-1 md:mt-2">Need attention</p>
                  </div>
                  <Package className="w-6 h-6 md:w-8 md:h-8 text-orange-200" />
                </div>
              </div>
            </div>

            {/* Mobile-optimized Quick Actions */}
            <div className="grid grid-cols-2 gap-3 md:grid-cols-2 lg:grid-cols-4 md:gap-4">
              {quickActions.map((action, index) => (
                <button
                  key={index}
                  onClick={action.action}
                  className={`${action.color} text-white rounded-lg md:rounded-xl p-3 md:p-4 text-left transition-all duration-300 transform hover:scale-105 hover:shadow-xl`}
                >
                  <action.icon className="w-6 h-6 md:w-8 md:h-8 mb-2" />
                  <h3 className="font-semibold text-sm md:text-lg">{action.label}</h3>
                  <p className="text-white text-opacity-90 text-xs md:text-sm mt-1">{action.description}</p>
                </button>
              ))}
            </div>

            {/* Mobile-optimized Recent Activity */}
            <div className="bg-white rounded-xl md:rounded-2xl shadow-lg border border-gray-100 p-4 md:p-6">
              <div className="flex items-center justify-between mb-4 md:mb-6">
                <h2 className="text-lg md:text-xl font-bold text-gray-800 flex items-center gap-2">
                  <Clock className="text-blue-500 w-5 h-5" />
                  Recent Activity
                </h2>
                <button
                  onClick={fetchOrders}
                  className="text-blue-600 hover:text-blue-700 text-xs md:text-sm font-medium"
                >
                  View All
                </button>
              </div>

              <div className="space-y-3 md:space-y-4">
                {orders.slice(0, 5).map((order) => {
                  const statusInfo = getStatusInfo(order.status);
                  const StatusIcon = statusInfo.icon;

                  return (
                    <div key={order._id} className="flex items-center justify-between p-3 md:p-4 border border-gray-200 rounded-lg md:rounded-xl hover:bg-gray-50 transition-colors duration-200">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center ${statusInfo.color.split(' ')[1]}`}>
                          <StatusIcon className="w-4 h-4 md:w-5 md:h-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-gray-900 text-sm md:text-base truncate">{order.userName}</p>
                          <p className="text-gray-600 text-xs md:text-sm truncate">#{order._id.slice(-6)} • {formatTimeAgo(order.createdAt)}</p>
                        </div>
                      </div>
                      <div className="text-right ml-2">
                        <p className="font-bold text-green-600 text-sm md:text-base">₹{order.totalAmount.toFixed(2)}</p>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
                          {statusInfo.label}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );

      case "menu-items":
        return (
          <div className="bg-white rounded-xl md:rounded-2xl shadow-xl overflow-hidden border border-gray-100">
            <div className="px-4 py-3 md:px-6 md:py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 md:gap-4">
                <h2 className="text-xl md:text-2xl font-bold text-gray-800 flex items-center gap-2 md:gap-3">
                  <Utensils className="text-green-500 w-6 h-6 md:w-7 md:h-7" />
                  <span className="text-lg md:text-2xl">Menu Management</span>
                </h2>
                <button
                  onClick={() => handleNavigation("add-menu")}
                  className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-2 md:px-6 md:py-3 rounded-lg md:rounded-xl hover:from-green-600 hover:to-emerald-600 flex items-center gap-2 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl text-sm md:text-base w-full md:w-auto justify-center"
                >
                  <Plus className="w-4 h-4 md:w-5 md:h-5" /> Add New Item
                </button>
              </div>
            </div>

            {items.length === 0 ? (
              <div className="text-center py-8 md:py-16">
                <div className="w-16 h-16 md:w-24 md:h-24 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6">
                  <Utensils className="text-green-500 w-8 h-8 md:w-10 md:h-10" />
                </div>
                <p className="text-gray-500 text-base md:text-lg mb-3 md:mb-4">No menu items found</p>
                <button
                  onClick={() => handleNavigation("add-menu")}
                  className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-2 md:px-8 md:py-3 rounded-lg md:rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all duration-300 transform hover:scale-105 shadow-lg text-sm md:text-base"
                >
                  Add Your First Item
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                {/* Mobile Card View */}
                <div className="md:hidden p-4 space-y-4">
                  {items.map((item) => (
                    <div key={item._id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-300">
                      <div className="flex items-start gap-3">
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="h-16 w-16 rounded-lg object-cover shadow-md flex-shrink-0"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "/placeholder-image.jpg";
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="min-w-0 flex-1">
                              <h3 className="font-semibold text-gray-900 text-sm truncate">{item.name}</h3>
                              <p className="text-gray-600 text-xs mt-1 line-clamp-2">{item.description}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between mt-3">
                            <span className="text-lg font-bold text-green-600">₹{item.price.toFixed(2)}</span>
                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 border border-green-200">
                              {item.category}
                            </span>
                          </div>
                          
                          <div className="flex items-center justify-between mt-3">
                            <select
                              value={item.status}
                              onChange={async (e) => {
                                const newStatus = e.target.value;
                                try {
                                  const res = await fetch(`/api/items/${item._id}`, {
                                    method: "PATCH",
                                    headers: { "Content-Type": "application/json" } as HeadersInit,
                                    body: JSON.stringify({ status: newStatus }),
                                  });
                                  const data = await res.json();
                                  if (!res.ok) throw new Error(data.message);
                                  toast.success(`Status updated to ${newStatus}`);
                                  fetchItems();
                                } catch (error: unknown) {
                                  toast.error(
                                    typeof error === "object" && error !== null && "message" in error
                                      ? (error as { message?: string }).message || "Failed to update status"
                                      : "Failed to update status"
                                  );
                                }
                              }}
                              className={`px-2 py-1 text-xs font-semibold rounded-full border-0 focus:ring-2 focus:ring-green-500 transition-all duration-300 ${
                                item.status === "available" 
                                  ? "bg-green-100 text-green-800" 
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              <option value="available">Available</option>
                              <option value="unavailable">Unavailable</option>
                            </select>
                            
                            <button
                              onClick={() => handleDeleteItem(item._id)}
                              className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 transition-all duration-300"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop Table View */}
                <table className="hidden md:table min-w-full divide-y divide-gray-200">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Item</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Description</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Price</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Category</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {items.map((item) => (
                      <tr key={item._id} className="hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 transition-all duration-300 group">
                        <td className="px-6 py-4 whitespace-nowrap flex items-center gap-3">
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="h-12 w-12 rounded-lg object-cover shadow-md group-hover:scale-110 transition-transform duration-300"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = "/placeholder-image.jpg";
                            }}
                          />
                          <span className="font-medium text-gray-900 group-hover:text-green-700 transition-colors duration-300">
                            {item.name}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700 max-w-xs group-hover:text-gray-900 transition-colors duration-300">
                          {item.description}
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-lg font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                            ₹{item.price.toFixed(2)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-3 py-1.5 inline-flex text-sm font-semibold rounded-full bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border border-green-200 shadow-sm">
                            {item.category}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <select
                            value={item.status}
                            onChange={async (e) => {
                              const newStatus = e.target.value;
                              try {
                                const res = await fetch(`/api/items/${item._id}`, {
                                  method: "PATCH",
                                  headers: { "Content-Type": "application/json" } as HeadersInit,
                                  body: JSON.stringify({ status: newStatus }),
                                });
                                const data = await res.json();
                                if (!res.ok) throw new Error(data.message);
                                toast.success(`Status updated to ${newStatus}`);
                                fetchItems();
                              } catch (error: unknown) {
                                toast.error(
                                  typeof error === "object" && error !== null && "message" in error
                                    ? (error as { message?: string }).message || "Failed to update status"
                                    : "Failed to update status"
                                );
                              }
                            }}
                            className={`px-3 py-1.5 text-sm font-semibold rounded-full border-0 focus:ring-2 focus:ring-green-500 transition-all duration-300 transform hover:scale-105 ${
                              item.status === "available" 
                                ? "bg-gradient-to-r from-green-100 to-emerald-100 text-green-800" 
                                : "bg-gradient-to-r from-red-100 to-pink-100 text-red-800"
                            }`}
                          >
                            <option value="available">Available</option>
                            <option value="unavailable">Unavailable</option>
                          </select>
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => handleDeleteItem(item._id)}
                            className="p-2 rounded-lg bg-gradient-to-r from-red-50 to-pink-50 text-red-600 hover:from-red-100 hover:to-pink-100 hover:text-red-700 hover:scale-110 transition-all duration-300 shadow-sm"
                          >
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );

      case "view-orders":
        return (
          <div className="bg-white rounded-xl md:rounded-2xl shadow-xl overflow-hidden border border-gray-100">
            <div className="px-4 py-3 md:px-6 md:py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
              <div className="flex flex-col gap-3 md:gap-4">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                  <h2 className="text-xl md:text-2xl font-bold text-gray-800 flex items-center gap-2 md:gap-3">
                    <Package className="text-purple-500 w-6 h-6 md:w-7 md:h-7" />
                    <span className="text-lg md:text-2xl">Orders Management</span>
                  </h2>
                  
                  <div className="flex flex-col sm:flex-row items-center gap-2 md:gap-4">
                    {/* Auto Refresh Toggle */}
                    <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1 md:p-2 w-full sm:w-auto justify-between">
                      <button
                        onClick={() => setAutoRefresh(!autoRefresh)}
                        className={`flex items-center gap-2 px-2 py-1 md:px-3 md:py-1 rounded-md text-xs md:text-sm font-medium transition-all duration-300 ${
                          autoRefresh 
                            ? "bg-green-500 text-white" 
                            : "bg-gray-200 text-gray-700"
                        }`}
                      >
                        {autoRefresh ? <Eye size={14} /> : <EyeOff size={14} />}
                        <span className="hidden sm:inline">Auto Refresh</span>
                      </button>
                      {autoRefresh && (
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                          <span className="text-xs text-gray-600 hidden sm:inline">Live</span>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={fetchOrders}
                      disabled={isRefreshing}
                      className="bg-gradient-to-r from-purple-500 to-purple-600 text-white px-3 py-2 md:px-4 md:py-2 rounded-lg md:rounded-xl hover:from-purple-600 hover:to-purple-700 transition-all duration-300 flex items-center gap-2 disabled:opacity-50 transform hover:scale-105 text-sm md:text-base w-full sm:w-auto justify-center"
                    >
                      <RefreshCw size={14} className={isRefreshing ? "animate-spin" : ""} />
                      {isRefreshing ? "Refreshing..." : "Refresh"}
                    </button>
                  </div>
                </div>

                {/* Mobile Search and Filter */}
                <div className="flex flex-col sm:flex-row gap-2 md:gap-4">
                  {/* Search */}
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
                    <input
                      type="text"
                      placeholder="Search orders..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg md:rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent w-full text-sm md:text-base"
                    />
                  </div>

                  {/* Status Filter */}
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg md:rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm md:text-base"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="preparing">Preparing</option>
                    <option value="ready">Ready</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Orders List */}
            <div className="p-4 md:p-6">
              {isRefreshing ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto"></div>
                  <p className="text-gray-500 mt-2 text-sm md:text-base">Refreshing orders...</p>
                </div>
              ) : filteredOrders.length === 0 ? (
                <div className="text-center py-8 md:py-16">
                  <div className="w-16 h-16 md:w-24 md:h-24 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6">
                    <Package className="text-purple-500 w-8 h-8 md:w-10 md:h-10" />
                  </div>
                  <p className="text-gray-500 text-base md:text-lg mb-3 md:mb-4">
                    {searchTerm || statusFilter !== "all" 
                      ? "No orders match your filters" 
                      : "No orders found"
                    }
                  </p>
                  {(searchTerm || statusFilter !== "all") && (
                    <button
                      onClick={() => {
                        setSearchTerm("");
                        setStatusFilter("all");
                      }}
                      className="bg-gradient-to-r from-purple-500 to-purple-600 text-white px-4 py-2 md:px-6 md:py-2 rounded-lg md:rounded-xl hover:from-purple-600 hover:to-purple-700 transition-colors duration-300 transform hover:scale-105 text-sm md:text-base"
                    >
                      Clear Filters
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-4 md:space-y-6">
                  {filteredOrders.map((order) => {
                    const statusInfo = getStatusInfo(order.status);
                    const StatusIcon = statusInfo.icon;

                    return (
                      <div
                        key={order._id}
                        className="border border-gray-200 rounded-xl md:rounded-2xl p-4 md:p-6 hover:shadow-lg transition-all duration-300 bg-white group"
                      >
                        {/* Order Header - Mobile Optimized */}
                        <div className="flex flex-col gap-3 md:gap-4 mb-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2 mb-2">
                                <span className="text-base md:text-lg font-semibold text-gray-900 truncate">
                                  Order #{order._id.slice(-8).toUpperCase()}
                                </span>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium border ${statusInfo.color} flex items-center gap-1 flex-shrink-0`}>
                                  <StatusIcon size={12} />
                                  {statusInfo.label}
                                </span>
                              </div>
                              <div className="space-y-1 text-xs md:text-sm text-gray-600">
                                <p><strong>Customer:</strong> {order.userName}</p>
                                <p><strong>Placed:</strong> {formatTimeAgo(order.createdAt)}</p>
                              </div>
                            </div>
                            
                            <div className="text-right ml-2">
                              <p className="text-lg md:text-2xl font-bold text-green-600 mb-1 md:mb-2">
                                ₹{order.totalAmount.toFixed(2)}
                              </p>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                order.role === "staff" 
                                  ? "bg-blue-100 text-blue-800 border border-blue-200"
                                  : "bg-green-100 text-green-800 border border-green-200"
                              }`}>
                                {order.role}
                              </span>
                            </div>
                          </div>

                          {/* Action Buttons - Mobile Stacked */}
                          <div className="flex flex-wrap gap-2">
                            {statusInfo.nextAction && (
                              <button
                                onClick={() => handleOrderStatusUpdate(order._id, statusInfo.nextStatus!)}
                                className="bg-gradient-to-r from-purple-500 to-purple-600 text-white px-3 py-2 rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all duration-300 text-xs md:text-sm font-medium flex-1 min-w-[120px] text-center"
                              >
                                {statusInfo.nextAction}
                              </button>
                            )}
                            
                            {order.status === "pending" && (
                              <button
                                onClick={() => handleOrderStatusUpdate(order._id, "cancelled")}
                                className="bg-gradient-to-r from-red-500 to-red-600 text-white px-3 py-2 rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-300 text-xs md:text-sm font-medium flex-1 min-w-[120px] text-center"
                              >
                                Cancel Order
                              </button>
                            )}
                            
                            <button
                              onClick={() => handleDeleteOrder(order._id)}
                              className="bg-gradient-to-r from-gray-500 to-gray-600 text-white px-3 py-2 rounded-lg hover:from-gray-600 hover:to-gray-700 transition-all duration-300 text-xs md:text-sm font-medium flex-1 min-w-[120px] text-center"
                            >
                              Delete
                            </button>
                          </div>
                        </div>

                        {/* Order Items */}
                        <div className="border-t border-gray-100 pt-3 md:pt-4">
                          <h4 className="font-semibold text-gray-900 mb-2 md:mb-3 text-sm md:text-lg">Order Items:</h4>
                          <div className="space-y-2 md:space-y-3">
                            {order.items.map((orderItem, index) => (
                              <div key={index} className="flex items-center justify-between group-hover:bg-gray-50 p-2 rounded-lg transition-colors duration-200">
                                <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
                                  <img
                                    src={orderItem.item?.imageUrl || "/placeholder-food.jpg"}
                                    alt={orderItem.item?.name || "Unknown Item"}
                                    className="w-12 h-12 md:w-16 md:h-16 rounded-lg object-cover border border-gray-200 shadow-sm flex-shrink-0"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).src = "/placeholder-food.jpg";
                                    }}
                                  />
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium text-gray-900 text-sm md:text-base truncate">{orderItem.item?.name || "Unknown Item"}</p>
                                    <p className="text-gray-600 text-xs md:text-sm">
                                      ₹{orderItem.item?.price || 0} × {orderItem.quantity}
                                    </p>
                                  </div>
                                </div>
                                <p className="font-semibold text-gray-900 text-base md:text-lg ml-2">
                                  ₹{((orderItem.item?.price || 0) * orderItem.quantity).toFixed(2)}
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
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      <Toaster 
        position="top-center"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'linear-gradient(135deg, #10B981, #059669)',
            color: 'white',
            borderRadius: '12px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
            fontSize: '14px',
          },
        }}
      />

      {/* Enhanced Mobile-optimized Navigation Bar */}
      <nav className="bg-white shadow-2xl border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="flex justify-between items-center h-16 md:h-20">
            {/* Logo/Brand */}
            <div className="flex items-center space-x-2 md:space-x-3">
              <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg md:rounded-xl flex items-center justify-center shadow-lg">
                <Shield className="w-4 h-4 md:w-6 md:h-6 text-white" />
              </div>
              <div className="hidden sm:block">
                <span className="text-lg md:text-xl font-bold text-gray-900">Admin Panel</span>
                <p className="text-gray-500 text-xs">Smart Canteen Management</p>
              </div>
              <div className="sm:hidden">
                <span className="text-base font-bold text-gray-900">Admin</span>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-4 md:space-x-6">
              {[
                { id: "dashboard", label: "Dashboard", icon: BarChart3 },
                { id: "menu-items", label: "Menu Items", icon: Utensils },
                { id: "view-orders", label: "Orders", icon: Package },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleNavigation(item.id)}
                  className={`px-3 py-2 md:px-4 md:py-3 rounded-lg md:rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 flex items-center gap-2 md:gap-3 group ${
                    activeSection === item.id
                      ? `bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg`
                      : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                  }`}
                >
                  <item.icon size={18} className={activeSection === item.id ? "text-white" : "text-green-500"} />
                  <span className="text-sm md:text-base">{item.label}</span>
                </button>
              ))}
              
              <button
                onClick={() => handleNavigation("add-menu")}
                className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-2 md:px-6 md:py-3 rounded-lg md:rounded-xl hover:from-green-600 hover:to-emerald-600 flex items-center gap-2 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl text-sm md:text-base"
              >
                <Plus size={18} /> <span className="hidden sm:inline">Add Menu</span>
              </button>

              {/* Notifications */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2 md:p-3 rounded-lg md:rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 transition-all duration-300 transform hover:scale-110 relative"
                >
                  <Bell size={18} />
                  {notificationCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 md:h-5 md:w-5 flex items-center justify-center font-bold text-[10px] md:text-xs">
                      {notificationCount}
                    </span>
                  )}
                </button>
              </div>

              <button
                onClick={handleLogout}
                className="bg-gradient-to-r from-red-500 to-pink-500 text-white px-4 py-2 md:px-6 md:py-3 rounded-lg md:rounded-xl hover:from-red-600 hover:to-pink-600 flex items-center gap-2 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl text-sm md:text-base"
              >
                <LogOut size={18} /> <span className="hidden sm:inline">Logout</span>
              </button>
            </div>

            {/* Mobile menu button */}
            <div className="lg:hidden flex items-center space-x-2 md:space-x-3">
              {/* Notifications for mobile */}
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition-all duration-300 transform hover:scale-110 relative"
              >
                <Bell size={18} />
                {notificationCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center font-bold text-[10px]">
                    {notificationCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-lg bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 hover:from-gray-200 hover:to-gray-300 transition-all duration-300 transform hover:scale-110 shadow-lg"
              >
                {mobileMenuOpen ? <CloseIcon size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white border-t border-gray-200 shadow-2xl">
            <div className="px-3 py-2 space-y-1">
              {[
                { id: "dashboard", label: "Dashboard", icon: BarChart3 },
                { id: "menu-items", label: "Menu Items", icon: Utensils },
                { id: "view-orders", label: "Orders", icon: Package },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleNavigation(item.id)}
                  className={`w-full text-left px-3 py-3 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 flex items-center gap-3 ${
                    activeSection === item.id
                      ? `bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg`
                      : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <item.icon size={20} />
                  {item.label}
                </button>
              ))}
              
              <button
                onClick={() => handleNavigation("add-menu")}
                className="w-full text-left bg-gradient-to-r from-green-500 to-emerald-500 text-white px-3 py-3 rounded-lg hover:from-green-600 hover:to-emerald-600 flex items-center gap-3 transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                <Plus size={20} />
                Add Menu Item
              </button>

              <button
                onClick={handleLogout}
                className="w-full text-left bg-gradient-to-r from-red-500 to-pink-500 text-white px-3 py-3 rounded-lg hover:from-red-600 hover:to-pink-600 flex items-center gap-3 transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                <LogOut size={20} />
                Logout
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 md:py-8">
        {/* Dynamic Section Content */}
        {renderSection()}
      </div>

      {/* Add Item Modal - Mobile Optimized */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center p-3 md:p-4 z-50">
          <div className="bg-white rounded-2xl md:rounded-3xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto border border-gray-200 transform transition-all duration-300">
            <div className="flex justify-between items-center p-4 md:p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
              <h2 className="text-xl md:text-2xl font-bold text-gray-800">Add New Menu Item</h2>
              <button 
                onClick={handleCloseModal}
                className="p-2 rounded-lg md:rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-800 transition-all duration-300 transform hover:scale-110"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddItem} className="p-4 md:p-6 space-y-4 md:space-y-6">
              {/* Image Upload */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Item Image *
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-xl md:rounded-2xl p-4 md:p-6 text-center hover:border-green-400 transition-all duration-300 bg-gray-50 hover:bg-green-50 group cursor-pointer">
                  {imagePreview ? (
                    <div className="relative">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="mx-auto h-32 w-32 md:h-40 md:w-40 object-cover rounded-xl md:rounded-2xl shadow-lg group-hover:scale-105 transition-transform duration-300"
                      />
                      <button
                        type="button"
                        onClick={resetForm}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 md:p-2 hover:bg-red-600 transition-all duration-300 transform hover:scale-110 shadow-lg"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <>
                      <Upload className="mx-auto h-12 w-12 md:h-16 md:w-16 text-gray-400 mb-3 md:mb-4 group-hover:text-green-500 transition-colors duration-300" />
                      <label htmlFor="image-upload" className="cursor-pointer block">
                        <span className="text-green-600 font-semibold text-base md:text-lg group-hover:text-green-700 transition-colors duration-300">
                          Click to upload
                        </span>
                        <input
                          id="image-upload"
                          name="image"
                          type="file"
                          accept="image/*"
                          onChange={handleImageSelect}
                          className="hidden"
                          required
                        />
                      </label>
                      <p className="text-xs text-gray-500 mt-1 md:mt-2">PNG, JPG, JPEG up to 5MB</p>
                    </>
                  )}
                </div>
              </div>

              {/* Form Fields */}
              {[
                { name: "name", label: "Item Name", type: "text", placeholder: "Enter item name" },
                { name: "price", label: "Price", type: "number", placeholder: "Enter price" },
              ].map((field) => (
                <div key={field.name}>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {field.label} *
                  </label>
                  <input
                    type={field.type}
                    name={field.name}
                    value={formData[field.name as keyof typeof formData]}
                    onChange={handleInputChange}
                    placeholder={field.placeholder}
                    className="w-full px-3 py-2 md:px-4 md:py-3 border border-gray-300 rounded-lg md:rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-300 bg-white hover:bg-gray-50 text-sm md:text-base"
                    required
                    min={field.type === "number" ? "0" : undefined}
                    step={field.type === "number" ? "0.01" : undefined}
                  />
                </div>
              ))}

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Enter item description"
                  className="w-full px-3 py-2 md:px-4 md:py-3 border border-gray-300 rounded-lg md:rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none transition-all duration-300 bg-white hover:bg-gray-50 text-sm md:text-base"
                  rows={3}
                  required
                />
              </div>

              {/* Category & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Category *
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 md:px-4 md:py-3 border border-gray-300 rounded-lg md:rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-300 bg-white hover:bg-gray-50 text-sm md:text-base"
                    required
                  >
                    <option value="">🍽️ Select category</option>
                    <option value="breakfast">🍳 Breakfast</option>
                    <option value="main-course">🍛 Main Course</option>
                    <option value="snacks">🥪 Snacks</option>
                    <option value="beverages">☕ Beverages</option>
                    <option value="desserts">🧁 Desserts</option>
                    <option value="fast-food">🍔 Fast Food</option>
                    <option value="south-indian">🍲 South Indian</option>
                    <option value="north-indian">🥘 North Indian</option>
                    <option value="chinese">🍜 Chinese</option>
                    <option value="bakery">🍩 Bakery</option>
                    <option value="healthy">🥗 Healthy Options</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 md:px-4 md:py-3 border border-gray-300 rounded-lg md:rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-300 bg-white hover:bg-gray-50 text-sm md:text-base"
                  >
                    <option value="available">Available</option>
                    <option value="unavailable">Unavailable</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white py-3 md:py-4 px-4 md:px-6 rounded-lg md:rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2 md:gap-3 shadow-lg hover:shadow-xl font-semibold text-sm md:text-lg"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 md:w-6 md:h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Adding Item...
                  </>
                ) : (
                  <>
                    <Plus size={18} /> Add Menu Item
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Mobile Floating Action Button */}
      <div className="lg:hidden fixed bottom-6 right-6 z-40">
        <button
          onClick={() => handleNavigation("add-menu")}
          className="bg-gradient-to-r from-green-500 to-emerald-500 text-white w-14 h-14 rounded-full shadow-2xl flex items-center justify-center hover:from-green-600 hover:to-emerald-600 transition-all duration-300 transform hover:scale-110"
        >
          <Plus size={24} />
        </button>
      </div>
    </div>
  );
}