// models/Order.ts - FIXED VERSION
import mongoose, { Schema, Document } from "mongoose";

export interface IOrderItem {
  item: mongoose.Schema.Types.ObjectId;
  quantity: number;
  price: number;
  name: string;
}

export interface IOrder extends Document {
  userId: mongoose.Schema.Types.ObjectId;
  userName: string;
  role: "student" | "staff"; // ✅ Only student and staff can order
  items: IOrderItem[];
  totalAmount: number;
  status: "pending" | "preparing" | "ready" | "completed" | "cancelled";
  orderNumber: string;
  createdAt: Date;
  updatedAt: Date;
}

const OrderSchema = new Schema<IOrder>(
  {
    userId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      required: true 
    },
    userName: { 
      type: String, 
      required: true 
    },
    role: { 
      type: String, 
      enum: ["student", "staff"],
      required: true 
    },
    items: [
      {
        item: { 
          type: mongoose.Schema.Types.ObjectId, 
          ref: "Item", 
          required: true 
        },
        quantity: { 
          type: Number, 
          required: true, 
          min: 1 
        },
        price: { 
          type: Number, 
          required: true 
        },
        name: { 
          type: String, 
          required: true 
        }
      },
    ],
    totalAmount: { 
      type: Number, 
      required: true 
    },
    status: {
      type: String,
      enum: ["pending", "preparing", "ready", "completed", "cancelled"],
      default: "pending",
    },
    orderNumber: { 
      type: String, 
      unique: true 
    }
  },
  { 
    timestamps: true 
  }
);

// Generate order number before saving
OrderSchema.pre('save', async function(next) {
  if (this.isNew && !this.orderNumber) {
    try {
      const lastOrder = await mongoose.model('Order').findOne().sort({ createdAt: -1 });
      let nextNumber = 1;
      if (lastOrder && lastOrder.orderNumber) {
        const lastNumber = parseInt(lastOrder.orderNumber.replace('ORD', '')) || 0;
        nextNumber = lastNumber + 1;
      }
      this.orderNumber = `ORD${nextNumber.toString().padStart(6, '0')}`;
    } catch (error) {
      this.orderNumber = `ORD${Date.now()}`;
    }
  }
  next();
});

export default mongoose.models.Order || mongoose.model<IOrder>("Order", OrderSchema);