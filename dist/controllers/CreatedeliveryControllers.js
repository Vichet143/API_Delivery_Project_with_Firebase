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
exports.updateStatusByTransporter = exports.acceptDelivery = exports.getAvailableDeliveries = exports.cancelDelivery = exports.updateDeliveryStatus = exports.getDeliveryById = exports.updatePaymentStatus = exports.getDeliveryHistory = exports.createDelivery = void 0;
const firebase_1 = require("../config/firebase");
const admin = __importStar(require("firebase-admin"));
const Createdelivery_1 = require("../models/Createdelivery");
function normalizeDelivery(docId, data) {
    let userId = data.userId ?? "";
    if (typeof userId === "object" && userId.path) {
        userId = userId.path.replace("users/", "");
    }
    else if (typeof userId === "string" && userId.startsWith("/users/")) {
        userId = userId.replace("/users/", "");
    }
    return {
        delivery_id: docId,
        userId,
        recipientName: data.recipientName,
        recipientPhone: data.recipientPhone,
        pickup: data.pickup,
        dropoff: data.dropoff,
        packageName: data.packageName,
        packageNote: data.packageNote ?? "",
        packageSize: data.packageSize,
        price: data.price ?? 0,
        status: data.status,
        paymentStatus: data.paymentStatus ?? "unpaid",
        paymentAt: data.paymentAt ?? null,
        transporterId: data.transporterId,
        acceptedAt: data.acceptedAt,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
    };
}
function resolveUid(req) {
    return req.uid;
}
/* ── POST /delivery/create ── */
const createDelivery = async (req, res) => {
    const { recipientName, recipientPhone, pickup, dropoff, packageName, packageNote, packageSize, } = req.body;
    if (!recipientName ||
        !recipientPhone ||
        !pickup ||
        !dropoff ||
        !packageName) {
        res.status(400).json({ message: "Missing required fields" });
        return;
    }
    // ── ADD THESE LINES ──
    if (!packageSize || !(packageSize in Createdelivery_1.PACKAGE_SIZE_PRICES)) {
        res.status(400).json({
            message: `Invalid packageSize. Must be one of: ${Object.keys(Createdelivery_1.PACKAGE_SIZE_PRICES).join(", ")}`,
        });
        return;
    }
    const price = Createdelivery_1.PACKAGE_SIZE_PRICES[packageSize];
    try {
        const deliveryRef = firebase_1.db.collection("deliveries").doc();
        const delivery = {
            delivery_id: deliveryRef.id,
            userId: resolveUid(req),
            recipientName,
            recipientPhone,
            pickup: {
                address: pickup.address,
                latitude: pickup.latitude,
                longitude: pickup.longitude,
            },
            dropoff: {
                address: dropoff.address,
                latitude: dropoff.latitude,
                longitude: dropoff.longitude,
            },
            packageName,
            packageNote: packageNote ?? "",
            packageSize,
            price,
            paymentStatus: "unpaid",
            paymentAt: null,
            status: "pending",
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };
        await deliveryRef.set(delivery);
        res.status(201).json({
            message: "Delivery created successfully",
            deliveryId: deliveryRef.id,
            delivery,
        });
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
};
exports.createDelivery = createDelivery;
const getDeliveryHistory = async (req, res) => {
    const uid = resolveUid(req);
    try {
        const snapshot = await firebase_1.db
            .collection("deliveries")
            .where("userId", "==", uid)
            .orderBy("createdAt", "desc")
            .get();
        const legacySnapshot = await firebase_1.db
            .collection("deliveries")
            .where("userId", "==", `/users/${uid}`)
            .orderBy("createdAt", "desc")
            .get();
        const seen = new Set();
        const deliveries = [];
        for (const doc of [...snapshot.docs, ...legacySnapshot.docs]) {
            if (!seen.has(doc.id)) {
                seen.add(doc.id);
                deliveries.push(normalizeDelivery(doc.id, doc.data()));
            }
        }
        deliveries.sort((a, b) => {
            const aTime = a.createdAt?.toMillis?.() ?? 0;
            const bTime = b.createdAt?.toMillis?.() ?? 0;
            return bTime - aTime;
        });
        res.status(200).json({ deliveries });
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
};
exports.getDeliveryHistory = getDeliveryHistory;
const updatePaymentStatus = async (req, res) => {
    const { delivery_id } = req.params;
    const { paymentStatus } = req.body;
    const uid = resolveUid(req);
    if (!Createdelivery_1.VALID_PAYMENT_STATUSES.includes(paymentStatus)) {
        res.status(400).json({
            message: `Invalid paymentStatus. Must be one of: ${Createdelivery_1.VALID_PAYMENT_STATUSES.join(", ")}`,
        });
        return;
    }
    try {
        const docRef = firebase_1.db.collection("deliveries").doc(delivery_id);
        const doc = await docRef.get();
        if (!doc.exists) {
            res.status(404).json({ message: "Delivery not found" });
            return;
        }
        const delivery = normalizeDelivery(doc.id, doc.data());
        if (delivery.userId !== uid) {
            res.status(403).json({ message: "Forbidden" });
            return;
        }
        // Refund only allowed if delivery is cancelled
        if (paymentStatus === "refunded" && delivery.status !== "cancelled") {
            res.status(409).json({
                message: "Refund only allowed on cancelled deliveries",
            });
            return;
        }
        // Cannot un-pay a paid delivery (no reverting to unpaid)
        if (paymentStatus === "unpaid" && delivery.paymentStatus !== "unpaid") {
            res.status(409).json({
                message: "Cannot revert payment status to unpaid",
            });
            return;
        }
        await docRef.update({
            paymentStatus,
            // Record timestamp only when marking as paid
            ...(paymentStatus === "paid" && {
                paymentAt: admin.firestore.FieldValue.serverTimestamp(),
            }),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        res.status(200).json({
            message: "Payment status updated",
            paymentStatus,
            // Echo it back in the response too
            ...(paymentStatus === "paid" && { paymentAt: new Date().toISOString() }),
        });
        res.status(200).json({ message: "Payment status updated", paymentStatus });
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
};
exports.updatePaymentStatus = updatePaymentStatus;
const getDeliveryById = async (req, res) => {
    const { delivery_id } = req.params;
    const uid = resolveUid(req);
    try {
        const doc = await firebase_1.db.collection("deliveries").doc(delivery_id).get();
        if (!doc.exists) {
            res.status(404).json({ message: "Delivery not found" });
            return;
        }
        const delivery = normalizeDelivery(doc.id, doc.data());
        // Allow both the owner and the assigned transporter to view
        if (delivery.userId !== uid && delivery.transporterId !== uid) {
            res.status(403).json({ message: "Forbidden" });
            return;
        }
        res.status(200).json({ delivery });
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
};
exports.getDeliveryById = getDeliveryById;
const updateDeliveryStatus = async (req, res) => {
    const { delivery_id } = req.params;
    const { status } = req.body;
    const uid = resolveUid(req);
    if (!Createdelivery_1.VALID_STATUSES.includes(status)) {
        res.status(400).json({
            message: `Invalid status. Must be one of: ${Createdelivery_1.VALID_STATUSES.join(", ")}`,
        });
        return;
    }
    try {
        const docRef = firebase_1.db.collection("deliveries").doc(delivery_id);
        const doc = await docRef.get();
        if (!doc.exists) {
            res.status(404).json({ message: "Delivery not found" });
            return;
        }
        const delivery = normalizeDelivery(doc.id, doc.data());
        if (delivery.userId !== uid) {
            res.status(403).json({ message: "Forbidden" });
            return;
        }
        await docRef.update({
            status,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        res.status(200).json({ message: "Status updated", status });
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
};
exports.updateDeliveryStatus = updateDeliveryStatus;
const cancelDelivery = async (req, res) => {
    const { delivery_id } = req.params;
    const uid = resolveUid(req);
    try {
        const docRef = firebase_1.db.collection("deliveries").doc(delivery_id);
        const doc = await docRef.get();
        if (!doc.exists) {
            res.status(404).json({ message: "Delivery not found" });
            return;
        }
        const delivery = normalizeDelivery(doc.id, doc.data());
        if (delivery.userId !== uid) {
            res.status(403).json({ message: "Forbidden" });
            return;
        }
        await docRef.update({
            status: "cancelled",
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        res.status(200).json({ message: "Delivery cancelled" });
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
};
exports.cancelDelivery = cancelDelivery;
// Transporter
const getAvailableDeliveries = async (req, res) => {
    try {
        const snapshot = await firebase_1.db
            .collection("deliveries")
            .where("status", "==", "pending")
            .orderBy("createdAt", "desc")
            .get();
        const deliveries = snapshot.docs
            .map((doc) => normalizeDelivery(doc.id, doc.data()))
            .filter((d) => !d.transporterId); // only truly unclaimed ones
        res.status(200).json({ deliveries });
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
};
exports.getAvailableDeliveries = getAvailableDeliveries;
/* ── POST /delivery/:delivery_id/accept ── */
// Transporter claims a pending delivery. Guards against double-acceptance.
const acceptDelivery = async (req, res) => {
    const { delivery_id } = req.params;
    const uid = resolveUid(req);
    console.log(uid);
    try {
        const docRef = firebase_1.db.collection("deliveries").doc(delivery_id);
        const doc = await docRef.get();
        if (!doc.exists) {
            res.status(404).json({ message: "Delivery not found" });
            return;
        }
        const delivery = normalizeDelivery(doc.id, doc.data());
        if (delivery.status !== "pending") {
            res.status(409).json({ message: "Delivery is no longer available" });
            return;
        }
        if (delivery.transporterId) {
            res.status(409).json({
                message: "Delivery already accepted by another transporter",
            });
            return;
        }
        await docRef.update({
            transporterId: uid,
            acceptedAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        res.status(200).json({
            message: "Delivery accepted successfully",
            deliveryId: delivery_id,
        });
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
};
exports.acceptDelivery = acceptDelivery;
/* ── PATCH /delivery/:delivery_id/transporter-status ── */
// Transporter updates the delivery progress.
// Only the assigned transporter can call this, and only with allowed statuses.
const updateStatusByTransporter = async (req, res) => {
    const { delivery_id } = req.params;
    const { status } = req.body;
    const uid = resolveUid(req);
    if (!Createdelivery_1.TRANSPORTER_ALLOWED_STATUSES.includes(status)) {
        res.status(400).json({
            message: `Transporters can only set: ${Createdelivery_1.TRANSPORTER_ALLOWED_STATUSES.join(", ")}`,
        });
        return;
    }
    try {
        const docRef = firebase_1.db.collection("deliveries").doc(delivery_id);
        const doc = await docRef.get();
        if (!doc.exists) {
            res.status(404).json({ message: "Delivery not found" });
            return;
        }
        const delivery = normalizeDelivery(doc.id, doc.data());
        if (delivery.transporterId !== uid) {
            res.status(403).json({
                message: "You are not the assigned transporter for this delivery",
            });
            return;
        }
        await docRef.update({
            status,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        res.status(200).json({ message: "Status updated", status });
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
};
exports.updateStatusByTransporter = updateStatusByTransporter;
