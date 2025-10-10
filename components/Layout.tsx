"use client";
import Link from "next/link";
import { useAuth } from "@/lib/authContext";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode } from "react";

interface User {
  id: string;
  name: string;
  email: string;
  dno?: string;
  staffId?: string;
  role: "student" | "staff" | "admin";
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

  const getUserIdentifier = () => {
    if (!user) return null;
    return user.dno || user.staffId || "No ID";
  };

  const getRoleDisplay = (role: string) => {
    switch (role) {
      case "student": return "🎓 Student";
      case "staff": return "👨‍🏫 Staff";
      case "admin": return "👨‍💼 Admin";
      default: return role;
    }
  };

  const getDashboardLink = () => {
    if (!user) return null;
    
    switch (user.role) {
      case "student": return "/dashboard";
      case "staff": return "/staff";
      case "admin": return "/admin";
      default: return "/dashboard";
    }
  };

  const getDashboardLabel = () => {
    if (!user) return null;
    
    switch (user.role) {
      case "student": return "🎓 Dashboard";
      case "staff": return "👨‍🏫 Staff Panel";
      case "admin": return "👨‍💼 Admin Panel";
      default: return "Dashboard";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {children}
      </main>

      
    </div>
  );
}