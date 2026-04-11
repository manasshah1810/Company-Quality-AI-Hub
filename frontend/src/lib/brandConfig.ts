export const BRAND_CONFIG: any = {
    company: {
        name: "Company Quality AI Hub",
        logo: "QAI",
        isTextLogo: true
    },
    Persistent: {
        name: "Persistent Quality AI Hub",
        logo: "/Persistent.png",
        isTextLogo: false
    },
    cogniify: {
        name: "Cogniify Quality AI Hub",
        logo: "/Cogniify.png",
        isTextLogo: false
    }
};

export const getBrand = () => {
    // In Vite, environment variables are usually on import.meta.env
    // But we will try several ways to be safe and follow user's "process.env" request if possible
    const envBrand = (import.meta as any).env?.NEXT_PUBLIC_BRAND || (import.meta as any).env?.VITE_BRAND || "company";
    return BRAND_CONFIG[envBrand] || BRAND_CONFIG.company;
};
