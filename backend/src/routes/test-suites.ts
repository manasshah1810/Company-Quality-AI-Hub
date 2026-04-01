import { Router, Request, Response } from "express";
import { db } from "../config/firebase.js";

const router = Router();

// ──────────────────────────────────────────────────────────────────────────────
// GET /api/test-suites
// Returns the test suites data
// ──────────────────────────────────────────────────────────────────────────────
router.get("/", async (req: Request, res: Response) => {
    try {
        const tenantId = req.tenantId ?? "default";

        const doc = await db
            .collection("tenants")
            .doc(tenantId)
            .collection("tenantData")
            .doc("testSuites")
            .get();

        if (!doc.exists) {
            const fallback = await db
                .collection("tenants")
                .doc("default")
                .collection("tenantData")
                .doc("testSuites")
                .get();

            if (!fallback.exists) {
                return res.status(404).json({ error: "Test suites not found" });
            }
            return res.json(fallback.data());
        }

        return res.json(doc.data());
    } catch (err) {
        console.error("Error fetching test suites:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
});

// ──────────────────────────────────────────────────────────────────────────────
// POST /api/test-suites
// Creates a new test suite or appends to existing
// ──────────────────────────────────────────────────────────────────────────────
router.post("/", async (req: Request, res: Response) => {
    try {
        const tenantId = req.tenantId ?? "default";
        const newSuite = req.body;

        const docRef = db
            .collection("tenants")
            .doc(tenantId)
            .collection("tenantData")
            .doc("testSuites");

        const doc = await docRef.get();

        if (doc.exists) {
            const data = doc.data() || { items: [] };
            const items = data.items || [];
            items.push(newSuite);
            await docRef.update({ items });
        } else {
            await docRef.set({ items: [newSuite] });
        }

        return res.status(201).json({ message: "Suite created successfully" });
    } catch (err) {
        console.error("Error creating test suite:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
});

export default router;
