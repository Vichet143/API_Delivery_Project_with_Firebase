"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const firebase_1 = __importDefault(require("../config/firebase"));
const authMiddleware = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(" ")[1];
    if (!token) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    try {
        console.log("Token preview:", token?.substring(0, 50));
        console.log("Token length:", token?.length);
        const decodedToken = await firebase_1.default.auth().verifyIdToken(token);
        console.log("Decoded UID:", decodedToken.uid);
        req.uid = decodedToken.uid;
        next();
    }
    catch (error) {
        console.log("Verify error:", error.code, error.message);
        return res.status(401).json({ message: "Invalid token" });
    }
};
exports.default = authMiddleware;
