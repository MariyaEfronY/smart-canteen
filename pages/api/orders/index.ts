// pages/api/orders/index.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { dbConnect } from "@/lib/mongoose";
import Order from "@/models/Order";
import Item from "@/models/Item";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await dbConnect();

  // 📦 Create new order
  if (req.method === "POST") {
    try {
      const { userId, userName, role, items } = req.body;

      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ message: "No items in order" });
      }

      // Fetch items for pricing
      const itemDocs = await Item.find({ _id: { $in: items.map(i => i.item) } });
      const totalAmount = items.reduce((sum, i) => {
        const item = itemDocs.find(d => d._id.toString() === i.item);
        return sum + (item ? item.price * i.quantity : 0);
      }, 0);

      const order = await Order.create({ userId, userName, role, items, totalAmount });
      return res.status(201).json(order);
    } catch (error) {
      return res.status(500).json({ message: "Error creating order", error });
    }
  }

  // 📋 Get all orders (admin) or user-specific (student/staff)
  if (req.method === "GET") {
    try {
      const { role, userId } = req.query;

      let orders;
      if (role === "admin") {
        orders = await Order.find().populate("items.item").sort({ createdAt: -1 });
      } else {
        orders = await Order.find({ userId }).populate("items.item").sort({ createdAt: -1 });
      }

      return res.status(200).json(orders);
    } catch (error) {
      return res.status(500).json({ message: "Error fetching orders", error });
    }
  }

  res.setHeader("Allow", ["GET", "POST"]);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}
