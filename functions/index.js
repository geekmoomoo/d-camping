// functions/index.js  (서울 리전, 2nd gen, Express)

const express = require("express");
const cors = require("cors");

// Firebase Admin (v2 스타일)
const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");

// Cloud Functions v2 (HTTP + 글로벌 옵션)
const { onRequest } = require("firebase-functions/v2/https");
const { setGlobalOptions } = require("firebase-functions/v2");

// 🔹 서울 리전으로 글로벌 설정
setGlobalOptions({
  region: "asia-northeast3", // 서울
});

// 🔹 Firebase Admin 초기화
initializeApp();
const db = getFirestore();
const reservationsRef = db.collection("reservations");
const sitesRef = db.collection("sites");
const inquiriesRef = db.collection("inquiries");
const SECRET_KEY = process.env.TOSS_SECRET_KEY;
const USE_FAKE_TOSS_CONFIRM = process.env.USE_FAKE_TOSS_CONFIRM === "true";

const ensureSecretKey = () => {
  if (!SECRET_KEY) {
    const err = new Error("TOSS_SECRET_KEY missing");
    err.status = 500;
    throw err;
  }
};

// 🔹 Express 앱 생성
const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

const trimToNull = (value) => {
  if (typeof value !== "string") {
    return value ?? null;
  }
  const trimmed = value.trim();
  return trimmed || null;
};

const normalizePhone = (value) =>
  String(value || "").replace(/[^0-9]/g, "");

const evaluatePreCheckFlags = (data = {}) => {
  const amountBreakdown = data.amountBreakdown || {};
  const qaValues = data.qa || {};
  const agreeValues = data.agree || {};
  const cancel = data.cancelRequest || {};
  const people = data.people ?? 0;
  const initialPeople =
    data.initialPeople ??
    data.quickData?.people ??
    amountBreakdown?.people ??
    0;
  const hasQaIssue = Object.values(qaValues).some(
    (value) =>
      value === false ||
      value === "" ||
      value === null ||
      value === undefined
  );
  const hasAgreeIssue = Object.values(agreeValues).some(
    (value) => value === false
  );
  const hasRefund = cancel.status === "REQUESTED";
  const extraCharge = data.extraCharge ?? amountBreakdown.extraCharge ?? 0;
  return {
    people: {
      active: initialPeople > 0 && people > initialPeople,
      message:
        initialPeople > 0 && people > initialPeople
          ? "Guest count exceeds the initial number"
          : "",
    },
    onsite: {
      active: extraCharge > 0,
      message: extraCharge > 0 ? "On-site extra charge applied" : "",
    },
    qa: {
      active: hasQaIssue,
      message: hasQaIssue ? "QA questions are incomplete" : "",
    },
    agree: {
      active: hasAgreeIssue,
      message: hasAgreeIssue ? "Some agreements are not accepted" : "",
    },
    refund: {
      active: hasRefund,
      message: hasRefund ? "Refund requested" : "",
    },
  };
};

