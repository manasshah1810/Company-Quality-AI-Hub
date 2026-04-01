import { toast } from "sonner";

export async function apiClient<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers = new Headers(options.headers || {});

    // Guarantee x-tenant-id header is injected
    if (!headers.has("x-tenant-id")) {
        headers.set("x-tenant-id", "default");
    }

    // Set Content-Type for JSON requests if body is present
    if (options.body && !headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
    }

    try {
        const baseUrl = (import.meta.env.VITE_API_URL || '').trim();
        const url = endpoint.startsWith('http') ? endpoint : `${baseUrl}${endpoint}`;
        const res = await fetch(url, {
            ...options,
            headers
        });

        if (!res.ok) {
            throw new Error(`Request failed with status ${res.status}`);
        }

        return await res.json() as T;
    } catch (error: any) {
        toast.error("Network Error", { description: error.message || "Failed to communicate with the server." });
        throw error;
    }
}
