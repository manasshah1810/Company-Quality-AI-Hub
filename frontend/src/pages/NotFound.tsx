import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { currentBrand } from "@/config/branding";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted">
      <div className="text-center space-y-6">
        <div className="flex justify-center mb-6">
          {currentBrand.logoImage ? (
            <img src={currentBrand.logoImage} alt={currentBrand.name} className="w-16 h-16 opacity-60 object-contain" />
          ) : (
            <div className="text-4xl font-black text-primary opacity-60">
              {currentBrand.logoText}
            </div>
          )}
        </div>
        <h1 className="text-4xl font-bold">404</h1>
        <p className="text-xl text-muted-foreground">Oops! Page not found</p>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto">The page you're looking for doesn't exist. Let's get you back on track.</p>
        <a href="/" className="inline-block px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
          Return to Dashboard
        </a>
      </div>
    </div>
  );
};

export default NotFound;
