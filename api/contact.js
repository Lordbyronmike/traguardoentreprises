const RESEND_API_URL = "https://api.resend.com/emails";
const SUBJECT_PREFIX = "Traguardo";

function asString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function parseBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body);
    } catch {
      return null;
    }
  }
  return null;
}

function buildMessagePayload({ name, email, message, sourceIp, userAgent }) {
  const nowIso = new Date().toISOString();
  const subject = `[${SUBJECT_PREFIX}] Nouveau message - ${name}`;

  const text = [
    "Nouveau message de contact (site Traguardo)",
    "",
    `Nom: ${name}`,
    `Email: ${email}`,
    "",
    "Message:",
    message,
    "",
    "---",
    `Date UTC: ${nowIso}`,
    `IP: ${sourceIp || "n/a"}`,
    `User-Agent: ${userAgent || "n/a"}`,
  ].join("\n");

  const html = `
    <h2>Nouveau message de contact (site Traguardo)</h2>
    <p><strong>Nom:</strong> ${escapeHtml(name)}</p>
    <p><strong>Email:</strong> ${escapeHtml(email)}</p>
    <p><strong>Message:</strong></p>
    <p>${escapeHtml(message).replaceAll("\n", "<br/>")}</p>
    <hr/>
    <p><strong>Date UTC:</strong> ${escapeHtml(nowIso)}</p>
    <p><strong>IP:</strong> ${escapeHtml(sourceIp || "n/a")}</p>
    <p><strong>User-Agent:</strong> ${escapeHtml(userAgent || "n/a")}</p>
  `.trim();

  return { subject, text, html };
}

function validateInput({ name, email, message }) {
  if (!name || !email || !message) return "Missing fields";
  if (name.length > 120) return "Name too long";
  if (!isValidEmail(email) || email.length > 254) return "Invalid email";
  if (message.length < 10 || message.length > 5000) return "Invalid message length";
  return "";
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const resendApiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.CONTACT_FROM_EMAIL;
  const toEmail = process.env.CONTACT_TO_EMAIL;
  if (!resendApiKey || !fromEmail || !toEmail) {
    return res.status(500).json({ error: "Server not configured" });
  }

  try {
    const rawBody = await parseBody(req);
    if (!rawBody) {
      return res.status(400).json({ error: "Invalid JSON body" });
    }

    // Honeypot anti-spam: on repond OK sans envoyer.
    if (rawBody.website) {
      return res.status(200).json({ ok: true });
    }

    const name = asString(rawBody.name);
    const email = asString(rawBody.email);
    const message = asString(rawBody.message);
    const validationError = validateInput({ name, email, message });
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const sourceIp = req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "";
    const userAgent = req.headers["user-agent"] || "";
    const mail = buildMessagePayload({ name, email, message, sourceIp, userAgent });

    const resendResponse = await fetch(RESEND_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [toEmail],
        reply_to: email,
        subject: mail.subject,
        text: mail.text,
        html: mail.html,
      }),
    });

    if (!resendResponse.ok) {
      const resendText = await resendResponse.text();
      console.error("RESEND_ERROR", resendResponse.status, resendText);
      return res.status(502).json({ error: "Email send failed" });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("CONTACT_ERROR", err);
    return res.status(500).json({ error: "Server error" });
  }
}
