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

export default function handler(req, res) {
  const TOKEN_SECRET = process.env.TOKEN_SECRET;
  if (!TOKEN_SECRET) {
    return res.status(500).json({ ok: false, reason: "missing_secret" });
  }

  const token = String(req.query.token || "");
  if (!token.includes(".")) {
    return res.status(403).json({ ok: false, reason: "bad_token" });
  }

  const [payload, sig] = token.split(".");
  if (sign(payload, TOKEN_SECRET) !== sig) {
    return res.status(403).json({ ok: false, reason: "invalid_signature" });
  }

  let data;
  try {
    data = JSON.parse(base64urlToString(payload));
  } catch {
    return res.status(403).json({ ok: false, reason: "invalid_payload" });
  }

  const now = Math.floor(Date.now() / 1000);
  if (!data.exp || now > data.exp) {
    return res.status(403).json({ ok: false, reason: "expired" });
  }

  if (String(data.email).toLowerCase() !== ALLOWED_EMAIL) {
    return res.status(403).json({ ok: false, reason: "email_denied" });
  }

  const allowedStages = ["song", "continue"];
  if (!allowedStages.includes(data.stage)) {
    return res.status(403).json({ ok: false, reason: "stage_denied" });
  }

  return res.json({ ok: true, stage: data.stage });
}
