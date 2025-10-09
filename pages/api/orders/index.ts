// pages/api/orders/index.ts - UPDATED VERSION
import type { NextApiRequest, NextApiResponse } from "next";
import { dbConnect } from "@/lib/mongoose";
import Order from "@/models/Order";
import Item from "@/models/Item";
import User from "@/models/User";
import { getTokenFromReq, verifyToken } from "@/lib/auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await dbConnect();

  // ✅ PLACE ORDER - ENHANCED DUPLICATE PREVENTION
  if (req.method === "POST") {
    try {
      const token = getTokenFromReq(req);
      if (!token) return res.status(401).json({ message: "Not logged in" });

      const decoded = verifyToken(token);
      if (!decoded) return res.status(401).json({ message: "Invalid token" });

      const { id: userId, role } = decoded as { id: string; role: "student" | "staff" | "admin" };

      // ✅ ENHANCED: Check for recent duplicate orders (within 2 minutes)
      const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
      const recentOrders = await Order.find({
        userId,
        createdAt: { $gte: twoMinutesAgo }
      }).sort({ createdAt: -1 });

      if (recentOrders.length > 0) {
        const mostRecentOrder = recentOrders[0];
        // Check if the recent order has similar items (potential duplicate)
        const timeDiff = Date.now() - new Date(mostRecentOrder.createdAt).getTime();
        if (timeDiff < 30000) { // 30 seconds
          return res.status(400).json({ 
            message: "You recently placed an order. Please wait a moment before placing another." 
          });
        }
      }

      // ✅ Fetch full user info from DB to get name
      const user = await User.findById(userId);
      if (!user) return res.status(404).json({ message: "User not found" });

      const { items, clientTimestamp, orderIdentifier } = req.body;
      
      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ message: "No items provided" });
      }

      // ✅ ENHANCED: Validate and deduplicate items before processing
      const validatedItems = [];
      const itemMap = new Map();

      for (const orderItem of items) {
        if (!orderItem.item || !orderItem.quantity) {
          return res.status(400).json({ message: "Invalid item data" });
        }

        // Check for duplicate items in the same request
        if (itemMap.has(orderItem.item)) {
          return res.status(400).json({ 
            message: "Duplicate items detected in order. Please review your cart." 
          });
        }
        itemMap.set(orderItem.item, true);

        const item = await Item.findById(orderItem.item);
        if (!item) {
          return res.status(404).json({ message: `Item not found: ${orderItem.item}` });
        }
        if (item.status !== "available") {
          return res.status(400).json({ message: `Item ${item.name} is unavailable` });
        }
        
        validatedItems.push({
          item: item._id,
          quantity: orderItem.quantity,
          price: item.price // Store price at time of order
        });
      }

      // ✅ Calculate total amount from validated items
      const totalAmount = validatedItems.reduce((total, item) => 
        total + (item.price * item.quantity), 0
      );

      // ✅ Create new order with validated items
      const newOrder = await Order.create({
        userId,
        userName: user.name,
        role,
        items: validatedItems,
        totalAmount,
        status: "pending",
        orderIdentifier: orderIdentifier || `order_${Date.now()}`
      });

      // ✅ Populate the created order with item details
      const populatedOrder = await Order.findById(newOrder._id)
        .populate("items.item", "name price imageUrl");

      console.log(`✅ Order created successfully: ${newOrder._id} with ${validatedItems.length} items`);

      return res.status(201).json({
        message: "Order placed successfully",
        order: populatedOrder,
      });
    } catch (err: any) {
      console.error("❌ Order Create Error:", err);
      return res.status(500).json({ 
        message: "Internal server error", 
        error: err.message 
      });
    }
  }

  // ✅ GET MY ORDERS (unchanged)
  if (req.method === "GET") {
    try {
      const token = getTokenFromReq(req);
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