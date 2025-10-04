import type { AppProps } from "next/app";
import "../app/globals.css";
import { AuthProvider } from "@/lib/authContext";
import Layout from "@/components/Layout";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </AuthProvider>
  );
}
