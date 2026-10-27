import { build } from "esbuild";
import path from "node:path";
import { fileURLToPath } from "node:url";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
await build({
    absWorkingDir: root,
    entryPoints: ["functions/src/domain-entry.js"],
    outfile: "functions/lib/domain.cjs",
    bundle: true, platform: "node", format: "cjs", target: "node22",
    external: ["firebase-admin/*", "node:*"],
    plugins: [{ name: "admin-adapter", setup(builder) {
        builder.onResolve({ filter: /^firebase\/firestore$/ }, () => ({ path: "../src/firestoreAdapter.cjs", external: true }));
        builder.onResolve({ filter: /lib\/firebase\/firestore$/ }, () => ({ path: "../src/firestore.cjs", external: true }));
        builder.onResolve({ filter: /^\.\/financialRuntime$/ }, () => ({ path: path.join(root, "functions/src/financialRuntime.cjs") }));
    } }],
});
