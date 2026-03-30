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
  getTransporterHistory,
  getActiveTransporterJobs
} from "../controllers/CreatedeliveryControllers";

const router = Router();


router.use(authMiddleware);

router.post("/create", createDelivery);
router.get("/history", getDeliveryHistory);
router.get("/:delivery_id", getDeliveryById);
router.patch("/:delivery_id/status", updateDeliveryStatus);
router.delete("/:delivery_id", cancelDelivery);

// transporter router
router.get("/transporter/available", getAvailableDeliveries);         
router.post("/:delivery_id/accept", acceptDelivery);        
router.patch("/:delivery_id/transporter-status", updateStatusByTransporter); 
router.get("/transporter/active", getActiveTransporterJobs);
router.get("/transporter/history", getTransporterHistory);

export default router;
  