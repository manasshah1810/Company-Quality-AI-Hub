import { Router, Request, Response } from "express";
import * as staticData from "../data/staticData.js";

const router = Router();

// ──────────────────────────────────────────────────────────────────────────────
// GET /api/healing/events
// Returns healing events, overview stats, decision matrix, and shadow approvals.
// ──────────────────────────────────────────────────────────────────────────────
router.get("/events", async (req: Request, res: Response) => {
    try {
        return res.json({
            healingEvents: staticData.healingEvents,
            healingOverview: staticData.healingOverview,
            decisionMatrix: staticData.decisionMatrix,
            shadowApprovals: staticData.shadowApprovals,
            _timestamp: new Date().toISOString()
        });
    } catch (err) {
        console.error("Error fetching healing events:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
});

export default router;
