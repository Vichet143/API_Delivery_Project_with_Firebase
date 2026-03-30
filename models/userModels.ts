import admin from "../config/firebase";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret";
const JWT_EXPIRES_IN = "7d";

const register = async (
  email: string,
  password: string,
  fullname: string,
  phone_number: string,
  photoURL: string,
  roles: string,
) => {
  const formatPhoneNumber = (phone: string) => {
    if (phone.startsWith("+")) return phone;

    // Cambodia default (+855)
    if (phone.startsWith("0")) {
      return "+855" + phone.slice(1);
    }

    return "+855" + phone;
  };

  const formattedPhone = formatPhoneNumber(phone_number);

  const userRecord = await admin.auth().createUser({
    email,
    password,
    displayName: fullname,
    photoURL,
    phoneNumber: formattedPhone,
  });

  const token = jwt.sign({ uid: userRecord.uid, roles }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
  const db = admin.firestore();
  await db.collection("users").doc(userRecord.uid).set({
    fullname,
    email,
    roles,
    phone_number,
    id: userRecord.uid,
    photoURL,
    createdAt: new Date(),
  });

  return { userRecord, token };
};
const registerTransporter = async (
  email: string,
  password: string,
  fullname: string,
  phone_number: string,
  photoURL: string,
  roles: string,
) => {
  const formatPhoneNumber = (phone: string) => {
    if (phone.startsWith("+")) return phone;

    // Cambodia default (+855)
    if (phone.startsWith("0")) {
      return "+855" + phone.slice(1);
    }

    return "+855" + phone;
  };

  const formattedPhone = formatPhoneNumber(phone_number);

  const userRecord = await admin.auth().createUser({
    email,
    password,
    displayName: fullname,
    photoURL,
    phoneNumber: formattedPhone,
  });

  const token = jwt.sign({ uid: userRecord.uid, roles }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
  const db = admin.firestore();
  await db.collection("transporter").doc(userRecord.uid).set({
    fullname,
    email,
    roles,
    phone_number,
    id: userRecord.uid,
    photoURL,
    createdAt: new Date(),
  });

  return { userRecord, token };
};

const getUserByUid = async (uid: string) => {
  const db = admin.firestore();

  // Check both users and transporter collections
  const userDoc = await db.collection("users").doc(uid).get();
  let userData = userDoc.data();

  if (!userData) {
    const transporterDoc = await db.collection("transporter").doc(uid).get();
    userData = transporterDoc.data();
  }

  return userData;
};

export const login = async (phone_number: string, roles?: string) => {
  const formattedPhone = phone_number.startsWith("+")
    ? phone_number
    : "+855" + phone_number.slice(1);

  // Get user by phone
  let userRecord;
  try {
    userRecord = await admin.auth().getUserByPhoneNumber(formattedPhone);
  } catch (error) {
    throw new Error("User not found");
  }

  const db = admin.firestore();

  // Check both users and transporter collections
  const userDoc = await db.collection("users").doc(userRecord.uid).get();
  let userData = userDoc.data();

  if (!userData) {
    const transporterDoc = await db
      .collection("transporter")
      .doc(userRecord.uid)
      .get();
    userData = transporterDoc.data();
  }

  if (!userData) {
    throw new Error("Profile not found for this account");
  }

  const tokenRole = roles || userData.roles || "user";
  const token = jwt.sign({ uid: userRecord.uid, roles: tokenRole }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });

  return {
    token,
    user: {
      id: userRecord.uid,
      email: userRecord.email,
      username: userRecord.displayName,
      phone_number: userRecord.phoneNumber,
      photoURL: userRecord.photoURL,
      roles: userData?.roles || [],
    },
  };
};

// Get all users
const getAllUsers = async () => {
  const listUsersResult = await admin.auth().listUsers(1000);
  const db = admin.firestore();

  const usersWithRoles = await Promise.all(
    listUsersResult.users.map(async (user) => {
      // Check both users and transporter collections
      const userDoc = await db.collection("users").doc(user.uid).get();
      let userData = userDoc.data();

      if (!userData) {
        const transporterDoc = await db
          .collection("transporter")
          .doc(user.uid)
          .get();
        userData = transporterDoc.data();
      }

      return {
        id: user.uid,
        email: user.email,
        username: user.displayName,
        phone_number: user.phoneNumber,
        photoURL: user.photoURL,
        role: userData?.roles,
      };
    }),
  );

  return usersWithRoles;
};

export const updateUser = async (
  uid: string,
  fullname: string,
  email: string,
  password: string,
  photoURL: string,
  phone_number: string,
) => {
  const formatPhoneNumber = (phone: string) => {
    if (phone.startsWith("+")) return phone;

    if (phone.startsWith("0")) {
      return "+855" + phone.slice(1);
    }

    return "+855" + phone;
  };

  const formattedPhone = formatPhoneNumber(phone_number);

  // Prepare data for Firebase Auth
  const updateData: any = {};
  if (email) updateData.email = email;
  if (password) updateData.password = password;
  if (fullname) updateData.displayName = fullname;
  if (photoURL) updateData.photoURL = photoURL;
  if (formattedPhone) updateData.phoneNumber = formattedPhone;

  const userRecord = await admin.auth().updateUser(uid, updateData);

  // Update Firestore user document
  const db = admin.firestore();
  const firestoreData: any = {};
  if (fullname) firestoreData.fullname = fullname;
  if (email) firestoreData.email = email;
  if (photoURL) firestoreData.photoURL = photoURL;
  if (phone_number) firestoreData.phone_number = phone_number;
  firestoreData.updatedAt = admin.firestore.FieldValue.serverTimestamp();

  await db.collection("users").doc(uid).update(firestoreData);

  return userRecord;
};

export const getallTransporter = async ()=>{
  const listUsersResult = await admin.auth().listUsers(1000);
  const db = admin.firestore();

  const transporterWithRoles = await Promise.all(
    listUsersResult.users.map(async (user) => {
      // Check transporter collection
      const transporterDoc = await db
        .collection("transporter")
        .doc(user.uid)
        .get();
      const transporterData = transporterDoc.data();

      if (transporterData) {
        return {
          id: user.uid,
          email: user.email,
          username: user.displayName,
          phone_number: user.phoneNumber,
          photoURL: user.photoURL,
          role: transporterData.roles,
        };
      }
    }),
  );

  // Filter out non-transporters
  return transporterWithRoles.filter((transporter) => transporter !== undefined);
}

export default {
  register,
  login,
  getAllUsers,
  updateUser,
  getUserByUid,
  registerTransporter,
  getallTransporter
};
