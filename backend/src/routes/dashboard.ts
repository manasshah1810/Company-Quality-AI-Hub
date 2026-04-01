import { Router, Request, Response } from "express";
import { db } from "../config/firebase.js";

const router = Router();

// ──────────────────────────────────────────────────────────────────────────────
// GET /api/dashboard/kpis
// Returns all dashboard data: KPIs, daily executions, weekly defects,
// coverage breakdown, AI mapping accuracy, and failure heatmap.
// ──────────────────────────────────────────────────────────────────────────────
router.get("/kpis", async (req: Request, res: Response) => {
    try {
        const tenantId = req.tenantId ?? "default";

        // Fetch the main dashboard document
        const dashDoc = await db
            .collection("tenants")
            .doc(tenantId)
            .collection("dashboard")
            .doc("kpis")
            .get();

        if (!dashDoc.exists) {
            // Fallback: try the shared "default" tenant
            const fallback = await db
                .collection("tenants")
                .doc("default")
                .collection("dashboard")
                .doc("kpis")
                .get();

            if (!fallback.exists) {
                return res.status(404).json({ error: "Dashboard KPIs not found" });
            }
            return res.json(fallback.data());
        }

        return res.json(dashDoc.data());
    } catch (err) {
        console.error("Error fetching dashboard KPIs:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
});

export default router;
