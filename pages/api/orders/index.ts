// pages/api/orders/index.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { dbConnect } from "../../../lib/mongoose";
import Order from "../../../models/Order";
import { getTokenFromReq, verifyToken } from "../../../lib/auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await dbConnect();
  const token = getTokenFromReq(req);
  const decoded = token ? verifyToken(token) : null;
  if (!decoded) return res.status(401).json({ message: "Unauthorized" });

  if (req.method === "POST") {
    // create order — student only
    if (decoded.role !== "student") return res.status(403).json({ message: "Only students can place orders" });
    const { items, total } = req.body;
    if (!Array.isArray(items) || typeof total !== "number") return res.status(400).json({ message: "Invalid payload" });

    const order = await Order.create({ student: decoded.id, items, total });
    return res.status(201).json(order);
  }

  if (req.method === "GET") {
    // admin sees all, student sees their own
    if (decoded.role === "admin") {
      const orders = await Order.find({}).populate("student").populate("items.item").sort({ createdAt: -1 });
      return res.status(200).json(orders);
    } else {
      const orders = await Order.find({ student: decoded.id }).populate("items.item").sort({ createdAt: -1 });
      return res.status(200).json(orders);
    }
  }

  res.setHeader("Allow", ["GET", "POST"]);
  res.status(405).end();
}
