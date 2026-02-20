import { Request, Response, NextFunction } from "express";
import admin from "../config/firebase";
import { AuthRequest } from "./AuthRequest"; // use the shared interface

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
    const decodedToken = await admin.auth().verifyIdToken(token);
    console.log("Decoded UID:", decodedToken.uid);
    req.uid = decodedToken.uid;
    next();
  } catch (error: any) {
    console.log("Verify error:", error.code, error.message); 
    return res.status(401).json({ message: "Invalid token" });
  }
};

export default authMiddleware;
