import { Router, Request, Response } from "express";
import * as staticData from "../data/staticData.js";

const router = Router();

// ──────────────────────────────────────────────────────────────────────────────
// GET /api/tenants
// Returns the list of tenant clients and their client tiles.
// ──────────────────────────────────────────────────────────────────────────────
router.get("/", async (req: Request, res: Response) => {
    try {
        return res.json({
            tenantClients: staticData.tenantClients,
            clientTiles: staticData.clientTiles,
        });
    } catch (err) {
        console.error("Error fetching tenants:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
});

// ──────────────────────────────────────────────────────────────────────────────
// POST /api/tenants/seed
// Removed Firebase seeding - now using static data
// ──────────────────────────────────────────────────────────────────────────────
router.post("/seed", async (req: Request, res: Response) => {
    return res.json({
        message: "Static data is already loaded in the backend memory.",
        clients: staticData.tenantClients.length,
        tiles: staticData.clientTiles.length
    });
});

export default router;
