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

  if (req.method !== "GET") return res.status(405).end();

  try {
    const orders = await Order.find({ userId: decoded.id })
      .populate("items.item")
      .sort({ createdAt: -1 });

    return res.status(200).json(orders);
  } catch (error: any) {
    return res.status(500).json({ message: "Error fetching user orders", error: error.message });
  }
}
