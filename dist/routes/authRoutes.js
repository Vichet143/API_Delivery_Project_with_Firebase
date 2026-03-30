"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController_1 = require("../controllers/authController");
const router = (0, express_1.Router)();
// POST /api/auth/register
router.post("/register", authController_1.register);
router.post("/registertransporter", authController_1.registerTrasporter);
// POST /api/auth/login
router.post("/login", authController_1.login);
router.get("/getalluser", authController_1.getAllUsers);
router.get("/getuser/:id", authController_1.getUserById);
router.get("/gettransporter/:id", authController_1.getTransporterById);
router.put("/updateprofile/:id", authController_1.updateUser);
exports.default = router;
