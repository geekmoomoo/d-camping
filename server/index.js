require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { db } = require('./firebase');

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

const loadPeakDates = async () => {
  const snapshot = await db.collection("peakDates").get();
  const peakDates = new Set();
  snapshot.forEach((doc) => {
    const data = doc.data() || {};
    if (data.isPeak) {
      peakDates.add(data.date);
    }
  });
  return peakDates;
};

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

app.post('/api/reservations', (req, res) => {
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
    totalAmount,
    memo,
  } = req.body || {};

  const finalName = customerName || (userInfo && userInfo.name) || '';
  const finalPhone = customerPhone || (userInfo && userInfo.phone) || '';
  const finalEmail = customerEmail || (userInfo && userInfo.email) || '';

  let amountNumber;
  if (typeof totalAmount !== 'undefined' && totalAmount !== null) {
    amountNumber = Number(totalAmount);
  } else if (typeof price !== 'undefined' || typeof extraCharge !== 'undefined') {
    amountNumber = Number(price || 0) + Number(extraCharge || 0);
  } else {
    amountNumber = 0;
  }

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

  const reservation = createReservation({
    checkIn,
    checkOut,
    siteId,
    people,
    siteType: siteType || null,
    price: typeof price !== 'undefined' ? Number(price) : null,
    extraCharge: typeof extraCharge !== 'undefined' ? Number(extraCharge) : 0,
    userInfo: userInfo || null,
    qa: qa || null,
    agree: agree || null,
    customerName: finalName,
    customerPhone: finalPhone,
    customerEmail: finalEmail || null,
    totalAmount: isNaN(amountNumber) ? 0 : amountNumber,
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
    return res.status(400).json({ message: '필수 값 누락' });
  }

  const start = new Date(checkIn);
  const end = new Date(checkOut);
  const nights = Math.max(
    1,
    Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
  );

  const peakDates = await loadPeakDates();

  const isPeak = (dateStr) => peakDates.has(dateStr);
  const isWeekend = (date) => {
    const day = date.getDay();
    return day === 0 || day === 6;
  };

  let totalBase = 0;
  for (let i = 0; i < nights; i++) {
    const current = new Date(start);
    current.setDate(start.getDate() + i);
    const dateStr = current.toISOString().slice(0, 10);
    const peak = isPeak(dateStr);
    const weekend = isWeekend(current);
    const peakWeekday = Number(site.pricePeakWeekday || 0);
    const peakWeekend = Number(site.pricePeakWeekend || 0);
    const offWeekday = Number(site.priceOffWeekday || 0);
    const offWeekend = Number(site.priceOffWeekend || 0);

    let daily = 0;
    if (peak) {
      daily = weekend ? peakWeekend : peakWeekday;
    } else {
      daily = weekend ? offWeekend : offWeekday;
    }
    totalBase += daily;
  }

  const adjustedBasePeople = Number(site.basePeople || 0);
  const extraPerPerson = Number(site.extraPerPerson || 0);
  const extraPeople = Math.max(0, people - adjustedBasePeople);
  const extraFee = extraPeople * extraPerPerson * nights;
  const total = totalBase + extraFee;

  return res.json({
    nights,
    totalBase,
    extraFee,
    total,
  });
});

app.listen(PORT, () => {
  console.log('D-Camping backend server running on http://localhost:' + PORT);
});
