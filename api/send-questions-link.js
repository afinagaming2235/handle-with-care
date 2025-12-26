import nodemailer from "nodemailer";
import crypto from "crypto";

const ALLOWED_EMAIL = "202510576@gordoncollege.edu.ph";
const TOKEN_TTL_SECONDS = 60 * 60;

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

  const exp = Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS;
  const payload = base64url(JSON.stringify({ exp, stage: "questions" }));
  const sig = sign(payload, TOKEN_SECRET);
  const token = `${payload}.${sig}`;

  const link = `${APP_URL}/questions.html?token=${token}`;

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: 465,
    secure: true,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

  await transporter.sendMail({
    from: `"Private" <${process.env.SMTP_USER}>`,
    to: ALLOWED_EMAIL,
    subject: "One question. Ten minutes.",
    text: `Answer before time runs out:\n\n${link}`
  });

  res.json({ ok: true });
}
