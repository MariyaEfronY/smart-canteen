import Link from "next/link";
import { useAuth } from "@/lib/authContext";

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="p-4 flex justify-between items-center border-b">
        <Link href="/" className="text-xl font-bold">
          Campus Canteen 🍔
        </Link>
        <div className="flex gap-4">
          {!user && (
            <>
              <Link href="/login">Login</Link>
              <Link href="/signup">Signup</Link>
            </>
          )}
          {user && (
            <>
              {user.role === "student" && <Link href="/dashboard">Dashboard</Link>}
              {user.role === "admin" && <Link href="/admin">Admin</Link>}
              <button onClick={logout} className="text-red-500">Logout</button>
            </>
          )}
        </div>
      </nav>
      <main className="p-6">{children}</main>
    </div>
  );
}
