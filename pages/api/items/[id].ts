// pages/api/items/[id].ts
import type { NextApiRequest, NextApiResponse } from "next";
import { dbConnect } from "../../../lib/mongoose";
import Item from "../../../models/Item";
import { getTokenFromReq, verifyToken } from "../../../lib/auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await dbConnect();
  const { id } = req.query;

  if (req.method === "GET") {
    const item = await Item.findById(id);
    if (!item) return res.status(404).json({ message: "Not found" });
    return res.status(200).json(item);
  }

  // admin protected
  const token = getTokenFromReq(req);
  const decoded = token ? verifyToken(token) : null;
  if (!decoded) return res.status(401).json({ message: "Unauthorized" });
  if (decoded.role !== "admin") return res.status(403).json({ message: "Forbidden" });

  if (req.method === "PUT") {
    const updated = await Item.findByIdAndUpdate(id, req.body, { new: true });
    if (!updated) return res.status(404).json({ message: "Not found" });
    return res.status(200).json(updated);
  }

  if (req.method === "DELETE") {
    await Item.findByIdAndDelete(id);
    return res.status(204).end();
  }

  res.setHeader("Allow", ["GET", "PUT", "DELETE"]);
  res.status(405).end();
}
