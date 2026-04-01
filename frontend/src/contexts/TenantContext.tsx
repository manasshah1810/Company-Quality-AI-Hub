import { createContext, useContext, useState, ReactNode } from "react";

interface TenantContextValue {
    tenantId: string;
    setTenantId: (id: string) => void;
    /** Returns headers object with x-tenant-id set */
    getTenantHeaders: () => Record<string, string>;
}

const TenantContext = createContext<TenantContextValue | undefined>(undefined);

const DEFAULT_TENANT = "default";

export function TenantProvider({ children }: { children: ReactNode }) {
    const tenantId = DEFAULT_TENANT;

    const updateTenantId = (id: string) => {
        // Multi-tenant switching disabled as per request
        console.warn("Tenant switching requested but disabled:", id);
    };

    const getTenantHeaders = (): Record<string, string> => ({
        "x-tenant-id": tenantId,
    });

    return (
        <TenantContext.Provider
            value={{ tenantId, setTenantId: updateTenantId, getTenantHeaders }}
        >
            {children}
        </TenantContext.Provider>
    );
}

export function useTenant(): TenantContextValue {
    const ctx = useContext(TenantContext);
    if (!ctx) {
        throw new Error("useTenant must be used within a <TenantProvider>");
    }
    return ctx;
}
