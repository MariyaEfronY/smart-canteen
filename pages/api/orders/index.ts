import type { NextApiRequest, NextApiResponse } from "next";
import { dbConnect } from "@/lib/mongoose";
import Order from "@/models/Order";
import User from "@/models/User";
import jwt from "jsonwebtoken";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await dbConnect();

  if (req.method === "POST") {
    try {
      const token = req.cookies.token; // 👈 your cookie set by setTokenCookie()
      if (!token) return res.status(401).json({ message: "Please login to place an order" });

      const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
        id: string;
        role: "student" | "staff";
      };

      const { items } = req.body;
      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ message: "No items provided" });
      }

      // Find the logged-in user
      const user = await User.findById(decoded.id);
      if (!user) return res.status(404).json({ message: "User not found" });

      // Calculate total
      const totalAmount = items.reduce(
        (sum: number, item: any) => sum + item.price * item.quantity,
        0
      );

      const order = await Order.create({
        userId: user._id,
        userName: user.name,
        role: user.role,
        items: items.map((i: any) => ({ item: i.itemId, quantity: i.quantity })),
        totalAmount,
        status: "pending",
      });

      return res.status(201).json({ message: "Order placed successfully", order });
    } catch (error: any) {
      console.error("Order creation error:", error);
      if (error.name === "JsonWebTokenError") {
        return res.status(401).json({ message: "Invalid or expired token" });
      }
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  if (req.method === "GET") {
    try {
      const token = req.cookies.token;
      if (!token) return res.status(401).json({ message: "Unauthorized" });

      const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
        id: string;
      };

      const orders = await Order.find({ userId: decoded.id }).populate("items.item");
      return res.status(200).json(orders);
    } catch (error: any) {
      console.error("Error fetching orders:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  return res.status(405).json({ message: "Method not allowed" });
}
