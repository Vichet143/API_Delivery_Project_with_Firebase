"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPayment = createPayment;
exports.verifyPayment = verifyPayment;
const admin = __importStar(require("firebase-admin"));
const { BakongKHQR, khqrData, IndividualInfo } = require("bakong-khqr");
const QRCode = require("qrcode");
const BAKONG_TOKEN = process.env.BAKONG_TOKEN;
const BAKONG_ACCOUNT_ID = process.env.BAKONG_ACCOUNT_ID;
const BAKONG_ACCOUNT_NAME = process.env.BAKONG_ACCOUNT_NAME;
const BAKONG_API_BASE = "https://api-bakong.nbc.gov.kh/v1";
const db = admin.firestore();
function generateTransactionId() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `TXN-${timestamp}-${random}`;
}
async function qrStringToBase64(qrString) {
    return QRCode.toDataURL(qrString, { width: 400, margin: 2 });
}
function getExpiration(minutes = 15) {
    return new Date(Date.now() + minutes * 60 * 1000).toISOString();
}
function startPolling(md5, paymentId) {
    if (!BAKONG_TOKEN) {
        console.error("[startPolling] BAKONG_TOKEN is not configured.");
        return;
    }
    const interval = setInterval(async () => {
        try {
            const response = await fetch(`${BAKONG_API_BASE}/check_transaction_by_md5`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${BAKONG_TOKEN}`,
                },
                body: JSON.stringify({ md5 }),
            });
            if (!response.ok) {
                console.error(`[startPolling] Bakong API error: ${response.status} ${response.statusText}`);
                return;
            }
            const result = await response.json();
            console.log(`[startPolling] Payment ${paymentId} status:`, result);
            if (result.responseCode === 0 && result.data) {
                console.log(`[startPolling] Payment ${paymentId} confirmed!`, result.data);
                clearInterval(interval);
                // Check if document exists before updating
                const docRef = db.collection("payments").doc(paymentId);
                const docSnap = await docRef.get();
                if (docSnap.exists) {
                    const paymentData = docSnap.data();
                    const deliveryId = paymentData?.delivery_id;
                    await docRef.update({
                        status: "paid",
                        bakong_hash: result.data.hash,
                        fromAccount: result.data.fromAccountId,
                        paid_at: admin.firestore.Timestamp.fromDate(new Date(result.data.acknowledgedDateMs)),
                    });
                    // Also update the delivery's paymentStatus
                    if (deliveryId) {
                        const deliveryRef = db.collection("deliveries").doc(deliveryId);
                        const deliverySnap = await deliveryRef.get();
                        if (deliverySnap.exists) {
                            await deliveryRef.update({
                                paymentStatus: "paid",
                                paymentAt: admin.firestore.Timestamp.fromDate(new Date(result.data.acknowledgedDateMs)),
                                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                            });
                            console.log(`[startPolling] Updated delivery ${deliveryId} paymentStatus to paid.`);
                        }
                        else {
                            console.warn(`[startPolling] Delivery ${deliveryId} not found. Cannot update paymentStatus.`);
                        }
                    }
                }
                else {
                    console.error(`[startPolling] Payment ${paymentId} document not found. Cannot update.`);
                }
            }
        }
        catch (err) {
            console.error("[startPolling] Error:", err.message);
        }
    }, 5000);
    // Auto-stop after 15 minutes when QR expires
    setTimeout(async () => {
        clearInterval(interval);
        console.log(`[startPolling] Polling stopped for payment ${paymentId} — QR expired.`);
        // Check if document exists before updating
        const docRef = db.collection("payments").doc(paymentId);
        const docSnap = await docRef.get();
        if (docSnap.exists) {
            await docRef.update({ status: "expired" });
        }
        else {
            console.error(`[startPolling] Payment ${paymentId} document not found. Cannot mark as expired.`);
        }
    }, 15 * 60 * 1000);
}
async function createPayment(input) {
    if (!BAKONG_ACCOUNT_ID || !BAKONG_ACCOUNT_NAME) {
        throw new Error("Bakong account credentials are not configured.");
    }
    if (!input.delivery_id || !input.user_id) {
        throw new Error("delivery_id and user_id are required.");
    }
    if (!input.amount || input.amount <= 0) {
        throw new Error("amount must be a positive number.");
    }
    const amount = Number(input.amount);
    const transactionId = generateTransactionId();
    const description = input.description ?? `Payment for delivery ${input.delivery_id}`;
    // Optional data for USD payment only
    const optionalData = {
        currency: khqrData.currency.usd, // 840 = USD only
        amount: amount, // User-defined amount in USD
        purposeOfTransaction: "Delivery payment",
        expirationTimestamp: String(Date.now() + 15 * 60 * 1000), // 15 minutes expiration
    };
    // Create IndividualInfo with account details and optional data
    const individualInfo = new IndividualInfo(BAKONG_ACCOUNT_ID, BAKONG_ACCOUNT_NAME, "PHNOM PENH", optionalData);
    console.log("[createPayment] Creating USD payment for amount: $${amount}");
    console.log("[createPayment] individualInfo:", JSON.stringify(individualInfo));
    const KHQR = new BakongKHQR();
    const individual = KHQR.generateIndividual(individualInfo);
    console.log("[createPayment] QR result:", JSON.stringify(individual));
    if (!individual || !individual.data || !individual.data.qr) {
        console.error("[createPayment] KHQR Generation failed!");
        console.error("[createPayment] Individual response:", JSON.stringify(individual));
        console.error("[createPayment] IndividualInfo details:", {
            account: BAKONG_ACCOUNT_ID,
            name: BAKONG_ACCOUNT_NAME,
            city: "PHNOM PENH",
            optionalData: optionalData,
        });
        throw new Error(`Failed to generate KHQR code. Response: ${JSON.stringify(individual)}`);
    }
    // Verify QR contains correct currency (840=USD) and amount
    const qrString = individual.data.qr;
    if (!qrString.includes("5303840")) {
        console.warn("[createPayment] WARNING: QR does not contain USD (5303840). Got:", qrString);
    }
    if (!qrString.includes("5405")) {
        console.warn("[createPayment] WARNING: QR does not contain amount field (5405). Got:", qrString);
    }
    const qrMd5 = individual.data.md5;
    const qrBase64 = await qrStringToBase64(qrString);
    const expiration = getExpiration(15);
    // Save QR as image file
    // QRCode.toFile(
    //   `khqr_${input.delivery_id}.png`,
    //   qrString,
    //   { width: 400, margin: 2 },
    //   (err: any) => {
    //     if (err) {
    //       console.error("[createPayment] Error saving QR code to file:", err);
    //     } else {
    //       console.log(
    //         `[createPayment] QR code saved as khqr_${input.delivery_id}.png`,
    //       );
    //     }
    //   },
    // );
    const paymentDoc = {
        delivery_id: input.delivery_id,
        user_id: input.user_id,
        amount,
        status: "pending",
        currency: "USD",
        payment_method: "bakong_khqr",
        transaction_id: transactionId,
        paid_at: null,
        qr_code: qrBase64,
        qr_string: qrString,
        qr_md5: qrMd5,
        qr_expiration: expiration,
        bakong_hash: "",
        fromAccount: input.fromAccount ?? "",
        toAccount: BAKONG_ACCOUNT_ID,
        description,
        created_at: admin.firestore.FieldValue.serverTimestamp(),
    };
    const docRef = await db.collection("payments").add(paymentDoc);
    console.log(`[createPayment] Created payment ${docRef.id} for delivery ${input.delivery_id} | amount: ${amount} USD`);
    // Start background polling (non-blocking)
    startPolling(qrMd5, docRef.id);
    return {
        payment_id: docRef.id,
        qr_code: qrBase64,
        qr_string: qrString,
        qr_md5: qrMd5,
        transaction_id: transactionId,
        expiration,
        amount,
        currency: "USD",
    };
}
async function verifyPayment(input) {
    if (!BAKONG_TOKEN) {
        throw new Error("BAKONG_TOKEN is not configured.");
    }
    const docRef = db.collection("payments").doc(input.payment_id);
    const docSnap = await docRef.get();
    if (!docSnap.exists) {
        throw new Error(`Payment ${input.payment_id} not found.`);
    }
    const payment = docSnap.data();
    // Already resolved — return early
    if (payment.status === "paid" || payment.status === "failed") {
        return {
            status: payment.status,
            paid_at: payment.paid_at
                ? payment.paid_at.toDate().toISOString()
                : null,
            bakong_hash: payment.bakong_hash,
            amount: payment.amount,
            currency: payment.currency,
            qr_code: payment.qr_code,
            qr_string: payment.qr_string,
            qr_expiration: payment.qr_expiration,
        };
    }
    // Check expiration
    if (new Date(payment.qr_expiration) < new Date()) {
        try {
            await docRef.update({ status: "expired" });
        }
        catch (error) {
            console.error(`[verifyPayment] Failed to update payment ${input.payment_id} to expired:`, error.message);
        }
        return {
            status: "expired",
            paid_at: null,
            qr_code: payment.qr_code,
            qr_string: payment.qr_string,
            qr_expiration: payment.qr_expiration,
            bakong_hash: "",
            amount: payment.amount,
            currency: payment.currency,
        };
    }
    // Call Bakong API
    const response = await fetch(`${BAKONG_API_BASE}/check_transaction_by_md5`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${BAKONG_TOKEN}`,
        },
        body: JSON.stringify({ md5: payment.qr_md5 }),
    });
    if (!response.ok) {
        throw new Error(`Bakong API error: ${response.status} ${response.statusText}`);
    }
    const result = await response.json();
    if (result.responseCode === 0 && result.data) {
        const paidAt = new Date(result.data.acknowledgedDateMs).toISOString();
        try {
            await docRef.update({
                status: "paid",
                bakong_hash: result.data.hash,
                fromAccount: result.data.fromAccountId,
                paid_at: admin.firestore.Timestamp.fromDate(new Date(result.data.acknowledgedDateMs)),
            });
            // Also update the delivery's paymentStatus
            const deliveryId = payment.delivery_id;
            if (deliveryId) {
                const deliveryRef = db.collection("deliveries").doc(deliveryId);
                const deliverySnap = await deliveryRef.get();
                if (deliverySnap.exists) {
                    await deliveryRef.update({
                        paymentStatus: "paid",
                        paymentAt: admin.firestore.Timestamp.fromDate(new Date(result.data.acknowledgedDateMs)),
                        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                    });
                    console.log(`[verifyPayment] Updated delivery ${deliveryId} paymentStatus to paid.`);
                }
                else {
                    console.warn(`[verifyPayment] Delivery ${deliveryId} not found. Cannot update paymentStatus.`);
                }
            }
        }
        catch (error) {
            console.error(`[verifyPayment] Failed to update payment ${input.payment_id} to paid:`, error.message);
        }
        console.log(`[verifyPayment] Payment ${input.payment_id} confirmed as PAID.`);
        return {
            status: "paid",
            paid_at: paidAt,
            bakong_hash: result.data.hash,
            amount: payment.amount,
            currency: payment.currency,
            qr_code: payment.qr_code,
            qr_string: payment.qr_string,
            qr_expiration: payment.qr_expiration,
        };
    }
    return {
        status: "pending",
        paid_at: null,
        bakong_hash: "",
        amount: payment.amount,
        currency: payment.currency,
        qr_code: payment.qr_code,
        qr_string: payment.qr_string,
        qr_expiration: payment.qr_expiration,
    };
}
