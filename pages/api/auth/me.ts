// pages/api/auth/me.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { dbConnect } from "@/lib/mongoose";
import User from "@/models/User";
import { getTokenFromReq, verifyToken } from "@/lib/auth";
import cookie from "cookie";


export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await dbConnect();

  try {
    const token = getTokenFromReq(req);
    if (!token) {
      return res.status(200).json({ user: null });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(200).json({ user: null });
    }

    // 🧠 Fetch user safely
    const user = await User.findById(decoded.id).select("name role email dno staffId department phone");
    if (!user) {
      return res.status(200).json({ user: null });
    }

    // ⚖️ Ensure token role matches DB role
    if (decoded.role !== user.role) {
      console.warn("⚠️ Role mismatch detected, invalidating token.");
      return res.status(200).json({ user: null });
    }

    // ✅ Return clean user object
    res.status(200).json({
      user,
      lastActive: new Date().toISOString(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Error in /api/auth/me:", message);
    res.status(500).json({ message: "Internal server error" });
  }
}
