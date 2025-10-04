// models/Order.ts
import mongoose, { Document, Model } from "mongoose";

export interface IOrderItem {
  item: mongoose.Types.ObjectId;
  qty: number;
}

export interface IOrder extends Document {
  student: mongoose.Types.ObjectId;
  items: IOrderItem[];
  total: number;
  status: "placed" | "preparing" | "delivered" | "cancelled";
}

const OrderSchema = new mongoose.Schema<IOrder>({
  student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  items: [
    {
      item: { type: mongoose.Schema.Types.ObjectId, ref: "Item", required: true },
      qty: { type: Number, required: true, default: 1 },
    },
  ],
  total: { type: Number, required: true },
  status: { type: String, enum: ["placed", "preparing", "delivered", "cancelled"], default: "placed" },
}, { timestamps: true });

const Order: Model<IOrder> = (mongoose.models.Order as Model<IOrder>) || mongoose.model<IOrder>("Order", OrderSchema);
export default Order;
