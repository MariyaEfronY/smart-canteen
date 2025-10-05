"use client";
import Link from "next/link";
import { useAuth } from "@/lib/authContext";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode } from "react";

interface User {
  id: string;
  name: string;
  dno: string;
  role: "student" | "admin";
}

interface AuthContextType {
  user: User | null;
  logout: () => Promise<void>;
}

export default function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth() as AuthContextType;
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
            <Link href="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
              <span className="text-2xl">🍔</span>
              <span className="text-xl font-bold text-green-600">Campus Canteen</span>
            </Link>

            {/* Navigation Links */}
            <div className="flex items-center space-x-6">
              {!user ? (
                <>
                  <Link 
                    href="/login" 
                    className="text-gray-700 hover:text-green-600 transition-colors duration-200 font-medium"
                  >
                    Login
                  </Link>
                  <Link 
                    href="/signup" 
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors duration-200 font-medium"
                  >
                    Sign Up
                  </Link>
                </>
              ) : (
                <>
                  {/* Navigation based on role */}
                  {user.role === "student" && (
                    <Link 
                      href="/dashboard" 
                      className="text-gray-700 hover:text-green-600 transition-colors duration-200 font-medium"
                    >
                      🎓 Dashboard
                    </Link>
                  )}
                  {user.role === "admin" && (
                    <Link 
                      href="/admin" 
                      className="text-gray-700 hover:text-green-600 transition-colors duration-200 font-medium"
                    >
                      👨‍💼 Admin Panel
                    </Link>
                  )}
                  
                  {/* User Info */}
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {user.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        D.No: {user.dno} • {user.role === 'student' ? 'Student' : 'Admin'}
                      </p>
                    </div>
                    
                    {/* Logout Button */}
                    <button 
                      onClick={handleLogout} 
                      className="bg-red-50 text-red-600 hover:bg-red-100 px-3 py-1 rounded-md text-sm font-medium transition-colors duration-200 border border-red-200"
                      type="button"
                    >
                      Logout
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="text-center text-gray-500 text-sm">
            <p>© 2024 Campus Canteen. Department Number based authentication system.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}