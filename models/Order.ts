import mongoose, { Schema, Document } from "mongoose";

export interface IOrder extends Document {
  userId: string;
  items: { itemId: string; quantity: number }[];
  totalAmount: number;
  status: "pending" | "completed";
}

const OrderSchema = new Schema<IOrder>(
  {
    userId: { type: String, required: true },
    items: [
      {
        itemId: { type: Schema.Types.ObjectId, ref: "Item", required: true },
        quantity: { type: Number, required: true, min: 1 },
      },
    ],
    totalAmount: { type: Number, required: true },
    status: { type: String, enum: ["pending", "completed"], default: "pending" },
  },
  { timestamps: true }
);

export default mongoose.models.Order || mongoose.model<IOrder>("Order", OrderSchema);
