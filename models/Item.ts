// models/Item.ts
import mongoose, { Schema, Document } from "mongoose";

export interface IItem extends Document {
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string;
}

const ItemSchema = new Schema<IItem>(
  {
    name: { type: String, required: true },
    description: { type: String },
    price: { type: Number, required: true },
    category: { type: String, required: true },
    imageUrl: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.models.Item || mongoose.model<IItem>("Item", ItemSchema);
