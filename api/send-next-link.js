import nodemailer from "nodemailer";
import crypto from "crypto";

const EMAIL = "202510576@gordoncollege.edu.ph";
const TTL = 60 * 60; // 1 hour

function base64url(input) {
  return Buffer.from(input).toString("base64url");
}

function sign(data, secret) {
  return crypto.createHmac("sha256", secret).update(data).digest("base64url");
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const secret = process.env.TOKEN_SECRET;
  const app = process.env.APP_URL;

  if (!secret || !app) {
    return res.status(500).json({ ok: false });
  }

  const payload = {
    email: EMAIL,
    stage: "continue", // ✅ FIXED
    exp: Math.floor(Date.now() / 1000) + TTL
  };

  const encoded = base64url(JSON.stringify(payload));
  const token = `${encoded}.${sign(encoded, secret)}`;

  const url = `${app.replace(/\/$/, "")}/continue.html?token=${token}`; // ✅ FIXED

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
    text: `You may continue here:\n\n${url}`
  });

  res.json({ ok: true });
}
