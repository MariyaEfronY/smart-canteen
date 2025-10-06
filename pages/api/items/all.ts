// pages/api/items/all.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { dbConnect } from "@/lib/mongoose";
import Item from "@/models/Item";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await dbConnect();

  const items = await Item.find({});
  res.status(200).json(items);
}
