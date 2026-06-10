"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const firebase_1 = __importDefault(require("../config/firebase"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret";
const authMiddleware = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(" ")[1];
    if (!token) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    try {
        console.log("Token preview:", token?.substring(0, 50));
        console.log("Token length:", token?.length);
        // First try Firebase ID token
        const decodedToken = await firebase_1.default.auth().verifyIdToken(token);
        console.log("Decoded UID (Firebase):", decodedToken.uid);
        req.uid = decodedToken.uid;
        next();
    }
    catch (firebaseError) {
        try {
            // Then try custom JWT token with 7d expiration
            const decodedJwt = jsonwebtoken_1.default.verify(token, JWT_SECRET);
            console.log("Decoded UID (JWT):", decodedJwt.uid);
            req.uid = decodedJwt.uid;
            next();
        }
        catch (jwtError) {
            console.log("Verify error:", jwtError);
            return res.status(401).json({ message: "Invalid token" });
        }
    }
};
exports.default = authMiddleware;
