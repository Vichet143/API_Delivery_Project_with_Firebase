import admin from "firebase-admin";
import dotenv from "dotenv";
import path from "path";

dotenv.config();

const serviceAccount = require(
  path.join(
    __dirname,
    "project-practicum-app-year-3-firebase-adminsdk-fbsvc-0636a4e5fd.json",
  ),
);

// if (!admin.apps.length) {
//   admin.initializeApp({
//     credential: admin.credential.cert(serviceAccount),
//   });
// }
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
  });
}

export const db = admin.firestore();
export const auth = admin.auth();
export default admin;
