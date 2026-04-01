import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";

// Automatically handles API URL switching based on environment
export const getApiBaseUrl = () => {
    // If in production mode, we enforce the external backend URL.
    // In dev, the Vite proxy handles /api to localhost:5001.
    if (import.meta.env.PROD) {
        return import.meta.env.VITE_API_URL || "https://quality-ai-hub-backend.onrender.com";
    }
    return ""; // Returns empty string so requests hit the relative path (Vite proxies it to :5001)
};

export const fetchApi = async (endpoint: string) => {
    const baseUrl = getApiBaseUrl();
    const tenantId = "default"; // Forced default sandbox as per UX requirements

    return apiClient(`${baseUrl}${endpoint}`, {
        headers: {
            "x-tenant-id": tenantId,
            "Content-Type": "application/json",
        },
    });
};

// Generic hook to fetch data via our new backend API
export const useApiData = <T = any>(key: string, endpoint: string) => {
    const tenantId = "default"; // Forced default sandbox as per UX requirements

    return useQuery<T, Error>({
        queryKey: [key, tenantId], // Re-fetches automatically when tenantId changes!
        queryFn: () => fetchApi(endpoint),
    });
};
