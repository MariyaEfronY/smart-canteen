// pages/api/items/[id].ts
import type { NextApiRequest, NextApiResponse } from "next";
import { dbConnect } from "@/lib/mongoose";
import Item from "@/models/Item";
import cloudinary from "@/lib/cloudinary";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  await dbConnect();

  if (req.method === "DELETE") {
    try {
      const item = await Item.findById(id);
      if (!item) return res.status(404).json({ message: "Item not found" });

      if (item.imageUrl) {
        try {
          const publicId = item.imageUrl.split("/").slice(-1)[0].split(".")[0];
          await cloudinary.uploader.destroy(`menu_items/${publicId}`);
        } catch (err) {
          console.warn("Cloudinary delete failed:", err);
        }
      }

      await Item.findByIdAndDelete(id);
      return res.status(200).json({ message: "Item deleted successfully" });
    } catch (error) {
      return res.status(500).json({ message: "Server error", error });
    }
  }

  if (req.method === "PATCH") {
    try {
      const { status } = req.body;
      const updated = await Item.findByIdAndUpdate(id, { status }, { new: true });
      if (!updated) return res.status(404).json({ message: "Item not found" });

      return res.status(200).json({ message: "Item updated", item: updated });
    } catch (error) {
      return res.status(500).json({ message: "Failed to update status", error });
    }
  }

  return res.status(405).json({ message: "Method Not Allowed" });
}
