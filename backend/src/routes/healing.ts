import { Router, Request, Response } from "express";
import { db } from "../config/firebase.js";

const router = Router();

// ──────────────────────────────────────────────────────────────────────────────
// GET /api/healing/events
// Returns healing events, overview stats, decision matrix, and shadow approvals.
// ──────────────────────────────────────────────────────────────────────────────
router.get("/events", async (req: Request, res: Response) => {
    try {
        const tenantId = req.tenantId ?? "default";

        const healingRef = db
            .collection("tenants")
            .doc(tenantId)
            .collection("healing");

        // Fetch all sub-documents in parallel
        const [eventsSnap, overviewSnap, matrixSnap, approvalsSnap] =
            await Promise.all([
                healingRef.doc("events").get(),
                healingRef.doc("overview").get(),
                healingRef.doc("decisionMatrix").get(),
                healingRef.doc("shadowApprovals").get(),
            ]);

        // If nothing exists for this tenant, try default
        if (!eventsSnap.exists) {
            const defaultRef = db
                .collection("tenants")
                .doc("default")
                .collection("healing");

            const [dEvents, dOverview, dMatrix, dApprovals] = await Promise.all([
                defaultRef.doc("events").get(),
                defaultRef.doc("overview").get(),
                defaultRef.doc("decisionMatrix").get(),
                defaultRef.doc("shadowApprovals").get(),
            ]);

            if (!dEvents.exists) {
                return res.status(404).json({ error: "Healing events not found" });
            }

            return res.json({
                healingEvents: dEvents.data()?.items ?? [],
                healingOverview: dOverview.data() ?? {},
                decisionMatrix: dMatrix.data()?.items ?? [],
                shadowApprovals: dApprovals.data()?.items ?? [],
            });
        }

        return res.json({
            healingEvents: eventsSnap.data()?.items ?? [],
            healingOverview: overviewSnap.data() ?? {},
            decisionMatrix: matrixSnap.data()?.items ?? [],
            shadowApprovals: approvalsSnap.data()?.items ?? [],
        });
    } catch (err) {
        console.error("Error fetching healing events:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
});

export default router;
