import { Router, Request, Response } from "express";
import * as staticData from "../data/staticData.js";

const router = Router();

// ──────────────────────────────────────────────────────────────────────────────
// GET /api/test-suites
// Returns the test suites data
// ──────────────────────────────────────────────────────────────────────────────
router.get("/", async (req: Request, res: Response) => {
    try {
        return res.json({
            items: staticData.testSuites,
            _timestamp: new Date().toISOString()
        });
    } catch (err) {
        console.error("Error fetching test suites:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
});

// ──────────────────────────────────────────────────────────────────────────────
// POST /api/test-suites
// Creates a new test suite (in-memory only)
// ──────────────────────────────────────────────────────────────────────────────
router.post("/", async (req: Request, res: Response) => {
    try {
        const newSuite = req.body;
        staticData.testSuites.push({
            ...newSuite,
            id: `TS-${Math.floor(Math.random() * 1000) + 2000}`
        });
        return res.status(201).json({ message: "Suite created successfully" });
    } catch (err) {
        console.error("Error creating test suite:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
});

export default router;
