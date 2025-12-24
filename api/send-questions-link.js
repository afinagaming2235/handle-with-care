import nodemailer from "nodemailer";
import crypto from "crypto";

const ALLOWED_EMAIL = "202510576@gordoncollege.edu.ph";
const TOKEN_TTL_SECONDS = 60 * 60;

function norm(v) {
  return String(v || "").trim().toLowerCase().replace(/\s+/g, " ");
}

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
  try {
    if (req.method !== "POST") return res.status(405).end();

    const TOKEN_SECRET = process.env.TOKEN_SECRET;
    const APP_URL = process.env.APP_URL;
    if (!TOKEN_SECRET || !APP_URL) return res.status(500).json({ ok: false, reason: "server_misconfigured" });

    const { email } = req.body || {};
    const safeEmail = norm(email);

    if (safeEmail !== ALLOWED_EMAIL) return res.status(403).json({ ok: false, reason: "email_denied" });

    // stage=questions (new link)
    const exp = Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS;
    const payloadObj = { email: safeEmail, exp, stage: "questions" };
    const payload = base64url(JSON.stringify(payloadObj));
    const sig = sign(payload, TOKEN_SECRET);
    const token = `${payload}.${sig}`;

    const questionsUrl = `${APP_URL.replace(/\/$/, "")}/questions.html?token=${encodeURIComponent(token)}`;

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 465),
      secure: String(process.env.SMTP_SECURE || "true") === "true",
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
    });

    await transporter.sendMail({
      from: `"Private" <${process.env.MAIL_FROM || process.env.SMTP_USER}>`,
      to: ALLOWED_EMAIL,
      subject: "Continue (Questions)",
      text: `You may continue here:\n\n${questionsUrl}\n`
    });

    return res.json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, reason: "mail_failed" });
  }
}
