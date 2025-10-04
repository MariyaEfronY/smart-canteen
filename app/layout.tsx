"use client";
import { ReactNode } from "react";
import { AuthProvider } from "../lib/authContext";

import Layout from "../components/Layout";
import "@/styles/globals.css";

export const metadata = {
  title: "Campus Canteen 🍔",
  description: "Browse menu, order food, and track your order status.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <Layout>{children}</Layout>
        </AuthProvider>
      </body>
    </html>
  );
}
