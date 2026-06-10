"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getallTransporters = exports.getuserByUid = exports.updateUser = exports.getAllUsers = exports.login = exports.registerTrasporter = exports.register = void 0;
const firebase_1 = __importDefault(require("../config/firebase"));
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
        const token = req.headers.authorization?.split("Bearer ")[1];
        if (!token)
            return res.status(401).json({ message: "No token" });
        const decoded = await firebase_1.default.auth().verifyIdToken(token);
        const userData = await userModels_1.default.getUserByUid(decoded.uid);
        console.log("Found User Data:", userData);
        res.json({
            success: true,
            user: {
                id: decoded.uid,
                phone_number: decoded.phone_number || "",
                email: decoded.email || "",
                fullname: userData?.fullname || decoded.name || "No name",
                role: userData?.roles || "user",
                photoURL: userData?.photoURL || decoded.picture || "",
            },
        });
    }
    catch (error) {
        console.error("Login Error:", error);
        res.status(401).json({ message: "Invalid token" });
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
const getuserByUid = async (req, res) => {
    const uid = req.params.uid;
    if (!uid) {
        return res
            .status(400)
            .json({ success: false, message: "User UID is required" });
    }
    try {
        const userData = await userModels_1.default.getUserByUid(uid);
        if (!userData) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        return res.status(200).json({
            success: true,
            user: {
                id: uid,
                fullname: userData.fullname,
                email: userData.email,
                phone_number: userData.phone_number,
                photoURL: userData.photoURL,
                roles: userData.roles,
            },
        });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.getuserByUid = getuserByUid;
const getallTransporters = async (req, res) => {
    try {
        const transporters = await userModels_1.default.getallTransporter();
        return res.status(200).json({
            success: true,
            transporters,
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};
exports.getallTransporters = getallTransporters;
