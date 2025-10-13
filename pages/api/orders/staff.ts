// pages/api/orders/staff.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { dbConnect } from "@/lib/mongoose";
import Order from "@/models/Order";
import { getTokenFromReq, verifyToken } from "@/lib/auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await dbConnect();

  if (req.method === "GET") {
    try {
      const token = getTokenFromReq(req);
      if (!token) return res.status(401).json({ message: "Not logged in" });

      const decoded = verifyToken(token);
      if (!decoded) return res.status(401).json({ message: "Invalid token" });

      const { id: userId, role } = decoded as { id: string; role: "student" | "staff" | "admin" };

      // ✅ Verify user is actually staff
      if (role !== "staff") {
        console.log("❌ Access denied: User is not staff, role:", role);
        return res.status(403).json({ 
          message: "Access denied. This endpoint is for staff only." 
        });
      }

      console.log("👨‍🏫 Fetching staff orders for:", userId);

      // ✅ CRITICAL: Only get orders for this staff member with staff role
      const orders = await Order.find({ 
        userId: userId,
        role: "staff" // ✅ Only staff orders
      })
        .populate("items.item", "name price imageUrl")
        .sort({ createdAt: -1 });

      console.log(`📊 Found ${orders.length} STAFF orders for user ${userId}`);

      return res.status(200).json(orders);
    } catch (err: unknown) {
  console.error("❌ Staff Orders Fetch Error:", err);

  const errorMessage = err instanceof Error ? err.message : "Unknown error";

  return res.status(500).json({
    message: "Internal server error",
    error: errorMessage,
  });
}

  }

  res.setHeader("Allow", ["GET"]);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}