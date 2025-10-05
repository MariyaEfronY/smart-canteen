"use client";
import { ReactNode } from "react";
import { AuthProvider } from "@/lib/authContext";
import Layout from "@/components/Layout";

interface ClientLayoutProps {
  children: ReactNode;
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  return (
    <AuthProvider>
      <Layout>{children}</Layout>
    </AuthProvider>
  );
}