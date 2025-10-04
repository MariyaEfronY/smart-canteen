import ClientLayout from "./ClientLayout";

export const metadata = {
  title: "Campus Canteen 🍔",
  description: "Browse menu, order food, and track your order status.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
