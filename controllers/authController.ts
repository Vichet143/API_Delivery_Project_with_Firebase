import { Request, Response } from "express";
import admin from "../config/firebase";
import userModels from "../models/userModels";

export const register = async (req: Request, res: Response) => {
  const { fullname, email, password, phone_number} = req.body;

  if (!fullname || !email || !password || !phone_number) {
    return res.status(400).json({
      success: false,
      message: "All fields are required",
    });
  }

  try {
    const photoURL = "http://www.example.com/12345678/photo.png";
    const roles = "user"
    const {userRecord, token} = await userModels.register(
      email,
      password,
      fullname,
      phone_number,
      photoURL,
      roles
    );

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
        token
      },
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.split("Bearer ")[1];
    if (!token) return res.status(401).json({ message: "No token" });

    const decoded = await admin.auth().verifyIdToken(token);

    const userData = await userModels.getUserByUid(decoded.uid);

    res.json({
      success: true,
      user: {
        uid: decoded.uid,
        phone_number: decoded.phone_number,
        email: decoded.email,
        ...userData,
      },
    });
  } catch {
    res.status(401).json({ message: "Invalid token" });
  }
};

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await userModels.getAllUsers();
    return res.status(200).json({
      success: true,
      users,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateUser = async (req: Request, res: Response) => {
  const id:any = req.params.id;
  const { fullname, email, password, photoURL , phone_number} = req.body;

  if (!id) {
    return res
      .status(400)
      .json({ success: false, message: "User ID is required" });
  }

  try {
    const userProfile = await userModels.updateUser(
      id,
      fullname,
      email,
      password,
      photoURL,
      phone_number
    );

    return res.status(200).json({
      success: true,
      message: "User updated successfully",
      user: {
        id: userProfile.uid,
        username: userProfile.displayName,
        email: userProfile.email,
        photoURL: userProfile.photoURL,
        phone_number: userProfile.phoneNumber
      },
    });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message });
  }
};