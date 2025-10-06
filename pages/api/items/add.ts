// pages/api/items/add.ts
import type { NextApiRequest, NextApiResponse } from "next";
import formidable, { File } from "formidable";
import fs from "fs";
import cloudinary from "@/lib/cloudinary";
import { dbConnect } from "@/lib/mongoose";
import Item from "@/models/Item";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end("Method Not Allowed");

  await dbConnect();

  const form = formidable({ multiples: false, keepExtensions: true });

  form.parse(req, async (err, fields, files) => {
    if (err) return res.status(400).json({ message: "Form parse error", error: err });

    try {
      const name = fields.name?.toString();
      const description = fields.description?.toString();
      const price = parseFloat(fields.price?.toString() || "0");
      const category = fields.category?.toString();
      const status = fields.status?.toString() || "available";

      const imageField = files.image;
      const file: File | undefined = Array.isArray(imageField) ? imageField[0] : imageField;

      if (!file) return res.status(400).json({ message: "Image file is required" });

      const data = fs.readFileSync(file.filepath);

      const upload = cloudinary.uploader.upload_stream(
        { folder: "menu_items" },
        async (error, result) => {
          if (error) return res.status(500).json({ message: "Cloudinary upload failed", error });

          const newItem = await Item.create({
            name,
            description,
            price,
            category,
            imageUrl: result?.secure_url,
            status,
          });

          return res.status(201).json({ message: "Item added successfully", item: newItem });
        }
      );

      upload.end(data);
    } catch (error) {
      res.status(500).json({ message: "Error uploading item", error });
    }
  });
}
