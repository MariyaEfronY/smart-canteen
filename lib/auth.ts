import { NextApiRequest, NextApiResponse } from "next";
import jwt, { JwtPayload, Secret, SignOptions } from "jsonwebtoken";
import cookie from "cookie";
import User from "@/models/User";
import { dbConnect } from "./mongoose";

// ✅ Strongly type JWT_SECRET and EXPIRES_IN
const JWT_SECRET: Secret = (process.env.JWT_SECRET || "supersecret") as Secret;
const JWT_EXPIRES_IN: string = process.env.JWT_EXPIRES_IN || "7d";

// ---- SIGN TOKEN ----
export function signToken(payload: Record<string, unknown>): string {
  const options: SignOptions = { expiresIn: JWT_EXPIRES_IN };
  return jwt.sign(payload, JWT_SECRET, options);
}


// ---- PARSE TOKEN FROM REQUEST ----
export function getTokenFromReq(req: NextApiRequest): string | null {
  const raw = req.headers.cookie || "";
  const parsed = cookie.parse(raw);
  return parsed.token || null;
}

// ---- VERIFY TOKEN ----
export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch {
    return null;
  }
}

// ---- VERIFY TOKEN & FETCH FRESH USER ROLE ----
export async function verifyTokenWithFreshRole(
  token: string
): Promise<{ id: string; role: string; name: string; email: string } | null> {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;

    await dbConnect();
    const user = await User.findById(decoded.id).select("role name email");
    if (!user) return null;

    return {
      id: decoded.id as string,
      role: user.role,
      name: user.name,
      email: user.email,
    };
  } catch {
    return null;
  }
}

// ---- SET TOKEN COOKIE ----
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

// ---- CLEAR TOKEN COOKIE ----
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
