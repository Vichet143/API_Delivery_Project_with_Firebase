import { Router } from "express";
import authMiddleware  from "../middleware/authMiddleware";
import {
  createDelivery,
  getDeliveryHistory,
  getDeliveryById,
  updateDeliveryStatus,
  cancelDelivery,
  getAvailableDeliveries,
  acceptDelivery,
  updateStatusByTransporter,
} from "../controllers/CreatedeliveryControllers";

const router = Router();


router.use(authMiddleware);

router.post("/create", authMiddleware, createDelivery);
router.get("/history", authMiddleware, getDeliveryHistory);
router.get("/:delivery_id", authMiddleware, getDeliveryById);
router.patch("/:delivery_id/status", authMiddleware, updateDeliveryStatus);
router.delete("/:delivery_id", authMiddleware, cancelDelivery);

// transporter router
router.get("/transporter/available", getAvailableDeliveries);         
router.post("/:delivery_id/accept", acceptDelivery);        
router.patch("/:delivery_id/transporter-status", updateStatusByTransporter); 

export default router;
