import { initializeApp, cert, getApps, type ServiceAccount } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

/**
 * Firebase Admin SDK Initialization
 * ----------------------------------
 * Uses a service-account JSON file pointed to by the GOOGLE_APPLICATION_CREDENTIALS
 * environment variable. If that is not set, falls back to Application Default
 * Credentials (useful when running on GCP).
 *
 * Project metadata (for reference / client-side SDK — NOT used by admin SDK):
 *   projectId:          qai-platform-9fc48
 *   authDomain:         qai-platform-9fc48.firebaseapp.com
 *   storageBucket:      qai-platform-9fc48.firebasestorage.app
 *   messagingSenderId:  886810620790
 *   appId:              1:886810620790:web:7ed9b8c6a7a1a2a27ac057
 */

function initFirebase() {
    if (getApps().length > 0) {
        return getApps()[0];
    }

    const projectId = "hub-dev-2b1dd";
    const credentials = process.env.GOOGLE_APPLICATION_CREDENTIALS;

    if (credentials) {
        try {
            // Check if it's a JSON string (for Render/Heroku)
            if (credentials.trim().startsWith('{')) {
                return initializeApp({
                    credential: cert(JSON.parse(credentials)),
                    projectId,
                });
            }
            // Otherwise treat as a file path
            return initializeApp({
                credential: cert(credentials),
                projectId,
            });
        } catch (error) {
            console.error("❌ Failed to initialize Firebase with GOOGLE_APPLICATION_CREDENTIALS:", error);
        }
    }

    // Fallback for ADC (Cloud environments like GCP)
    return initializeApp({
        projectId,
    });
}

const app = initFirebase();
export const db = getFirestore(app);
db.settings({ ignoreUndefinedProperties: true });

/**
 * Utility: Clean undefined properties from an object recursively
 * This helps prevent Firestore errors when writing nested objects
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
