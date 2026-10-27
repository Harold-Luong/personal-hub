const { onCall } = require("firebase-functions/v2/https");
const { handleMutation } = require("./src/handler.cjs");
exports.mutateExpenses = onCall({
    region: "asia-southeast1", enforceAppCheck: true,
    maxInstances: 10, timeoutSeconds: 120,
}, handleMutation);
