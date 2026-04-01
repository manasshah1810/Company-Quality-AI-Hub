import { Moon, Sun } from "lucide-react";
import { motion } from "framer-motion";
import { useTheme } from "@/context/ThemeContext";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <motion.button
      onClick={toggleTheme}
      className="relative inline-flex items-center justify-center p-2 rounded-lg transition-colors bg-sidebar/50 hover:bg-sidebar-accent/50 text-sidebar-foreground hover:text-foreground group"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
    >
      <motion.div
        initial={false}
        animate={{ rotate: theme === "dark" ? 180 : 0 }}
        transition={{ duration: 0.3 }}
      >
        {theme === "dark" ? (
          <Sun className="w-5 h-5 text-yellow-400 drop-shadow-lg" />
        ) : (
          <Moon className="w-5 h-5 text-indigo-600 drop-shadow-lg" />
        )}
      </motion.div>
      
      <span className="ml-2 text-xs font-medium uppercase tracking-wider">
        {theme === "dark" ? "Light" : "Dark"}
      </span>
    </motion.button>
  );
}
