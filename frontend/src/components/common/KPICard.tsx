import { ReactNode } from "react";
import CountUp from "react-countup";
import { motion } from "framer-motion";
import {
  TestTube2, CheckCircle2, ShieldAlert, Clock, Sparkles, Gauge,
  TrendingUp, TrendingDown
} from "lucide-react";

const iconMap: Record<string, any> = { TestTube2, CheckCircle2, ShieldAlert, Clock, Sparkles, Gauge };

interface KPICardProps {
  label: string;
  value: number;
  suffix?: string;
  change?: number;
  changeLabel?: string;
  target?: number;
  targetLabel?: string;
  previousValue?: number;
  previousLabel?: string;
  icon?: string;
  index?: number;
}

export function KPICard({ label, value, suffix = "", change, changeLabel, target, targetLabel, previousValue, previousLabel, icon, index = 0 }: KPICardProps) {
  const IconComponent = icon ? iconMap[icon] : null;
  const decimals = value % 1 !== 0 ? (value < 1 ? 2 : 1) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.4 }}
      className="glass glow-border rounded-xl p-5 relative overflow-hidden"
    >
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</span>
        {IconComponent && (
          <div className="p-2 rounded-lg bg-primary/10">
            <IconComponent className="w-4 h-4 text-primary" />
          </div>
        )}
      </div>
      <div className="flex items-baseline gap-1">
        <span className="font-heading font-bold text-3xl text-foreground">
          <CountUp end={value} decimals={decimals} duration={2} separator="," />
        </span>
        <span className="text-sm text-muted-foreground">{suffix}</span>
      </div>
      <div className="mt-2 flex items-center gap-2 text-xs">
        {change !== undefined && (
          <span className={`flex items-center gap-1 ${change >= 0 ? "text-success" : "text-destructive"}`}>
            {change >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {change >= 0 ? "+" : ""}{change}%
          </span>
        )}
        {changeLabel && <span className="text-muted-foreground">{changeLabel}</span>}
        {targetLabel && <span className="text-muted-foreground">{targetLabel}</span>}
        {previousLabel && <span className="text-muted-foreground">{previousLabel}</span>}
      </div>
    </motion.div>
  );
}
