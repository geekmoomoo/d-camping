require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { db } = require('./firebase');

// ---------------- 요금 계산 상수/헬퍼 ----------------

function isWeekendInOffSeason(day) {
  // 비수기: 금, 토만 주말
  return day === 5 || day === 6;
}

function isWeekendInPeakSeason(day) {
  // 성수기: 금, 토 (공휴일 전날 등은 나중에 확장)
  return day === 5 || day === 6;
}

async function isPeakDate(dateStr) {
  const snap = await db.collection('peakDates').doc(dateStr).get();
  if (!snap.exists) return false;
  const data = snap.data() || {};
  return !!data.isPeak;
}

function enumerateNights(checkIn, checkOut) {
  const nights = [];
  let cur = new Date(checkIn + 'T00:00:00+09:00');
  const end = new Date(checkOut + 'T00:00:00+09:00');

  while (cur < end) {
    const y = cur.getFullYear();
    const m = String(cur.getMonth() + 1).padStart(2, '0');
    const d = String(cur.getDate()).padStart(2, '0');
    nights.push(`${y}-${m}-${d}`);
    cur.setDate(cur.getDate() + 1);
  }
  return nights;
}

async function getNightPriceForDate(site, dateStr) {
  const date = new Date(dateStr + 'T00:00:00+09:00');
  const day = date.getDay();
  const isPeak = await isPeakDate(dateStr);
  const isSunday = day === 0;

  if (isPeak) {
    if (!isSunday && isWeekendInPeakSeason(day)) {
      return Number(site.pricePeakWeekend || 0);
    }
    return Number(site.pricePeakWeekday || 0);
  }

  if (!isSunday && isWeekendInOffSeason(day)) {
    return Number(site.priceOffWeekend || 0);
  }
  return Number(site.priceOffWeekday || 0);
}

async function calculateTotalAmountForStay(site, checkIn, checkOut) {
  const nights = enumerateNights(checkIn, checkOut);
  let total = 0;
  const breakdown = [];

  for (const dateStr of nights) {
    const price = await getNightPriceForDate(site, dateStr);
    breakdown.push({ date: dateStr, price });
    total += price;
  }

  return { totalAmount: total, breakdown };
}

const app = express();
const PORT = process.env.PORT || 4000;

app.use(
  cors({
    origin: 'http://localhost:5173',
    credentials: true,
  })
);
app.use(express.json());

let reservations = [];
let reservationSeq = 1;

function normalizePhone(value) {
  return String(value || '').replace(/[-\s]/g, '');
}

function generateReservationId() {
  const now = new Date();
  const year = String(now.getFullYear()).slice(-2);
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let rand = '';
  for (let i = 0; i < 6; i += 1) {
    rand += chars[Math.floor(Math.random() * chars.length)];
  }
  return `${year}${rand}`;
}

function createReservation(data) {
  let id = generateReservationId();
  if (reservations.find((r) => r.id === id)) {
    id = generateReservationId();
  }

  const reservation = {
    id,
    createdAt: now.toISOString(),
    status: 'PENDING_PAYMENT',
    ...data,
  };

  reservations.push(reservation);
  return reservation;
}

function findReservationById(id) {
  return reservations.find((r) => r.id === id) || null;
}

function findReservationsByPhone(phone) {
  if (!phone) return [];
  const target = normalizePhone(phone);

  return reservations.filter((r) => {
    const stored = normalizePhone(
      r.customerPhone || (r.userInfo && r.userInfo.phone) || ''
    );
    return stored === target;
  });
}

