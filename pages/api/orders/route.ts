import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongoose";
import Order from "@/models/Order";
import Item from "@/models/Item";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET as string;

// 🟢 Create Order (POST)
export async function POST(req: Request) {
  try {
    await dbConnect();

    // Parse body
    const { items } = await req.json();

    // Read cookies
    const cookieHeader = req.headers.get("cookie");
    if (!cookieHeader) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const token = cookieHeader
      .split(";")
      .find(c => c.trim().startsWith("token="))
      ?.split("=")[1];

    if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const decoded = jwt.verify(token, JWT_SECRET) as { id: string };

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ message: "No items provided" }, { status: 400 });
    }

    const itemDocs = await Item.find({ _id: { $in: items.map((i: any) => i.itemId) } });

    const orderItems = items.map((i: any) => {
      const item = itemDocs.find(d => d._id.toString() === i.itemId);
      if (!item) throw new Error(`Item not found: ${i.itemId}`);
      return {
        itemId: item._id,
        name: item.name,
        price: item.price,
        quantity: i.quantity,
      };
    });

    const total = orderItems.reduce((sum, i) => sum + i.price * i.quantity, 0);

    const order = await Order.create({
      userId: decoded.id,
      items: orderItems,
      total,
      status: "pending",
    });

    return NextResponse.json({ message: "Order placed successfully", order }, { status: 201 });
  } catch (err: any) {
    console.error("Order POST error:", err);
    return NextResponse.json({ message: "Server error", error: err.message }, { status: 500 });
  }
}

// 🔵 Fetch Orders (GET)
export async function GET(req: Request) {
  try {
    await dbConnect();

    const cookieHeader = req.headers.get("cookie");
    if (!cookieHeader) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const token = cookieHeader
      .split(";")
      .find(c => c.trim().startsWith("token="))
      ?.split("=")[1];

    if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const decoded = jwt.verify(token, JWT_SECRET) as { id: string };

    const orders = await Order.find({ userId: decoded.id }).sort({ createdAt: -1 });

    return NextResponse.json(orders, { status: 200 });
  } catch (err: any) {
    console.error("Order GET error:", err);
    return NextResponse.json({ message: "Server error", error: err.message }, { status: 500 });
  }
}
