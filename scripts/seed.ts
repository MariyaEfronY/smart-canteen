// scripts/seed.ts
import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import User from "../models/User";
import Item from "../models/Item";

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI as string;
if (!MONGODB_URI) throw new Error("MONGODB_URI missing");

async function main() {
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB");

  // remove existing sample data (optional)
  await User.deleteMany({ email: /@example.com$/ });
  await Item.deleteMany({ name: /sample/i });

  const adminPass = await bcrypt.hash("admin123", 10);
  const admin = await User.create({ name: "Admin", email: "admin@example.com", password: adminPass, role: "admin" });
  console.log("Created admin:", admin.email);

  await Item.insertMany([
    { name: "Sample Pizza", description: "Cheesy classic", price: 199, category: "Pizza" },
    { name: "Sample Burger", description: "Veg burger", price: 99, category: "Burgers" },
    { name: "French Fries", description: "Crispy fries", price: 49, category: "Sides" },
  ]);
  console.log("Inserted sample items");

  process.exit(0);
}

main().catch(err => { console.error(err); process.exit(1); });
