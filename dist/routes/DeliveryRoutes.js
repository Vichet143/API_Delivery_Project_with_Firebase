"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authMiddleware_1 = __importDefault(require("../middleware/authMiddleware"));
const CreatedeliveryControllers_1 = require("../controllers/CreatedeliveryControllers");
const router = (0, express_1.Router)();
router.use(authMiddleware_1.default);
router.post("/create", authMiddleware_1.default, CreatedeliveryControllers_1.createDelivery);
router.get("/history", authMiddleware_1.default, CreatedeliveryControllers_1.getDeliveryHistory);
router.get("/:delivery_id", authMiddleware_1.default, CreatedeliveryControllers_1.getDeliveryById);
router.patch("/:delivery_id/status", authMiddleware_1.default, CreatedeliveryControllers_1.updateDeliveryStatus);
router.delete("/:delivery_id", authMiddleware_1.default, CreatedeliveryControllers_1.cancelDelivery);
// transporter router
router.get("/transporter/available", CreatedeliveryControllers_1.getAvailableDeliveries);
router.post("/:delivery_id/accept", CreatedeliveryControllers_1.acceptDelivery);
router.patch("/:delivery_id/transporter-status", CreatedeliveryControllers_1.updateStatusByTransporter);
exports.default = router;
