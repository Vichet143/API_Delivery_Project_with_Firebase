"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const PaymentController_1 = require("../controllers/PaymentController");
const router = (0, express_1.Router)();
router.post("/", PaymentController_1.createPaymentController);
router.get("/:payment_id/verify", PaymentController_1.verifyPaymentController);
router.get("/delivery/:delivery_id/status", PaymentController_1.getPaymentStatusByDelivery);
exports.default = router;