function eachDate(startISO, endISO) {
  const out = [];
  const cur = new Date(`${startISO}T00:00:00Z`);
  const end = new Date(`${endISO}T00:00:00Z`);

  while (cur < end) {
    const y = cur.getUTCFullYear();
    const m = String(cur.getUTCMonth() + 1).padStart(2, "0");
    const d = String(cur.getUTCDate()).padStart(2, "0");
    out.push(`${y}-${m}-${d}`);
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return out;
}

const mapAdminReservation = (doc) => {
  const data = doc.data() || {};
  const amountBreakdown = data.amountBreakdown || {};
  const extraChargeValue =
    data.extraCharge ?? amountBreakdown.extraCharge ?? 0;
  const manualExtraValue =
    amountBreakdown.manualExtra ??
    data.manualExtra ??
    amountBreakdown.onsiteManualExtra ??
    0;
  const normalizedPhone = normalizePhone(
    data.userInfo?.phone || data.phone || ""
  );
  return {
    reservationId: data.reservationId || doc.id,
    siteId: data.siteId || data.site?.id || null,
    siteName: data.siteName || data.site?.name || null,
    userName: data.userInfo?.name || data.userName || null,
    userPhone: trimToNull(data.userPhone) || null,
    userInfo: data.userInfo || null,
    phone: normalizedPhone,
    checkIn: data.checkIn || null,
    checkOut: data.checkOut || null,
    nights: data.nights ?? 0,
    people: data.people ?? null,
    status: data.status || null,
    amountBreakdown: {
      baseAmount: amountBreakdown.baseAmount ?? data.baseAmount ?? null,
      extraPersonAmount:
        amountBreakdown.extraPersonAmount ?? data.extraPersonAmount ?? 0,
      manualExtra: manualExtraValue,
      extraCharge: extraChargeValue,
      total:
        amountBreakdown.total ?? data.totalAmount ?? data.amount ?? null,
    },
    totalAmount: data.totalAmount ?? null,
    quickData: data.quickData || null,
    extraCharge: extraChargeValue,
    cancelRequest: {
      status: data.cancelRequest?.status || "NONE",
      reason: data.cancelRequest?.reason || null,
      daysBeforeCheckIn:
        data.cancelRequest?.daysBeforeCheckIn ?? null,
      requestedAt: data.cancelRequest?.requestedAt || null,
      adminNote: data.cancelRequest?.adminNote || null,
    },
    adminNotes: Array.isArray(data.adminNotes) ? data.adminNotes : [],
    preCheckFlags: evaluatePreCheckFlags(data),
    createdAt: data.createdAt || null,
    updatedAt: data.updatedAt || null,
    source: data.source || null,
};
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

const parseISODate = (value) => {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
};

const diffDays = (startISO, endISO) => {
  const start = parseISODate(startISO);
  const end = parseISODate(endISO);
  if (!start || !end) return 0;
  const delta = end.getTime() - start.getTime();
  return Math.max(0, Math.round(delta / 86400000));
};

const padTwo = (value) => String(value).padStart(2, "0");

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

const isWeekend = (date) => {
  const day = date.getDay();
  return day === 0 || day === 6;
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
    asNumber(
      siteData?.basePeople ?? siteData?.minPeople ?? siteData?.includedPeople ?? 1
    )
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
  const totalAmount = Math.max(
    0,
    Math.round(baseTotal + extraPeopleTotal + manualExtraAmount)
  );
  return {
    amount: totalAmount,
    nights,
    peopleCount,
    baseTotal,
    extraTotal: extraPeopleTotal,
    manualExtra: manualExtraAmount,
  };
};

const BLOCKING_STATUSES = new Set(["paid", "confirmed"]);

const isReservationBlockingForAvailability = (data = {}) => {
  const status = (data.status || "").toString().toLowerCase();
  return BLOCKING_STATUSES.has(status);
};

const hasPaidConflict = async (siteId, checkIn, checkOut) => {
  if (!siteId || !checkIn || !checkOut) return false;
  const snapshot = await reservationsRef
    .where("siteId", "==", siteId)
    .get();
  let conflict = false;
  snapshot.forEach((doc) => {
    const data = doc.data();
    if (!isReservationBlockingForAvailability(data)) {
      return;
    }
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

const getSiteById = async (siteId) => {
  if (!siteId) return null;
  const snapshot = await sitesRef.doc(siteId).get();
  if (!snapshot.exists) return null;
  return { id: snapshot.id, ...snapshot.data() };
};
const mapSiteDoc = (doc) => {
  const data = doc.data() || {};
  const normalized = {
    id: doc.id,
    siteId: data.siteId || doc.id,
    name: data.name || "",
    zone: data.zone || data.siteZone || "",
    type: data.type || data.siteType || "",
    baseAmount:
      data.baseAmount ?? data.price ?? data.priceOffWeekday ?? 0,
    defaultPeople: data.defaultPeople ?? data.basePeople ?? null,
    maxPeople: data.maxPeople ?? null,
    isActive: typeof data.isActive === "boolean" ? data.isActive : true,
    mainImageUrl:
      data.mainImageUrl ||
      data.squareImg ||
      data.image ||
      (Array.isArray(data.images) ? data.images[0] : "") ||
      "",
    descriptionShort: data.descriptionShort || "",
    descriptionLong: data.descriptionLong || "",
    galleryImageUrls: Array.isArray(data.galleryImageUrls)
      ? data.galleryImageUrls
      : Array.isArray(data.images)
      ? data.images
      : [],
    extraPersonAmount: data.extraPerPerson ?? null,
    carOption: data.carOption || "",
    offWeekdayAmount: data.priceOffWeekday ?? null,
    offWeekendAmount: data.priceOffWeekend ?? null,
    peakWeekdayAmount: data.pricePeakWeekday ?? null,
    peakWeekendAmount: data.pricePeakWeekend ?? null,
    productDescription: data.productDescription || "",
    noticeHighlight: data.noticeHighlight || "",
    noticeLines: Array.isArray(data.noticeLines) ? data.noticeLines : [],
    noticeHtml: data.noticeHtml || "",
  };
  return { ...data, ...normalized };
};

const isValidDate = (value) => {
  if (!value) return false;
  const date = parseISODate(value);
  return !!date;
};

const compareISO = (a, b) => {
  const dateA = parseISODate(a);
  const dateB = parseISODate(b);
  if (!dateA || !dateB) return 0;
  if (dateA.getTime() > dateB.getTime()) return 1;
  if (dateA.getTime() < dateB.getTime()) return -1;
  return 0;
};

const datesOverlap = (startA, endA, startB, endB) => {
  const aStart = parseISODate(startA);
  const aEnd = parseISODate(endA);
  const bStart = parseISODate(startB);
  const bEnd = parseISODate(endB);
  if (!aStart || !aEnd || !bStart || !bEnd) return false;
  return aStart < bEnd && bStart < aEnd;
};

const asNumber = (value) => {
  if (value == null) return 0;
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};

const getKstDateString = () => {
  const offsetMs = 9 * 60 * 60 * 1000;
  const kst = new Date(Date.now() + offsetMs);
  return kst.toISOString().slice(0, 10);
};

const INTERNAL_TYPES = ["paid", "free", "manual"];
const buildInternalAmountBreakdown = (totalAmount) => ({
  baseAmount: totalAmount,
  extraPersonAmount: 0,
  manualExtra: 0,
  extraCharge: 0,
  total: totalAmount,
});

// 1) 헬스 체크: GET /health
app.get("/health", (req, res) => {
  res.json({
    ok: true,
    message: "Firebase Functions server (Seoul) is running",
    region: "asia-northeast3",
    time: new Date().toISOString(),
  });
});

// 2) 사이트 목록: GET /sites
app.get("/sites", async (req, res) => {
  const limitParam = Number.parseInt(req.query.limit, 10);
  const limit =
    Number.isFinite(limitParam) && limitParam > 0 ? Math.min(limitParam, 50) : 0;
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
      const mapped = mapSiteDoc(doc);
      return { ...mapped, id: doc.id };
    });

    const lastDoc = docs[docs.length - 1];
    const nextStartAfter =
      hasMore && lastDoc ? lastDoc.data()?.id || lastDoc.id : null;

    return res.json({
      ok: true,
      sites,
      items: sites,
      hasMore,
      nextStartAfter,
    });
  } catch (err) {
    console.error("Error fetching sites:", err);
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// 사용자용 배너 목록: GET /banners
app.get("/banners", async (req, res) => {
  try {
    const snapshot = await db
      .collection("banners")
      .where("active", "==", true)
      .orderBy("order", "asc")
      .get();

    const items = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return res.json(items);
  } catch (err) {
    console.error("[banners] list error:", err);
    return res.status(500).json({ error: "FAILED_TO_LOAD_BANNERS" });
  }
});

async function getDisabledDatesForRange(siteId, from, to) {
  const disabled = new Set();

  const resSnap = await db
    .collection("reservations")
    .where("siteId", "==", siteId)
    .where("checkIn", "<", to)
    .where("checkOut", ">", from)
    .get();

  resSnap.forEach((doc) => {
    const r = doc.data() || {};
    const status = r.status || "PAID";
    if (status === "PAID" || status === "PENDING") {
      eachDate(r.checkIn, r.checkOut).forEach((d) => disabled.add(d));
    }
  });

  const internalSnap = await db
    .collection("internalReservations")
    .where("siteId", "==", siteId)
    .where("checkIn", "<", to)
    .where("checkOut", ">", from)
    .get();

  internalSnap.forEach((doc) => {
    const r = doc.data() || {};
    eachDate(r.checkIn, r.checkOut).forEach((d) => disabled.add(d));
  });

  return Array.from(disabled).sort();
}

// 예약 가능 조회: GET /api/reservations/availability
app.get("/reservations/availability", async (req, res) => {
  const { siteId, checkIn, checkOut } = req.query;
  if (!siteId || !checkIn || !checkOut) {
    return res
      .status(400)
      .json({ error: "siteId, checkIn, checkOut required" });
  }

  try {
    console.log("[availability] handler hit", { siteId, checkIn, checkOut });
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

app.get("/reservations/disabled-dates", async (req, res) => {
  const { siteId, from, to } = req.query;

  if (!siteId || !from || !to) {
    return res
      .status(400)
      .json({ error: "siteId, from, to query params are required" });
  }

  try {
    console.log("[disabled-dates] hit", { siteId, from, to });
    const dates = await getDisabledDatesForRange(siteId, from, to);
    return res.json({ siteId, from, to, dates });
  } catch (err) {
    console.error("[disabled-dates] error:", err);
    return res
      .status(500)
      .json({ error: "FAILED_TO_GET_DISABLED_DATES" });
  }
});

// 결제 준비: POST /payments/ready
app.post("/payments/ready", async (req, res) => {
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
      return res
        .status(400)
        .json({ error: "Invalid checkIn / checkOut date range" });
    }

    const reservationId = generateReservationId();
    const orderId = reservationId;
    const amount = calc.amount;
    const orderName =
      siteData?.name || siteData?.zone || `캠핑 예약 ${siteData?.id || siteId}`;

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

    await reservationsRef.doc(reservationId).set(pendingRecord, { merge: true });

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

app.post("/payments/confirm", async (req, res) => {
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

  if (!paymentKey || !orderId) {
    return res.status(400).json({ error: "paymentKey and orderId required" });
  }

  try {
    const reservationId = orderId;
    const snapshot = await reservationsRef.doc(reservationId).get();
    const existingReservation = snapshot.exists ? snapshot.data() : {};

    const pendingCheckIn =
      existingReservation.checkIn || quickData?.checkIn || "";
    const pendingCheckOut =
      existingReservation.checkOut || quickData?.checkOut || "";
    const conflictSiteId =
      existingReservation.siteId || site?.id || siteId || quickData?.siteId;

    await ensureNoPaidConflict(conflictSiteId, pendingCheckIn, pendingCheckOut);

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

    let tossRes;
    if (USE_FAKE_TOSS_CONFIRM) {
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
            Authorization: `Basic ${Buffer.from(`${SECRET_KEY}:`).toString(
              "base64"
            )}`,
          },
          body: JSON.stringify(payload),
        }
      );

      const rawText = await response.text();
      try {
        tossRes = rawText ? JSON.parse(rawText) : {};
      } catch (error) {
        return res.status(502).json({
          error: "Toss confirm response is not JSON",
          status: response.status,
          body: rawText,
        });
      }

      if (!response.ok) {
        return res.status(response.status).json({
          error: tossRes.error || tossRes.message || "Toss confirm error",
          detail: tossRes,
        });
      }
    }

    const updates = {
      status: "PAID",
      amountBreakdown: amountCalc
        ? {
            baseAmount: amountCalc.baseTotal,
            extraPersonAmount: amountCalc.extraTotal,
            manualExtra: amountCalc.manualExtra,
            extraCharge: extraChargeValue,
            total: finalAmount,
          }
        : existingReservation.amountBreakdown || {},
      totalAmount: finalAmount,
      people: peopleCount,
      extraCharge: extraChargeValue,
      qa: normalizedQa,
      agree: normalizedAgree,
      userInfo: normalizedUserInfo,
      updatedAt: new Date().toISOString(),
    };

    await reservationsRef.doc(reservationId).set(updates, { merge: true });

    return res.json({
      ok: true,
      payment: tossRes,
      totalAmount: finalAmount,
    });
  } catch (err) {
    console.error("Toss confirm error", err);
    return res.status(err.status || 502).json({
      error: err.message || "Payment confirmation failed",
    });
  }
});


// 관리자 배너 목록: GET /admin/banners
app.get("/admin/banners", async (req, res) => {
  try {
    const snapshot = await db
      .collection("banners")
      .orderBy("order", "asc")
      .get();

    const items = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return res.json(items);
  } catch (err) {
    console.error("[admin banners] list error:", err);
    return res.status(500).json({ error: "FAILED_TO_LIST_BANNERS" });
  }
});

// 관리자 배너 생성: POST /admin/banners
app.post("/admin/banners", async (req, res) => {
  try {
    const data = req.body;
    if (!data?.title) {
      return res.status(400).json({ error: "TITLE_REQUIRED" });
    }

    const ref = await db.collection("banners").add({
      title: data.title,
      subtitle: data.subtitle || "",
      content: data.content || "",
      imageUrl: data.imageUrl || "",
      active: typeof data.active === "boolean" ? data.active : true,
      order: typeof data.order === "number" ? data.order : 1,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return res.json({ id: ref.id });
  } catch (err) {
    console.error("[admin banners] create error:", err);
    return res.status(500).json({ error: "FAILED_TO_CREATE_BANNER" });
  }
});

// 관리자 배너 수정: PATCH /admin/banners/:id
app.patch("/admin/banners/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body || {};

    await db.collection("banners").doc(id).update({
      ...data,
      updatedAt: Date.now(),
    });

    return res.json({ id });
  } catch (err) {
    console.error("[admin banners] update error:", err);
    return res.status(500).json({ error: "FAILED_TO_UPDATE_BANNER" });
  }
});

// 관리자 배너 삭제: DELETE /admin/banners/:id
app.delete("/admin/banners/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await db.collection("banners").doc(id).delete();
    return res.json({ id });
  } catch (err) {
    console.error("[admin banners] delete error:", err);
    return res.status(500).json({ error: "FAILED_TO_DELETE_BANNER" });
  }
});

// 관리자 예약 목록: GET /admin/reservations
app.get("/admin/reservations", async (req, res) => {
  try {
    let query = reservationsRef;
    const { checkInStart, checkInEnd, siteId, name, phone, status } = req.query;
    if (status) {
      query = query.where("status", "==", status);
    }
    if (siteId) {
      query = query.where("siteId", "==", siteId);
    }
    if (checkInStart && checkInEnd) {
      const startDate = new Date(`${checkInStart}T00:00:00`);
      const endDate = new Date(`${checkInEnd}T23:59:59`);
      if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
        return res.status(400).json({ error: "INVALID_DATE_RANGE" });
      }
      if (startDate > endDate) {
        return res.status(400).json({ error: "INVALID_DATE_RANGE" });
      }
      query = query
        .where("checkIn", ">=", checkInStart)
        .where("checkIn", "<=", checkInEnd);
    } else if (checkInStart) {
      const startDate = new Date(`${checkInStart}T00:00:00`);
      if (Number.isNaN(startDate.getTime())) {
        return res.status(400).json({ error: "INVALID_DATE_RANGE" });
      }
      query = query.where("checkIn", ">=", checkInStart);
    } else if (checkInEnd) {
      const endDate = new Date(`${checkInEnd}T23:59:59`);
      if (Number.isNaN(endDate.getTime())) {
        return res.status(400).json({ error: "INVALID_DATE_RANGE" });
      }
      query = query.where("checkIn", "<=", checkInEnd);
    }

    const snapshot = await query.get();
    const normalizedFilterPhone = normalizePhone(phone);
    const filtered = snapshot.docs
      .map(mapAdminReservation)
      .filter((item) => {
        if (
          name &&
          !String(item.userInfo?.name || item.userName || "")
            .toLowerCase()
            .includes(name.toLowerCase())
        ) {
          return false;
        }
        if (
          phone &&
          normalizePhone(item.userInfo?.phone || item.phone || "").indexOf(
            normalizedFilterPhone
          ) === -1
        ) {
          return false;
        }
        return true;
      });
    return res.json({ reservations: filtered });
  } catch (err) {
    console.error("[/admin/reservations] error", err);
    return res
      .status(500)
      .json({ error: "FAILED_TO_FETCH_RESERVATIONS", detail: err.message });
  }
});

// 예약 상세: GET /reservations/:reservationId
app.get("/reservations/:reservationId", async (req, res) => {
  const { reservationId } = req.params;
  if (!reservationId) {
    return res.status(400).json({ error: "reservationId required" });
  }
  try {
    const snapshot = await reservationsRef
      .where("reservationId", "==", reservationId)
      .limit(1)
      .get();
    if (snapshot.empty) {
      return res.status(404).json({ error: "NOT_FOUND" });
    }
    const doc = snapshot.docs[0];
    return res.json(doc.data());
  } catch (err) {
    console.error("[GET /reservations] error for:", reservationId, err);
    return res.status(500).json({ error: "INTERNAL_ERROR" });
  }
});

// 관리자 오늘 일정: GET /admin/reservations/today
app.get("/admin/reservations/today", async (req, res) => {
  try {
    const targetDate = req.query.date || getKstDateString();
    const snapshot = await reservationsRef
      .where("status", "==", "PAID")
      .get();
    const allPaid = snapshot.docs.map(mapAdminReservation);
    const checkInToday = allPaid.filter((item) => item.checkIn === targetDate);
    const checkOutToday = allPaid.filter(
      (item) => item.checkOut === targetDate
    );
    const inHouseToday = allPaid.filter(
      (item) =>
        item.checkIn &&
        item.checkOut &&
        item.checkIn < targetDate &&
        item.checkOut > targetDate
    );
    return res.json({
      date: targetDate,
      checkInToday,
      checkOutToday,
      inHouseToday,
    });
  } catch (err) {
    console.error("[/admin/reservations/today] error", err);
    return res
      .status(500)
      .json({ error: "FAILED_TO_FETCH_TODAY_RESERVATIONS" });
  }
});

// 관리자 통계 요약: GET /admin/stats/summary
app.get("/admin/stats/summary", async (req, res) => {
  try {
    const { from, to } = req.query;

    if (!from || !to) {
      return res.status(400).json({ error: "MISSING_DATE_RANGE" });
    }

    const startDate = new Date(`${from}T00:00:00`);
    const endDate = new Date(`${to}T23:59:59`);

    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      return res.status(400).json({ error: "INVALID_DATE_RANGE" });
    }

    if (startDate > endDate) {
      return res.status(400).json({ error: "INVALID_DATE_RANGE" });
    }

    const snap = await reservationsRef
      .where("checkIn", ">=", from)
      .where("checkIn", "<=", to)
      .get();

    const reservations = snap.docs.map(mapAdminReservation);

    const summary = {
      totalReservations: reservations.length,
      checkInToday: 0,
      checkOutToday: 0,
      totalAmount: 0,
      refundAmount: 0,
      refundCount: 0,
      onlineAmount: 0,
    };

    reservations.forEach((r) => {
      const total = r.amountBreakdown?.total ?? 0;
      const canceled = r.cancelRequest?.status === "REQUESTED";
      summary.totalAmount += total;
      if (canceled) {
        summary.refundAmount += total;
        summary.refundCount += 1;
      }
    });

    return res.json({
      ok: true,
      range: { from, to },
      summary,
      reservations,
    });
  } catch (err) {
    console.error("[/admin/stats/summary] error:", err);
    return res.status(500).json({
      error: "FAILED_TO_FETCH_STATS",
      detail: err.message,
    });
  }
});

// 관리자 사이트 목록: GET /admin/sites
app.get("/admin/sites", async (req, res) => {
  try {
    const snapshot = await sitesRef.get();
    const sites = snapshot.docs.map(mapSiteDoc);
    return res.json({ sites });
  } catch (err) {
    console.error("[/admin/sites] error", err);
    return res.status(500).json({ error: "ADMIN_SITES_FETCH_FAILED" });
  }
});

// 관리자 내부 예약: POST /admin/internal-reservations
app.post("/admin/internal-reservations", async (req, res) => {
  const {
    siteId,
    checkIn,
    checkOut,
    people,
    internalType,
    totalAmount: rawTotal,
    adminName,
    adminId,
    internalMemo,
  } = req.body || {};
  const normalizedAdminName = (adminName || "").trim();
  if (
    !siteId ||
    !checkIn ||
    !checkOut ||
    !people ||
    !internalType ||
    !normalizedAdminName
  ) {
    return res.status(400).json({ error: "MISSING_REQUIRED_FIELDS" });
  }
  if (!isValidDate(checkIn) || !isValidDate(checkOut)) {
    return res.status(400).json({ error: "INVALID_DATE_RANGE" });
  }
  if (new Date(`${checkIn}T00:00:00`) >= new Date(`${checkOut}T00:00:00`)) {
    return res.status(400).json({ error: "CHECKIN_MUST_BE_BEFORE_CHECKOUT" });
  }
  if (!INTERNAL_TYPES.includes(internalType)) {
    return res.status(400).json({ error: "INVALID_INTERNAL_TYPE" });
  }
  const peopleCount = Number(people);
  if (!Number.isFinite(peopleCount) || peopleCount < 1) {
    return res.status(400).json({ error: "INVALID_PEOPLE_COUNT" });
  }

  let total = asNumber(rawTotal);
  if (internalType === "free") {
    total = 0;
  } else if (internalType === "manual") {
    if (rawTotal == null) {
      return res
        .status(400)
        .json({ error: "MANUAL_AMOUNT_REQUIRED_FOR_MANUAL_TYPE" });
    }
    total = asNumber(rawTotal);
  }

  const docData = {
    siteId,
    checkIn,
    checkOut,
    people: peopleCount,
    internalType,
    totalAmount: total,
    amountBreakdown: buildInternalAmountBreakdown(total),
    source: "admin",
    status: "confirmed",
    createdAt: new Date().toISOString(),
    adminInfo: {
      adminName: normalizedAdminName,
      ...(adminId ? { adminId } : {}),
    },
  };
  if (internalMemo) {
    docData.internalMemo = internalMemo.trim();
  }

  try {
    const docRef = await reservationsRef.add(docData);
    return res.status(201).json({
      id: docRef.id,
      ...docData,
    });
  } catch (err) {
    console.error("[/admin/internal-reservations] create error", err);
    return res
      .status(500)
      .json({ error: "INTERNAL_RESERVATION_CREATE_FAILED" });
  }
});

// 관리자 내부 예약 목록: GET /admin/internal-reservations
app.get("/admin/internal-reservations", async (req, res) => {
  const { siteId, type, adminName, from, to } = req.query || {};
  if (from && !isValidDate(from)) {
    return res.status(400).json({ error: "INVALID_FROM_DATE" });
  }
  if (to && !isValidDate(to)) {
    return res.status(400).json({ error: "INVALID_TO_DATE" });
  }

  try {
    let query = reservationsRef.where("source", "==", "admin");
    if (siteId) {
      query = query.where("siteId", "==", siteId);
    }
    if (type && INTERNAL_TYPES.includes(type)) {
      query = query.where("internalType", "==", type);
    }
    const snapshot = await query.get();
    const filterName = (adminName || "").trim().toLowerCase();
    const fromDate = from ? from : null;
    const toDate = to ? to : null;
    const results = snapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .filter((item) => {
        if (filterName) {
          const targetName = (item.adminInfo?.adminName || "").toLowerCase();
          if (!targetName.includes(filterName)) {
            return false;
          }
        }
        if (fromDate && toDate) {
          if (!datesOverlap(fromDate, toDate, item.checkIn, item.checkOut)) {
            return false;
          }
        } else if (fromDate) {
          if (!item.checkOut || compareISO(item.checkOut, fromDate) <= 0) {
            return false;
          }
        } else if (toDate) {
          if (!item.checkIn || compareISO(item.checkIn, toDate) >= 0) {
            return false;
          }
        }
        return true;
      });
    return res.json(results);
  } catch (err) {
    console.error("[/admin/internal-reservations] list error", err);
    return res
      .status(500)
      .json({ error: "INTERNAL_RESERVATION_LIST_FAILED" });
  }
});

// 관리자 내부 예약 수정: PUT /admin/internal-reservations/:id
app.put("/admin/internal-reservations/:id", async (req, res) => {
  const { id } = req.params;
  const body = req.body || {};
  try {
    const docRef = reservationsRef.doc(id);
    const doc = await docRef.get();
    if (!doc.exists) {
      return res.status(404).json({ error: "Reservation not found" });
    }
    const existing = doc.data() || {};
    if (existing.source !== "admin") {
      return res.status(403).json({ error: "NOT_AN_ADMIN_RESERVATION" });
    }

    const updates = {};
    const newCheckIn = body.checkIn || existing.checkIn;
    const newCheckOut = body.checkOut || existing.checkOut;
    if (newCheckIn && newCheckOut) {
      if (
        !isValidDate(newCheckIn) ||
        !isValidDate(newCheckOut) ||
        new Date(`${newCheckIn}T00:00:00`) >=
          new Date(`${newCheckOut}T00:00:00`)
      ) {
        return res.status(400).json({ error: "INVALID_DATE_RANGE" });
      }
      updates.checkIn = newCheckIn;
      updates.checkOut = newCheckOut;
    }

    if (body.people != null) {
      const peopleCount = Number(body.people);
      if (!Number.isFinite(peopleCount) || peopleCount < 1) {
        return res.status(400).json({ error: "INVALID_PEOPLE_COUNT" });
      }
      updates.people = peopleCount;
    }

    const targetInternalType = body.internalType || existing.internalType;
    if (targetInternalType && !INTERNAL_TYPES.includes(targetInternalType)) {
      return res.status(400).json({ error: "INVALID_INTERNAL_TYPE" });
    }
    if (targetInternalType) {
      updates.internalType = targetInternalType;
    }

    let total = existing.totalAmount ?? 0;
    if (body.totalAmount != null) {
      total = asNumber(body.totalAmount);
    }
    if (targetInternalType === "free") {
      total = 0;
    } else if (targetInternalType === "manual") {
      if (body.totalAmount == null && existing.internalType !== "manual") {
        return res
          .status(400)
          .json({ error: "MANUAL_AMOUNT_REQUIRED_FOR_MANUAL_TYPE" });
      }
      if (body.totalAmount == null) {
        total = asNumber(existing.totalAmount ?? 0);
      }
    }
    updates.totalAmount = total;
    updates.amountBreakdown = buildInternalAmountBreakdown(total);

    if (body.adminName != null) {
      const normalized = (body.adminName || "").trim();
      if (!normalized) {
        return res.status(400).json({ error: "ADMIN_NAME_REQUIRED" });
      }
      const existingAdminInfo = existing.adminInfo || {};
      updates.adminInfo = {
        ...existingAdminInfo,
        adminName: normalized,
        ...(body.adminId ? { adminId: body.adminId } : {}),
      };
    }

    if (body.internalMemo != null) {
      updates.internalMemo = body.internalMemo.trim();
    }

    if (body.status) {
      updates.status = body.status;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: "NO_CHANGES_PROVIDED" });
    }

    await docRef.update(updates);
    const refreshed = await docRef.get();
    return res.json({ id: refreshed.id, ...refreshed.data() });
  } catch (err) {
    console.error("[/admin/internal-reservations/:id] update error", err);
    return res
      .status(500)
      .json({ error: "INTERNAL_RESERVATION_UPDATE_FAILED" });
  }
});

