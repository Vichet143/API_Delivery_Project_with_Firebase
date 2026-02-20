import { Router } from "express";
import { register, login, getAllUsers, updateUser, registerTrasporter } from "../controllers/authController";
import authMiddleware from "../middleware/authMiddleware";

const router = Router();

// POST /api/auth/register
router.post("/register", register);
router.post("/registertransporter", registerTrasporter)

// POST /api/auth/login
router.post("/login", login);
router.get("/getalluser", getAllUsers)
router.put("/updateprofile/:id", updateUser)

export default router;
