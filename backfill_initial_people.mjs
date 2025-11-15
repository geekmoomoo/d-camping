import dotenv from "dotenv";
import admin from "firebase-admin";
import { readFileSync } from "fs";
import path from "path";

dotenv.config();

const serviceAccountPath = path.resolve("server", "serviceAccountKey.json");
const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, "utf-8"));

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: "damyang-camping",
  });
}

const db = admin.firestore();

async function backfillInitialPeople() {
  const reservationsRef = db.collection("reservations");
  const snapshot = await reservationsRef.get();
  const updates = [];

  snapshot.forEach((doc) => {
    const data = doc.data();
    if (data?.initialPeople != null) return;
    const quickPeople = data?.quickData?.people;
    const fallback = data?.people ?? quickPeople ?? 1;
    updates.push(
      doc.ref.update({
        initialPeople: fallback,
      })
    );
  });

  const results = await Promise.allSettled(updates);
  const successCount = results.filter((res) => res.status === "fulfilled").length;
  console.log(
    `Processed ${snapshot.size} reservations, added initialPeople to ${successCount} docs.`
  );
}

backfillInitialPeople()
  .then(() => {
    console.log("Backfill complete.");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Backfill failed:", err);
    process.exit(1);
  });
