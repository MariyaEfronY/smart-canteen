import { NextApiRequest, NextApiResponse } from "next";
import jwt, { JwtPayload, Secret, SignOptions } from "jsonwebtoken";
import cookie from "cookie";
import User from "@/models/User";
import { dbConnect } from "./mongoose";

// ---- JWT CONFIG ----
const JWT_SECRET: Secret = (process.env.JWT_SECRET || "supersecret") as Secret;
const JWT_EXPIRES_IN: SignOptions["expiresIn"] = (process.env.JWT_EXPIRES_IN || "7d") as unknown as SignOptions["expiresIn"];

// ---- TOKEN PAYLOAD TYPE ----
export interface AuthPayload {
  id: string;
  role: "admin" | "staff" | "student";
  name?: string;
  email?: string;
}

// ---- SIGN TOKEN ----
export function signToken(payload: AuthPayload): string {
  const options: SignOptions = { expiresIn: JWT_EXPIRES_IN };
  return jwt.sign(payload, JWT_SECRET, options);
}

// ---- PARSE TOKEN (supports cookie & Authorization header) ----
export function getTokenFromReq(req: NextApiRequest): string | null {
  // Try from cookie
  const rawCookie = req.headers.cookie || "";
  const cookies = cookie.parse(rawCookie);
  if (cookies.token) return cookies.token;

  // Try from Bearer header
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.replace("Bearer ", "");
  }

  return null;
}

// ---- VERIFY TOKEN ----
export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch {
    return null;
  }
}

// ---- VERIFY TOKEN + FETCH LATEST USER ROLE ----
export async function verifyTokenWithFreshRole(
  token: string
): Promise<AuthPayload | null> {
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

// ---- ROLE PROTECTION HELPER ----
export async function requireRole(
  req: NextApiRequest,
  res: NextApiResponse,
  allowedRoles: Array<"admin" | "staff" | "student">
) {
  const token = getTokenFromReq(req);
  if (!token)
    return res.status(401).json({ message: "Authentication required" });

  const userData = await verifyTokenWithFreshRole(token);
  if (!userData)
    return res.status(401).json({ message: "Invalid or expired token" });

  if (!allowedRoles.includes(userData.role))
    return res.status(403).json({ message: "Access denied" });

  return userData; // Return user details for next operations
}
