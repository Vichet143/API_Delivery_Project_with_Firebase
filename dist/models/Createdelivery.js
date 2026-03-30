"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VALID_PAYMENT_STATUSES = exports.TRANSPORTER_ALLOWED_STATUSES = exports.VALID_STATUSES = exports.PACKAGE_SIZE_PRICES = void 0;
exports.PACKAGE_SIZE_PRICES = {
    small: 0.25,
    medium: 0.26,
    large: 0.27,
};
exports.VALID_STATUSES = [
    "pending",
    "picked_up",
    "in_transit",
    "delivered",
    "cancelled",
];
exports.TRANSPORTER_ALLOWED_STATUSES = [
    "picked_up",
    "in_transit",
    "delivered",
];
exports.VALID_PAYMENT_STATUSES = [
    // ← new
    "unpaid",
    "paid",
    "refunded",
];
