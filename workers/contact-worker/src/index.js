const JSON_HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store",
};

const SECURITY_HEADERS = {
  "x-content-type-options": "nosniff",
  "referrer-policy": "no-referrer",
};

function parseAllowedOrigins(env) {
  return (env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

function buildCorsHeaders(request, env) {
  const origin = request.headers.get("Origin") || "";
  const allowedOrigins = parseAllowedOrigins(env);
  const hasWildcard = allowedOrigins.includes("*");

  const headers = {
    "access-control-allow-methods": "POST, OPTIONS",
    "access-control-allow-headers": "Content-Type",
    "access-control-max-age": "86400",
    vary: "Origin",
  };

  if (hasWildcard) {
    headers["access-control-allow-origin"] = "*";
    return headers;
  }

  if (origin && allowedOrigins.includes(origin)) {
    headers["access-control-allow-origin"] = origin;
  }

  return headers;
}

function jsonResponse(status, payload, corsHeaders = {}) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      ...JSON_HEADERS,
      ...SECURITY_HEADERS,
      ...corsHeaders,
    },
  });
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

function requiredEnvPresent(env) {
  return Boolean(env.RESEND_API_KEY && env.CONTACT_FROM_EMAIL && env.CONTACT_TO_EMAIL);
}

function buildMailBody({ name, email, message, request }) {
  const ip = request.headers.get("CF-Connecting-IP") || "n/a";
  const userAgent = request.headers.get("User-Agent") || "n/a";
  const now = new Date().toISOString();

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
    `Date UTC: ${now}`,
    `IP: ${ip}`,
    `User-Agent: ${userAgent}`,
  ].join("\n");

  const html = `
    <h2>Nouveau message de contact (site Traguardo)</h2>
    <p><strong>Nom:</strong> ${escapeHtml(name)}</p>
    <p><strong>Email:</strong> ${escapeHtml(email)}</p>
    <p><strong>Message:</strong></p>
    <p>${escapeHtml(message).replaceAll("\n", "<br/>")}</p>
    <hr/>
    <p><strong>Date UTC:</strong> ${escapeHtml(now)}</p>
    <p><strong>IP:</strong> ${escapeHtml(ip)}</p>
    <p><strong>User-Agent:</strong> ${escapeHtml(userAgent)}</p>
  `.trim();

  return { text, html };
}

async function sendContactEmail(env, payload) {
  const subjectPrefix = env.CONTACT_SUBJECT_PREFIX || "Traguardo";
  const subject = `[${subjectPrefix}] Nouveau message - ${payload.name}`;
  const { text, html } = buildMailBody(payload);

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: env.CONTACT_FROM_EMAIL,
      to: [env.CONTACT_TO_EMAIL],
      reply_to: payload.email,
      subject,
      text,
      html,
    }),
  });

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`Resend HTTP ${res.status}: ${errorBody}`);
  }
}

function validatePayload(payload) {
  if (!payload || typeof payload !== "object") {
    return "Payload JSON invalide.";
  }

  const name = String(payload.name || "").trim();
  const email = String(payload.email || "").trim();
  const message = String(payload.message || "").trim();

  if (!name || !email || !message) {
    return "Champs requis manquants.";
  }
  if (name.length > 120) {
    return "Le nom est trop long.";
  }
  if (!isValidEmail(email) || email.length > 254) {
    return "Adresse email invalide.";
  }
  if (message.length < 10 || message.length > 5000) {
    return "Le message doit contenir entre 10 et 5000 caracteres.";
  }

  return "";
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const corsHeaders = buildCorsHeaders(request, env);

    if (url.pathname !== "/api/contact" && url.pathname !== "/") {
      return jsonResponse(404, { ok: false, error: "Not found" }, corsHeaders);
    }

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    if (request.method !== "POST") {
      return jsonResponse(405, { ok: false, error: "Method not allowed" }, corsHeaders);
    }

    const origin = request.headers.get("Origin") || "";
    const allowedOrigins = parseAllowedOrigins(env);
    if (
      origin &&
      allowedOrigins.length > 0 &&
      !allowedOrigins.includes("*") &&
      !allowedOrigins.includes(origin)
    ) {
      return jsonResponse(403, { ok: false, error: "Origin not allowed" }, corsHeaders);
    }

    if (!requiredEnvPresent(env)) {
      return jsonResponse(
        500,
        { ok: false, error: "Configuration serveur incomplete." },
        corsHeaders,
      );
    }

    let payload;
    try {
      payload = await request.json();
    } catch {
      return jsonResponse(400, { ok: false, error: "JSON invalide." }, corsHeaders);
    }

    // Honeypot optionnel: accepte silencieusement pour limiter le bruit spam.
    if (payload && payload.website) {
      return jsonResponse(200, { ok: true }, corsHeaders);
    }

    const validationError = validatePayload(payload);
    if (validationError) {
      return jsonResponse(400, { ok: false, error: validationError }, corsHeaders);
    }

    const sanitizedPayload = {
      name: String(payload.name).trim(),
      email: String(payload.email).trim(),
      message: String(payload.message).trim(),
      request,
    };

    try {
      await sendContactEmail(env, sanitizedPayload);
      return jsonResponse(200, { ok: true }, corsHeaders);
    } catch {
      return jsonResponse(502, { ok: false, error: "Echec envoi email." }, corsHeaders);
    }
  },
};
