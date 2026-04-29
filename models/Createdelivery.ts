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

export type PackageSize = "small" | "medium" | "large";

export const PACKAGE_SIZE_PRICES: Record<PackageSize, number> = {
  small: 0.25,
  medium: 0.26,
  large: 0.27,
};

export type PaymentStatus = "unpaid" | "paid" | "refunded";

export interface Delivery {
  delivery_id: string;
  userId: string;

  recipientName: string;
  recipientPhone: string;

  pickup: Location;
  dropoff: Location;

  packageName: string;
  packageNote: string;
  photoURL?: string;
  packageSize: PackageSize;
  price: number;

  status: DeliveryStatus;
  paymentStatus: PaymentStatus;
  paymentAt?: FirebaseFirestore.FieldValue | null;

  transporterId?: string;
  transporterName?: string;
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

export const TRANSPORTER_ALLOWED_STATUSES: DeliveryStatus[] = [
  "picked_up",
  "in_transit",
  "delivered",
];

export const VALID_PAYMENT_STATUSES: PaymentStatus[] = [
  // ← new
  "unpaid",
  "paid",
  "refunded",
];
