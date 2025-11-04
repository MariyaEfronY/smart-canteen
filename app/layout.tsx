import type { Metadata } from "next";
import { ReactNode } from "react";
import ClientLayout from "./ClientLayout";
import "./globals.css";
import { Toaster } from "sonner";

export const metadata: Metadata = { 
  title: "Smart Canteen 🍔",
  description: "Browse menu, order food, and track your order status.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">
        <ClientLayout>{children}</ClientLayout>
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}