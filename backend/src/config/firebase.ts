import { LocalDb } from "./mock-db.js";

/**
 * Mock Firebase DB
 * -----------------
 * Replaces Firestore with a local JSON file (db.json) for 100% reliability
 * without need for Cloud permissions or internet.
 */

export const db = new LocalDb();

/**
 * Utility: Clean undefined properties from an object recursively
 * (Kept for compatibility with existing code)
 */
export function cleanUndefinedProps(obj: any): any {
    if (obj === null || typeof obj !== "object") return obj;

    if (Array.isArray(obj)) {
        return obj.map(item => cleanUndefinedProps(item));
    }

    const cleaned: any = {};
    for (const [key, value] of Object.entries(obj)) {
        if (value !== undefined) {
            cleaned[key] = cleanUndefinedProps(value);
        }
    }
    return cleaned;
}
