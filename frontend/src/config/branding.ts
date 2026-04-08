export const BRAND_CONFIG = {
    company: {
        name: "Company Quality AI Hub",
        logoText: "QAI",
        logoImage: null,
    },
    persistant: {
        name: "Persistant Quality AI Hub",
        logoText: null,
        logoImage: "/Persistant Logo.png",
    },
    cogniify: {
        name: "Cogniify Quality AI Hub",
        logoText: null,
        logoImage: "/Cogniify Logo.png",
    }
} as const;

export type BrandType = keyof typeof BRAND_CONFIG;

// Support both NEXT_PUBLIC_BRAND and VITE_BRAND for flexibility
const getBrand = (): BrandType => {
    const brandEnv = (import.meta.env.VITE_BRAND || import.meta.env.NEXT_PUBLIC_BRAND || "company") as string;
    if (brandEnv in BRAND_CONFIG) {
        return brandEnv as BrandType;
    }
    return "company";
};

export const brand = getBrand();
export const currentBrand = BRAND_CONFIG[brand];
