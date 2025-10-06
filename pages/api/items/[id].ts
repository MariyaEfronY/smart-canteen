// pages/api/items/[id].ts
import type { NextApiRequest, NextApiResponse } from "next";
import { dbConnect } from "@/lib/mongoose";
import Item from "@/models/Item";
import cloudinary from "@/lib/cloudinary";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  await dbConnect();

  // DELETE: Remove item and image from Cloudinary
  if (req.method === "DELETE") {
    try {
      const item = await Item.findById(id);
      if (!item) return res.status(404).json({ message: "Item not found" });

      // Delete from Cloudinary if image exists
      if (item.imageUrl) {
        try {
          const publicId = item.imageUrl.split("/").slice(-1)[0].split(".")[0];
          await cloudinary.uploader.destroy(`menu_items/${publicId}`);
        } catch (err) {
          console.warn("Cloudinary delete failed:", err);
        }
      }

      // Delete from MongoDB
      await Item.findByIdAndDelete(id);

      return res.status(200).json({ message: "Item deleted successfully" });
    } catch (error) {
      console.error("Error deleting item:", error);
      return res.status(500).json({ message: "Server error", error });
    }
  }

  // PATCH: Update item status
  else if (req.method === "PATCH") {
    try {
      const { status } = req.body;
      if (!["available", "unavailable"].includes(status)) {
        return res.status(400).json({ message: "Invalid status value" });
      }

      const item = await Item.findByIdAndUpdate(id, { status }, { new: true });
      if (!item) return res.status(404).json({ message: "Item not found" });

      return res.status(200).json({ message: "Status updated successfully", item });
    } catch (error) {
      console.error("Error updating status:", error);
      return res.status(500).json({ message: "Error updating status", error });
    }
  }

  // Method not allowed
  else {
    return res.status(405).json({ message: "Method not allowed" });
  }
}
