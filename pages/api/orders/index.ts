// pages/api/orders/index.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { dbConnect } from "@/lib/mongoose";
import Order from "@/models/Order";
import Item from "@/models/Item";
import User from "@/models/User";
import { verifyToken } from "@/lib/auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await dbConnect();

  // ✅ PLACE ORDER
  if (req.method === "POST") {
    try {
      const token = req.cookies.token;
      if (!token) return res.status(401).json({ message: "Not logged in" });

      const decoded = verifyToken(token);
      if (!decoded) return res.status(401).json({ message: "Invalid token" });

      const { id: userId, role } = decoded as { id: string; role: "student" | "staff" };

      // ✅ Fetch full user info from DB to get name
      const user = await User.findById(userId);
      if (!user) return res.status(404).json({ message: "User not found" });

      const { items } = req.body;
      if (!items || !Array.isArray(items) || items.length === 0)
        return res.status(400).json({ message: "No items provided" });

      // ✅ Calculate total amount
      let totalAmount = 0;
      for (const orderItem of items) {
        const item = await Item.findById(orderItem.item);
        if (!item) return res.status(404).json({ message: `Item not found: ${orderItem.item}` });
        totalAmount += item.price * orderItem.quantity;
      }

      // ✅ Create new order
      const newOrder = await Order.create({
        userId,
        userName: user.name,
        role,
        items,
        totalAmount,
        status: "pending",
      });

      return res.status(201).json({
        message: "Order placed successfully",
        order: newOrder,
      });
    } catch (err: any) {
      console.error("❌ Order Create Error:", err);
      return res.status(500).json({ message: "Internal server error", error: err.message });
    }
  }

  // ✅ GET MY ORDERS
  if (req.method === "GET") {
    try {
      const token = req.cookies.token;
      if (!token) return res.status(401).json({ message: "Not logged in" });

      const decoded = verifyToken(token);
      if (!decoded) return res.status(401).json({ message: "Invalid token" });

      const { id: userId } = decoded as { id: string };

      const orders = await Order.find({ userId })
        .populate("items.item", "name price imageUrl")
        .sort({ createdAt: -1 });

      return res.status(200).json(orders);
    } catch (err: any) {
      console.error("❌ Fetch Orders Error:", err);
      return res.status(500).json({ message: "Internal server error", error: err.message });
    }
  }

  res.setHeader("Allow", ["GET", "POST"]);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}
