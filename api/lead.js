// Vercel Function: receives the "Book an Architecture Call" form on advayaai.in
// and creates a row in the Airtable general-leads table.
//
// Required environment variable (Vercel → this project → Settings → Environment Variables):
//   AIRTABLE_TOKEN  Personal access token with scope data.records:write on base appxVgFc2OECiVDXz.
// Optional overrides:
//   AIRTABLE_BASE_ID, AIRTABLE_TABLE_ID
//
// The token is only read here on the server; it never reaches the browser.

const BASE_ID = process.env.AIRTABLE_BASE_ID || "appxVgFc2OECiVDXz";
const TABLE_ID = process.env.AIRTABLE_TABLE_ID || "tblkLoM28KLHZdc4V";

// Airtable column names. They must match the table exactly (case and punctuation).
const FIELDS = {
  name: "Name",
  phone: "Phone",
  industry: "Industry",
  slot: "Preferred demo slot",
  source: "Source",
};

const SOURCE = "advayaai.in - Book Architecture Call";
const LIMITS = { name: 120, phone: 40, industry: 80, slot: 60 };

function clean(value, max) {
  if (typeof value !== "string") return "";
  return value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "").trim().slice(0, max);
}

function parseBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string") {
    try { return JSON.parse(req.body); } catch (e) { return null; }
  }
  return null;
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const body = parseBody(req);
  if (!body) return res.status(400).json({ ok: false, error: "Invalid request" });

  // Honeypot: real visitors never fill the hidden "website" field.
  if (clean(body.website, 200)) return res.status(200).json({ ok: true });

  const data = {
    name: clean(body.name, LIMITS.name),
    phone: clean(body.phone, LIMITS.phone),
    industry: clean(body.industry, LIMITS.industry),
    slot: clean(body.slot, LIMITS.slot),
  };

  const missing = ["name", "phone"].filter(k => !data[k]);
  if (missing.length) {
    return res.status(400).json({ ok: false, error: "Please fill in your name and phone number", fields: missing });
  }
  if (!/^[+()\d\s.-]{6,40}$/.test(data.phone)) {
    return res.status(400).json({ ok: false, error: "Please enter a valid phone number", fields: ["phone"] });
  }

  const token = process.env.AIRTABLE_TOKEN;
  if (!token) {
    console.error("AIRTABLE_TOKEN is not set");
    return res.status(500).json({ ok: false, error: "Form is not configured" });
  }

  const fields = {
    [FIELDS.name]: data.name,
    [FIELDS.phone]: data.phone,
    [FIELDS.source]: SOURCE,
  };
  if (data.industry) fields[FIELDS.industry] = data.industry;
  if (data.slot) fields[FIELDS.slot] = data.slot;

  try {
    const r = await fetch(`https://api.airtable.com/v0/${BASE_ID}/${TABLE_ID}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ records: [{ fields }], typecast: true }),
    });
    if (!r.ok) {
      const detail = await r.text();
      console.error("Airtable error", r.status, detail.slice(0, 500));
      return res.status(502).json({ ok: false, error: "Could not save your request" });
    }
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("Airtable request failed", err);
    return res.status(502).json({ ok: false, error: "Could not save your request" });
  }
};
