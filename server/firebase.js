// server/firebase.js
const admin = require("firebase-admin");
const path = require("path");

// 1) 서비스 계정 JSON 경로
const serviceAccountPath = path.join(__dirname, "serviceAccountKey.json");
console.log("[firebase] service account path:", serviceAccountPath);

// 2) JSON 로드
const serviceAccount = require(serviceAccountPath);

// 3) firebase-admin 초기화 (이미 초기화돼 있으면 재사용)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: serviceAccount.project_id,
      clientEmail: serviceAccount.client_email,
      // private_key에 \n이 이스케이프되어 있을 때를 위해 치환
      privateKey: serviceAccount.private_key.replace(/\\n/g, "\n"),
    }),
  });
  console.log("[firebase] firebase-admin initialized with service account");
} else {
  console.log("[firebase] firebase-admin already initialized, reusing app");
}

// 4) Firestore 핸들러 export
const db = admin.firestore();

module.exports = {
  admin,
  db,
};
