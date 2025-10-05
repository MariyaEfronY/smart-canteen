import type { NextApiRequest, NextApiResponse } from "next";
import bcrypt from "bcryptjs";
import { dbConnect } from "@/lib/mongoose";
import User from "@/models/User";
import { signToken, setTokenCookie } from "@/lib/auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST")
    return res.status(405).json({ message: "Method not allowed" });

  try {
    await dbConnect();

    const { name, dno, staffId, email, password, role } = req.body;

    if (!name || !email || !password || (!dno && !staffId)) {
      return res.status(400).json({
        message: "Missing required fields: name, email, password, and either dno or staffId",
      });
    }

    // ✅ Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { dno }, { staffId }],
    });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // ✅ Validate staffId format if provided
    if (staffId && !/^ST[0-9A-Z]{3,}$/.test(staffId)) {
      return res.status(400).json({ message: "Invalid staffId format (example: ST001 or ST23CS512)" });
    }

    // ✅ Validate dno format if provided
    if (dno && !/^[0-9]{2}[A-Z]{3}[0-9]{3}$/.test(dno)) {
      return res.status(400).json({ message: "Invalid D.No format (example: 23UBC512)" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // ✅ Automatically assign role
    const userRole = role || (staffId ? "staff" : "student");

    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      dno: dno || null,
      staffId: staffId || null,
      role: userRole,
    });

    // ✅ Create token and set cookie
    const token = signToken({ id: newUser._id, role: newUser.role });
    setTokenCookie(res, token);

    return res.status(201).json({
      message: "Signup successful",
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        dno: newUser.dno,
        staffId: newUser.staffId,
      },
    });
  } catch (error: any) {
    console.error("Signup Error:", error);
    return res.status(500).json({ message: "Server error during signup", error: error.message });
  }
}
