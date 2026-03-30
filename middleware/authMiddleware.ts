import { Request, Response, NextFunction } from "express";
import admin from "../config/firebase";
import jwt from "jsonwebtoken";
import { AuthRequest } from "./AuthRequest"; // use the shared interface

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret";

const authMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    console.log("Token preview:", token?.substring(0, 50));
    console.log("Token length:", token?.length);

    // First try Firebase ID token
    const decodedToken = await admin.auth().verifyIdToken(token);
    console.log("Decoded UID (Firebase):", decodedToken.uid);
    req.uid = decodedToken.uid;
    next();
  } catch (firebaseError: any) {
    try {
      // Then try custom JWT token with 7d expiration
      const decodedJwt = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload;
      console.log("Decoded UID (JWT):", decodedJwt.uid);

      req.uid = decodedJwt.uid as string;
      next();
    } catch (jwtError) {
      console.log("Verify error:", jwtError);
      return res.status(401).json({ message: "Invalid token" });
    }
  }
};

export default authMiddleware;
