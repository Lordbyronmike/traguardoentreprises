export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { name, email, message } = req.body || {};

    console.log("CONTACT FORM:", { name, email, message });

    if (!name || !email || !message) {
      return res.status(400).json({ error: "Missing fields" });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("CONTACT ERROR:", err);
    return res.status(500).json({ error: "Server error" });
  }
}