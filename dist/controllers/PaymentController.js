"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPaymentStatusByDelivery = exports.verifyPaymentController = exports.createPaymentController = void 0;
const PaymentModels_1 = require("../models/PaymentModels");
const firebase_1 = require("../config/firebase");
const VALID_CURRENCIES = ["USD"];
const createPaymentController = async (req, res) => {
    try {
        const { delivery_id, user_id, amount, currency, description, fromAccount } = req.body;
        if (!delivery_id || !user_id || !amount) {
            res.status(400).json({
                success: false,
                message: "delivery_id, user_id, and amount are required.",
            });
            return;
        }
        if (!currency) {
            res.status(400).json({
                success: false,
                message: "currency is required. Only 'USD' is supported.",
            });
            return;
        }
        if (typeof amount !== "number" || amount <= 0) {
            res.status(400).json({
                success: false,
                message: "amount must be a positive number.",
            });
            return;
        }
        if (currency !== "USD") {
            res.status(400).json({
                success: false,
                message: "Only 'USD' is supported as a currency. Payments in Riel are not allowed.",
            });
            return;
        }
        const result = await (0, PaymentModels_1.createPayment)({
            delivery_id,
            user_id,
            currency: "USD",
            amount,
            description,
            fromAccount,
        });
        res.status(201).json({
            success: true,
            data: result,
        });
    }
    catch (error) {
        console.error("[createPaymentController] Error:", error);
        res.status(500).json({
            success: false,
            message: error.message ?? "Failed to create payment.",
        });
    }
};
exports.createPaymentController = createPaymentController;
const verifyPaymentController = async (req, res) => {
    try {
        const { payment_id } = req.params;
        const result = await (0, PaymentModels_1.verifyPayment)({ payment_id });
        // 200 = paid, 202 = still pending/processing
        const httpStatus = result.status === "paid" ? 200 : 202;
        res.status(httpStatus).json({
            success: true,
            data: result,
        });
    }
    catch (error) {
        console.error("[verifyPaymentController] Error:", error);
        if (error.message?.includes("not found")) {
            res.status(404).json({
                success: false,
                message: error.message,
            });
            return;
        }
        res.status(500).json({
            success: false,
            message: error.message ?? "Failed to verify payment.",
        });
    }
};
exports.verifyPaymentController = verifyPaymentController;
const getPaymentStatusByDelivery = async (req, res) => {
    try {
        const { delivery_id } = req.params;
        if (!delivery_id) {
            res.status(400).json({
                success: false,
                message: "delivery_id is required.",
            });
            return;
        }
        // Query payments collection for this delivery_id
        const snapshot = await firebase_1.db
            .collection("payments")
            .where("delivery_id", "==", delivery_id)
            .orderBy("created_at", "desc")
            .limit(1)
            .get();
        if (snapshot.empty) {
            res.status(404).json({
                success: false,
                message: `No payment found for delivery ${delivery_id}`,
            });
            return;
        }
        const paymentDoc = snapshot.docs[0];
        const paymentData = paymentDoc.data();
        res.status(200).json({
            success: true,
            data: {
                payment_id: paymentDoc.id,
                delivery_id: paymentData.delivery_id,
                status: paymentData.status,
                amount: paymentData.amount,
                currency: paymentData.currency,
                payment_method: paymentData.payment_method,
                transaction_id: paymentData.transaction_id,
                paid_at: paymentData.paid_at,
                qr_expiration: paymentData.qr_expiration,
                created_at: paymentData.created_at,
            },
        });
    }
    catch (error) {
        console.error("[getPaymentStatusByDelivery] Error:", error);
        res.status(500).json({
            success: false,
            message: error.message ?? "Failed to fetch payment status.",
        });
    }
};
exports.getPaymentStatusByDelivery = getPaymentStatusByDelivery;
