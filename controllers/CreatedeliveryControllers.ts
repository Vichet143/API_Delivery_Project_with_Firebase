import { Response } from "express";
import { db } from "../config/firebase";
import { AuthRequest } from "../middleware/AuthRequest";
import * as admin from "firebase-admin";
import {
  Delivery,
  VALID_STATUSES,
  TRANSPORTER_ALLOWED_STATUSES,
} from "../models/Createdelivery";

function normalizeDelivery(
  docId: string,
  data: FirebaseFirestore.DocumentData,
): Delivery {
  let userId: string = data.userId ?? "";
  if (typeof userId === "object" && (userId as any).path) {
    userId = (userId as any).path.replace("users/", "");
  } else if (typeof userId === "string" && userId.startsWith("/users/")) {
    userId = userId.replace("/users/", "");
  }

  return {
    delivery_id: docId,
    userId,
    recipientName: data.recipientName,
    recipientPhone: data.recipientPhone,
    pickup: data.pickup,
    dropoff: data.dropoff,
    packageName: data.packageName,
    packageNote: data.packageNote ?? "",
    packageSize: data.packageSize,
    status: data.status,
    transporterId: data.transporterId,
    acceptedAt: data.acceptedAt,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
}

function resolveUid(req: AuthRequest): string {
  return req.uid!;
}

/* ── POST /delivery/create ── */
export const createDelivery = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  const {
    recipientName,
    recipientPhone,
    pickup,
    dropoff,
    packageName,
    packageNote,
    packageSize,
  } = req.body;

  if (
    !recipientName ||
    !recipientPhone ||
    !pickup ||
    !dropoff ||
    !packageName
  ) {
    res.status(400).json({ message: "Missing required fields" });
    return;
  }

  try {
    const deliveryRef = db.collection("deliveries").doc();

    const delivery: Delivery = {
      delivery_id: deliveryRef.id,
      userId: resolveUid(req),

      recipientName,
      recipientPhone,

      pickup: {
        address: pickup.address,
        latitude: pickup.latitude,
        longitude: pickup.longitude,
      },
      dropoff: {
        address: dropoff.address,
        latitude: dropoff.latitude,
        longitude: dropoff.longitude,
      },

      packageName,
      packageNote: packageNote ?? "",
      packageSize,

      status: "pending",

      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await deliveryRef.set(delivery);

    res.status(201).json({
      message: "Delivery created successfully",
      deliveryId: deliveryRef.id,
      delivery,
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};


export const getDeliveryHistory = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  const uid = resolveUid(req);

  try {
    const snapshot = await db
      .collection("deliveries")
      .where("userId", "==", uid)
      .orderBy("createdAt", "desc")
      .get();

    const legacySnapshot = await db
      .collection("deliveries")
      .where("userId", "==", `/users/${uid}`)
      .orderBy("createdAt", "desc")
      .get();

    const seen = new Set<string>();
    const deliveries: Delivery[] = [];

    for (const doc of [...snapshot.docs, ...legacySnapshot.docs]) {
      if (!seen.has(doc.id)) {
        seen.add(doc.id);
        deliveries.push(normalizeDelivery(doc.id, doc.data()));
      }
    }


    deliveries.sort((a: any, b: any) => {
      const aTime = a.createdAt?.toMillis?.() ?? 0;
      const bTime = b.createdAt?.toMillis?.() ?? 0;
      return bTime - aTime;
    });

    res.status(200).json({ deliveries });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const getDeliveryById = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  const { delivery_id }: any = req.params;
  const uid = resolveUid(req);

  try {
    const doc = await db.collection("deliveries").doc(delivery_id).get();

    if (!doc.exists) {
      res.status(404).json({ message: "Delivery not found" });
      return;
    }

    const delivery = normalizeDelivery(doc.id, doc.data()!);

    // Allow both the owner and the assigned transporter to view
    if (delivery.userId !== uid && delivery.transporterId !== uid) {
      res.status(403).json({ message: "Forbidden" });
      return;
    }

    res.status(200).json({ delivery });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const updateDeliveryStatus = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  const { delivery_id }: any = req.params;
  const { status } = req.body;
  const uid = resolveUid(req);

  if (!VALID_STATUSES.includes(status)) {
    res.status(400).json({
      message: `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}`,
    });
    return;
  }

  try {
    const docRef = db.collection("deliveries").doc(delivery_id);
    const doc = await docRef.get();

    if (!doc.exists) {
      res.status(404).json({ message: "Delivery not found" });
      return;
    }

    const delivery = normalizeDelivery(doc.id, doc.data()!);

    if (delivery.userId !== uid) {
      res.status(403).json({ message: "Forbidden" });
      return;
    }

    await docRef.update({
      status,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.status(200).json({ message: "Status updated", status });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const cancelDelivery = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  const { delivery_id }: any = req.params;
  const uid = resolveUid(req);

  try {
    const docRef = db.collection("deliveries").doc(delivery_id);
    const doc = await docRef.get();

    if (!doc.exists) {
      res.status(404).json({ message: "Delivery not found" });
      return;
    }

    const delivery = normalizeDelivery(doc.id, doc.data()!);

    if (delivery.userId !== uid) {
      res.status(403).json({ message: "Forbidden" });
      return;
    }

    await docRef.update({
      status: "cancelled",
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.status(200).json({ message: "Delivery cancelled" });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// Transporter

export const getAvailableDeliveries = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const snapshot = await db
      .collection("deliveries")
      .where("status", "==", "pending")
      .orderBy("createdAt", "desc")
      .get();

    const deliveries = snapshot.docs
      .map((doc) => normalizeDelivery(doc.id, doc.data()))
      .filter((d) => !d.transporterId); // only truly unclaimed ones

    res.status(200).json({ deliveries });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

/* ── POST /delivery/:delivery_id/accept ── */
// Transporter claims a pending delivery. Guards against double-acceptance.
export const acceptDelivery = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  const { delivery_id }: any = req.params;
  const uid = resolveUid(req);

  try {
    const docRef = db.collection("deliveries").doc(delivery_id);
    const doc = await docRef.get();

    if (!doc.exists) {
      res.status(404).json({ message: "Delivery not found" });
      return;
    }

    const delivery = normalizeDelivery(doc.id, doc.data()!);

    if (delivery.status !== "pending") {
      res.status(409).json({ message: "Delivery is no longer available" });
      return;
    }

    if (delivery.transporterId) {
      res.status(409).json({
        message: "Delivery already accepted by another transporter",
      });
      return;
    }

    await docRef.update({
      transporterId: uid,
      acceptedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.status(200).json({
      message: "Delivery accepted successfully",
      deliveryId: delivery_id,
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

/* ── PATCH /delivery/:delivery_id/transporter-status ── */
// Transporter updates the delivery progress.
// Only the assigned transporter can call this, and only with allowed statuses.
export const updateStatusByTransporter = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  const { delivery_id }: any = req.params;
  const { status } = req.body;
  const uid = resolveUid(req);

  if (!TRANSPORTER_ALLOWED_STATUSES.includes(status)) {
    res.status(400).json({
      message: `Transporters can only set: ${TRANSPORTER_ALLOWED_STATUSES.join(", ")}`,
    });
    return;
  }

  try {
    const docRef = db.collection("deliveries").doc(delivery_id);
    const doc = await docRef.get();

    if (!doc.exists) {
      res.status(404).json({ message: "Delivery not found" });
      return;
    }

    const delivery = normalizeDelivery(doc.id, doc.data()!);

    if (delivery.transporterId !== uid) {
      res.status(403).json({
        message: "You are not the assigned transporter for this delivery",
      });
      return;
    }

    await docRef.update({
      status,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.status(200).json({ message: "Status updated", status });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};
