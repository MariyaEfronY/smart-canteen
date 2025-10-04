import mongoose, { Schema, Document } from "mongoose";

export interface IOrder extends Document {
  student: mongoose.Types.ObjectId;
  items: { item: mongoose.Types.ObjectId; qty: number }[];
  total: number;
  status: "placed" | "preparing" | "delivered" | "cancelled";
}

const OrderSchema = new Schema<IOrder>({
  student: { type: Schema.Types.ObjectId, ref: "User", required: true },
  items: [
    {
      item: { type: Schema.Types.ObjectId, ref: "Item", required: true },
      qty: { type: Number, required: true },
    },
  ],
  total: { type: Number, required: true },
  status: { type: String, enum: ["placed", "preparing", "delivered", "cancelled"], default: "placed" },
}, { timestamps: true });

export default mongoose.models.Order || mongoose.model<IOrder>("Order", OrderSchema);
