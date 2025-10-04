// pages/api/items/index.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { dbConnect } from "../../../lib/mongoose";
import Item from "../../../models/Item";
import { getTokenFromReq, verifyToken } from "../../../lib/auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await dbConnect();

  if (req.method === "GET") {
    const items = await Item.find({}).sort({ createdAt: -1 });
    return res.status(200).json(items);
  }

  if (req.method === "POST") {
    // admin only
    const token = getTokenFromReq(req);
    const decoded = token ? verifyToken(token) : null;
    if (!decoded) return res.status(401).json({ message: "Unauthorized" });
    if (decoded.role !== "admin") return res.status(403).json({ message: "Forbidden" });

    const { name, description, price, category, image } = req.body;
    if (!name || price == null) return res.status(400).json({ message: "Missing name or price" });

    const item = await Item.create({ name, description, price, category, image });
    return res.status(201).json(item);
  }

  res.setHeader("Allow", ["GET", "POST"]);
  res.status(405).end();
}
