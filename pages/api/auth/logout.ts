// pages/api/auth/logout.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { clearTokenCookie } from "../../../lib/auth";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  clearTokenCookie(res);
  res.status(200).json({ message: "Logged out" });
}
