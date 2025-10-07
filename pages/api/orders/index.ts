import type { NextApiRequest, NextApiResponse } from "next";
import { dbConnect } from "@/lib/mongoose";
import Order from "@/models/Order";
import Item from "@/models/Item";
import { getTokenFromReq, verifyToken } from "@/lib/auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await dbConnect();

  // ✅ Create Order — only for student or staff
  if (req.method === "POST") {
    try {
      const token = getTokenFromReq(req);
      if (!token) {
        return res.status(401).json({ message: "Not authorized. Please login." });
      }

      const decoded = verifyToken(token);
      if (!decoded) {
        return res.status(401).json({ message: "Invalid or expired token" });
      }

      const { items } = req.body;

      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ message: "No items in order" });
      }

      // ❌ Prevent admin from placing orders
      if (decoded.role === "admin") {
        return res.status(403).json({ message: "Admins cannot place orders" });
      }

      // Fetch items to calculate total
      const itemDocs = await Item.find({ _id: { $in: items.map(i => i.item) } });

      const totalAmount = items.reduce((sum, i) => {
        const item = itemDocs.find(d => d._id.toString() === i.item);
        return sum + (item ? item.price * i.quantity : 0);
      }, 0);

      const newOrder = await Order.create({
        userId: decoded.id,
        userName: decoded.name,
        role: decoded.role,
        items,
        totalAmount,
        status: "pending",
      });

      return res.status(201).json({ message: "Order placed successfully", order: newOrder });
    } catch (error: any) {
      console.error("Error creating order:", error);
      return res.status(500).json({ message: "Server error creating order", error: error.message });
    }
  }

  // ✅ Get Orders (Admin sees all, Student/Staff sees their own)
  if (req.method === "GET") {
    try {
      const token = getTokenFromReq(req);
      if (!token) {
        return res.status(401).json({ message: "Not authorized" });
      }

      const decoded = verifyToken(token);
      if (!decoded) {
        return res.status(401).json({ message: "Invalid or expired token" });
      }

      let orders;

      if (decoded.role === "admin") {
        orders = await Order.find().populate("items.item").sort({ createdAt: -1 });
      } else {
        orders = await Order.find({ userId: decoded.id })
          .populate("items.item")
          .sort({ createdAt: -1 });
      }

      return res.status(200).json(orders);
    } catch (error: any) {
      console.error("Error fetching orders:", error);
      return res.status(500).json({ message: "Server error fetching orders", error: error.message });
    }
  }

  res.setHeader("Allow", ["GET", "POST"]);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}
