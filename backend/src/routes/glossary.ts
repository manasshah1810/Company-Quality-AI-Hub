import { Router, Request, Response } from "express";
import * as staticData from "../data/staticData.js";

const router = Router();

// ──────────────────────────────────────────────────────────────────────────────
// GET /api/glossary
// Returns the KPI glossary and analytical data
// ──────────────────────────────────────────────────────────────────────────────
router.get("/", async (req: Request, res: Response) => {
    try {
        return res.json({
            kpiDefinitions: staticData.kpiDefinitions,
            formulaExamples: staticData.formulaExamples,
            chartIndex: staticData.chartIndex,
            aiModels: staticData.aiModels,
            defectPredictions: staticData.defectPredictions,
            bugLeakageTrend: staticData.bugLeakageTrend,
            maintenanceTimeTrend: staticData.maintenanceTimeTrend,
            coverageTreemap: staticData.coverageTreemap,
            _timestamp: new Date().toISOString()
        });
    } catch (err) {
        console.error("Error fetching KPI glossary:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
});

export default router;