// 관리자 내부 예약 삭제: DELETE /admin/internal-reservations/:id
app.delete("/admin/internal-reservations/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const docRef = reservationsRef.doc(id);
    const doc = await docRef.get();
    if (!doc.exists) {
      return res.status(404).json({ error: "Reservation not found" });
    }
    const existing = doc.data() || {};
    if (existing.source !== "admin") {
      return res.status(403).json({ error: "NOT_AN_ADMIN_RESERVATION" });
    }
    await docRef.update({
      status: "canceled",
      canceledAt: new Date().toISOString(),
    });
    return res.json({ success: true });
  } catch (err) {
    console.error("[/admin/internal-reservations/:id] delete error", err);
    return res
      .status(500)
      .json({ error: "INTERNAL_RESERVATION_DELETE_FAILED" });
  }
});

// 관리자 환불 요청: GET /admin/refund-requests
app.get("/admin/refund-requests", async (req, res) => {
  try {
    const snapshot = await reservationsRef
      .where("status", "==", "PAID")
      .where("cancelRequest.status", "==", "REQUESTED")
      .get();
    const list = snapshot.docs.map((doc) => {
      const data = doc.data() || {};
      const cancel = data.cancelRequest || {};
      const userInfo = data.userInfo || {};
      const breakdown = {
        baseAmount:
          data.amountBreakdown?.baseAmount ??
          data.baseAmount ??
          data.totalAmount ??
          null,
        totalAmount:
          data.amountBreakdown?.totalAmount ??
          data.totalAmount ??
          data.baseAmount ??
          null,
      };
      return {
        reservationId: doc.id,
        userName: userInfo.name || data.userName || null,
        userPhone: normalizePhone(userInfo.phone || data.phone || ""),
        siteId: data.siteId || (data.site && data.site.id) || null,
        siteName: data.siteName || (data.site && data.site.name) || null,
        zone:
          data.siteZone ||
          data.zone ||
          (data.site && data.site.zone) ||
          null,
        checkIn: data.checkIn || null,
        checkOut: data.checkOut || null,
        people: data.people ?? data.guests ?? null,
        amount: data.totalAmount ?? data.baseAmount ?? null,
        amountBreakdown: breakdown,
        reason: cancel.reason || null,
        requestedAt: cancel.requestedAt || null,
        daysBeforeCheckIn:
          cancel.daysBeforeCheckIn !== undefined
            ? cancel.daysBeforeCheckIn
            : null,
      };
    });
    return res.json(list);
  } catch (err) {
    console.error("[/admin/refund-requests] error", err);
    return res
      .status(500)
      .json({ error: "FAILED_TO_FETCH_REFUND_REQUESTS" });
  }
});

// 관리자 문의 목록: GET /admin/inquiries
app.get("/admin/inquiries", async (req, res) => {
  try {
    const { status, from, to } = req.query;
    let query = inquiriesRef.orderBy("createdAt", "desc");
    if (status) {
      query = query.where("status", "==", status);
    }
    if (from) {
      query = query.where("createdAt", ">=", from);
    }
    if (to) {
      query = query.where("createdAt", "<=", to);
    }
    const snapshot = await query.get();
    const items = snapshot.docs.map((doc) => {
      const data = doc.data() || {};
      return {
        id: doc.id,
        name: data.name || null,
        phone: data.phone || null,
        message: data.message || null,
        status: data.status || "OPEN",
        createdAt: data.createdAt || null,
        updatedAt: data.updatedAt || null,
        adminNote: data.adminNote || null,
      };
    });
    return res.json({ items });
  } catch (err) {
    console.error("[/admin/inquiries] error", err);
    return res.status(500).json({ error: "FAILED_TO_FETCH_INQUIRIES" });
  }
});


// 🔹 Cloud Functions v2 HTTP 트리거로 export
exports.api = onRequest(app);
