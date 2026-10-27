// Build-time adapter: reuse the repository business logic with Admin SDK and one
// outer transaction. Browser bundles never import this module or Admin SDK.
const { AsyncLocalStorage } = require("node:async_hooks");
const { FieldValue, Timestamp, Filter, AggregateField } = require("firebase-admin/firestore");
const scope = new AsyncLocalStorage();
exports.withTransaction = (transaction, callback) => scope.run(transaction, callback);
const document = (snapshot) => ({ id: snapshot.id, exists: () => snapshot.exists, data: () => snapshot.data() });
const result = (snapshot) => snapshot.docs
    ? { docs: snapshot.docs.map(document), empty: snapshot.empty, size: snapshot.size }
    : document(snapshot);
const read = async (reference) => result(await (scope.getStore()?.get(reference) ?? reference.get()));
exports.Timestamp = Timestamp;
exports.collection = (db, ...parts) => db.collection(parts.join("/"));
exports.doc = (collection, id) => id ? collection.doc(id) : collection.doc();
exports.serverTimestamp = () => FieldValue.serverTimestamp();
exports.deleteField = () => FieldValue.delete();
exports.getDocFromServer = read;
exports.getDocsFromServer = read;
exports.getDocsFromCache = read;
exports.where = (...args) => (q) => q.where(...args);
exports.orderBy = (...args) => (q) => q.orderBy(...args);
exports.limit = (value) => (q) => q.limit(value);
exports.startAfter = (...args) => (q) => q.startAfter(...args);
exports.or = (...args) => (q) => q.where(Filter.or(...args));
exports.query = (q, ...constraints) => constraints.reduce((next, apply) => apply(next), q);
exports.count = () => AggregateField.count();
exports.sum = (field) => AggregateField.sum(field);
exports.getAggregateFromServer = (q, fields) => q.aggregate(fields).get();
exports.deleteDoc = (ref) => scope.getStore() ? scope.getStore().delete(ref) : ref.delete();
exports.runTransaction = async (db, callback) => {
    const run = (tx) => callback({
        get: async (ref) => result(await tx.get(ref)),
        set: (ref, data, options) => options ? tx.set(ref, data, options) : tx.set(ref, data),
        update: (ref, data) => tx.update(ref, data),
    });
    return scope.getStore() ? run(scope.getStore()) : db.runTransaction(run);
};
exports.writeBatch = (db) => {
    const transaction = scope.getStore();
    if (!transaction) return db.batch();
    return {
        set: (ref, data) => transaction.set(ref, data),
        update: (ref, data) => transaction.update(ref, data),
        commit: async () => {},
    };
};
