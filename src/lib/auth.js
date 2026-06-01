import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "hra-groups-secret-key-12345";

export async function verifyToken(token) {
  try {
    if (!token) return null;
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    console.error("JWT verifyToken error:", error);
    return null;
  }
}

export function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}
