"use client";
import { ReactNode } from "react";
import { AuthProvider } from "@/lib/authContext";
import Layout from "@/components/Layout";

export default function ClientLayout({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <Layout>{children}</Layout>
    </AuthProvider>
  );
}
