"use client";
import Link from "next/link";
import { useAuth } from "@/lib/authContext";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode } from "react";

export default function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await logout();
      router.push("/");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2">
              <span className="text-2xl">🍔</span>
              <span className="text-xl font-bold text-green-600">Campus Canteen</span>
            </Link>

            {/* Navigation Links */}
            <div className="flex items-center space-x-4">
              {!user ? (
                <>
                  <Link 
                    href="/login" 
                    className="text-gray-700 hover:text-green-600 transition-colors duration-200"
                  >
                    Login
                  </Link>
                  <Link 
                    href="/signup" 
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors duration-200"
                  >
                    Sign Up
                  </Link>
                </>
              ) : (
                <>
                  {user.role === "student" && (
                    <Link 
                      href="/dashboard" 
                      className="text-gray-700 hover:text-green-600 transition-colors duration-200"
                    >
                      Dashboard
                    </Link>
                  )}
                  {user.role === "admin" && (
                    <Link 
                      href="/admin" 
                      className="text-gray-700 hover:text-green-600 transition-colors duration-200"
                    >
                      Admin Panel
                    </Link>
                  )}
                  <span className="text-sm text-gray-600">
                    Hello, {user.name}
                  </span>
                  <button 
                    onClick={handleLogout} 
                    className="text-red-600 hover:text-red-700 transition-colors duration-200"
                  >
                    Logout
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}