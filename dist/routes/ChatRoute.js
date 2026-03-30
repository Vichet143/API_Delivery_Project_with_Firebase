"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const Chat_1 = require("../controllers/Chat");
const router = (0, express_1.Router)();
router.post("/", Chat_1.createChat);
exports.default = router;
