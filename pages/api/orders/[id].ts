// pages/api/orders/[id].ts

import type { NextApiRequest, NextApiResponse } from "next";
import { dbConnect } from "@/lib/mongoose";
import Order from "@/models/Order";
import { getTokenFromReq, verifyToken } from "@/lib/auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await dbConnect();

  const token = getTokenFromReq(req);
  if (!token) return res.status(401).json({ message: "Unauthorized" });

  const decoded = verifyToken(token);
  if (!decoded) return res.status(401).json({ message: "Invalid token" });

  const { id } = req.query;

  // ✅ Fetch order
  if (req.method === "GET") {
    try {
      const order = await Order.findById(id).populate("items.item");
      if (!order) return res.status(404).json({ message: "Order not found" });
      return res.status(200).json(order);
    } catch (error: any) {
      return res.status(500).json({ message: "Error fetching order", error: error.message });
    }
  }

  // ✅ Update status (admin/staff only)
  if (req.method === "PUT") {
    if (!["admin", "staff"].includes(decoded.role)) {
      return res.status(403).json({ message: "Not authorized to update orders" });
    }

    const { status } = req.body;
    if (!["pending", "preparing", "ready", "completed", "cancelled"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    try {
      const updated = await Order.findByIdAndUpdate(id, { status }, { new: true });
      if (!updated) return res.status(404).json({ message: "Order not found" });
      return res.status(200).json({ message: "Order status updated", order: updated });
    } catch (error: any) {
      return res.status(500).json({ message: "Error updating order", error: error.message });
    }
  }

  res.setHeader("Allow", ["GET", "PUT"]);
  return res.status(405).end();
}
