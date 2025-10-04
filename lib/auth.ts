// lib/auth.ts
import { NextApiRequest, NextApiResponse } from "next";
import jwt, { JwtPayload, Secret } from "jsonwebtoken";
import cookie from "cookie";

// ✅ force TypeScript to treat env as Secret
const JWT_SECRET: Secret = (process.env.JWT_SECRET || "supersecret") as Secret;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

// ---- SIGN ----
export function signToken(payload: Record<string, unknown>): string {
  // ✅ explicit cast removes red underline
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  }) as string;
}

// ---- PARSE ----
export function getTokenFromReq(req: NextApiRequest): string | null {
  const raw = req.headers.cookie || "";
  const parsed = cookie.parse(raw || "");
  return parsed.token || null;
}

// ---- VERIFY ----
export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch {
    return null;
  }
}

// ---- SET COOKIE ----
export function setTokenCookie(res: NextApiResponse, token: string): void {
  const cookieStr = cookie.serialize("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
  res.setHeader("Set-Cookie", cookieStr);
}

// ---- CLEAR COOKIE ----
export function clearTokenCookie(res: NextApiResponse): void {
  const cookieStr = cookie.serialize("token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(0),
  });
  res.setHeader("Set-Cookie", cookieStr);
}
