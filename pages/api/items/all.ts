// pages/api/items/all.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { dbConnect } from "@/lib/mongoose";
import Item from "@/models/Item"; // Ensure this model path is correct

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await dbConnect();

    if (req.method !== "GET") {
      return res.status(405).json({ message: "Method not allowed" });
    }

    const items = await Item.find({});
    return res.status(200).json(items);
  } catch (error: any) {
    console.error("Error fetching items:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
}
