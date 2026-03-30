"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateUser = exports.login = void 0;
const firebase_1 = __importDefault(require("../config/firebase"));
const register = async (email, password, fullname, phone_number, photoURL, roles) => {
    const formatPhoneNumber = (phone) => {
        if (phone.startsWith("+"))
            return phone;
        // Cambodia default (+855)
        if (phone.startsWith("0")) {
            return "+855" + phone.slice(1);
        }
        return "+855" + phone;
    };
    const formattedPhone = formatPhoneNumber(phone_number);
    const userRecord = await firebase_1.default.auth().createUser({
        email,
        password,
        displayName: fullname,
        photoURL,
        phoneNumber: formattedPhone,
    });
    const token = await firebase_1.default.auth().createCustomToken(userRecord.uid);
    const db = firebase_1.default.firestore();
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
const registerTransporter = async (email, password, fullname, phone_number, photoURL, roles) => {
    const formatPhoneNumber = (phone) => {
        if (phone.startsWith("+"))
            return phone;
        // Cambodia default (+855)
        if (phone.startsWith("0")) {
            return "+855" + phone.slice(1);
        }
        return "+855" + phone;
    };
    const formattedPhone = formatPhoneNumber(phone_number);
    const userRecord = await firebase_1.default.auth().createUser({
        email,
        password,
        displayName: fullname,
        photoURL,
        phoneNumber: formattedPhone,
    });
    const token = await firebase_1.default.auth().createCustomToken(userRecord.uid);
    const db = firebase_1.default.firestore();
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
const getUserByUid = async (uid) => {
    const db = firebase_1.default.firestore();
    // Check both users and transporter collections
    const userDoc = await db.collection("users").doc(uid).get();
    let userData = userDoc.data();
    if (!userData) {
        const transporterDoc = await db.collection("transporter").doc(uid).get();
        userData = transporterDoc.data();
    }
    return userData;
};
const getUserById = async (uid) => {
    const db = firebase_1.default.firestore();
    const userDoc = await db.collection("users").doc(uid).get();
    return userDoc.data();
};
const getTransporterById = async (uid) => {
    const db = firebase_1.default.firestore();
    const transporterDoc = await db.collection("transporter").doc(uid).get();
    return transporterDoc.data();
};
const normalizePhoneNumber = (phone_number) => {
    if (phone_number.startsWith("+"))
        return phone_number;
    if (phone_number.startsWith("0")) {
        return "+855" + phone_number.slice(1);
    }
    return "+855" + phone_number;
};
const login = async (phone_number, roles) => {
    const formattedPhone = normalizePhoneNumber(phone_number);
    // Get user by phone
    let userRecord;
    try {
        userRecord = await firebase_1.default.auth().getUserByPhoneNumber(formattedPhone);
    }
    catch (error) {
        throw new Error("User not found");
    }
    // Create custom token for your backend
    const token = await firebase_1.default.auth().createCustomToken(userRecord.uid);
    const db = firebase_1.default.firestore();
    // Check both users and transporter collections
    let userData;
    if (roles === "user") {
        const userDoc = await db.collection("users").doc(userRecord.uid).get();
        userData = userDoc.data();
    }
    else if (roles === "transporter") {
        const transporterDoc = await db
            .collection("transporter")
            .doc(userRecord.uid)
            .get();
        userData = transporterDoc.data();
    }
    else {
        const userDoc = await db.collection("users").doc(userRecord.uid).get();
        userData = userDoc.data();
        if (!userData) {
            const transporterDoc = await db
                .collection("transporter")
                .doc(userRecord.uid)
                .get();
            userData = transporterDoc.data();
        }
    }
    if (!userData) {
        throw new Error("Profile not found for this account");
    }
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
exports.login = login;
// Get all users
const getAllUsers = async () => {
    const listUsersResult = await firebase_1.default.auth().listUsers(1000);
    const db = firebase_1.default.firestore();
    const usersWithRoles = await Promise.all(listUsersResult.users.map(async (user) => {
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
    }));
    return usersWithRoles;
};
const updateUser = async (uid, fullname, email, password, photoURL, phone_number) => {
    const formatPhoneNumber = (phone) => {
        if (phone.startsWith("+"))
            return phone;
        if (phone.startsWith("0")) {
            return "+855" + phone.slice(1);
        }
        return "+855" + phone;
    };
    const formattedPhone = formatPhoneNumber(phone_number);
    // Prepare data for Firebase Auth
    const updateData = {};
    if (email)
        updateData.email = email;
    if (password)
        updateData.password = password;
    if (fullname)
        updateData.displayName = fullname;
    if (photoURL)
        updateData.photoURL = photoURL;
    if (formattedPhone)
        updateData.phoneNumber = formattedPhone;
    const userRecord = await firebase_1.default.auth().updateUser(uid, updateData);
    // Update Firestore user document
    const db = firebase_1.default.firestore();
    const firestoreData = {};
    if (fullname)
        firestoreData.fullname = fullname;
    if (email)
        firestoreData.email = email;
    if (photoURL)
        firestoreData.photoURL = photoURL;
    if (phone_number)
        firestoreData.phone_number = phone_number;
    firestoreData.updatedAt = firebase_1.default.firestore.FieldValue.serverTimestamp();
    await db.collection("users").doc(uid).update(firestoreData);
    return userRecord;
};
exports.updateUser = updateUser;
exports.default = {
    register,
    login: exports.login,
    getAllUsers,
    updateUser: exports.updateUser,
    getUserByUid,
    getUserById,
    getTransporterById,
    registerTransporter,
};
