"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateUser = exports.getTransporterById = exports.getUserById = exports.getAllUsers = exports.login = exports.registerTrasporter = exports.register = void 0;
const userModels_1 = __importDefault(require("../models/userModels"));
const register = async (req, res) => {
    const { fullname, email, password, phone_number } = req.body;
    if (!fullname || !email || !password || !phone_number) {
        return res.status(400).json({
            success: false,
            message: "All fields are required",
        });
    }
    try {
        const photoURL = "http://www.example.com/12345678/photo.png";
        const roles = "user";
        const { userRecord, token } = await userModels_1.default.register(email, password, fullname, phone_number, photoURL, roles);
        return res.status(201).json({
            success: true,
            message: "User registered successfully",
            user: {
                id: userRecord.uid,
                fullname,
                phone_number,
                email,
                photoURL,
                roles,
                token,
            },
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};
exports.register = register;
const registerTrasporter = async (req, res) => {
    const { fullname, email, password, phone_number } = req.body;
    if (!fullname || !email || !password || !phone_number) {
        return res.status(400).json({
            success: false,
            message: "All fields are required",
        });
    }
    try {
        const photoURL = "http://www.example.com/12345678/photo.png";
        const roles = "transporter";
        const { userRecord, token } = await userModels_1.default.registerTransporter(email, password, fullname, phone_number, photoURL, roles);
        return res.status(201).json({
            success: true,
            message: "Transporter registered successfully",
            user: {
                id: userRecord.uid,
                fullname,
                phone_number,
                email,
                photoURL,
                roles,
                token,
            },
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};
exports.registerTrasporter = registerTrasporter;
const login = async (req, res) => {
    try {
        const { phone_number, roles } = req.body;
        if (!phone_number) {
            return res.status(400).json({
                success: false,
                message: "phone_number is required",
            });
        }
        if (roles && !["user", "transporter"].includes(roles)) {
            return res.status(400).json({
                success: false,
                message: "roles must be either 'user' or 'transporter'",
            });
        }
        const loginResult = await userModels_1.default.login(phone_number, roles);
        res.json({
            success: true,
            message: "Login success",
            token: loginResult.token,
            user: loginResult.user,
        });
    }
    catch (error) {
        if (error.message === "User not found" ||
            error.message === "Profile not found for this account") {
            return res.status(404).json({
                success: false,
                message: error.message,
            });
        }
        res.status(500).json({
            success: false,
            message: error.message || "Failed to login",
        });
    }
};
exports.login = login;
const getAllUsers = async (req, res) => {
    try {
        const users = await userModels_1.default.getAllUsers();
        return res.status(200).json({
            success: true,
            users,
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};
exports.getAllUsers = getAllUsers;
const getUserById = async (req, res) => {
    const rawId = req.params.id;
    const id = Array.isArray(rawId) ? rawId[0] : rawId;
    if (!id) {
        return res.status(400).json({
            success: false,
            message: "User ID is required",
        });
    }
    try {
        const user = await userModels_1.default.getUserById(id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }
        return res.status(200).json({
            success: true,
            user,
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};
exports.getUserById = getUserById;
const getTransporterById = async (req, res) => {
    const rawId = req.params.id;
    const id = Array.isArray(rawId) ? rawId[0] : rawId;
    if (!id) {
        return res.status(400).json({
            success: false,
            message: "Transporter ID is required",
        });
    }
    try {
        const transporter = await userModels_1.default.getTransporterById(id);
        if (!transporter) {
            return res.status(404).json({
                success: false,
                message: "Transporter not found",
            });
        }
        return res.status(200).json({
            success: true,
            transporter,
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};
exports.getTransporterById = getTransporterById;
const updateUser = async (req, res) => {
    const id = req.params.id;
    const { fullname, email, password, photoURL, phone_number } = req.body;
    if (!id) {
        return res
            .status(400)
            .json({ success: false, message: "User ID is required" });
    }
    try {
        const userProfile = await userModels_1.default.updateUser(id, fullname, email, password, photoURL, phone_number);
        return res.status(200).json({
            success: true,
            message: "User updated successfully",
            user: {
                id: userProfile.uid,
                username: userProfile.displayName,
                email: userProfile.email,
                photoURL: userProfile.photoURL,
                phone_number: userProfile.phoneNumber,
            },
        });
    }
    catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
};
exports.updateUser = updateUser;
