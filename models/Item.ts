import mongoose, { Schema, Document } from "mongoose";

export interface IItem extends Document {
  name: string;
  description?: string;
  price: number;
  category?: string;
  image?: string;
}

const ItemSchema = new Schema<IItem>({
  name: { type: String, required: true },
  description: String,
  price: { type: Number, required: true },
  category: String,
  image: String,
});

export default mongoose.models.Item || mongoose.model<IItem>("Item", ItemSchema);
