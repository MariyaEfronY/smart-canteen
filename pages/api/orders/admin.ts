// pages/api/orders/admin.ts - NEW FILE
import type { NextApiRequest, NextApiResponse } from "next";
import { dbConnect } from "@/lib/mongoose";
import Order from "@/models/Order";
import { getTokenFromReq, verifyToken } from "@/lib/auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await dbConnect();

  // ✅ GET ALL ORDERS (Admin/Staff only)
  if (req.method === "GET") {
    try {
      const token = getTokenFromReq(req);
      if (!token) return res.status(401).json({ message: "Unauthorized" });

      const decoded = verifyToken(token);
      if (!decoded) return res.status(401).json({ message: "Invalid token" });

      // Only admin and staff can access all orders
      if (!["admin", "staff"].includes(decoded.role)) {
        return res.status(403).json({ message: "Admin/Staff access required" });
      }

      const orders = await Order.find({})
        .populate("items.item", "name price imageUrl")
        .sort({ createdAt: -1 });

      return res.status(200).json(orders);
    } catch (err: any) {
      console.error("❌ Admin Orders Fetch Error:", err);
      return res.status(500).json({ message: "Internal server error", error: err.message });
    }
  }

  res.setHeader("Allow", ["GET"]);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}