export interface Location {
  address: string;
  latitude: number;
  longitude: number;
}

export type DeliveryStatus =
  | "pending"
  | "picked_up"
  | "in_transit"
  | "delivered"
  | "cancelled";

export interface Delivery {
  delivery_id: string;
  userId: string;

  // Recipient
  recipientName: string;
  recipientPhone: string;

  // Locations
  pickup: Location;
  dropoff: Location;

  // Package
  packageName: string;
  packageNote: string;
  packageSize: string;

  // Status
  status: DeliveryStatus;

  // Transporter
  transporterId?: string;
  acceptedAt?: FirebaseFirestore.FieldValue;

  createdAt: FirebaseFirestore.FieldValue;
  updatedAt: FirebaseFirestore.FieldValue;
}

export const VALID_STATUSES: DeliveryStatus[] = [
  "pending",
  "picked_up",
  "in_transit",
  "delivered",
  "cancelled",
];

// Statuses only a transporter can set (cannot cancel or revert to pending)
export const TRANSPORTER_ALLOWED_STATUSES: DeliveryStatus[] = [
  "picked_up",
  "in_transit",
  "delivered",
];
