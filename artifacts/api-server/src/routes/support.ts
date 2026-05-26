import { Router } from "express";
import { db } from "@workspace/db";
import { supportRequests } from "@workspace/db/schema";

const router = Router();

const CLIENT_ID_RE = /^client_[a-z0-9_]+$/;

router.post("/support-requests", async (req, res) => {
  try {
    const raw = req.body as Record<string, unknown>;

    const name = (typeof raw.name === "string" ? raw.name : "").trim();
    const email = (typeof raw.email === "string" ? raw.email : "").trim();
    const phone = (typeof raw.phone === "string" ? raw.phone.trim() : "") || null;
    const topic = (typeof raw.topic === "string" ? raw.topic : "").trim();
    const preferredContact = typeof raw.preferredContact === "string" ? raw.preferredContact.trim() : "";
    const message = (typeof raw.message === "string" ? raw.message : "").trim();

    if (!name) {
      res.status(400).json({ error: "Name is required." });
      return;
    }
    if (!email) {
      res.status(400).json({ error: "Email is required." });
      return;
    }
    if (!email.includes("@")) {
      res.status(400).json({ error: "A valid email address is required." });
      return;
    }
    if (!topic) {
      res.status(400).json({ error: "Topic is required." });
      return;
    }
    if (preferredContact !== "email" && preferredContact !== "phone") {
      res.status(400).json({ error: "Preferred contact must be 'email' or 'phone'." });
      return;
    }
    if (!message || message.length < 10) {
      res.status(400).json({ error: "Message must be at least 10 characters." });
      return;
    }

    const rawClientId = (typeof req.headers["x_client_id"] === "string"
      ? req.headers["x_client_id"]
      : ""
    ).trim();
    const clientId = CLIENT_ID_RE.test(rawClientId) ? rawClientId : "anonymous_support";

    const [inserted] = await db
      .insert(supportRequests)
      .values({
        clientId,
        name,
        email,
        phone,
        topic,
        preferredContact,
        message,
        status: "received",
        source: "ios_app",
      })
      .returning({ id: supportRequests.id, status: supportRequests.status, createdAt: supportRequests.createdAt });

    res.status(201).json({
      id: inserted.id,
      status: inserted.status,
      createdAt: inserted.createdAt,
    });
  } catch (err) {
    req.log.error({ err }, "Support request error");
    res.status(500).json({ error: "Failed to submit support request" });
  }
});

export default router;
