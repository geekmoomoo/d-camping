import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fetch from "node-fetch";
import admin from "firebase-admin";
import { readFileSync } from "fs";

const rootEnvPath = new URL("../.env", import.meta.url);
dotenv.config({ path: rootEnvPath });
dotenv.config({ path: new URL("./.env", import.meta.url), override: true });

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
const sitesRef = db.collection("sites");
const SECRET_KEY = process.env.TOSS_SECRET_KEY;
const USE_FAKE_TOSS_CONFIRM = process.env.USE_FAKE_TOSS_CONFIRM === "true";

const ensureSecretKey = () => {
  if (!SECRET_KEY) {
    const err = new Error("TOSS_SECRET_KEY missing");
    err.status = 500;
    throw err;
  }
};

const normalizePhone = (value) =>
  String(value || "").replace(/[^0-9]/g, "");

const calcDaysBeforeCheckIn = (checkIn) => {
  if (!checkIn) return null;
  const now = new Date();
  const checkInDate = new Date(`${checkIn}T00:00:00`);
  const msPerDay = 24 * 60 * 60 * 1000;
  const diffMs = checkInDate.getTime() - now.getTime();
  return Math.floor(diffMs / msPerDay);
};

function generateReservationId() {
  const prefix = "25";
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let random = "";
  for (let i = 0; i < 6; i++) {
    random += chars[Math.floor(Math.random() * chars.length)];
  }
  return prefix + random;
}

const parseISODate = (value) => {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
};

const diffDays = (startISO, endISO) => {
  const start = parseISODate(startISO);
  const end = parseISODate(endISO);
  if (!start || !end) {
    return 0;
  }
  const delta = end.getTime() - start.getTime();
  return Math.max(0, Math.round(delta / 86400000));
};

const padTwo = (value) => String(value).padStart(2, "0");

const compareISO = (a, b) => {
  const dateA = parseISODate(a);
  const dateB = parseISODate(b);
  if (!dateA || !dateB) return 0;
  if (dateA.getTime() > dateB.getTime()) return 1;
  if (dateA.getTime() < dateB.getTime()) return -1;
  return 0;
};

const buildMonthRange = (year, month) => {
  const y = Number(year);
  const m = Number(month);
  if (!Number.isFinite(y) || !Number.isFinite(m) || m < 1 || m > 12) {
    return null;
  }
  const start = `${y}-${padTwo(m)}-01`;
  const lastDay = new Date(y, m, 0).getDate();
  const end = `${y}-${padTwo(m)}-${padTwo(lastDay)}`;
  return { start, end, year: y, month: m };
};

const normalizeQa = (values = {}) => ({
  q1: Boolean(values.q1),
  q2: values.q2 ?? "0",
  q3: Boolean(values.q3),
  q4: Boolean(values.q4),
  q5: Boolean(values.q5),
  q6: Boolean(values.q6),
  q7: Boolean(values.q7),
  q8: Boolean(values.q8),
});

const normalizeAgree = (values = {}) => ({
  a1: Boolean(values.a1),
  a2: Boolean(values.a2),
  a3: Boolean(values.a3),
  a4: Boolean(values.a4),
  a5: Boolean(values.a5),
});

const normalizeUserInfo = (info = {}) => ({
  name: info?.name || "",
  phone: info?.phone || "",
  email: info?.email || "",
  request: info?.request || "",
});

