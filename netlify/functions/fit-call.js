// Netlify Function: receives the fit-call form and emails it via Resend.
// The Resend API key is read from an environment variable (RESEND_API_KEY)
// set in Netlify → Site settings → Environment variables. It is NEVER in the page.

exports.handler = async (event) => {
  const CORS = { "Content-Type": "application/json" };

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  let data;
  try {
    data = JSON.parse(event.body || "{}");
  } catch {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: "Invalid request." }) };
  }

  const name = (data.name || "").toString().trim();
  const email = (data.email || "").toString().trim();
  const company = (data.company || "").toString().trim();
  const message = (data.message || "").toString().trim();
  const honeypot = (data.company_website || "").toString().trim();

  // Honeypot: real users never fill this hidden field. Silently accept + drop.
  if (honeypot) {
    return { statusCode: 200, headers: CORS, body: JSON.stringify({ ok: true }) };
  }

  if (!name || !email) {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: "Name and email are required." }) };
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: "That email doesn't look valid." }) };
  }

  const key = process.env.RESEND_API_KEY;
  if (!key) {
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: "Email service not configured." }) };
  }

  // Where the notification is sent, and the verified sender domain.
  // Update TO_ADDRESS / FROM_ADDRESS to match your verified Resend domain.
  const TO_ADDRESS = process.env.FIT_CALL_TO || "timour@tkthrive.io";
  const FROM_ADDRESS = process.env.FIT_CALL_FROM || "T.K. Thrive <noreply@tkthrive.io>";

  const esc = (s) => s.replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" }[c]));

  const html = `
    <h2 style="font-family:Georgia,serif;color:#0F2A44">New fit-call request</h2>
    <table style="font-family:Arial,sans-serif;font-size:14px;border-collapse:collapse">
      <tr><td style="padding:4px 12px 4px 0;color:#6B7280">Name</td><td><b>${esc(name)}</b></td></tr>
      <tr><td style="padding:4px 12px 4px 0;color:#6B7280">Email</td><td><a href="mailto:${esc(email)}">${esc(email)}</a></td></tr>
      <tr><td style="padding:4px 12px 4px 0;color:#6B7280">Company</td><td>${esc(company) || "—"}</td></tr>
    </table>
    <p style="font-family:Arial,sans-serif;font-size:14px;color:#2C2C2C;margin-top:16px">
      <b>The decision they're weighing:</b><br>${esc(message).replace(/\n/g, "<br>") || "—"}
    </p>`;

  try {
    const resp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: FROM_ADDRESS,
        to: [TO_ADDRESS],
        reply_to: email,
        subject: `Fit-call request — ${name}${company ? " · " + company : ""}`,
        html,
      }),
    });

    if (!resp.ok) {
      const detail = await resp.text();
      console.error("Resend error:", resp.status, detail);
      return { statusCode: 502, headers: CORS, body: JSON.stringify({ error: "Could not send. Please email us directly." }) };
    }

    return { statusCode: 200, headers: CORS, body: JSON.stringify({ ok: true }) };
  } catch (err) {
    console.error("Send failed:", err);
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: "Unexpected error. Please email us directly." }) };
  }
};
