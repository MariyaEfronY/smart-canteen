// pages/api/items/add.ts
import type { NextApiRequest, NextApiResponse } from "next";
import formidable from "formidable";
import cloudinary from "@/lib/cloudinary";
import { dbConnect } from "@/lib/mongoose";
import Item from "@/models/Item";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();
  await dbConnect();

  const form = formidable({ multiples: false });

  form.parse(req, async (err, fields, files) => {
    if (err) return res.status(400).json({ message: "Form data error", error: err });

    try {
      const { name, description, price, category } = fields;
      const file = files.image as unknown as formidable.File;

      if (!file) return res.status(400).json({ message: "Image required" });

      const upload = await cloudinary.uploader.upload(file.filepath, {
        folder: "menu_items",
      });

      const newItem = await Item.create({
        name,
        description,
        price,
        category,
        imageUrl: upload.secure_url,
      });

      res.status(201).json({ message: "Item added successfully", item: newItem });
    } catch (error) {
      res.status(500).json({ message: "Error uploading item", error });
    }
  });
}
