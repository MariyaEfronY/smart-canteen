// pages/api/orders/index.ts - COMPLETELY FIXED VERSION
import type { NextApiRequest, NextApiResponse } from "next";
import { dbConnect } from "@/lib/mongoose";
import Order from "@/models/Order";
import Item from "@/models/Item";
import User from "@/models/User";
import { getTokenFromReq, verifyToken } from "@/lib/auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await dbConnect();

  // ✅ PLACE ORDER - FIXED ROLE STORAGE
  if (req.method === "POST") {
    try {
      const token = getTokenFromReq(req);
      if (!token) return res.status(401).json({ message: "Not logged in" });

      const decoded = verifyToken(token);
      if (!decoded) return res.status(401).json({ message: "Invalid token" });

      const { id: userId } = decoded as { id: string; role: "student" | "staff" | "admin" };

      console.log("🔐 User placing order:", { userId, roleFromToken: decoded.role });

      // ✅ CRITICAL FIX: Get fresh user data from database to ensure correct role
      const user = await User.findById(userId);
      if (!user) return res.status(404).json({ message: "User not found" });

      console.log("🎯 User details from database:", {
        userId: user._id,
        userName: user.name,
        roleFromDB: user.role
      });

      // ✅ PREVENT ADMIN FROM PLACING ORDERS
      if (user.role === "admin") {
        console.log("❌ Admin user attempted to place order");
        return res.status(403).json({ 
          message: "Admin users cannot place orders. Please use a student or staff account." 
        });
      }

      // ✅ Check for recent duplicate orders
      const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
      const recentOrders = await Order.find({
        userId,
        createdAt: { $gte: oneMinuteAgo }
      }).sort({ createdAt: -1 });

      if (recentOrders.length > 0) {
        const mostRecentOrder = recentOrders[0];
        const timeDiff = Date.now() - new Date(mostRecentOrder.createdAt).getTime();
        if (timeDiff < 30000) {
          return res.status(400).json({ 
            message: "You recently placed an order. Please wait a moment before placing another.",
            recentOrder: mostRecentOrder
          });
        }
      }

      const { items } = req.body;
      
      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ message: "No items provided" });
      }

      // ✅ Validate and process items
      const validatedItems = [];
      const itemMap = new Map();

      for (const orderItem of items) {
        if (!orderItem.item || !orderItem.quantity) {
          return res.status(400).json({ message: "Invalid item data" });
        }

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
          price: item.price,
          name: item.name
        });
      }

      // ✅ Calculate total amount
      const totalAmount = validatedItems.reduce((total, item) => 
        total + (item.price * item.quantity), 0
      );

      // ✅ CRITICAL FIX: Create order with CORRECT role from database
      const order = await Order.create({
        userId: user._id,
        userName: user.name,
        role: user.role, // ✅ This is the FIX - using role from database
        items: validatedItems,
        totalAmount,
        status: "pending"
      });

      // ✅ Populate the created order
      const populatedOrder = await Order.findById(order._id)
        .populate("items.item", "name price imageUrl");

      console.log(`✅ ORDER CREATED SUCCESSFULLY:`, {
        orderNumber: order.orderNumber,
        userId: order.userId,
        userName: order.userName,
        role: order.role, // ✅ This should now show the correct role
        itemsCount: validatedItems.length,
        totalAmount: order.totalAmount
      });

      return res.status(201).json({
        message: "Order placed successfully",
        order: populatedOrder,
      });
    } catch (err: unknown) {
  console.error("❌ Order Create Error:", err);

  const errorMessage = err instanceof Error ? err.message : "Unknown error";

  return res.status(500).json({
    message: "Internal server error",
    error: errorMessage,
  });
}

  }

  // ✅ GET ORDERS - FIXED ROLE-BASED FILTERING
  if (req.method === "GET") {
    try {
      const token = getTokenFromReq(req);
      if (!token) return res.status(401).json({ message: "Not logged in" });

      const decoded = verifyToken(token);
      if (!decoded) return res.status(401).json({ message: "Invalid token" });

      const { id: userId, role: userRole } = decoded as { id: string; role: "student" | "staff" | "admin" };

      console.log("🔍 Fetching orders for:", { userId, userRole });

      let orders;
      
      if (userRole === "admin") {
        // Admin can see all orders
        orders = await Order.find({})
          .populate("items.item", "name price imageUrl")
          .populate("userId", "name email role")
          .sort({ createdAt: -1 });
      } else {
        // ✅ CRITICAL FIX: Users only see their own orders with their specific role
        orders = await Order.find({ 
          userId: userId,
          role: userRole // ✅ Only get orders with matching role
        })
          .populate("items.item", "name price imageUrl")
          .sort({ createdAt: -1 });
      }

      console.log(`📊 Found ${orders.length} orders for user ${userId} (role: ${userRole})`);

      return res.status(200).json(orders);
    } catch (err: unknown) {
  console.error("❌ Fetch Orders Error:", err);

  // Narrow unknown to Error type before accessing message
  const errorMessage = err instanceof Error ? err.message : "Unknown error";

  return res.status(500).json({
    message: "Internal server error",
    error: errorMessage,
  });
}

  }

  res.setHeader("Allow", ["GET", "POST"]);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}