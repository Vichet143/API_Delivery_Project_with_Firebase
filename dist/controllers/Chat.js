"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getChatsByTransporter = exports.getChats = exports.createChat = void 0;
const Chat_1 = require("../models/Chat");
const firebase_1 = require("../config/firebase");
const createChat = async (req, res) => {
    try {
        const { user_id, transporter_id, messages } = req.body;
        const senderUid = req.uid; // Get authenticated user's ID
        if (!user_id || !transporter_id || !messages) {
            res.status(400).json({
                success: false,
                message: "user_id, transporter_id, and messages are required.",
            });
            return;
        }
        const userDoc = await firebase_1.db.collection("users").doc(user_id).get();
        const transporterDoc = await firebase_1.db.collection("transporter").doc(transporter_id).get();
        if (!userDoc.exists) {
            res.status(404).json({
                success: false,
                message: "User not found.",
            });
            return;
        }
        if (!transporterDoc.exists) {
            res.status(404).json({
                success: false,
                message: "Transporter not found.",
            });
            return;
        }
        // Determine who is sending the message
        let sender_type;
        if (senderUid === user_id) {
            sender_type = "user";
        }
        else if (senderUid === transporter_id) {
            sender_type = "transporter";
        }
        else {
            res.status(403).json({
                success: false,
                message: "Unauthorized: You are neither the user nor the transporter.",
            });
            return;
        }
        const result = await (0, Chat_1.chat)({
            user_id,
            transporter_id,
            user: userDoc.data(),
            transporter: transporterDoc.data(),
            messages,
            sender_type,
        });
        res.status(201).json({
            success: true,
            message: "Chat created successfully",
            data: result,
        });
    }
    catch (error) {
        console.error("[createChat] Error:", error);
        res.status(500).json({
            success: false,
            message: error.message ?? "Failed to create chat.",
        });
    }
};
exports.createChat = createChat;
const getChats = async (req, res) => {
    try {
        const user_id = req.params.user_id;
        //Validate input
        if (!user_id) {
            res.status(400).json({
                success: false,
                message: "user_id route param is required",
            });
            return;
        }
        //Auth check
        const requesterUid = req.uid;
        if (requesterUid !== user_id) {
            res.status(403).json({
                success: false,
                message: "Unauthorized: only the user can view these messages",
            });
            return;
        }
        // Query by one key to avoid requiring composite index, then filter in app code
        const chatsRef = firebase_1.db.collection("chat");
        const snapshot = await chatsRef
            .where("user_id", "==", user_id)
            .get();
        const chats = [];
        snapshot.forEach((doc) => {
            chats.push({
                id: doc.id,
                ...doc.data(),
            });
        });
        // Sort in memory by date (Firestore Timestamp -> JS Date)
        chats.sort((a, b) => {
            const da = a.date?.toDate ? a.date.toDate().getTime() : 0;
            const db_time = b.date?.toDate ? b.date.toDate().getTime() : 0;
            return db_time - da;
        });
        res.status(200).json({
            success: true,
            count: chats.length,
            data: chats,
        });
    }
    catch (error) {
        console.error("getChats error:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Internal server error",
        });
    }
};
exports.getChats = getChats;
const getChatsByTransporter = async (req, res) => {
    try {
        const transporter_id = req.params.transporter_id;
        //Validate input
        if (!transporter_id) {
            res.status(400).json({
                success: false,
                message: "transporter_id route param is required",
            });
            return;
        }
        //Auth check
        const requesterUid = req.uid;
        if (requesterUid !== transporter_id) {
            res.status(403).json({
                success: false,
                message: "Unauthorized: only the transporter can view these messages",
            });
            return;
        }
        // Query by transporter_id key
        const chatsRef = firebase_1.db.collection("chat");
        const snapshot = await chatsRef
            .where("transporter_id", "==", transporter_id)
            .get();
        const chats = [];
        snapshot.forEach((doc) => {
            chats.push({
                id: doc.id,
                ...doc.data(),
            });
        });
        // Sort in memory by date (Firestore Timestamp -> JS Date)
        chats.sort((a, b) => {
            const da = a.date?.toDate ? a.date.toDate().getTime() : 0;
            const db_time = b.date?.toDate ? b.date.toDate().getTime() : 0;
            return db_time - da;
        });
        res.status(200).json({
            success: true,
            count: chats.length,
            data: chats,
        });
    }
    catch (error) {
        console.error("getChatsByTransporter error:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Internal server error",
        });
    }
};
exports.getChatsByTransporter = getChatsByTransporter;
