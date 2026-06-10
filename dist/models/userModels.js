"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getallTransporter = exports.updateUser = exports.login = void 0;
const firebase_1 = __importDefault(require("../config/firebase"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret";
const JWT_EXPIRES_IN = "7d";
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
    const token = jsonwebtoken_1.default.sign({ uid: userRecord.uid, roles }, JWT_SECRET, {
        expiresIn: JWT_EXPIRES_IN,
    });
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
    const token = jsonwebtoken_1.default.sign({ uid: userRecord.uid, roles }, JWT_SECRET, {
        expiresIn: JWT_EXPIRES_IN,
    });
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
    // Check users, transporter, and admin collections
    const userDoc = await db.collection("users").doc(uid).get();
    let userData = userDoc.data();
    if (!userData) {
        const transporterDoc = await db.collection("transporter").doc(uid).get();
        userData = transporterDoc.data();
    }
    if (!userData) {
        const adminDoc = await db.collection("admin").doc(uid).get();
        userData = adminDoc.data();
        if (userData && !userData.roles) {
            userData.roles = "admin";
        }
    }
    if (userData && !userData.photoURL) {
        const authUser = await firebase_1.default.auth().getUser(uid);
        userData.photoURL = authUser.photoURL || "";
    }
    return userData;
};
const login = async (phone_number, roles) => {
    const formattedPhone = phone_number.startsWith("+")
        ? phone_number
        : "+855" + phone_number.slice(1);
    // Get user by phone
    let userRecord;
    try {
        userRecord = await firebase_1.default.auth().getUserByPhoneNumber(formattedPhone);
    }
    catch (error) {
        throw new Error("User not found");
    }
    const db = firebase_1.default.firestore();
    // Check users, transporter, and admin collections
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
        const adminDoc = await db
            .collection("admin")
            .doc(userRecord.uid)
            .get();
        userData = adminDoc.data();
        if (userData && !userData.roles) {
            userData.roles = "admin";
        }
    }
    if (!userData) {
        throw new Error("Profile not found for this account");
    }
    const tokenRole = roles || userData.roles || "user";
    const token = jsonwebtoken_1.default.sign({ uid: userRecord.uid, roles: tokenRole }, JWT_SECRET, {
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
exports.login = login;
// Get all users
const getAllUsers = async () => {
    const listUsersResult = await firebase_1.default.auth().listUsers(1000);
    const db = firebase_1.default.firestore();
    const usersWithRoles = await Promise.all(listUsersResult.users.map(async (user) => {
        // Check users, transporter, and admin collections
        const userDoc = await db.collection("users").doc(user.uid).get();
        let userData = userDoc.data();
        if (!userData) {
            const transporterDoc = await db
                .collection("transporter")
                .doc(user.uid)
                .get();
            userData = transporterDoc.data();
        }
        if (!userData) {
            const adminDoc = await db
                .collection("admin")
                .doc(user.uid)
                .get();
            userData = adminDoc.data();
            if (userData && !userData.roles) {
                userData.roles = "admin";
            }
        }
        return {
            id: user.uid,
            email: user.email,
            username: user.displayName,
            phone_number: user.phoneNumber,
            photoURL: userData?.photoURL || user.photoURL || "",
            role: userData?.roles,
        };
    }));
    return usersWithRoles;
};
const updateUser = async (uid, fullname, email, password, photoURL, phone_number, roles) => {
    const formatPhoneNumber = (phone) => {
        if (phone.startsWith("+"))
            return phone;
        if (phone.startsWith("0"))
            return "+855" + phone.slice(1);
        return "+855" + phone;
    };
    const formattedPhone = phone_number
        ? formatPhoneNumber(phone_number)
        : undefined;
    const db = firebase_1.default.firestore();
    let targetCollection = "users";
    if (roles === "transporter") {
        targetCollection = "transporter";
    }
    else if (roles === "admin") {
        targetCollection = "admin";
    }
    else if (typeof roles === "undefined") {
        const [usersDoc, transporterDoc, adminDoc] = await Promise.all([
            db.collection("users").doc(uid).get(),
            db.collection("transporter").doc(uid).get(),
            db.collection("admin").doc(uid).get(),
        ]);
        if (usersDoc.exists)
            targetCollection = "users";
        else if (transporterDoc.exists)
            targetCollection = "transporter";
        else if (adminDoc.exists)
            targetCollection = "admin";
        else
            targetCollection = "users";
    }
    else {
        targetCollection = "users";
    }
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
    if (roles) {
        try {
            await firebase_1.default.auth().setCustomUserClaims(uid, { role: roles });
        }
        catch (err) {
            console.error("setCustomUserClaims failed for", uid, err);
        }
    }
    const firestoreData = {};
    if (fullname)
        firestoreData.fullname = fullname;
    if (email)
        firestoreData.email = email;
    if (photoURL)
        firestoreData.photoURL = photoURL;
    if (formattedPhone)
        firestoreData.phone_number = formattedPhone;
    if (roles)
        firestoreData.roles = roles;
    firestoreData.uid = uid;
    firestoreData.updatedAt = firebase_1.default.firestore.FieldValue.serverTimestamp();
    await db
        .collection(targetCollection)
        .doc(uid)
        .set(firestoreData, { merge: true });
    return userRecord;
};
exports.updateUser = updateUser;
const getallTransporter = async () => {
    const listUsersResult = await firebase_1.default.auth().listUsers(1000);
    const db = firebase_1.default.firestore();
    const transporterWithRoles = await Promise.all(listUsersResult.users.map(async (user) => {
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
    }));
    // Filter out non-transporters
    return transporterWithRoles.filter((transporter) => transporter !== undefined);
};
exports.getallTransporter = getallTransporter;
exports.default = {
    register,
    login: exports.login,
    getAllUsers,
    updateUser: exports.updateUser,
    getUserByUid,
    registerTransporter,
    getallTransporter: exports.getallTransporter,
};
