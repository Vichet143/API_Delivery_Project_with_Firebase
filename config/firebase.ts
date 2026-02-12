import admin from "firebase-admin";
import dotenv from "dotenv";
import path from "path";

dotenv.config();


const serviceAccount = require(
  path.join(
    __dirname,
    "../config/projectpracticumyear3-firebase-adminsdk-fbsvc-47ea9a1b7d.json",
  ),
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});


export default admin;
