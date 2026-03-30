import { Router } from "express";
import { createChat } from "../controllers/Chat";

const router = Router();

router.post("/", createChat);

export default router;
