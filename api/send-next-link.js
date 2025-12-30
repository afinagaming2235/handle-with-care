import nodemailer from "nodemailer";
import crypto from "crypto";

const EMAIL = "202511617@gordoncollege.edu.ph";
const TTL = 60 * 60; // 1 hour

function base64url(input) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function sign(data, secret) {
  return crypto.createHmac("sha256", secret).update(data).digest("base64url");
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const TOKEN_SECRET = process.env.TOKEN_SECRET;
  const APP_URL = process.env.APP_URL;

  if (!TOKEN_SECRET || !APP_URL) {
    return res.status(500).json({ ok: false });
  }

  const payloadObj = {
    email: EMAIL,
    stage: "continue", // 🔥 MUST MATCH continue.js
    exp: Math.floor(Date.now() / 1000) + TTL
  };

  const payload = base64url(JSON.stringify(payloadObj));
  const token = `${payload}.${sign(payload, TOKEN_SECRET)}`;

  const continueUrl =
    `${APP_URL.replace(/\/$/, "")}/continue.html?token=${encodeURIComponent(token)}`;

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 465),
    secure: true,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

  await transporter.sendMail({
    from: `"Private" <${process.env.MAIL_FROM || process.env.SMTP_USER}>`,
    to: EMAIL,
    subject: "Continue",
    text: `You may continue here:\n\n${continueUrl}`
  });

  res.json({ ok: true });
}
