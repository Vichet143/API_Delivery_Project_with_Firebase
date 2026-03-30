import { Request, Response } from "express";
import { chat } from "../models/Chat";

export const createChat = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { user_id, transporter_id, messages } = req.body;

    if (!user_id || !transporter_id || !messages) {
      res.status(400).json({
        success: false,
        message: "user_id, transporter_id, and messages are required.",
      });
      return;
    }

    const result = await chat({ user_id, transporter_id, messages });

    res.status(201).json({
      success: true,
      message: "Chat created successfully",
      data: result,
    });
  } catch (error: any) {
    console.error("[createChat] Error:", error);
    res.status(500).json({
      success: false,
      message: error.message ?? "Failed to create chat.",
    });
  }
};
