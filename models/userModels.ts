import admin from "../config/firebase";


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

  const token = await admin.auth().createCustomToken(userRecord.uid);
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

  const token = await admin.auth().createCustomToken(userRecord.uid);
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
  const doc = await admin.firestore().collection("users").doc(uid).get();
  return doc.data();
};

export const login = async (phone_number: string) => {
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

  // Create custom token for your backend
  const token = await admin.auth().createCustomToken(userRecord.uid);
  console.log(token);
  

  const db = admin.firestore();
  const userDoc = await db.collection("users").doc(userRecord.uid).get();
  const userData = userDoc.data();

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
  return listUsersResult.users.map((user) => ({
    id: user.uid,
    email: user.email,
    username: user.displayName,
    phone_number: user.phoneNumber,
    photoURL: user.photoURL,
  }));
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


export default { register, login, getAllUsers, updateUser ,getUserByUid, registerTransporter};
