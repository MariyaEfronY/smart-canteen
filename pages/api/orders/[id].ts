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

  // ✅ Fetch specific order
  if (req.method === "GET") {
    try {
      const order = await Order.findById(id).populate("items.item");
      if (!order) return res.status(404).json({ message: "Order not found" });
      
      // Allow users to see their own orders, admins/staff to see all
      if (decoded.role !== "admin" && decoded.role !== "staff" && order.userId.toString() !== decoded.id) {
        return res.status(403).json({ message: "Not authorized to view this order" });
      }
      
      return res.status(200).json(order);
    } catch (error: unknown) {
  const errorMessage = error instanceof Error ? error.message : "Unknown error";

  return res.status(500).json({
    message: "Error fetching order",
    error: errorMessage,
  });
}

  }

  // ✅ Update order status with enhanced authorization
  if (req.method === "PUT") {
    try {
      const { status } = req.body;
      
      // Validate status
      if (!["pending", "preparing", "ready", "completed", "cancelled"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }

      const order = await Order.findById(id);
      if (!order) return res.status(404).json({ message: "Order not found" });

      const isAdminOrStaff = ["admin", "staff"].includes(decoded.role);
      const isOrderOwner = order.userId.toString() === decoded.id;

      // 🔹 CASE 1: User cancelling their own pending order
      if (status === "cancelled" && isOrderOwner && order.status === "pending") {
        const updated = await Order.findByIdAndUpdate(
          id, 
          { status }, 
          { new: true }
        ).populate("items.item");
        return res.status(200).json({ 
          message: "Order cancelled successfully", 
          order: updated 
        });
      }

      // 🔹 CASE 2: Admin/Staff updating any order status
      if (isAdminOrStaff) {
        const updated = await Order.findByIdAndUpdate(
          id, 
          { status }, 
          { new: true }
        ).populate("items.item");
        return res.status(200).json({ 
          message: "Order status updated successfully", 
          order: updated 
        });
      }

      // 🔹 CASE 3: User trying to update non-cancellation status
      if (isOrderOwner && status !== "cancelled") {
        return res.status(403).json({ 
          message: "You can only cancel your own pending orders. Contact staff for other status changes." 
        });
      }

      // 🔹 CASE 4: User trying to cancel non-pending order
      if (isOrderOwner && status === "cancelled" && order.status !== "pending") {
        return res.status(400).json({ 
          message: "Only pending orders can be cancelled. Contact staff for assistance." 
        });
      }

      return res.status(403).json({ message: "Not authorized to update this order" });

    } catch (error: unknown) {
  console.error("Order update error:", error);

  const errorMessage = error instanceof Error ? error.message : "Unknown error";

  return res.status(500).json({
    message: "Error updating order",
    error: errorMessage,
  });
}
  }

  // ✅ DELETE ORDER (Admin only) - NEW FEATURE
  if (req.method === "DELETE") {
    try {
      // Only admin can delete orders
      if (decoded.role !== "admin") {
        return res.status(403).json({ message: "Admin access required to delete orders" });
      }

      const deletedOrder = await Order.findByIdAndDelete(id);
      if (!deletedOrder) return res.status(404).json({ message: "Order not found" });

      return res.status(200).json({ message: "Order deleted successfully" });
    } catch (error: unknown) {
  console.error("Order delete error:", error);

  const errorMessage = error instanceof Error ? error.message : "Unknown error";

  return res.status(500).json({
    message: "Error deleting order",
    error: errorMessage,
  });
}
  }

  res.setHeader("Allow", ["GET", "PUT", "DELETE"]);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}