import { useState } from "react";
import { NavLink } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, TestTube2, Sparkles, HeartPulse, Database, Bot, Building2, BarChart3, BookOpen, Zap,
  ChevronLeft, ChevronRight, GitBranch, Microscope
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { getBrand } from "@/lib/brandConfig";

const navItems = [
  { path: "/dashboard", label: "Command Center", icon: LayoutDashboard },
  { path: "/regression-analysis", label: "Regression Analysis", icon: Zap },
  { path: "/debug-center", label: "Debug Center", icon: Microscope },
  { path: "/test-suites", label: "Test Suites", icon: TestTube2 },
  { path: "/ai-test-generation", label: "AI Test Generator", icon: Sparkles },
  { path: "/code-intelligence", label: "Code Intelligence", icon: GitBranch },
  { path: "/self-healing", label: "Self-Healing", icon: HeartPulse },
  { path: "/synthetic-data", label: "Synthetic Data", icon: Database },
  { path: "/agent-testing", label: "Agent Testing", icon: Bot },
  { path: "/multi-tenant", label: "Multi-Tenant", icon: Building2 },
  { path: "/analytics", label: "Analytics", icon: BarChart3 },
  { path: "/glossary", label: "Glossary", icon: BookOpen },
];

export function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const brand = getBrand();

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 72 : 240 }}
      transition={{ duration: 0.2 }}
      className="h-screen bg-sidebar border-r border-sidebar-border flex flex-col flex-shrink-0 sticky top-0 z-30"
    >
      {/* Logo Section */}
      <div className={`flex items-center justify-center ${collapsed ? 'h-20' : 'h-32'} border-b border-sidebar-border bg-sidebar overflow-hidden px-2`}>
        <div className={`flex ${collapsed ? 'flex-row' : 'flex-col'} items-center gap-2`}>
          {brand.isTextLogo ? (
            <div className={`flex items-center justify-center bg-primary text-primary-foreground font-black rounded-lg ${collapsed ? 'h-10 w-10 text-xs' : 'h-14 w-14 text-xl shadow-glow'}`}>
              {brand.logo}
            </div>
          ) : (
            <img
              src={brand.logo}
              alt={`${brand.name} Logo`}
              className={`${collapsed ? 'h-10 w-10' : 'h-14 w-auto'} object-contain transition-all duration-300`}
            />
          )}
          {!collapsed && (
            <div className="flex flex-col items-center">
              <span className="font-heading font-black text-sidebar-foreground text-center text-sm leading-tight tracking-tight px-1">{brand.name}</span>
              <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-[0.2em] mt-1">Testing Suite</span>
            </div>
          )}
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto scrollbar-thin">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group
              ${isActive
                ? "bg-sidebar-accent text-primary glow-cyan"
                : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-foreground"
              }`
            }
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            <AnimatePresence>
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  className="whitespace-nowrap overflow-hidden"
                >
                  {item.label}
                </motion.span>
              )}
            </AnimatePresence>
          </NavLink>
        ))}
      </nav>

      {/* Footer Actions */}
      <div className="border-t border-sidebar-border flex flex-col gap-1 p-2">
        <div className="flex items-center justify-center">
          <ThemeToggle />
        </div>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center justify-center h-12 text-muted-foreground hover:text-foreground transition-all uppercase px-3 gap-2 rounded-lg hover:bg-sidebar-accent/50"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <><ChevronLeft className="w-4 h-4" /> <span className="text-[10px] font-bold">Collapse</span></>}
        </button>
      </div>
    </motion.aside>
  );
}
