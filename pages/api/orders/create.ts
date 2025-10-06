// pages/api/orders/create.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { dbConnect } from "@/lib/mongoose";
import Order from "@/models/Order";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();
  await dbConnect();

  try {
    const { userId, items, totalAmount } = req.body;

    if (!userId || !items || items.length === 0)
      return res.status(400).json({ message: "Invalid order data" });

    const order = await Order.create({ userId, items, totalAmount });
    res.status(201).json({ message: "Order created", order });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
}
