import nodemailer from "nodemailer";
import crypto from "crypto";

const ALLOWED_EMAIL = "202510576@gordoncollege.edu.ph";
const TOKEN_TTL_SECONDS = 60 * 60; // 1 hour

function norm(v) {
  return String(v || "").trim().toLowerCase();
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
  console.log("SEND QUESTIONS LINK HIT");

  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, reason: "method_not_allowed" });
  }

  try {
    const {
      TOKEN_SECRET,
      APP_URL,
      SMTP_HOST,
      SMTP_PORT,
      SMTP_SECURE,
      SMTP_USER,
      SMTP_PASS,
      MAIL_FROM
    } = process.env;

    if (
      !TOKEN_SECRET ||
      !APP_URL ||
      !SMTP_HOST ||
      !SMTP_PORT ||
      !SMTP_USER ||
      !SMTP_PASS
    ) {
      console.error("Missing env vars");
      return res.status(500).json({
        ok: false,
        reason: "server_misconfigured"
      });
    }

    const { email } = req.body || {};
    const safeEmail = norm(email);

    if (safeEmail !== ALLOWED_EMAIL) {
      return res.status(403).json({ ok: false, reason: "email_denied" });
    }

    // create token (stage = questions)
    const exp = Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS;
    const payloadObj = { email: safeEmail, exp, stage: "questions" };
    const payload = base64url(JSON.stringify(payloadObj));
    const sig = sign(payload, TOKEN_SECRET);
    const token = `${payload}.${sig}`;

    const questionsUrl =
      `${APP_URL.replace(/\/$/, "")}/song.html?token=${encodeURIComponent(token)}`;

    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT),
      secure: String(SMTP_SECURE) === "true",
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS
      }
    });

    await transporter.sendMail({
      from: `"Private" <${MAIL_FROM || SMTP_USER}>`,
      to: ALLOWED_EMAIL,
      subject: "One question. Ten minutes.",
      text: `Answer before time runs out:\n\n${questionsUrl}\n`
    });

    return res.json({ ok: true });
  } catch (err) {
    console.error("MAIL ERROR:", err);
    return res.status(500).json({ ok: false, reason: "mail_failed" });
  }
}
