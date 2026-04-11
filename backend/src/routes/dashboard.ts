import { Router, Request, Response } from "express";
import * as staticData from "../data/staticData.js";

const router = Router();

// ──────────────────────────────────────────────────────────────────────────────
// GET /api/dashboard/kpis
// Returns all dashboard data: KPIs, daily executions, weekly defects,
// coverage breakdown, AI mapping accuracy, and failure heatmap.
// ──────────────────────────────────────────────────────────────────────────────
router.get("/kpis", async (req: Request, res: Response) => {
    try {
        // Return static dashboard data
        return res.json({
            dashboardKPIs: staticData.dashboardKPIs,
            dailyExecutions: staticData.generateDailyExecutions(),
            weeklyDefects: staticData.weeklyDefects,
            coverageByModule: staticData.coverageByModule,
            aiMappingAccuracy: staticData.aiMappingAccuracy,
            failureHeatmap: staticData.generateFailureHeatmap(),
            _timestamp: new Date().toISOString()
        });
    } catch (err) {
        console.error("Error fetching dashboard KPIs:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
});

export default router;
