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

  if (userData && !userData.photoURL) {
    const authUser = await admin.auth().getUser(uid);
    userData.photoURL = authUser.photoURL || "";
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
  const token = jwt.sign(
    { uid: userRecord.uid, roles: tokenRole },
    JWT_SECRET,
    {
      expiresIn: JWT_EXPIRES_IN,
    },
  );

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
        photoURL: userData?.photoURL || user.photoURL || "",
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
  roles?: string,
) => {
  const formatPhoneNumber = (phone: string) => {
    if (phone.startsWith("+")) return phone;
    if (phone.startsWith("0")) return "+855" + phone.slice(1);
    return "+855" + phone;
  };

  const formattedPhone = phone_number
    ? formatPhoneNumber(phone_number)
    : undefined;
  const db = admin.firestore();

  let targetCollection = "users";
  if (roles === "transporter") {
    targetCollection = "transporter";
  } else if (typeof roles === "undefined") {
    const [usersDoc, transporterDoc] = await Promise.all([
      db.collection("users").doc(uid).get(),
      db.collection("transporter").doc(uid).get(),
    ]);
    if (usersDoc.exists) targetCollection = "users";
    else if (transporterDoc.exists) targetCollection = "transporter";
    else targetCollection = "users";
  } else {
    targetCollection = "users";
  }
  const updateData: any = {};
  if (email) updateData.email = email;
  if (password) updateData.password = password;
  if (fullname) updateData.displayName = fullname;
  if (photoURL) updateData.photoURL = photoURL;
  if (formattedPhone) updateData.phoneNumber = formattedPhone;

  const userRecord = await admin.auth().updateUser(uid, updateData);

  if (roles) {
    try {
      await admin.auth().setCustomUserClaims(uid, { role: roles });
    } catch (err) {
      console.error("setCustomUserClaims failed for", uid, err);
    }
  }

  const firestoreData: any = {};
  if (fullname) firestoreData.fullname = fullname;
  if (email) firestoreData.email = email;
  if (photoURL) firestoreData.photoURL = photoURL;
  if (formattedPhone) firestoreData.phone_number = formattedPhone;
  if (roles) firestoreData.roles = roles;
  firestoreData.uid = uid;
  firestoreData.updatedAt = admin.firestore.FieldValue.serverTimestamp();

  await db
    .collection(targetCollection)
    .doc(uid)
    .set(firestoreData, { merge: true });

  return userRecord;
};

export const getallTransporter = async () => {
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
          photoURL: transporterData.photoURL || user.photoURL || "",
          role: transporterData.roles,
        };
      }
    }),
  );

  // Filter out non-transporters
  return transporterWithRoles.filter(
    (transporter) => transporter !== undefined,
  );
};

export default {
  register,
  login,
  getAllUsers,
  updateUser,
  getUserByUid,
  registerTransporter,
  getallTransporter,
};
