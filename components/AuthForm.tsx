"use client";
import { useForm } from "react-hook-form";
import api from "@/lib/api";
import { useRouter } from "next/navigation";
import { useState } from "react";

// Define proper TypeScript interfaces
interface AuthFormData {
  name?: string;
  dno: string;
  email?: string;
  password: string;
  role?: "student" | "admin";
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
  const { register, handleSubmit, formState: { errors } } = useForm<AuthFormData>();
  const [isLoading, setIsLoading] = useState(false);

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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-white to-blue-50 py-8 px-4">
      <div className="max-w-md w-full">
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
              ? "Sign in with your D.No and password" 
              : "Register with your details to get started"
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
                  Full Name
                </label>
                <input
                  {...register("name", { required: type === "signup" ? "Name is required" : false })}
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
                  Email Address
                </label>
                <input
                  {...register("email", { 
                    required: type === "signup" ? "Email is required" : false,
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
            </>
          )}

          {/* D.No Field - Required for both login and signup */}
          <div>
            <label htmlFor="dno" className="block text-sm font-medium text-gray-700 mb-2">
              Department Number (D.No)
            </label>
            <input
              {...register("dno", { 
                required: "D.No is required",
                pattern: {
                  value: /^[A-Za-z0-9\-_]+$/,
                  message: "Please enter a valid D.No"
                }
              })}
              id="dno"
              placeholder={type === "login" ? "Enter your D.No" : "Enter your department number"}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white text-gray-900 placeholder-gray-500"
            />
            {errors.dno && (
              <p className="text-red-500 text-sm mt-2 flex items-center">
                <span>⚠️</span>
                <span className="ml-1">{errors.dno.message}</span>
              </p>
            )}
            {type === "signup" && (
              <p className="text-gray-500 text-xs mt-1">
                Your unique department identification number
              </p>
            )}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password
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

          {type === "signup" && (
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
                I am a
              </label>
              <select 
                {...register("role")} 
                id="role"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white text-gray-900"
              >
                <option value="student">🎓 Student</option>
                <option value="admin">👨‍💼 Admin</option>
              </select>
            </div>
          )}

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
              <a
                href={type === "login" ? "/signup" : "/login"}
                className="text-green-600 hover:text-green-700 font-semibold transition-colors duration-200"
              >
                {type === "login" ? "Sign up" : "Sign in"}
              </a>
            </p>
          </div>
        </form>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-gray-500 text-sm">
            © 2024 Campus Canteen. Serving delicious meals with ❤️
          </p>
        </div>
      </div>
    </div>
  );
}