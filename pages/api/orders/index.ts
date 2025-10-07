// pages/api/orders/index.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { dbConnect } from "@/lib/mongoose";
import Order from "@/models/Order";
import User from "@/models/User";
import { getToken } from "next-auth/jwt"; // or use your existing auth system

const secret = process.env.NEXTAUTH_SECRET as string;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await dbConnect();

  // ✅ Handle Order Creation
  if (req.method === "POST") {
    try {
      const token = await getToken({ req, secret });
      if (!token) {
        return res.status(401).json({ message: "Unauthorized - Please login first" });
      }

      const { items, totalAmount } = req.body;
      if (!items || items.length === 0) {
        return res.status(400).json({ message: "No items found in the order" });
      }

      // ✅ Fetch user details from DB
      const user = await User.findById(token.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // ✅ Create and Save Order
      const newOrder = await Order.create({
        userId: user._id,
        userName: user.name,
        role: user.role, // student or staff
        items: items.map((i: any) => ({
          item: i.itemId,
          quantity: i.quantity,
        })),
        totalAmount,
        status: "pending",
      });

      return res.status(201).json({ message: "Order placed successfully", order: newOrder });
    } catch (error: any) {
      console.error("Error creating order:", error);
      return res.status(500).json({ message: "Internal Server Error" });
    }
  }

  // ✅ Fetch Logged-in User's Orders
  if (req.method === "GET") {
    try {
      const token = await getToken({ req, secret });
      if (!token) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const user = await User.findById(token.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const orders = await Order.find({ userId: user._id }).populate("items.item", "name price");
      return res.status(200).json(orders);
    } catch (error: any) {
      console.error("Error fetching orders:", error);
      return res.status(500).json({ message: "Internal Server Error" });
    }
  }

  // ❌ Any other HTTP Method
  return res.status(405).json({ message: "Method Not Allowed" });
}
