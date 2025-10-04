// models/Item.ts
import mongoose, { Document, Model } from "mongoose";

export interface IItem extends Document {
  name: string;
  description?: string;
  price: number;
  category?: string;
  image?: string;
}

const ItemSchema = new mongoose.Schema<IItem>({
  name: { type: String, required: true },
  description: String,
  price: { type: Number, required: true },
  category: String,
  image: String,
}, { timestamps: true });

const Item: Model<IItem> = (mongoose.models.Item as Model<IItem>) || mongoose.model<IItem>("Item", ItemSchema);
export default Item;
