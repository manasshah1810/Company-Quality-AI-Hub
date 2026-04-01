import { Router, Request, Response } from "express";
import { db } from "../config/firebase.js";

const router = Router();

// ──────────────────────────────────────────────────────────────────────────────
// GET /api/tenants
// Returns the list of tenant clients and their client tiles.
// ──────────────────────────────────────────────────────────────────────────────
router.get("/", async (req: Request, res: Response) => {
    try {
        const tenantId = req.tenantId ?? "default";

        const tenantsRef = db
            .collection("tenants")
            .doc(tenantId)
            .collection("tenantData");

        const [clientsSnap, tilesSnap] = await Promise.all([
            tenantsRef.doc("clients").get(),
            tenantsRef.doc("clientTiles").get(),
        ]);

        // If nothing exists for this tenant, try default
        if (!clientsSnap.exists) {
            const defaultRef = db
                .collection("tenants")
                .doc("default")
                .collection("tenantData");

            const [dClients, dTiles] = await Promise.all([
                defaultRef.doc("clients").get(),
                defaultRef.doc("clientTiles").get(),
            ]);

            if (!dClients.exists) {
                return res.status(404).json({ error: "Tenant data not found" });
            }

            return res.json({
                tenantClients: dClients.data()?.items ?? [],
                clientTiles: dTiles.data()?.items ?? [],
            });
        }

        return res.json({
            tenantClients: clientsSnap.data()?.items ?? [],
            clientTiles: tilesSnap.data()?.items ?? [],
        });
    } catch (err) {
        console.error("Error fetching tenants:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
});

// ──────────────────────────────────────────────────────────────────────────────
// POST /api/tenants/seed
// Seed the database with sample tenant data
// ──────────────────────────────────────────────────────────────────────────────
router.post("/seed", async (req: Request, res: Response) => {
    try {
        const defaultRef = db.collection("tenants").doc("default").collection("tenantData");

        const sampleClients = {
            items: [
                { name: "Cognify Inc", healthScore: 92, passRate: 98.5, activeSuites: 145, lastTestRun: "2026-03-29T10:15:00Z" },
                { name: "DataFlow Corp", healthScore: 85, passRate: 96.2, activeSuites: 89, lastTestRun: "2026-03-29T09:45:00Z" },
                { name: "TaxLogix Pro", healthScore: 78, passRate: 93.8, activeSuites: 156, lastTestRun: "2026-03-29T08:30:00Z" },
                { name: "FormMaster Systems", healthScore: 88, passRate: 97.1, activeSuites: 112, lastTestRun: "2026-03-29T10:00:00Z" },
                { name: "AuditChain Ltd", healthScore: 81, passRate: 95.3, activeSuites: 98, lastTestRun: "2026-03-29T09:20:00Z" },
                { name: "CloudTax Partner", healthScore: 91, passRate: 98.9, activeSuites: 167, lastTestRun: "2026-03-29T10:25:00Z" }
            ]
        };

        const sampleTiles = {
            items: [
                { tileName: "K-1 Schedule Processing", type: "Form Processing", testCases: 2450, passRate: 98.7, avgLatency: 245, lastRun: "2026-03-29T10:25:00Z", issues: 0, slaMet: true },
                { tileName: "1040-EZ Extraction", type: "OCR Pipeline", testCases: 1890, passRate: 97.3, avgLatency: 312, lastRun: "2026-03-29T10:20:00Z", issues: 1, slaMet: false },
                { tileName: "Interest Income Detection", type: "Validation", testCases: 3200, passRate: 96.5, avgLatency: 189, lastRun: "2026-03-29T10:15:00Z", issues: 0, slaMet: true },
                { tileName: "Partnership Mapping", type: "Data Transform", testCases: 1650, passRate: 94.2, avgLatency: 421, lastRun: "2026-03-29T10:10:00Z", issues: 3, slaMet: false }
            ]
        };

        await defaultRef.doc("clients").set(sampleClients);
        await defaultRef.doc("clientTiles").set(sampleTiles);

        return res.json({ 
            message: "Tenant data seeded successfully", 
            clients: sampleClients.items.length,
            tiles: sampleTiles.items.length
        });
    } catch (err: any) {
        console.error("Error seeding tenants:", err);
        return res.status(500).json({ error: "Failed to seed tenant data", details: err.message });
    }
});

export default router;
