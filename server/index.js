import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

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

    const secretKey = process.env.TOSS_SECRET_KEY;
    if (!secretKey) {
      return res.status(500).json({ error: "TOSS_SECRET_KEY missing" });
    }

    const orderId = `${reservationId}_${Date.now()}`;
    console.log(
      "[payments.ready computed]",
      "reservationId:",
      reservationId,
      "orderId:",
      orderId,
      "amount:",
      amount,
      "amount_type:",
      typeof amount,
      "isNaN(amount):",
      Number.isNaN(amount)
    );

    // ✅ extra, checkoutOptions 빼고 최소 필드 + flowMode/method만 사용
    const payload = {
      orderId,
      orderName: "담양금성산성오토캠핑장 예약",
      amount,
      currency: "KRW",
      successUrl,
      failUrl,
      customerName: customerName || "예약자",
      customerEmail: customerEmail || "noreply@example.com",
      flowMode: "DEFAULT",
      method: "CARD",
    };
    console.log("[Toss payload object]", payload);
    console.log("[Toss payload JSON]", JSON.stringify(payload));

    const response = await fetch("https://api.tosspayments.com/v1/payments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${Buffer.from(`${secretKey}:`).toString("base64")}`,
      },
      body: JSON.stringify(payload),
    });

    const rawText = await response.text();
    console.log("[Toss Ready 응답 status]", response.status);
    console.log("[Toss Ready 응답 raw body]", rawText);

    let data;
    try {
      data = rawText ? JSON.parse(rawText) : {};
    } catch (err) {
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
    console.error("Toss ready network/server error", err);
    return res.status(502).json({ error: "Payment gateway unreachable" });
  }
});

app.get("/api/health", (req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Payments proxy running on http://localhost:${PORT}`);
});
