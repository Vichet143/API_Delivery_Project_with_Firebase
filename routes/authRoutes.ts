import { Router } from "express";
import {
  register,
  login,
  getAllUsers,
  updateUser,
  registerTrasporter,
  getuserByUid,
  getallTransporters
} from "../controllers/authController";

const router = Router();

router.post("/register", register);
router.post("/registertransporter", registerTrasporter);

router.post("/login", login);
router.get("/getalluser", getAllUsers);
router.get("/getalltransporter", getallTransporters);
router.get("/getuser/:uid", getuserByUid);
router.put("/updateprofile/:id", updateUser);

export default router;
