// pages/api/auth/me.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { dbConnect } from "@/lib/mongoose";
import User from "@/models/User";
import { getTokenFromReq, verifyToken } from "@/lib/auth";
import { JwtPayload } from "jsonwebtoken";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  // ✅ Allow only GET
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    await dbConnect();

    const token = getTokenFromReq(req);
    if (!token) {
      return res.status(200).json({ user: null });
    }

    const decoded = verifyToken(token) as JwtPayload | null;
    if (!decoded || !decoded.id || !decoded.role) {
      return res.status(200).json({ user: null });
    }

    const user = await User.findById(decoded.id).select(
      "name role email dno staffId department phone",
    );

    if (!user) {
      return res.status(200).json({ user: null });
    }

    // ⚖️ Ensure token role matches DB role
    if (decoded.role !== user.role) {
      console.warn("⚠️ Role mismatch detected, invalidating token.");
      return res.status(200).json({ user: null });
    }

    return res.status(200).json({
      user,
      lastActive: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Error in /api/auth/me:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}
