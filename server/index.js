import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fetch from "node-fetch";
import admin from "firebase-admin";
import { readFileSync } from "fs";

dotenv.config();

// 🔥 Firebase service account 로딩
const serviceAccount = JSON.parse(
  readFileSync(new URL("./serviceAccountKey.json", import.meta.url))
);

// 🔥 Firebase Admin 초기화
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: "damyang-camping",
  });
}

const db = admin.firestore();

// 🔥 Express 서버 생성 (⚠️ app.post 사용 전에 반드시 있어야 함!)
const app = express();
app.use(cors());
app.use(express.json());



const reservationsRef = db.collection("reservations");
const SECRET_KEY = process.env.TOSS_SECRET_KEY;

const ensureSecretKey = () => {
  if (!SECRET_KEY) {
    const err = new Error("TOSS_SECRET_KEY missing");
    err.status = 500;
    throw err;
  }
};

const normalizePhone = (value) =>
  String(value || "").replace(/[^0-9]/g, "");

app.post("/api/payments/ready", async (req, res) => {
  try {
    const {
      reservationId,
      successUrl,
      failUrl,
      amount,
      customerName,
      customerEmail,
    } = req.body;

    console.log("[/api/payments/ready req.body]", req.body);

    if (!reservationId || !successUrl || !failUrl || typeof amount !== "number") {
      return res.status(400).json({
        error: "reservationId, successUrl, failUrl, amount required",
      });
    }

    ensureSecretKey();

    const orderId = `${reservationId}_${Date.now()}`;
    const payload = {
      orderId,
      orderName: "다양금성 토캠핑 예약",
      amount,
      currency: "KRW",
      successUrl,
      failUrl,
      customerName: customerName || "예약자",
      customerEmail: customerEmail || "noreply@example.com",
      flowMode: "DEFAULT",
      method: "CARD",
    };

    const response = await fetch("https://api.tosspayments.com/v1/payments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${Buffer.from(`${SECRET_KEY}:`).toString("base64")}`,
      },
      body: JSON.stringify(payload),
    });

    const rawText = await response.text();
    let data;
    try {
      data = rawText ? JSON.parse(rawText) : {};
    } catch (error) {
      return res.status(502).json({
        error: "Toss response is not JSON",
        status: response.status,
        body: rawText,
      });
    }

    if (!response.ok) {
      return res.status(response.status).json({
        error: data.error || data.message || "Toss ready error",
        detail: data,
      });
    }

    const checkoutUrl =
      data.nextRedirectUrl || data.checkoutUrl || data.checkout?.url;
    if (!checkoutUrl) {
      return res.status(500).json({
        error: "checkoutUrl missing",
        detail: data,
      });
    }

    return res.json({ checkoutUrl, orderId });
  } catch (err) {
    console.error("Toss ready error", err);
    return res.status(err.status || 502).json({ error: err.message || "Payment gateway unreachable" });
  }
});

app.post("/api/payments/confirm", async (req, res) => {
  try {
    const {
      paymentKey,
      orderId,
      amount,
      quickData = {},
      site = {},
      userInfo = {},
      extraCharge = 0,
      qa = {},
      agree = {},
    } = req.body;

    if (!paymentKey || !orderId || !amount) {
      return res.status(400).json({ error: "paymentKey, orderId, amount required" });
    }

    ensureSecretKey();

    const payload = {
      paymentKey,
      orderId,
      amount,
    };

    const response = await fetch("https://api.tosspayments.com/v1/payments/confirm", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${Buffer.from(`${SECRET_KEY}:`).toString("base64")}`,
      },
      body: JSON.stringify(payload),
    });

    const rawText = await response.text();
    let paymentData;
    try {
      paymentData = rawText ? JSON.parse(rawText) : {};
    } catch (error) {
      return res.status(502).json({
        error: "Toss confirm response is not JSON",
        status: response.status,
        body: rawText,
      });
    }

    if (!response.ok) {
      return res.status(response.status).json({
        error: paymentData.error || paymentData.message || "Toss confirm error",
        detail: paymentData,
      });
    }

    const checkIn = quickData?.checkIn;
    const checkOut = quickData?.checkOut;
    const nights =
      checkIn && checkOut
        ? Math.max(
            1,
            Math.round(
              (new Date(checkOut).getTime() - new Date(checkIn).getTime()) /
                86400000
            ) || 1
          )
        : 0;

    const qaRecord = {
      q1: Boolean(qa?.q1),
      q2: qa?.q2 ?? "0",
      q3: Boolean(qa?.q3),
      q4: Boolean(qa?.q4),
      q5: Boolean(qa?.q5),
      q6: Boolean(qa?.q6),
      q7: Boolean(qa?.q7),
      q8: Boolean(qa?.q8),
    };
    const agreeRecord = {
      a1: Boolean(agree?.a1),
      a2: Boolean(agree?.a2),
      a3: Boolean(agree?.a3),
      a4: Boolean(agree?.a4),
      a5: Boolean(agree?.a5),
    };
    const record = {
      reservationId: orderId,
      siteId: site?.id ?? "",
      siteType: site?.type ?? "",
      people: quickData?.people ?? 1,
      checkIn: checkIn || "",
      checkOut: checkOut || "",
      nights,
      totalAmount: Number(amount),
      extraCharge: Number(extraCharge ?? 0),
      userName: userInfo?.name || "",
      userPhone: userInfo?.phone || "",
      userEmail: userInfo?.email || "",
      request: userInfo?.request || "",
      status: "PAID",
      agree: agreeRecord,
      qa: qaRecord,
      payment: paymentData,
      createdAt: new Date().toISOString(),
    };

    await reservationsRef.doc(orderId).set(record, { merge: true });

    return res.json({ success: true, reservationId: orderId, record, payment: paymentData });
  } catch (err) {
    console.error("Toss confirm error", err);
    return res.status(502).json({
      error: err.message || "Payment confirmation failed",
      detail: err.detail || null,
    });
  }
});

app.get("/api/reservations/search", async (req, res) => {
  try {
    const { name = "", phone = "", reservationId = "" } = req.query;
    const snapshot = await reservationsRef.get();
    const normalizedSearchPhone = normalizePhone(phone);
    const matches = [];

    snapshot.forEach((doc) => {
      const data = doc.data();
      const matchesId = reservationId
        ? doc.id.toLowerCase().includes(reservationId.toLowerCase())
        : true;
      const matchesName = name
        ? String(data.userName || "").toLowerCase().includes(name.toLowerCase())
        : true;
      const matchesPhone = normalizedSearchPhone
        ? normalizePhone(data.userPhone).includes(normalizedSearchPhone)
        : true;

      if (matchesId && matchesName && matchesPhone) {
        matches.push({ reservationId: doc.id, ...data });
      }
    });

    return res.json(matches);
  } catch (err) {
    console.error("reservation search error", err);
    return res.status(500).json({ error: "Failed to search reservations" });
  }
});

app.get("/api/health", (req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Payments proxy running on http://localhost:${PORT}`);
});
