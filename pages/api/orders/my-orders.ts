// pages/api/orders/my-orders.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { dbConnect } from "@/lib/mongoose";
import Order from "@/models/Order";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET as string;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).end();

  try {
    await dbConnect();

    const token = req.cookies.token;
    if (!token) return res.status(401).json({ message: "Unauthorized" });

    const decoded = jwt.verify(token, JWT_SECRET) as { id: string };

    const orders = await Order.find({ userId: decoded.id }).sort({ createdAt: -1 });

    return res.status(200).json(orders);
  } catch (err: any) {
    console.error("Error fetching orders:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
}
