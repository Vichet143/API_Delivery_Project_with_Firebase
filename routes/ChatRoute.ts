import { Router } from "express";
import { createChat, getChats, getChatsByTransporter } from "../controllers/Chat";
import authMiddleware from "../middleware/authMiddleware";


const router = Router();

router.post("/", authMiddleware, createChat);
router.get("/user/:user_id", authMiddleware, getChats);
router.get("/transporter/:transporter_id", authMiddleware, getChatsByTransporter);

export default router;
