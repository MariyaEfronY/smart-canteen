// pages/api/orders/[id].ts
import type { NextApiRequest, NextApiResponse } from "next";
import { dbConnect } from "../../../lib/mongoose";
import Order from "../../../models/Order";
import { getTokenFromReq, verifyToken } from "../../../lib/auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await dbConnect();
  const { id } = req.query;
  const token = getTokenFromReq(req);
  const decoded = token ? verifyToken(token) : null;
  if (!decoded) return res.status(401).json({ message: "Unauthorized" });

  if (req.method === "GET") {
    const order = await Order.findById(id).populate("student").populate("items.item");
    if (!order) return res.status(404).json({ message: "Not found" });
    if (decoded.role !== "admin" && String(order.student._id) !== decoded.id) return res.status(403).json({ message: "Forbidden" });
    return res.status(200).json(order);
  }

  if (req.method === "PUT") {
    // admin updates order status
    if (decoded.role !== "admin") return res.status(403).json({ message: "Only admin can update orders" });
    const { status } = req.body;
    const allowed = ["placed", "preparing", "delivered", "cancelled"];
    if (!allowed.includes(status)) return res.status(400).json({ message: "Invalid status" });

    const updated = await Order.findByIdAndUpdate(id, { status }, { new: true }).populate("student").populate("items.item");
    if (!updated) return res.status(404).json({ message: "Not found" });
    return res.status(200).json(updated);
  }

  if (req.method === "DELETE") {
    if (decoded.role !== "admin") return res.status(403).json({ message: "Only admin can delete orders" });
    await Order.findByIdAndDelete(id);
    return res.status(204).end();
  }

  res.setHeader("Allow", ["GET", "PUT", "DELETE"]);
  res.status(405).end();
}
