import { Router, Request, Response } from "express";
import { db } from "../config/firebase.js";

const router = Router();

// ──────────────────────────────────────────────────────────────────────────────
// GET /api/glossary
// Returns the KPI glossary and analytical data
// ──────────────────────────────────────────────────────────────────────────────
router.get("/", async (req: Request, res: Response) => {
    try {
        const tenantId = req.tenantId ?? "default";

        const doc = await db
            .collection("tenants")
            .doc(tenantId)
            .collection("tenantData")
            .doc("kpiGlossary")
            .get();

        if (!doc.exists) {
            const fallback = await db
                .collection("tenants")
                .doc("default")
                .collection("tenantData")
                .doc("kpiGlossary")
                .get();

            if (!fallback.exists) {
                return res.status(404).json({ error: "KPI Glossary not found" });
            }
            return res.json(fallback.data());
        }

        return res.json(doc.data());
    } catch (err) {
        console.error("Error fetching KPI glossary:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
});

export default router;
