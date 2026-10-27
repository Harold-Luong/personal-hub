const { initializeApp, getApps } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
if (!getApps().length) initializeApp();
// Set EXPENSE_DATABASE_ID in functions/.env.<project> only for a named database.
exports.firestore = getFirestore(process.env.EXPENSE_DATABASE_ID || "(default)");
