import { Router } from "express";
import {
  createPaymentController,
  verifyPaymentController,
  getPaymentStatusByDelivery,
} from "../controllers/PaymentController";

const router = Router();

router.post("/", createPaymentController);
router.get("/:payment_id/verify", verifyPaymentController);
router.get("/delivery/:delivery_id/status", getPaymentStatusByDelivery);

export default router;