const buildNightDates = (checkIn, checkOut) => {
  const start = parseISODate(checkIn);
  const end = parseISODate(checkOut);
  if (!start || !end || start >= end) return [];
  const dates = [];
  const cursor = new Date(start);
  while (cursor < end) {
    dates.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return dates;
};

const asNumber = (value) => {
  if (value == null) return 0;
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};

const isWeekend = (date) => {
  const day = date.getDay();
  return day === 0 || day === 6;
};

const datesOverlap = (startA, endA, startB, endB) => {
  const aStart = parseISODate(startA);
  const aEnd = parseISODate(endA);
  const bStart = parseISODate(startB);
  const bEnd = parseISODate(endB);
  if (!aStart || !aEnd || !bStart || !bEnd) return false;
  return aStart < bEnd && bStart < aEnd;
};

const hasPaidConflict = async (siteId, checkIn, checkOut) => {
  if (!siteId || !checkIn || !checkOut) return false;
  const snapshot = await reservationsRef
    .where("siteId", "==", siteId)
    .where("status", "==", "PAID")
    .get();
  let conflict = false;
  snapshot.forEach((doc) => {
    const data = doc.data();
    if (datesOverlap(data.checkIn, data.checkOut, checkIn, checkOut)) {
      conflict = true;
    }
  });
  return conflict;
};

const ensureNoPaidConflict = async (siteId, checkIn, checkOut) => {
  if (!siteId || !checkIn || !checkOut) return;
  const conflict = await hasPaidConflict(siteId, checkIn, checkOut);
  if (conflict) {
    const err = new Error("ALREADY_RESERVED");
    err.status = 409;
    throw err;
  }
};

const getDayRate = (siteData, date) => {
  if (!siteData) return 0;
  if (isWeekend(date) && siteData?.weekendPrice != null) {
    return asNumber(siteData.weekendPrice);
  }
  if (!isWeekend(date) && siteData?.weekdayPrice != null) {
    return asNumber(siteData.weekdayPrice);
  }
  if (siteData?.basePrice != null) return asNumber(siteData.basePrice);
  if (siteData?.price != null) return asNumber(siteData.price);
  if (siteData?.rate != null) return asNumber(siteData.rate);
  return 0;
};

const calculateTotalAmount = (
  siteData,
  checkIn,
  checkOut,
  people = 1,
  manualExtra = 0
) => {
  const nights = diffDays(checkIn, checkOut);
  if (nights < 1) return null;
  const dates = buildNightDates(checkIn, checkOut);
  const baseTotal = dates.reduce(
    (sum, date) => sum + getDayRate(siteData, date),
    0
  );
  const basePeople = Math.max(
    1,
    asNumber(siteData?.basePeople ?? siteData?.minPeople ?? siteData?.includedPeople ?? 1)
  );
  const peopleCount = Math.max(1, asNumber(people || basePeople));
  const extraPersonPrice = Math.max(
    0,
    asNumber(
      siteData?.extraPersonPrice ??
        siteData?.extraPerPerson ??
        siteData?.extraCharge ??
        siteData?.extraFee
    )
  );
  const extraPeople = Math.max(0, peopleCount - basePeople);
  const extraPeopleTotal = extraPersonPrice * extraPeople * nights;
  const manualExtraAmount = Math.max(0, asNumber(manualExtra));
  const totalAmount = Math.max(0, Math.round(baseTotal + extraPeopleTotal));
  return {
    amount: totalAmount,
    nights,
    peopleCount,
    baseTotal,
    extraTotal: extraPeopleTotal,
    manualExtra: manualExtraAmount,
  };
};

const getSiteById = async (siteId) => {
  if (!siteId) return null;
  const snapshot = await sitesRef.doc(siteId).get();
  if (!snapshot.exists) return null;
  return { id: snapshot.id, ...snapshot.data() };
};

app.post("/api/payments/ready", async (req, res) => {
  try {
    const {
      successUrl,
      failUrl,
      customerName,
      customerEmail,
      siteId,
      checkIn,
      checkOut,
      people,
      extraCharge = 0,
      quickData = {},
      userInfo = {},
      qa = {},
      agree = {},
    } = req.body;

    console.log("[/api/payments/ready req.body]", req.body);

    if (!successUrl || !failUrl || !siteId || !checkIn || !checkOut) {
      return res.status(400).json({
        error: "successUrl, failUrl, siteId, checkIn, checkOut required",
      });
    }

    const normalizedQa = normalizeQa(qa);
    const normalizedAgree = normalizeAgree(agree);
    const normalizedUserInfo = normalizeUserInfo(userInfo);

    ensureSecretKey();

    const siteData = await getSiteById(siteId);
    if (!siteData) {
      return res.status(404).json({ error: "SITE_NOT_FOUND" });
    }

    const calc = calculateTotalAmount(
      siteData,
      checkIn,
      checkOut,
      people ?? quickData?.people ?? 1,
      extraCharge
    );

    if (!calc) {
      return res.status(400).json({ error: "Invalid checkIn / checkOut date range" });
    }

    const reservationId = generateReservationId();
    const orderId = reservationId;
    const amount = calc.amount;
    const orderName =
      siteData?.name ||
      siteData?.zone ||
      `캠핑 예약 ${siteData?.id || siteId}`;

    const pendingRecord = {
      reservationId,
      orderId,
      status: "PENDING",
      siteId: siteData.id,
      siteName: orderName,
      siteType: siteData.type ?? "",
      siteZone: siteData.zone ?? "",
      checkIn,
      checkOut,
      nights: calc.nights,
      people: calc.peopleCount,
      initialPeople: quickData?.people ?? calc.peopleCount,
      totalAmount: amount,
      baseAmount: calc.baseTotal,
      extraPersonAmount: calc.extraTotal,
      extraCharge: calc.manualExtra,
      quickData,
      qa: normalizedQa,
      agree: normalizedAgree,
      userInfo: normalizedUserInfo,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // 🔥 pendingRecord 생성 직후 로그
    console.log("[/ready] pendingRecord", pendingRecord);

    // 🔥 Firestore에 저장 (단 1번만!)
    await reservationsRef.doc(reservationId).set(pendingRecord, { merge: true });

    // 🔥 Firestore에 실제 저장된 내용 로그
    const saved = await reservationsRef.doc(reservationId).get();
    console.log("[/ready] savedRecord", saved.data());



    const payload = {
      orderId,
      orderName,
      amount,
      currency: "KRW",
      successUrl,
      failUrl,
      customerName: customerName || userInfo?.name || "예약자",
      customerEmail: customerEmail || userInfo?.email || "noreply@example.com",
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

    return res.json({
      checkoutUrl,
      orderId,
      reservationId,
      totalAmount: amount,
      nights: calc.nights,
    });
  } catch (err) {
    console.error("Toss ready error", err);
    return res.status(err.status || 502).json({
      error: err.message || "Payment gateway unreachable",
    });
  }
});
app.post("/api/payments/confirm", async (req, res) => {
  const {
    paymentKey,
    orderId,
    amount: reportedAmount = 0,
    quickData = {},
    site = {},
    siteId,
    people: requestedPeople,
    userInfo = {},
    extraCharge = 0,
    qa = {},
    agree = {},
  } = req.body;

  console.log("[CONFIRM] body:", req.body);
  console.log("[CONFIRM] orderId:", orderId, "paymentKey:", paymentKey);

  if (!paymentKey || !orderId) {
    return res.status(400).json({ error: "paymentKey and orderId required" });
  }

  try {
    const reservationId = orderId;

    // 기존 예약 조회
    const snapshot = await reservationsRef.doc(reservationId).get();
    const existingReservation = snapshot.exists ? snapshot.data() : {};

    const pendingCheckIn =
      existingReservation.checkIn || quickData?.checkIn || "";
    const pendingCheckOut =
      existingReservation.checkOut || quickData?.checkOut || "";
    const conflictSiteId =
      existingReservation.siteId || site?.id || siteId || quickData?.siteId;

    // 이미 PAID 예약이 겹치는지 먼저 검사
    try {
      await ensureNoPaidConflict(conflictSiteId, pendingCheckIn, pendingCheckOut);
    } catch (err) {
      if (err.message === "ALREADY_RESERVED") {
        console.warn(
          "[RESERVE] already reserved:",
          conflictSiteId,
          pendingCheckIn,
          pendingCheckOut
        );
        return res.status(409).json({
          error: "ALREADY_RESERVED",
          message: "해당 기간에는 이미 예약이 완료된 사이트입니다.",
        });
      }
      throw err;
    }

    ensureSecretKey();

    const mergedQa = { ...(existingReservation.qa || {}), ...qa };
    const mergedAgree = { ...(existingReservation.agree || {}), ...agree };
    const mergedUserInfo = {
      ...(existingReservation.userInfo || {}),
      ...userInfo,
    };
    const normalizedQa = normalizeQa(mergedQa);
    const normalizedAgree = normalizeAgree(mergedAgree);
    const normalizedUserInfo = normalizeUserInfo(mergedUserInfo);

    // 최종 체크인/체크아웃/인원/추가요금 결정
    const checkIn =
      existingReservation.checkIn || quickData?.checkIn || "";
    const checkOut =
      existingReservation.checkOut || quickData?.checkOut || "";
    const peopleCount =
      existingReservation.people ??
      requestedPeople ??
      quickData?.people ??
      site?.people ??
      1;
    const extraChargeValue =
      existingReservation.extraCharge ?? extraCharge ?? 0;

    const calculatedSiteId =
      existingReservation.siteId || site?.id || siteId || quickData?.siteId;

    const siteData = await getSiteById(calculatedSiteId);

    const amountCalc =
      siteData && checkIn && checkOut
        ? calculateTotalAmount(
            siteData,
            checkIn,
            checkOut,
            peopleCount,
            extraChargeValue
          )
        : null;

    const finalAmount =
      amountCalc?.amount ??
      existingReservation.totalAmount ??
      Number(reportedAmount) ??
      0;

    const payload = {
      paymentKey,
      orderId,
      amount: finalAmount,
    };

    // 🔹 Toss confirm 호출 (또는 Fake 모드)
    let tossRes;

    if (USE_FAKE_TOSS_CONFIRM) {
      // 실제 Toss 확인 없이 바로 성공 처리
      tossRes = {
        status: "DONE",
        method: "CARD",
        easyPay: { provider: "" },
        requestedAt: new Date().toISOString(),
        approvedAt: new Date().toISOString(),
        receipt: { url: "" },
      };
    } else {
      const response = await fetch(
        "https://api.tosspayments.com/v1/payments/confirm",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Basic ${Buffer.from(`${SECRET_KEY}:`).toString("base64")}`,
          },
          body: JSON.stringify(payload),
        }
      );

      const httpStatus = response.status;
      const rawText = await response.text();

      try {
        tossRes = rawText ? JSON.parse(rawText) : {};
      } catch (error) {
        console.error("Toss confirm JSON parse error", error, rawText);
        return res.status(502).json({
          error: "Toss confirm response is not JSON",
          status: httpStatus,
          body: rawText,
        });
      }

      if (!response.ok) {
        return res.status(httpStatus).json({
          error: tossRes.error || tossRes.message || "Toss confirm error",
          detail: tossRes,
        });
      }
    }

    console.log(
      "[CONFIRM] tossRes.status:",
      tossRes.status,
      "totalAmount:",
      tossRes.totalAmount
    );

    // 동의/질문 응답 정리
    const qaRecord = normalizedQa;
    const agreeRecord = normalizedAgree;

    const resolvedStatus =
      tossRes?.status === "DONE" ? "PAID" : tossRes?.status || "PAID";

    const nights =
      amountCalc?.nights ??
      existingReservation.nights ??
      (checkIn && checkOut ? diffDays(checkIn, checkOut) : 0);

    const baseAmount =
      amountCalc?.baseTotal ?? existingReservation.baseAmount ?? 0;
    const extraPersonAmount =
      amountCalc?.extraTotal ?? existingReservation.extraPersonAmount ?? 0;
    const manualExtraAmount =
      amountCalc?.manualExtra ??
      existingReservation.extraCharge ??
      extraChargeValue;

    const siteName =
      siteData?.name ||
      existingReservation.siteName ||
      site?.name ||
      "";
    const siteTypeValue =
      siteData?.type || existingReservation.siteType || site?.type || "";
    const siteZoneValue =
      siteData?.zone || existingReservation.siteZone || site?.zone || "";
    const siteIdValue =
      siteData?.id || existingReservation.siteId || site?.id || calculatedSiteId || "";

    const paymentLog = {
      paymentKey,
      method: tossRes?.method || "CARD",
      provider: tossRes?.easyPay?.provider || "",
      easyPay: {
        provider: tossRes?.easyPay?.provider || "",
      },
      requestedAt: tossRes?.requestedAt || "",
      approvedAt: tossRes?.approvedAt || "",
      receiptUrl: tossRes?.receipt?.url || "",
    };

    const record = {
      reservationId,
      siteId: siteIdValue,
      siteName,
      siteType: siteTypeValue,
      siteZone: siteZoneValue,
      people: peopleCount,
      initialPeople:
        quickData?.people ??
        existingReservation.initialPeople ??
        peopleCount,
      checkIn: checkIn || "",
      checkOut: checkOut || "",
      nights,
      totalAmount: finalAmount,
      baseAmount,
      extraPersonAmount,
      extraCharge: manualExtraAmount,
      amountBreakdown: {
        baseAmount,
        extraPersonAmount,
        manualExtra: manualExtraAmount,
      },
      userName:
        normalizedUserInfo.name ||
        existingReservation.userName ||
        existingReservation.userInfo?.name ||
        "",
      userPhone:
        normalizedUserInfo.phone ||
        existingReservation.userPhone ||
        existingReservation.userInfo?.phone ||
        "",
      userEmail:
        normalizedUserInfo.email || existingReservation.userEmail || "",
      request:
        normalizedUserInfo.request ||
        existingReservation.request ||
        existingReservation.userInfo?.request ||
        "",
      status: resolvedStatus,
      agree: agreeRecord,
      qa: qaRecord,
      payment: paymentLog,
      quickData: quickData || existingReservation.quickData || {},
      userInfo: normalizedUserInfo,
      createdAt: existingReservation.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      await reservationsRef.doc(reservationId).set(record, { merge: true });
      console.log("[CONFIRM] saved reservation:", reservationId);
    } catch (err) {
      console.error(
      
        "[CONFIRM] failed to save reservation:",
        reservationId,
        err
      );
      return res.status(500).json({
        error: "FAILED_TO_SAVE_RESERVATION",
        detail: err.message,
      });
    }

    return res.json({ success: true, reservationId, record, payment: paymentLog });
  } catch (err) {
    console.error("Toss confirm error", err);
    return res.status(502).json({
      error: err.message || "Payment confirmation failed",
      detail: err.detail || null,
    });
  }
});

app.get("/api/sites", async (req, res) => {
  const limitParam = parseInt(req.query.limit, 10);
  const limit = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(limitParam, 50) : 0;
  const startAfterId = req.query.startAfterId;

  try {
    let query = sitesRef.orderBy("id");
    if (startAfterId) {
      query = query.startAfter(startAfterId);
    }
    if (limit > 0) {
      query = query.limit(limit + 1);
    }

    const snapshot = await query.get();
    let docs = snapshot.docs;
    let hasMore = false;
    if (limit > 0 && docs.length > limit) {
      hasMore = true;
      docs = docs.slice(0, limit);
    }

    const sites = docs.map((doc) => {
      const data = doc.data() || {};
      const normalized = { id: doc.id, ...data };
      if (data?.id && data.id !== doc.id) {
        normalized.sourceId = data.id;
      }
      return normalized;
    });

    const lastDoc = docs[docs.length - 1];
    const nextStartAfter =
      hasMore && lastDoc
        ? lastDoc.data()?.id || lastDoc.id
        : null;

    return res.json({
      sites,
      hasMore,
      nextStartAfter,
    });
  } catch (err) {
    console.error("[SITES] list error:", err);
    return res.status(500).json({ error: "FAILED_TO_FETCH_SITES" });
  }
});

app.get("/api/reservations/availability", async (req, res) => {
  const { siteId, checkIn, checkOut } = req.query;
  if (!siteId || !checkIn || !checkOut) {
    return res
      .status(400)
      .json({ error: "siteId, checkIn, checkOut required" });
  }

  try {
    const conflict = await hasPaidConflict(siteId, checkIn, checkOut);
    return res.json({
      siteId,
      checkIn,
      checkOut,
      available: !conflict,
      conflict,
    });
  } catch (err) {
    console.error("[AVAILABILITY] error:", err);
    return res
      .status(500)
      .json({ error: "FAILED_TO_CHECK_AVAILABILITY" });
  }
});

app.get("/api/reservations/disabled-dates", async (req, res) => {
  const { siteId, year, month } = req.query;
  if (!siteId || !year || !month) {
    return res
      .status(400)
      .json({ error: "siteId, year, month required" });
  }
  const range = buildMonthRange(year, month);
  if (!range) {
    return res.status(400).json({ error: "Invalid year or month" });
  }

  try {
    const snapshot = await reservationsRef
      .where("siteId", "==", siteId)
      .where("status", "==", "PAID")
      .get();
    const disabledCheckInDates = new Set();
    snapshot.forEach((doc) => {
      const data = doc.data();
      if (data?.checkIn) {
        if (
          compareISO(data.checkIn, range.start) >= 0 &&
          compareISO(data.checkIn, range.end) <= 0
        ) {
          disabledCheckInDates.add(data.checkIn);
        }
      }
    });
    return res.json({
      siteId,
      year: range.year,
      month: range.month,
      disabledCheckInDates: Array.from(disabledCheckInDates).sort(),
    });
  } catch (err) {
    console.error("[DISABLED-DATES] error:", err);
    return res
      .status(500)
      .json({ error: "FAILED_TO_FETCH_DISABLED_DATES" });
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

app.post("/api/reservations/lookup", async (req, res) => {
  try {
    const { reservationId, phone } = req.body || {};
    if (!reservationId || !phone) {
      return res.status(400).json({ error: "RESERVATION_ID_AND_PHONE_REQUIRED" });
    }

    const normalizedInput = normalizePhone(phone);
    if (!normalizedInput) {
      return res.status(400).json({ error: "INVALID_PHONE" });
    }

    const docRef = reservationsRef.doc(reservationId);
    const snap = await docRef.get();
    if (!snap.exists) {
      return res.status(404).json({ error: "NOT_FOUND" });
    }

    const data = snap.data() || {};
    const savedPhone = data.userInfo?.phone || data.userPhone || "";
    const normalizedSaved = normalizePhone(savedPhone);

    if (!normalizedSaved || normalizedSaved !== normalizedInput) {
      return res.status(403).json({ error: "PHONE_MISMATCH" });
    }

    return res.json({
      reservationId: docRef.id,
      reservation: { reservationId: docRef.id, ...data },
    });
  } catch (err) {
    console.error("[POST /api/reservations/lookup] error:", err);
    return res.status(500).json({ error: "LOOKUP_FAILED" });
  }
});

app.get("/api/reservations/:reservationId", async (req, res) => {
  const { reservationId } = req.params;
  if (!reservationId) {
    return res.status(400).json({ error: "reservationId required" });
  }

  console.log("[GET /api/reservations] reservationId:", reservationId);

  try {
    const snapshot = await reservationsRef
      .where("reservationId", "==", reservationId)
      .limit(1)
      .get();

    if (snapshot.empty) {
      console.warn("[GET /api/reservations] not found:", reservationId);
      return res.status(404).json({ error: "NOT_FOUND" });
    }

    const doc = snapshot.docs[0];
    const data = doc.data();
    return res.json(data);
  } catch (err) {
    console.error("[GET /api/reservations] error for:", reservationId, err);
    return res.status(500).json({ error: "INTERNAL_ERROR" });
  }
});

// ===== 환불/취소 요청 API (기록만, 실제 환불 X) =====
app.post("/api/inquiries", async (req, res) => {
  try {
    const { name, phone, category, message } = req.body;
    if (!name || !phone || !message) {
      return res.status(400).json({ error: "MISSING_INQUIRY_FIELDS" });
    }

    const nowIso = new Date().toISOString();
    const docRef = db.collection("inquiries").doc();
    await docRef.set({
      name,
      phone,
      category: category || "GENERAL",
      message,
      source: "frontend",
      createdAt: nowIso,
    });

    return res.json({ ok: true, inquiryId: docRef.id });
  } catch (err) {
    console.error("[POST /api/inquiries] error", err);
    return res.status(500).json({ error: "INTERNAL_ERROR" });
  }
});

app.post("/api/refunds", async (req, res) => {
  try {
    const { reservationId, phone, reason, causeType = "GUEST" } = req.body;

    if (!reservationId || !phone) {
      return res.status(400).json({ error: "MISSING_PARAMS" });
    }

    const docRef = db.collection("reservations").doc(reservationId);
    const snap = await docRef.get();

    if (!snap.exists) {
      return res.status(404).json({ error: "RESERVATION_NOT_FOUND" });
    }

    const data = snap.data();

    const savedPhone = data.userInfo?.phone;
    if (!savedPhone) {
      return res.status(400).json({ error: "MISSING_SAVED_PHONE" });
    }

    const normalizedSaved = normalizePhone(savedPhone);
    const normalizedInput = normalizePhone(phone);

    if (!normalizedSaved || normalizedSaved !== normalizedInput) {
      return res.status(403).json({ error: "PHONE_MISMATCH" });
    }

    if (data.status !== "PAID") {
      return res.status(400).json({
        error: "NOT_REFUNDABLE_STATUS",
        status: data.status,
      });
    }

    const checkIn = data.checkIn;
    if (!checkIn) {
      return res.status(400).json({ error: "MISSING_CHECKIN" });
    }

    const daysBefore = calcDaysBeforeCheckIn(checkIn);
    const nowIso = new Date().toISOString();

    await docRef.set(
      {
        cancelRequest: {
          requestedAt: nowIso,
          reason: reason || "",
          causeType,
          daysBeforeCheckIn: daysBefore,
          status: "REQUESTED",
        },
      },
      { merge: true }
    );

    const updated = (await docRef.get()).data();

    return res.json({
      ok: true,
      reservation: updated,
    });
  } catch (err) {
    console.error("[POST /api/refunds] error", err);
    return res.status(500).json({ error: "INTERNAL_ERROR" });
  }
});

app.get("/api/health", (req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Payments proxy running on http://localhost:${PORT}`);
});
