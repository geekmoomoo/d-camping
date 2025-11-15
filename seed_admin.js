import fs from "fs";
import admin from "firebase-admin";

// serviceAccountKey.json 읽기
const serviceAccount = JSON.parse(
  fs.readFileSync("./serviceAccountKey.json", "utf8")
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function seed() {
  console.log("⏳ Firestore admin seeding 시작...");

  const sites = [
    {
      id: "A1",
      type: "self-caravan",
      name: "*A1* 자가 카라반 사이트 / 차박 가능",
      zone: "*A1*",
      carOption: "차박 가능",
      price: 50000,
      remain: 2,
      image: "/site_img/site_001.jpg",
    },
    {
      id: "A2",
      type: "cabana-deck",
      name: "*A2* 카바나 데크 사이트 / 차박 불가",
      zone: "*A2*",
      carOption: "차박 불가",
      price: 55000,
      remain: 3,
      image: "/site_img/site_002.jpg",
    },
  ];

  const batch = db.batch();
  const colRef = db.collection("sites");

  sites.forEach((site) => {
    const docRef = colRef.doc(site.id);
    batch.set(docRef, site);
  });

  await batch.commit();

  console.log("✅ Firestore admin seeding 완료!");
}

seed().catch((err) => console.error(err));
