import "./env.js"; // CRITICAL: Load env variables before any other imports
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Route modules - imported AFTER dotenv.config
import dashboardRoutes from "./routes/dashboard.js";
import healingRoutes from "./routes/healing.js";
import tenantRoutes from "./routes/tenants.js";
import winnieRoutes from "./routes/winnie.js";
import jobsRoutes from "./routes/jobs.js";
import testSuitesRoutes from "./routes/test-suites.js";
import syntheticDataRoutes from "./routes/synthetic-data.js";
import glossaryRoutes from "./routes/glossary.js";
import analysisRoutes from "./routes/analysis.js";
import analyticsRoutes from "./routes/analytics.js";
import codeIntelligenceRoutes from "./routes/code-intelligence.js";
import testGenerationRoutes from "./routes/test-generation.js";
import regressionAnalysisRoutes from "./routes/regression-analysis.js";

const app = express();
const PORT = Number(process.env.PORT) || 5003;

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// Global Request Logger for Debugging
app.use((req: Request, res: Response, next: NextFunction) => {
    console.log(`[DEBUG] ${req.method} ${req.url}`);
    next();
});

/**
 * Tenant Context Middleware
 * -------------------------
 * Extracts the tenant identifier from one of the following sources
 * (in priority order):
 *   1. `x-tenant-id` request header
 *   2. `tenantId` query-string parameter
 *
 * The resolved tenant ID is attached to `req.tenantId` so downstream
 * handlers can read it without repeating the lookup logic.
 */

// Extend Express Request to carry tenantId
declare global {
    namespace Express {
        interface Request {
            tenantId?: string;
        }
    }
}

function tenantContext(req: Request, _res: Response, next: NextFunction): void {
    const tenantId =
        (req.headers["x-tenant-id"] as string | undefined) ??
        (req.query.tenantId as string | undefined) ??
        "default";

    req.tenantId = tenantId;
    next();
}

app.use(tenantContext);

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

/** Health-check / smoke-test endpoint */
app.get("/api/health", (_req: Request, res: Response) => {
    res.json({
        status: "ok",
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
    });
});

/** Echo the resolved tenant ID back to the caller (useful for debugging) */
app.get("/api/tenant", (req: Request, res: Response) => {
    res.json({ tenantId: req.tenantId });
});

/** Data routes */
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/healing", healingRoutes);
app.use("/api/tenants", tenantRoutes);
app.use("/api/ai/winnie", winnieRoutes);
app.use("/api/analysis", analysisRoutes);
app.use("/api/jobs", jobsRoutes);
app.use("/api/test-suites", testSuitesRoutes);
app.use("/api/synthetic-data", syntheticDataRoutes);
app.use("/api/glossary", glossaryRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/code-intelligence", codeIntelligenceRoutes);
app.use("/api/test-generation", testGenerationRoutes);
app.use("/api/regression-analysis", regressionAnalysisRoutes);



// ---------------------------------------------------------------------------
// Global Error Handler Middleware
// ---------------------------------------------------------------------------

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error("❌ Unhandled error:", err);

    const statusCode = err.statusCode || 500;
    const message = err.message || "Internal server error";

    return res.status(statusCode).json({
        error: message,
        timestamp: new Date().toISOString(),
        path: req.path
    });
});

// 404 Handler
app.use((req: express.Request, res: express.Response) => {
    return res.status(404).json({
        error: `Route not found: ${req.method} ${req.path}`,
        timestamp: new Date().toISOString()
    });
});

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------

app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀  Backend server running on http://0.0.0.0:${PORT}`);
});
