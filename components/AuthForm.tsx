//components/AuthForm.tsx

"use client";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";

// Define proper TypeScript interfaces
interface AuthFormData {
  name?: string;
  dno?: string;
  staffId?: string;
  email?: string;
  password: string;
  role?: "student" | "staff" | "admin";
  department?: string;
  phone?: string;
}

interface ApiResponse {
  message?: string;
  user?: {
    role: string;
  };
}

type Props = { type: "login" | "signup" };

export default function AuthForm({ type }: Props) {
  const router = useRouter();
  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm<AuthFormData>();
  const [isLoading, setIsLoading] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  
  const watchRole = watch("role");

  // Fix hydration by only rendering after mount
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const apiRequest = async (url: string, data: unknown): Promise<ApiResponse> => {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    const result: ApiResponse = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || "Something went wrong");
    }

    return result;
  };

  // ✅ FIXED: Simplified and reliable redirection function
  const redirectUser = async (formRole?: string) => {
    try {
      console.log("🔄 Starting redirection process...");
      
      // First, check for pending order redirect
      const redirectData = localStorage.getItem('loginRedirect');
      
      if (redirectData) {
        try {
          const parsedData = JSON.parse(redirectData);
          console.log("📦 Found redirect data:", parsedData);
          
          // If there's a pending order, redirect to place-order immediately
          if (parsedData.fromOrder === true && parsedData.redirectTo === '/place-order') {
            console.log("🎯 Redirecting to place-order page (pending order detected)");
            // Clear the redirect data after use
            localStorage.removeItem('loginRedirect');
            router.push('/place-order');
            return; // Stop further execution
          }
        } catch (error) {
          console.error("❌ Error parsing redirect data:", error);
          localStorage.removeItem('loginRedirect'); // Clear invalid data
        }
      }

      // If no pending order, try to get user data from API
      console.log("🔍 Fetching user data for role-based redirection...");
      const userResponse = await fetch("/api/auth/me");
      
      if (userResponse.ok) {
        const userData = await userResponse.json();
        const userRole = userData.user?.role || formRole;
        console.log("👤 User role detected from API:", userRole);
        
        // Redirect based on confirmed role
        redirectToDashboard(userRole);
      } else {
        console.log("⚠️ Could not fetch user data, using form role");
        // Use the role from form data as fallback
        redirectToDashboard(formRole);
      }
    } catch (error) {
      console.error("❌ Error in redirectUser:", error);
      // Final fallback to form data role
      redirectToDashboard(formRole);
    }
  };

  // ✅ NEW: Centralized dashboard redirection
  const redirectToDashboard = (role: string | undefined) => {
    console.log("🎯 Redirecting to dashboard for role:", role);
    
    switch (role) {
      case "admin":
        console.log("🚀 Redirecting to admin dashboard");
        router.push("/admin");
        break;
      case "staff":
        console.log("🚀 Redirecting to staff dashboard");
        router.push("/staff");
        break;
      case "student":
      default:
        console.log("🚀 Redirecting to student dashboard");
        router.push("/student");
        break;
    }
  };

  // ✅ FIXED: Enhanced onSubmit with proper error handling and redirection
  const onSubmit = async (data: AuthFormData) => {
    setIsLoading(true);
    try {
      const url = type === "login" ? "/api/auth/login" : "/api/auth/signup";
      
      let requestData: Record<string, unknown> = {};

      // For login, ensure we send the correct identifier based on role
      if (type === "login") {
        requestData = {
          password: data.password,
          role: data.role
        };

        // Add the correct identifier based on role
        if (data.role === "student") {
          requestData.dno = data.dno;
        } else if (data.role === "staff") {
          requestData.staffId = data.staffId;
        } else if (data.role === "admin") {
          requestData.email = data.email;
        }
      } else {
        // For signup, send all data as is
        requestData = {
          name: data.name,
          password: data.password,
          role: data.role,
          email: data.email,
          dno: data.dno,
          staffId: data.staffId,
          department: data.department,
          phone: data.phone,
        };
      }

      console.log("📤 Sending auth request to:", url);
      console.log("📝 Request data:", { ...requestData, password: '***' }); // Hide password in logs
      
      const result = await apiRequest(url, requestData);
      console.log("✅ Auth successful:", result);
      
      // ✅ CRITICAL FIX: Add a small delay to ensure session is set
      console.log("⏳ Waiting for session to be established...");
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // ✅ Now redirect user
      await redirectUser(data.role);
      
    } catch (err: unknown) {
      const error = err as Error;
      console.error("❌ Auth error:", error);
      
      // Show user-friendly error messages
      let errorMessage = error.message || "Something went wrong";
      
      // Enhance common error messages
      if (errorMessage.includes("Invalid credentials") || errorMessage.includes("not found")) {
        errorMessage = "Invalid login credentials. Please check your details and try again.";
      } else if (errorMessage.includes("already exists")) {
        errorMessage = "An account with these details already exists. Please try logging in instead.";
      } else if (errorMessage.includes("password")) {
        errorMessage = "Password is incorrect. Please try again.";
      }
      
      alert(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Get identifier field based on selected role for LOGIN
  const getLoginIdentifier = () => {
    if (type === "login") {
      if (watchRole === "student") {
        return (
          <div className="space-y-2">
            <label htmlFor="dno" className="block text-sm font-semibold text-gray-800 mb-2 tracking-wide">
              🎓 Department Number <span className="text-red-500">*</span>
            </label>
            <input
              {...register("dno", { 
                required: watchRole === "student" ? "D.No is required for students" : false,
              })}
              id="dno"
              placeholder="Enter your D.No (e.g., 23UBC512)"
              className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-3 focus:ring-green-400 focus:border-green-400 transition-all duration-300 bg-white text-gray-900 placeholder-gray-400 font-medium shadow-sm hover:shadow-md"
            />
            {errors.dno && (
              <p className="text-red-500 text-sm mt-2 flex items-center font-medium bg-red-50 px-3 py-2 rounded-lg border border-red-200">
                <span className="text-lg mr-2">⚠️</span>
                {errors.dno.message}
              </p>
            )}
          </div>
        );
      } else if (watchRole === "staff") {
        return (
          <div className="space-y-2">
            <label htmlFor="staffId" className="block text-sm font-semibold text-gray-800 mb-2 tracking-wide">
              👨‍🏫 Staff ID <span className="text-red-500">*</span>
            </label>
            <input
              {...register("staffId", { 
                required: watchRole === "staff" ? "Staff ID is required for staff" : false,
              })}
              id="staffId"
              placeholder="Enter your Staff ID (e.g., 23UBC52)"
              className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-3 focus:ring-blue-400 focus:border-blue-400 transition-all duration-300 bg-white text-gray-900 placeholder-gray-400 font-medium shadow-sm hover:shadow-md"
            />
            {errors.staffId && (
              <p className="text-red-500 text-sm mt-2 flex items-center font-medium bg-red-50 px-3 py-2 rounded-lg border border-red-200">
                <span className="text-lg mr-2">⚠️</span>
                {errors.staffId.message}
              </p>
            )}
          </div>
        );
      } else if (watchRole === "admin") {
        return (
          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm font-semibold text-gray-800 mb-2 tracking-wide">
              👨‍💼 Admin Email <span className="text-red-500">*</span>
            </label>
            <input
              {...register("email", { 
                required: watchRole === "admin" ? "Email is required for admin" : false,
                pattern: {
                  value: /^\S+@\S+$/i,
                  message: "Invalid email address"
                }
              })}
              id="email"
              placeholder="Enter your admin email address"
              type="email"
              className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-3 focus:ring-purple-400 focus:border-purple-400 transition-all duration-300 bg-white text-gray-900 placeholder-gray-400 font-medium shadow-sm hover:shadow-md"
            />
            {errors.email && (
              <p className="text-red-500 text-sm mt-2 flex items-center font-medium bg-red-50 px-3 py-2 rounded-lg border border-red-200">
                <span className="text-lg mr-2">⚠️</span>
                {errors.email.message}
              </p>
            )}
          </div>
        );
      } else {
        // No role selected yet
        return (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-5 text-center transform hover:scale-[1.02] transition-all duration-300">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-blue-600 text-xl">🔍</span>
            </div>
            <p className="text-blue-800 font-semibold text-sm tracking-wide">
              Select your account type to continue
            </p>
            <p className="text-blue-600 text-xs mt-1 font-medium">
              Choose from Student, Staff, or Admin above
            </p>
          </div>
        );
      }
    }
    return null;
  };

  // For signup, show identifier field based on selected role
  const getSignupIdentifier = () => {
    if (type === "signup") {
      if (watchRole === "student") {
        return (
          <div className="space-y-2">
            <label htmlFor="dno" className="block text-sm font-semibold text-gray-800 mb-2 tracking-wide">
              🎓 Department Number <span className="text-red-500">*</span>
            </label>
            <input
              {...register("dno", { 
                required: watchRole === "student" ? "D.No is required for students" : false,
                pattern: {
                  value: /^[0-9]{2}[A-Z]{3}[0-9]{3}$/,
                  message: "Invalid D.No format (example: 23UBC512)"
                }
              })}
              id="dno"
              placeholder="e.g., 23UBC512"
              className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-3 focus:ring-green-400 focus:border-green-400 transition-all duration-300 bg-white text-gray-900 placeholder-gray-400 font-medium shadow-sm hover:shadow-md"
            />
            {errors.dno && (
              <p className="text-red-500 text-sm mt-2 flex items-center font-medium bg-red-50 px-3 py-2 rounded-lg border border-red-200">
                <span className="text-lg mr-2">⚠️</span>
                {errors.dno.message}
              </p>
            )}
            <p className="text-gray-500 text-xs mt-2 font-medium tracking-wide bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
              📝 <span className="font-semibold">Format:</span> 23UBC512 (Year+Dept+Number) - Required for student registration
            </p>
          </div>
        );
      } else if (watchRole === "staff") {
        return (
          <div className="space-y-2">
            <label htmlFor="staffId" className="block text-sm font-semibold text-gray-800 mb-2 tracking-wide">
              👨‍🏫 Staff ID <span className="text-red-500">*</span>
            </label>
            <input
              {...register("staffId", { 
                required: watchRole === "staff" ? "Staff ID is required for staff" : false,
                pattern: {
                  value: /^[0-9]{2}[A-Z]{3}[0-9]{2,3}$/,
                  message: "Invalid Staff ID format (example: 23UBC52)"
                }
              })}
              id="staffId"
              placeholder="e.g., 23UBC52"
              className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-3 focus:ring-blue-400 focus:border-blue-400 transition-all duration-300 bg-white text-gray-900 placeholder-gray-400 font-medium shadow-sm hover:shadow-md"
            />
            {errors.staffId && (
              <p className="text-red-500 text-sm mt-2 flex items-center font-medium bg-red-50 px-3 py-2 rounded-lg border border-red-200">
                <span className="text-lg mr-2">⚠️</span>
                {errors.staffId.message}
              </p>
            )}
            <p className="text-gray-500 text-xs mt-2 font-medium tracking-wide bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
              📝 <span className="font-semibold">Format:</span> 23UBC52 (Year+Dept+Number) - Required for staff registration
            </p>
          </div>
        );
      } else if (watchRole === "admin") {
        return (
          <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border-2 border-yellow-200 rounded-xl p-5 text-center transform hover:scale-[1.02] transition-all duration-300">
            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-yellow-600 text-xl">💼</span>
            </div>
            <p className="text-yellow-800 font-bold text-sm tracking-wide mb-1">
              Admin Account Setup
            </p>
            <p className="text-yellow-700 text-xs font-medium">
              Email authentication only. No additional ID required.
            </p>
          </div>
        );
      } else {
        // No role selected yet
        return (
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-xl p-5 text-center transform hover:scale-[1.02] transition-all duration-300">
            <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-indigo-600 text-xl">🎯</span>
            </div>
            <p className="text-indigo-800 font-bold text-sm tracking-wide">
              Select Your Role First
            </p>
            <p className="text-indigo-600 text-xs mt-1 font-medium">
              Choose your account type above to see required fields
            </p>
          </div>
        );
      }
    }
    return null;
  };

  // Additional fields for signup - Hide for admin
  const getAdditionalSignupFields = () => {
    if (type === "signup" && watchRole !== "admin") {
      return (
        <>
          <div className="space-y-2">
            <label htmlFor="department" className="block text-sm font-semibold text-gray-800 mb-2 tracking-wide">
              🏫 Department {watchRole === "student" ? <span className="text-red-500">*</span> : <span className="text-gray-500">(Optional)</span>}
            </label>
            <input
              {...register("department", { 
                required: watchRole === "student" ? "Department is required for students" : false 
              })}
              id="department"
              placeholder="Enter your department name"
              className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-3 focus:ring-indigo-400 focus:border-indigo-400 transition-all duration-300 bg-white text-gray-900 placeholder-gray-400 font-medium shadow-sm hover:shadow-md"
            />
            {errors.department && (
              <p className="text-red-500 text-sm mt-2 flex items-center font-medium bg-red-50 px-3 py-2 rounded-lg border border-red-200">
                <span className="text-lg mr-2">⚠️</span>
                {errors.department.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="phone" className="block text-sm font-semibold text-gray-800 mb-2 tracking-wide">
              📱 Phone Number <span className="text-gray-500 font-normal">(Optional)</span>
            </label>
            <input
              {...register("phone")}
              id="phone"
              placeholder="Enter your contact number"
              className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-3 focus:ring-gray-400 focus:border-gray-400 transition-all duration-300 bg-white text-gray-900 placeholder-gray-400 font-medium shadow-sm hover:shadow-md"
            />
          </div>
        </>
      );
    }
    return null;
  };

  // Check if there's a pending order to show special message
  const hasPendingOrder = () => {
    if (typeof window !== 'undefined') {
      const redirectData = localStorage.getItem('loginRedirect');
      if (redirectData) {
        try {
          const parsedData: { fromOrder?: boolean } = JSON.parse(redirectData);
          console.log("🛒 Pending order check:", parsedData.fromOrder);
          return parsedData.fromOrder;
        } catch (error) {
          console.error("❌ Error checking pending order:", error);
          return false;
        }
      }
    }
    return false;
  };

  // Don't render anything until mounted to avoid hydration mismatch
  if (!isMounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-cyan-50 to-blue-50">
        <div className="max-w-md w-full mx-auto p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 p-8 transform hover:scale-[1.01] transition-all duration-500">
            <div className="animate-pulse">
              <div className="h-7 bg-gradient-to-r from-gray-200 to-gray-300 rounded-xl w-3/4 mx-auto mb-4"></div>
              <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg w-1/2 mx-auto mb-8"></div>
              <div className="space-y-5">
                <div className="h-14 bg-gradient-to-r from-gray-200 to-gray-300 rounded-xl"></div>
                <div className="h-14 bg-gradient-to-r from-gray-200 to-gray-300 rounded-xl"></div>
                <div className="h-14 bg-gradient-to-r from-green-400 to-emerald-500 rounded-xl"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-cyan-50 to-blue-50 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute top-10 left-10 w-20 h-20 bg-green-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse"></div>
      <div className="absolute top-40 right-20 w-24 h-24 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse delay-75"></div>
      <div className="absolute bottom-20 left-20 w-16 h-16 bg-cyan-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse delay-150"></div>

      {/* Mobile Header with Enhanced Burger Menu */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-md shadow-lg z-50 border-b border-gray-200/50">
        <div className="flex justify-between items-center p-4">
          <Link href="/" className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-600 tracking-tight">
            🍔 SmartCanteen
          </Link>
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-3 rounded-xl bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 hover:text-green-600 hover:from-green-50 hover:to-emerald-50 transition-all duration-300 shadow-sm hover:shadow-md transform hover:scale-105"
            aria-label="Toggle menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Enhanced Mobile Menu Dropdown */}
        {isMenuOpen && (
          <div className="absolute top-full left-0 right-0 bg-white/95 backdrop-blur-md shadow-xl border-t border-gray-200/50 animate-slideDown">
            <div className="flex flex-col p-5 space-y-4">
              <Link 
                href="/" 
                className="text-gray-700 hover:text-green-600 font-bold py-3 px-4 rounded-xl hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 transition-all duration-300 text-center text-lg tracking-wide border-2 border-transparent hover:border-green-200"
                onClick={() => setIsMenuOpen(false)}
              >
                🏠 Home Portal
              </Link>
              {type === "login" ? (
                <Link 
                  href="/signup" 
                  className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-4 rounded-xl font-black hover:from-green-600 hover:to-emerald-700 transition-all duration-300 text-center text-lg tracking-wider shadow-lg hover:shadow-xl transform hover:scale-105"
                  onClick={() => setIsMenuOpen(false)}
                >
                  🚀 Create Account
                </Link>
              ) : (
                <Link 
                  href="/login" 
                  className="bg-white text-green-600 border-2 border-green-600 px-6 py-4 rounded-xl font-black hover:bg-green-50 transition-all duration-300 text-center text-lg tracking-wider shadow-lg hover:shadow-xl transform hover:scale-105"
                  onClick={() => setIsMenuOpen(false)}
                >
                  🔐 Sign In
                </Link>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex items-center justify-center min-h-screen py-4 px-4 lg:py-8 lg:px-6">
        <div className="max-w-md w-full mx-auto lg:mt-0 mt-20 transform hover:scale-[1.01] transition-all duration-500">
          {/* Enhanced Header */}
          <div className="text-center mb-10">
            <div className="mx-auto w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-3xl flex items-center justify-center shadow-2xl mb-6 transform hover:rotate-6 transition-all duration-500">
              <span className="text-3xl text-white">🍕</span>
            </div>
            <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-700 mb-3 tracking-tight">
              SmartCanteen
            </h1>
            <h2 className="text-3xl font-extrabold text-gray-800 mb-3 tracking-wide">
              {type === "login" ? "Welcome Back!" : "Join Our Community"}
            </h2>
            <p className="text-gray-600 font-medium tracking-wide text-lg">
              {type === "login" 
                ? "🔐 Secure access to your account" 
                : "🌟 Begin your culinary journey with us"
              }
            </p>

            {/* Enhanced Special message for pending orders */}
            {type === "login" && hasPendingOrder() && (
              <div className="mt-6 bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-amber-300 rounded-2xl p-5 transform hover:scale-[1.02] transition-all duration-300 shadow-lg">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-full flex items-center justify-center shadow-md">
                    <span className="text-white text-lg">🛒</span>
                  </div>
                  <div className="text-left">
                    <p className="text-amber-800 font-extrabold text-sm tracking-wide">ORDER PENDING!</p>
                    <p className="text-amber-700 text-xs font-semibold">Complete login to finalize your delicious order</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Enhanced Form Container */}
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl border border-gray-200/50 p-8 space-y-7 transform hover:shadow-2xl transition-all duration-500"
          >
            {/* Enhanced Role Selection */}
            <div className="space-y-3">
              <label htmlFor="role" className="block text-sm font-black text-gray-800 mb-2 tracking-wider uppercase">
                👤 ACCOUNT TYPE <span className="text-red-500">*</span>
              </label>
              <select 
                {...register("role", { required: "Please select your account type" })} 
                id="role"
                className="w-full px-5 py-4 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-green-300 focus:border-green-400 transition-all duration-300 bg-white text-gray-900 font-semibold tracking-wide shadow-sm hover:shadow-md"
              >
                <option value="" className="text-gray-400">🎯 Select your role identity</option>
                <option value="student" className="font-semibold">🎓 Student Account</option>
                <option value="staff" className="font-semibold">👨‍🏫 Staff Account</option>
                <option value="admin" className="font-semibold">👨‍💼 Admin Account</option>
              </select>
              {errors.role && (
                <p className="text-red-500 text-sm mt-3 flex items-center font-bold bg-red-50 px-4 py-3 rounded-xl border-2 border-red-200">
                  <span className="text-xl mr-3">🚫</span>
                  {errors.role.message}
                </p>
              )}
            </div>

            {type === "signup" && (
              <>
                <div className="space-y-3">
                  <label htmlFor="name" className="block text-sm font-black text-gray-800 mb-2 tracking-wider uppercase">
                    📛 FULL NAME <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register("name", { required: "Name is required" })}
                    id="name"
                    placeholder="Enter your complete name"
                    className="w-full px-5 py-4 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-300 focus:border-blue-400 transition-all duration-300 bg-white text-gray-900 font-semibold tracking-wide shadow-sm hover:shadow-md"
                  />
                  {errors.name && (
                    <p className="text-red-500 text-sm mt-3 flex items-center font-bold bg-red-50 px-4 py-3 rounded-xl border-2 border-red-200">
                      <span className="text-xl mr-3">🚫</span>
                      {errors.name.message}
                    </p>
                  )}
                </div>

                <div className="space-y-3">
                  <label htmlFor="email" className="block text-sm font-black text-gray-800 mb-2 tracking-wider uppercase">
                    📧 EMAIL ADDRESS {watchRole === "admin" ? <span className="text-red-500">*</span> : <span className="text-gray-500 font-normal">(Optional)</span>}
                  </label>
                  <input
                    {...register("email", { 
                      required: watchRole === "admin" ? "Email is required for admin" : false,
                      pattern: {
                        value: /^\S+@\S+$/i,
                        message: "Invalid email address format"
                      }
                    })}
                    id="email"
                    placeholder="Enter your professional email"
                    type="email"
                    className="w-full px-5 py-4 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-purple-300 focus:border-purple-400 transition-all duration-300 bg-white text-gray-900 font-semibold tracking-wide shadow-sm hover:shadow-md"
                  />
                  {errors.email && (
                    <p className="text-red-500 text-sm mt-3 flex items-center font-bold bg-red-50 px-4 py-3 rounded-xl border-2 border-red-200">
                      <span className="text-xl mr-3">🚫</span>
                      {errors.email.message}
                    </p>
                  )}
                  {watchRole !== "admin" && (
                    <p className="text-gray-500 text-xs mt-2 font-semibold tracking-wide bg-gray-50 px-4 py-3 rounded-xl border-2 border-gray-200">
                      💡 <span className="font-black">Optional:</span> Provide email for important notifications
                    </p>
                  )}
                </div>
              </>
            )}

            {/* Enhanced Identifier Fields */}
            {type === "login" ? getLoginIdentifier() : getSignupIdentifier()}

            {/* Enhanced Additional fields for signup */}
            {getAdditionalSignupFields()}

            <div className="space-y-3">
              <label htmlFor="password" className="block text-sm font-black text-gray-800 mb-2 tracking-wider uppercase">
                🔒 PASSWORD <span className="text-red-500">*</span>
              </label>
              <input
                {...register("password", { 
                  required: "Password is mandatory",
                  minLength: {
                    value: 6,
                    message: "Password must be at least 6 characters"
                  }
                })}
                id="password"
                placeholder="Create a strong password"
                type="password"
                className="w-full px-5 py-4 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-red-300 focus:border-red-400 transition-all duration-300 bg-white text-gray-900 font-semibold tracking-wide shadow-sm hover:shadow-md"
              />
              {errors.password && (
                <p className="text-red-500 text-sm mt-3 flex items-center font-bold bg-red-50 px-4 py-3 rounded-xl border-2 border-red-200">
                  <span className="text-xl mr-3">🚫</span>
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Enhanced Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-black py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-[1.03] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center space-x-3 shadow-2xl hover:shadow-3xl text-lg tracking-wider"
            >
              {isLoading ? (
                <>
                  <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" />
                  <span className="font-black">PROCESSING...</span>
                </>
              ) : (
                <>
                  <span className="text-xl">{type === "login" ? "🔓" : "🎉"}</span>
                  <span className="font-black">
                    {type === "login" 
                      ? (hasPendingOrder() ? "LOGIN & ORDER NOW" : "ACCESS MY ACCOUNT")
                      : "LAUNCH MY ACCOUNT"
                    }
                  </span>
                </>
              )}
            </button>

            {/* Enhanced Navigation Link */}
            <div className="text-center pt-6 border-t-2 border-gray-200/50">
              <p className="text-gray-600 font-semibold tracking-wide text-base">
                {type === "login" ? "New to SmartCanteen?" : "Already part of our family?"}{" "}
                <Link
                  href={type === "login" ? "/signup" : "/login"}
                  className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 font-black transition-all duration-300 text-lg tracking-wider"
                >
                  {type === "login" ? "JOIN NOW" : "SIGN IN"}
                </Link>
              </p>
            </div>
          </form>

          {/* Enhanced Footer */}
          <div className="text-center mt-8">
            <p className="text-gray-500 font-semibold text-sm tracking-wider bg-white/50 backdrop-blur-sm rounded-2xl p-4 border border-gray-200/50">
              © 2024 <span className="font-black">SmartCanteen</span> • Role-Based Authentication System
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slideDown {
          animation: slideDown 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}