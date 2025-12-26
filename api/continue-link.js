import nodemailer from "nodemailer";
import crypto from "crypto";

/* ======================
   CONFIG
====================== */
const ALLOWED_EMAIL = "202510576@gordoncollege.edu.ph";
const TOKEN_TTL_SECONDS = 60 * 60; // 1 hour

/* ======================
   HELPERS
====================== */
function base64url(input) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function base64urlToString(b64url) {
  const b64 = b64url.replace(/-/g, "+").replace(/_/g, "/");
  const pad = b64.length % 4 ? "=".repeat(4 - (b64.length % 4)) : "";
  return Buffer.from(b64 + pad, "base64").toString("utf8");
}

function sign(data, secret) {
  return crypto
    .createHmac("sha256", secret)
    .update(data)
    .digest("base64url");
}

/* ======================
   API HANDLER
====================== */
export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ ok: false, reason: "method_not_allowed" });
    }

    const TOKEN_SECRET = process.env.TOKEN_SECRET;
    const APP_URL = process.env.APP_URL;

    if (!TOKEN_SECRET || !APP_URL) {
      return res.status(500).json({ ok: false, reason: "server_misconfigured" });
    }

    /* ======================
       VALIDATE INCOMING TOKEN (FROM LINK #1)
    ====================== */
    const { token } = req.body || {};

    if (!token || !token.includes(".")) {
      return res.status(403).json({ ok: false, reason: "missing_token" });
    }

    const [payload, sig] = token.split(".");
    const expectedSig = sign(payload, TOKEN_SECRET);

    if (sig !== expectedSig) {
      return res.status(403).json({ ok: false, reason: "invalid_signature" });
    }

    let payloadObj;
    try {
      payloadObj = JSON.parse(base64urlToString(payload));
    } catch {
      return res.status(403).json({ ok: false, reason: "invalid_payload" });
    }

    const now = Math.floor(Date.now() / 1000);

    if (!payloadObj.exp || now > payloadObj.exp) {
      return res.status(403).json({ ok: false, reason: "expired" });
    }

    if (
      String(payloadObj.email || "").toLowerCase() !== ALLOWED_EMAIL
    ) {
      return res.status(403).json({ ok: false, reason: "email_denied" });
    }

    if (payloadObj.stage !== "song") {
      return res.status(403).json({ ok: false, reason: "wrong_stage" });
    }

    /* ======================
       CREATE SECOND TOKEN (stage: continue)
    ====================== */
    const newExp = Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS;

    const newPayload = {
      email: ALLOWED_EMAIL,
      exp: newExp,
      stage: "continue"
    };

    const encodedPayload = base64url(JSON.stringify(newPayload));
    const newSig = sign(encodedPayload, TOKEN_SECRET);
    const newToken = `${encodedPayload}.${newSig}`;

    const continueUrl =
      `${APP_URL.replace(/\/$/, "")}/continue.html?token=${encodeURIComponent(newToken)}`;

    /* ======================
       SEND EMAIL #2
    ====================== */
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 465),
      secure: String(process.env.SMTP_SECURE || "true") === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    await transporter.sendMail({
      from: `"Private" <${process.env.MAIL_FROM || process.env.SMTP_USER}>`,
      to: ALLOWED_EMAIL,
      subject: "You may continue",
      text:
`You made it this far.

This is the next part.

Open it when you’re ready:
${continueUrl}

—`
    });

    return res.json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, reason: "mail_failed" });
  }
}
