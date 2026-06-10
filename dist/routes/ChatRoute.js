"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const Chat_1 = require("../controllers/Chat");
const authMiddleware_1 = __importDefault(require("../middleware/authMiddleware"));
const router = (0, express_1.Router)();
router.post("/", authMiddleware_1.default, Chat_1.createChat);
router.get("/user/:user_id", authMiddleware_1.default, Chat_1.getChats);
router.get("/transporter/:transporter_id", authMiddleware_1.default, Chat_1.getChatsByTransporter);
exports.default = router;
