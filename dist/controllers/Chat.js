"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createChat = void 0;
const Chat_1 = require("../models/Chat");
const createChat = async (req, res) => {
    try {
        const { user_id, transporter_id, messages } = req.body;
        if (!user_id || !transporter_id || !messages) {
            res.status(400).json({
                success: false,
                message: "user_id, transporter_id, and messages are required.",
            });
            return;
        }
        const result = await (0, Chat_1.chat)({ user_id, transporter_id, messages });
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
