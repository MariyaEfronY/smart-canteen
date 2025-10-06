"use client";

import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Upload, X, LogOut } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { useRouter } from "next/navigation";

interface MenuItem {
  _id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string;
  createdAt: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [items, setItems] = useState<MenuItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
  });

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

  useEffect(() => {
    fetchItems();
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
    } catch (error: any) {
      toast.error(error.message || "Error adding item");
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
      if (!response.ok) throw new Error(data.message || "Failed to delete item");

      toast.success("Item deleted successfully!");
      fetchItems();
    } catch (error: any) {
      toast.error(error.message || "Error deleting item");
    }
  };

  const resetForm = () => {
    setFormData({ name: "", description: "", price: "", category: "" });
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setSelectedImage(null);
    setImagePreview("");
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <Toaster position="top-right" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600 mt-2">Manage your menu items and orders</p>
          </div>
          <button
            onClick={handleLogout}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center gap-2"
          >
            <LogOut size={20} /> Logout
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-800">Total Items</h3>
            <p className="text-3xl font-bold text-green-600 mt-2">{items.length}</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-800">Categories</h3>
            <p className="text-3xl font-bold text-blue-600 mt-2">
              {new Set(items.map((item) => item.category)).size}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-800">Actions</h3>
            <button
              onClick={() => setIsModalOpen(true)}
              className="mt-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
            >
              <Plus size={20} /> Add New Item
            </button>
          </div>
        </div>

        {/* Menu Items Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">Menu Items</h2>
          </div>

          {items.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No menu items found</p>
              <button
                onClick={() => setIsModalOpen(true)}
                className="mt-4 bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
              >
                Add Your First Item
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Item
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {items.map((item) => (
                    <tr key={item._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap flex items-center gap-3">
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="h-12 w-12 rounded-lg object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "/placeholder-image.jpg";
                          }}
                        />
                        <span className="font-medium">{item.name}</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700 max-w-xs">
                        {item.description}
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-800">
                        ₹{item.price.toFixed(2)}
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 inline-flex text-xs font-semibold rounded-full bg-green-100 text-green-800">
                          {item.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <button
                          onClick={() => handleDeleteItem(item._id)}
                          className="text-red-600 hover:text-red-900"
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
      </div>

      {/* Add Item Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-semibold">Add New Menu Item</h2>
              <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleAddItem} className="p-6 space-y-4">
              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Item Image *
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-green-400">
                  {imagePreview ? (
                    <div className="relative">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="mx-auto h-32 w-32 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          resetForm();
                        }}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <>
                      <Upload className="mx-auto h-12 w-12 text-gray-400" />
                      <label htmlFor="image-upload" className="cursor-pointer mt-2 block">
                        <span className="text-green-600 font-medium">Click to upload</span>
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
                      <p className="text-xs text-gray-500 mt-1">PNG, JPG, JPEG up to 5MB</p>
                    </>
                  )}
                </div>
              </div>

              {/* Name */}
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Item name"
                className="w-full border rounded-md p-2"
                required
              />

              {/* Description */}
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Description"
                className="w-full border rounded-md p-2"
                required
              />

              {/* Price */}
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                placeholder="Price"
                className="w-full border rounded-md p-2"
                required
              />

              {/* Category */}
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="w-full border rounded-md p-2"
                required
              >
                <option value="">Select category</option>
                <option value="appetizers">Appetizers</option>
                <option value="main-course">Main Course</option>
                <option value="desserts">Desserts</option>
                <option value="beverages">Beverages</option>
                <option value="snacks">Snacks</option>
              </select>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-green-600 text-white py-2 rounded-md hover:bg-green-700 flex justify-center items-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Plus size={20} /> Add Item
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
