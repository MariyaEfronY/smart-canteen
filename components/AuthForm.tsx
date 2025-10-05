"use client";
import { useForm } from "react-hook-form";
import api from "@/lib/api";
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
}

interface ApiError {
  response?: {
    data?: {
      message?: string;
    };
  };
  message?: string;
}

type Props = { type: "login" | "signup" };

export default function AuthForm({ type }: Props) {
  const router = useRouter();
  const { register, handleSubmit, formState: { errors }, watch } = useForm<AuthFormData>();
  const [isLoading, setIsLoading] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  
  const watchRole = watch("role");

  // Fix hydration by only rendering after mount
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const onSubmit = async (data: AuthFormData) => {
    setIsLoading(true);
    try {
      const url = type === "login" ? "/auth/login" : "/auth/signup";
      await api.post(url, data);
      router.push(type === "login" ? "/dashboard" : "/login");
    } catch (err: unknown) {
      const error = err as ApiError;
      alert(error.response?.data?.message || error.message || "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  // Determine which identifier to use for login
  const getLoginIdentifier = () => {
    if (type === "login") {
      return (
        <div>
          <label htmlFor="identifier" className="block text-sm font-medium text-gray-700 mb-2">
            D.No or Staff ID
          </label>
          <input
            {...register("dno", { 
              required: "D.No or Staff ID is required",
            })}
            id="identifier"
            placeholder="Enter your D.No or Staff ID"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white text-gray-900 placeholder-gray-500"
          />
          {errors.dno && (
            <p className="text-red-500 text-sm mt-2 flex items-center">
              <span>⚠️</span>
              <span className="ml-1">{errors.dno.message}</span>
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  // For signup, show identifier field based on selected role
  const getSignupIdentifier = () => {
    if (type === "signup") {
      if (watchRole === "student") {
        return (
          <div>
            <label htmlFor="dno" className="block text-sm font-medium text-gray-700 mb-2">
              Department Number (D.No) *
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
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white text-gray-900 placeholder-gray-500"
            />
            {errors.dno && (
              <p className="text-red-500 text-sm mt-2 flex items-center">
                <span>⚠️</span>
                <span className="ml-1">{errors.dno.message}</span>
              </p>
            )}
            <p className="text-gray-500 text-xs mt-1">
              Format: 23UBC512 (Year+Dept+Number) - Required for students
            </p>
          </div>
        );
      } else if (watchRole === "staff" || watchRole === "admin") {
        return (
          <div>
            <label htmlFor="staffId" className="block text-sm font-medium text-gray-700 mb-2">
              Staff ID *
            </label>
            <input
              {...register("staffId", { 
                required: (watchRole === "staff" || watchRole === "admin") ? "Staff ID is required" : false,
                pattern: {
                  value: /^ST[0-9A-Z]{3,}$/,
                  message: "Invalid Staff ID format (example: ST001 or ST23CS512)"
                }
              })}
              id="staffId"
              placeholder="e.g., ST001"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white text-gray-900 placeholder-gray-500"
            />
            {errors.staffId && (
              <p className="text-red-500 text-sm mt-2 flex items-center">
                <span>⚠️</span>
                <span className="ml-1">{errors.staffId.message}</span>
              </p>
            )}
            <p className="text-gray-500 text-xs mt-1">
              Format: ST followed by numbers/letters - Required for staff/admin
            </p>
          </div>
        );
      } else {
        // No role selected yet
        return (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-blue-800 text-sm text-center">
              Please select your account type above to see the required identifier field
            </p>
          </div>
        );
      }
    }
    return null;
  };

  // Don't render anything until mounted to avoid hydration mismatch
  if (!isMounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-white to-blue-50">
        <div className="max-w-md w-full mx-auto p-4">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
            <div className="animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-3/4 mx-auto mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto mb-8"></div>
              <div className="space-y-4">
                <div className="h-12 bg-gray-200 rounded"></div>
                <div className="h-12 bg-gray-200 rounded"></div>
                <div className="h-12 bg-green-600 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      {/* Mobile Header with Burger Menu */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-white shadow-md z-50">
        <div className="flex justify-between items-center p-4">
          <Link href="/" className="text-lg font-bold text-green-600">
            Campus Canteen
          </Link>
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 rounded-md text-gray-600 hover:text-green-600 hover:bg-gray-100 transition-colors"
            aria-label="Toggle menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu Dropdown */}
        {isMenuOpen && (
          <div className="absolute top-full left-0 right-0 bg-white shadow-lg border-t border-gray-200">
            <div className="flex flex-col p-4 space-y-3">
              <Link 
                href="/" 
                className="text-gray-700 hover:text-green-600 font-medium py-2 transition-colors duration-200 text-center"
                onClick={() => setIsMenuOpen(false)}
              >
                🏠 Home
              </Link>
              {type === "login" ? (
                <Link 
                  href="/signup" 
                  className="bg-green-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors duration-200 text-center"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Create Account
                </Link>
              ) : (
                <Link 
                  href="/login" 
                  className="bg-white text-green-600 border border-green-600 px-4 py-3 rounded-lg font-semibold hover:bg-green-50 transition-colors duration-200 text-center"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Sign In
                </Link>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex items-center justify-center min-h-screen py-4 px-4 lg:py-8 lg:px-6">
        <div className="max-w-md w-full mx-auto lg:mt-0 mt-16">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-green-500 rounded-2xl flex items-center justify-center shadow-lg mb-4">
              <span className="text-2xl text-white">🍔</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Campus Canteen
            </h1>
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">
              {type === "login" ? "Welcome Back" : "Create Account"}
            </h2>
            <p className="text-gray-600">
              {type === "login" 
                ? "Sign in with your D.No or Staff ID" 
                : "Register as Student or Staff member"
              }
            </p>
          </div>

          {/* Form */}
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 space-y-6"
          >
            {type === "signup" && (
              <>
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    {...register("name", { required: "Name is required" })}
                    id="name"
                    placeholder="Enter your full name"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white text-gray-900 placeholder-gray-500"
                  />
                  {errors.name && (
                    <p className="text-red-500 text-sm mt-2 flex items-center">
                      <span>⚠️</span>
                      <span className="ml-1">{errors.name.message}</span>
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <input
                    {...register("email", { 
                      required: "Email is required",
                      pattern: {
                        value: /^\S+@\S+$/i,
                        message: "Invalid email address"
                      }
                    })}
                    id="email"
                    placeholder="Enter your email"
                    type="email"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white text-gray-900 placeholder-gray-500"
                  />
                  {errors.email && (
                    <p className="text-red-500 text-sm mt-2 flex items-center">
                      <span>⚠️</span>
                      <span className="ml-1">{errors.email.message}</span>
                    </p>
                  )}
                </div>

                {/* Account Type Selection */}
                <div>
                  <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
                    Account Type *
                  </label>
                  <select 
                    {...register("role", { required: "Please select your account type" })} 
                    id="role"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white text-gray-900"
                  >
                    <option value="">Select your role</option>
                    <option value="student">🎓 Student</option>
                    <option value="staff">👨‍🏫 Staff</option>
                    <option value="admin">👨‍💼 Admin</option>
                  </select>
                  {errors.role && (
                    <p className="text-red-500 text-sm mt-2 flex items-center">
                      <span>⚠️</span>
                      <span className="ml-1">{errors.role.message}</span>
                    </p>
                  )}
                </div>
              </>
            )}

            {/* Identifier Fields */}
            {getLoginIdentifier()}
            {getSignupIdentifier()}

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password *
              </label>
              <input
                {...register("password", { 
                  required: "Password is required",
                  minLength: {
                    value: 6,
                    message: "Password must be at least 6 characters"
                  }
                })}
                id="password"
                placeholder="Enter your password"
                type="password"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white text-gray-900 placeholder-gray-500"
              />
              {errors.password && (
                <p className="text-red-500 text-sm mt-2 flex items-center">
                  <span>⚠️</span>
                  <span className="ml-1">{errors.password.message}</span>
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <span>{type === "login" ? "🔐" : "🚀"}</span>
                  <span>{type === "login" ? "Sign In" : "Create Account"}</span>
                </>
              )}
            </button>

            <div className="text-center pt-4 border-t border-gray-200">
              <p className="text-gray-600">
                {type === "login" ? "Don't have an account?" : "Already have an account?"}{" "}
                <Link
                  href={type === "login" ? "/signup" : "/login"}
                  className="text-green-600 hover:text-green-700 font-semibold transition-colors duration-200"
                >
                  {type === "login" ? "Sign up" : "Sign in"}
                </Link>
              </p>
            </div>
          </form>

          {/* Footer */}
          <div className="text-center mt-6">
            <p className="text-gray-500 text-sm">
              © 2024 Campus Canteen. Role-based authentication system.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}