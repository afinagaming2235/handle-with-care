import nodemailer from "nodemailer";
import crypto from "crypto";

const ALLOWED_EMAIL = "202510576@gordoncollege.edu.ph";

function base64urlToString(b64url) {
  const b64 = b64url.replace(/-/g, "+").replace(/_/g, "/");
  const pad = b64.length % 4 ? "=".repeat(4 - (b64.length % 4)) : "";
  return Buffer.from(b64 + pad, "base64").toString("utf8");
}

function sign(data, secret) {
  return crypto.createHmac("sha256", secret).update(data).digest("base64url");
}

function escapeHtml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatAnswersText({ hearts, answers }) {
  const lines = [];
  lines.push(`New answers received`);
  lines.push(`Hearts remaining: ${hearts}`);
  lines.push(``);
  answers.forEach((a, i) => {
    lines.push(`Q${i + 1}: ${a.question}`);
    lines.push(`Hurt: ${a.hurt ? "YES (-1)" : "NO"}`);
    lines.push(`Answer:`);
    lines.push(`${a.answer}`);
    lines.push(``);
    lines.push(`------------------------------`);
    lines.push(``);
  });
  return lines.join("\n");
}

function formatAnswersHtml({ hearts, answers }) {
  const rows = answers
    .map((a, i) => {
      const hurtBadge = a.hurt
        ? `<span style="display:inline-block;padding:4px 8px;border-radius:999px;background:#ff8aa8;color:#120717;font-weight:700;">HURT (-1)</span>`
        : `<span style="display:inline-block;padding:4px 8px;border-radius:999px;background:#9affc9;color:#120717;font-weight:700;">SAFE</span>`;

      return `
        <div style="padding:14px 14px;border:1px solid rgba(255,255,255,0.15);border-radius:12px;margin:12px 0;background:rgba(255,255,255,0.03);">
          <div style="font-size:13px;opacity:0.8;margin-bottom:6px;">Q${i + 1}</div>
          <div style="font-size:16px;font-weight:700;margin-bottom:8px;">${escapeHtml(a.question)}</div>
          <div style="margin-bottom:10px;">${hurtBadge}</div>
          <div style="white-space:pre-wrap;line-height:1.6;font-size:14px;">${escapeHtml(a.answer)}</div>
        </div>
      `;
    })
    .join("");

  return `
    <div style="font-family:Georgia,serif;background:#120717;color:#f1e9f4;padding:18px;border-radius:14px;">
      <div style="font-size:18px;font-weight:800;margin-bottom:6px;">New answers received</div>
      <div style="opacity:0.85;margin-bottom:14px;">Hearts remaining: <b>${escapeHtml(hearts)}</b></div>
      ${rows}
      <div style="opacity:0.7;font-size:12px;margin-top:18px;">Sent by /api/send-answers</div>
    </div>
  `;
}

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") return res.status(405).end();

    const TOKEN_SECRET = process.env.TOKEN_SECRET;
    const APP_URL = process.env.APP_URL;
    if (!TOKEN_SECRET || !APP_URL) {
      return res.status(500).json({ ok: false, reason: "server_misconfigured" });
    }

    const { token, hearts, answers } = req.body || {};

    // basic payload validation
    if (!token || typeof token !== "string" || !token.includes(".")) {
      return res.status(400).json({ ok: false, reason: "token_missing" });
    }
    if (!Array.isArray(answers)) {
      return res.status(400).json({ ok: false, reason: "answers_missing" });
    }

    // verify token signature
    const [payload, sig] = token.split(".");
    const expectedSig = sign(payload, TOKEN_SECRET);
    if (sig !== expectedSig) {
      return res.status(403).json({ ok: false, reason: "bad_signature" });
    }

    // decode payload
    let data;
    try {
      data = JSON.parse(base64urlToString(payload));
    } catch {
      return res.status(403).json({ ok: false, reason: "bad_payload" });
    }

    // expiry
    const now = Math.floor(Date.now() / 1000);
    if (!data.exp || now > data.exp) {
      return res.status(403).json({ ok: false, reason: "expired" });
    }

    // stage must be continue
    if (data.stage !== "continue") {
      return res.status(403).json({ ok: false, reason: "wrong_stage" });
    }

    // email must be allowed
    if (data.email !== ALLOWED_EMAIL) {
      return res.status(403).json({ ok: false, reason: "email_denied" });
    }

    // Build email
    const text = formatAnswersText({ hearts, answers });
    const html = formatAnswersHtml({ hearts, answers });

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 465),
      secure: String(process.env.SMTP_SECURE || "true") === "true",
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
    });

    await transporter.sendMail({
      from: `"Private" <${process.env.MAIL_FROM || process.env.SMTP_USER}>`,
      to: ALLOWED_EMAIL,
      subject: "Answers received (Continue)",
      text,
      html
    });

    return res.json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, reason: "mail_failed" });
  }
}
