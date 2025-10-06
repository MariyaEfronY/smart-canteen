import mongoose, { Schema, Document } from "mongoose";

export interface IOrderItem {
  item: mongoose.Schema.Types.ObjectId;
  quantity: number;
}

export interface IOrder extends Document {
  userId: mongoose.Schema.Types.ObjectId;
  userName: string;
  role: "student" | "staff";
  items: IOrderItem[];
  totalAmount: number;
  status: "pending" | "preparing" | "ready" | "completed" | "cancelled";
}

const OrderSchema = new Schema<IOrder>(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    userName: { type: String, required: true },
    role: { type: String, enum: ["student", "staff"], required: true },
    items: [
      {
        item: { type: mongoose.Schema.Types.ObjectId, ref: "Item", required: true },
        quantity: { type: Number, required: true, min: 1 },
      },
    ],
    totalAmount: { type: Number, required: true },
    status: {
      type: String,
      enum: ["pending", "preparing", "ready", "completed", "cancelled"],
      default: "pending",
    },
  },
  { timestamps: true }
);

export default mongoose.models.Order || mongoose.model<IOrder>("Order", OrderSchema);
