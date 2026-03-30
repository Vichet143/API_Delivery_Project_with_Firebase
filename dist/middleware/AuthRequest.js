"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyToken = void 0;
const firebase_1 = require("../config/firebase");
const verifyToken = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        res.status(401).json({ message: "Unauthorized: No token provided" });
        return;
    }
    const token = authHeader.split("Bearer ")[1];
    try {
        const decoded = await firebase_1.auth.verifyIdToken(token);
        req.uid = decoded.uid;
        next();
    }
    catch (err) {
        res.status(401).json({ message: "Unauthorized: Invalid token" });
    }
};
exports.verifyToken = verifyToken;