app.get('/api/health', (req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

app.get('/api/sites', async (req, res) => {
  console.log('[/api/sites] request (Firestore)');

  try {
    const snapshot = await db
      .collection('sites')
      .where('isActive', '==', true)
      .get();

    const items = snapshot.docs.map((doc) => {
      const data = doc.data() || {};
      return {
        id: data.id || doc.id,
        type: data.type || null,
        name: data.name || data.id || doc.id,
        zone: data.zone || '',
        carOption: data.carOption || '',
        price:
          data.priceOffWeekday ??
          data.priceOffWeekend ??
          data.pricePeakWeekday ??
          data.pricePeakWeekend ??
          0,
        squareImg: data.squareImg || '',
        images: Array.isArray(data.images) ? data.images : [],
        stockTotal: data.stockTotal ?? 1,
        isActive: data.isActive !== false,
        basePeople: data.basePeople ?? null,
        maxPeople: data.maxPeople ?? null,
        extraPerPerson: data.extraPerPerson ?? 0,
        priceOffWeekday: data.priceOffWeekday ?? null,
        priceOffWeekend: data.priceOffWeekend ?? null,
        pricePeakWeekday: data.pricePeakWeekday ?? null,
        pricePeakWeekend: data.pricePeakWeekend ?? null,
      };
    });

    return res.json(items);
  } catch (err) {
    console.error('[/api/sites] Firestore error:', err);
    return res.status(500).json({
      code: 'FIRESTORE_ERROR',
      message: 'Failed to load sites from Firestore.',
    });
  }
});

app.post('/api/reservations', async (req, res) => {
  console.log('=== [/api/reservations] CREATE REQUEST START ===');
  console.log('body:', req.body);

  const {
    checkIn,
    checkOut,
    siteId,
    people,
    siteType,
    price,
    extraCharge,
    userInfo,
    qa,
    agree,
    customerName,
    customerPhone,
    customerEmail,
    memo,
  } = req.body || {};

  const finalName = customerName || (userInfo && userInfo.name) || '';
  const finalPhone = customerPhone || (userInfo && userInfo.phone) || '';
  const finalEmail = customerEmail || (userInfo && userInfo.email) || '';

  if (!checkIn || !checkOut || !siteId || !people || !finalName || !finalPhone) {
    console.error('[/api/reservations] missing required fields', {
      checkIn,
      checkOut,
      siteId,
      people,
      finalName,
      finalPhone,
    });
    return res.status(400).json({
      code: 'INVALID_REQUEST',
      message:
        'checkIn, checkOut, siteId, people, userInfo.name (or customerName), userInfo.phone (or customerPhone) are required.',
    });
  }

  let siteData = null;
  try {
    const snap = await db.collection('sites').doc(siteId).get();
    if (!snap.exists) {
      console.warn('[/api/reservations] site not found:', siteId);
      return res.status(400).json({
        code: 'SITE_NOT_FOUND',
        message: '해당 사이트 정보를 찾을 수 없습니다.',
      });
    }
    siteData = snap.data() || {};
  } catch (err) {
    console.error('[/api/reservations] site fetch error:', err);
    return res.status(500).json({
      code: 'SITE_FETCH_ERROR',
      message: '사이트 정보를 불러오는 중 오류가 발생했습니다.',
    });
  }

  let totalAmount = 0;
  let priceBreakdown = [];
  try {
    const result = await calculateTotalAmountForStay(siteData, checkIn, checkOut);
    totalAmount = result.totalAmount;
    priceBreakdown = result.breakdown;
  } catch (err) {
    console.error('[/api/reservations] price calc error:', err);
    return res.status(500).json({
      code: 'PRICE_CALC_ERROR',
      message: '요금 계산 중 오류가 발생했습니다.',
    });
  }

  const priceBase = typeof price !== 'undefined' ? Number(price) : null;
  const extraChargeAmount = typeof extraCharge !== 'undefined' ? Number(extraCharge) : 0;
  const finalTotalAmount = totalAmount + extraChargeAmount;

  const reservation = createReservation({
    checkIn,
    checkOut,
    siteId,
    people,
    siteType: siteType || null,
    price: priceBase,
    extraCharge: extraChargeAmount,
    userInfo: userInfo || null,
    qa: qa || null,
    agree: agree || null,
    customerName: finalName,
    customerPhone: finalPhone,
    customerEmail: finalEmail || null,
    totalAmount: finalTotalAmount,
    priceBreakdown,
    memo: memo || '',
  });

  console.log('[/api/reservations] CREATED:', reservation.id);
  console.log('=== [/api/reservations] CREATE REQUEST END ===');

  return res.status(201).json(reservation);
});

app.get('/api/reservations/search', (req, res) => {
  const phone = req.query.phone;
  console.log('=== [/api/reservations/search] REQUEST phone:', phone);

  if (!phone) {
    return res.status(400).json({
      code: 'INVALID_REQUEST',
      message: 'phone query parameter is required.',
    });
  }

  const list = findReservationsByPhone(phone);
  console.log('[/api/reservations/search] FOUND:', list.length);

  return res.json({
    total: list.length,
    items: list,
  });
});

app.get('/api/reservations/:id', (req, res) => {
  const { id } = req.params;
  console.log('=== [/api/reservations/:id] GET REQUEST ===', id);

  const reservation = findReservationById(id);
  if (!reservation) {
    console.warn('[/api/reservations/:id] NOT FOUND:', id);
    return res.status(404).json({
      code: 'NOT_FOUND',
      message: 'Reservation not found.',
    });
  }

  return res.json(reservation);
});

app.post('/api/reservations/:id/cancel-request', (req, res) => {
  const { id } = req.params;
  const { phone, reason } = req.body || {};

  console.log('=== [/api/reservations/:id/cancel-request] START ===', {
    id,
    phone,
    reason,
  });

  if (!phone) {
    return res.status(400).json({
      code: 'INVALID_REQUEST',
      message: 'phone is required.',
    });
  }

  const reservation = findReservationById(id);
  if (!reservation) {
    console.warn('[/api/reservations/:id/cancel-request] NOT FOUND:', id);
    return res.status(404).json({
      code: 'NOT_FOUND',
      message: 'Reservation not found.',
    });
  }

  const normalizedReqPhone = normalizePhone(phone);
  const normalizedResPhone = normalizePhone(
    reservation.customerPhone || (reservation.userInfo && reservation.userInfo.phone) || ''
  );

  if (!normalizedResPhone || normalizedReqPhone !== normalizedResPhone) {
    console.warn(
      '[/api/reservations/:id/cancel-request] PHONE MISMATCH',
      normalizedReqPhone,
      normalizedResPhone
    );
    return res.status(400).json({
      code: 'PHONE_MISMATCH',
      message: 'Phone number does not match the reservation.',
    });
  }

  reservation.status = 'CANCEL_REQUESTED';
  reservation.cancelRequest = {
    phone: reservation.customerPhone,
    reason: reason || '',
    requestedAt: new Date().toISOString(),
  };

  console.log(
    '[/api/reservations/:id/cancel-request] UPDATED STATUS:',
    reservation.id,
    reservation.status
  );
  console.log('=== [/api/reservations/:id/cancel-request] END ===');

  return res.json(reservation);
});

app.post('/api/payments/ready', (req, res) => {
  console.log('=== [/api/payments/ready] REQUEST START ===');
  console.log('body:', req.body);

  const { reservationId, amount, successUrl, failUrl, customerName, customerEmail } =
    req.body || {};

  if (!reservationId || typeof amount === 'undefined' || amount === null) {
    console.error('[/api/payments/ready] missing required fields', { reservationId, amount });
    return res.status(400).json({
      code: 'INVALID_REQUEST',
      message: 'reservationId and amount are required.',
    });
  }

  const reservation = findReservationById(reservationId);
  if (!reservation) {
    console.warn('[/api/payments/ready] reservation not found:', reservationId);
    return res.status(404).json({
      code: 'RESERVATION_NOT_FOUND',
      message: 'Reservation not found.',
    });
  }

  const mockOrderId = 'MOCKORDER-' + Date.now();
  const redirectUrl =
    (successUrl || 'http://localhost:5173/payment/success') +
    '?orderId=' +
    encodeURIComponent(mockOrderId) +
    '&reservationId=' +
    encodeURIComponent(reservationId);

  console.log('[/api/payments/ready] redirectUrl:', redirectUrl);
  console.log('=== [/api/payments/ready] REQUEST END ===');

  return res.json({
    redirectUrl,
    reservationId,
    amount,
    orderId: mockOrderId,
    customerName: customerName || reservation.customerName,
    customerEmail: customerEmail || reservation.customerEmail,
  });
});

// =========================
// 요금 계산 API
// =========================
app.post('/api/price/calc', async (req, res) => {
  const { site, checkIn, checkOut, people } = req.body || {};

  if (!site || !checkIn || !checkOut || typeof people === 'undefined') {
    return res.status(400).json({ message: 'Missing reservation data.' });
  }

  try {
    const { totalAmount, breakdown } = await calculateTotalAmountForStay(
      site,
      checkIn,
      checkOut
    );
    const nights = Math.max(1, breakdown.length);
    const adjustedBasePeople = Number(site.basePeople || 0);
    const extraPerPerson = Number(site.extraPerPerson || 0);
    const requestedPeople = Number(people || 0);
    const extraPeople = Math.max(0, requestedPeople - adjustedBasePeople);
    const extraFee = extraPeople * extraPerPerson * nights;
    const total = totalAmount + extraFee;

    return res.json({
      nights,
      totalBase: totalAmount,
      extraFee,
      total,
      breakdown,
    });
  } catch (err) {
    console.error('[/api/price/calc] failed to calculate price', err);
    return res.status(500).json({
      code: 'PRICE_CALC_ERROR',
      message: 'Failed to calculate price.',
    });
  }
});

app.listen(PORT, () => {
  console.log('D-Camping backend server running on http://localhost:' + PORT);
});
