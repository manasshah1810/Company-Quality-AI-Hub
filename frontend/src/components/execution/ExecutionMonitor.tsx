import { useState, useEffect } from "react";
import { Play, Pause, X, CheckCircle2, AlertCircle } from "lucide-react";

interface ExecutionMonitorProps {
  isRunning: boolean;
  progress: number;
  testsPassed: number;
  testsFailed: number;
  totalTests: number;
  estimatedTimeRemaining: number;
  elapsedTime: number;
  currentTestName?: string;
  onCancel: () => void;
  onPause?: () => void;
}

export function ExecutionMonitor({
  isRunning,
  progress,
  testsPassed,
  testsFailed,
  totalTests,
  estimatedTimeRemaining,
  elapsedTime,
  currentTestName,
  onCancel,
  onPause
}: ExecutionMonitorProps) {
  const [animatedProgress, setAnimatedProgress] = useState(progress);

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedProgress(progress), 100);
    return () => clearTimeout(timer);
  }, [progress]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    }
    return `${secs}s`;
  };

  const passRate = totalTests > 0 ? Math.round((testsPassed / totalTests) * 100) : 0;

  return (
    <div className="glass rounded-xl p-6 space-y-4">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="font-semibold text-sm text-foreground flex items-center gap-2">
            <Play className="w-4 h-4 text-primary" />
            Live Execution Monitor
          </h3>
          <p className="text-xs text-muted-foreground mt-1">Real-time test execution tracking</p>
        </div>
        <div className="flex items-center gap-2">
          {onPause && (
            <button
              onClick={onPause}
              className="p-2 rounded-lg bg-muted/30 hover:bg-muted/50 text-muted-foreground transition-all"
              title="Pause execution"
            >
              <Pause className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onCancel}
            className="p-2 rounded-lg bg-destructive/20 hover:bg-destructive/30 text-destructive transition-all"
            title="Cancel execution"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Overall Progress</span>
          <span className="font-mono font-bold text-foreground">{animatedProgress}%</span>
        </div>
        <div className="w-full h-2 rounded-full bg-muted/20 overflow-hidden">
          <div
            className={`h-full bg-gradient-to-r from-primary to-primary/50 transition-all duration-500 rounded-full ${
              animatedProgress === 100 ? "animate-pulse" : ""
            }`}
            style={{ width: `${animatedProgress}%` }}
          />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-3">
        <div className="p-3 rounded-lg bg-muted/10 border border-border/40">
          <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mb-1">
            Tests Completed
          </div>
          <div className="text-lg font-bold text-foreground">
            {testsPassed + testsFailed} <span className="text-xs text-muted-foreground">/ {totalTests}</span>
          </div>
        </div>

        <div className="p-3 rounded-lg bg-success/10 border border-success/30">
          <div className="text-[10px] text-success font-bold uppercase tracking-wider mb-1">
            Passed
          </div>
          <div className="text-lg font-bold text-success flex items-center gap-1.5">
            {testsPassed}
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>

        <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30">
          <div className="text-[10px] text-destructive font-bold uppercase tracking-wider mb-1">
            Failed
          </div>
          <div className="text-lg font-bold text-destructive flex items-center gap-1.5">
            {testsFailed}
            {testsFailed > 0 && <AlertCircle className="w-4 h-4" />}
          </div>
        </div>

        <div className="p-3 rounded-lg bg-primary/10 border border-primary/30">
          <div className="text-[10px] text-primary font-bold uppercase tracking-wider mb-1">
            Pass Rate
          </div>
          <div className="text-lg font-bold text-primary">{passRate}%</div>
        </div>
      </div>

      {/* Time Info */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 rounded-lg bg-muted/10 border border-border/40">
          <div className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider">Elapsed</div>
          <div className="text-sm font-mono text-foreground mt-1.5">{formatTime(elapsedTime)}</div>
        </div>
        <div className="p-3 rounded-lg bg-muted/10 border border-border/40">
          <div className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider">Remaining</div>
          <div className="text-sm font-mono text-primary mt-1.5">~{formatTime(estimatedTimeRemaining)}</div>
        </div>
        <div className="p-3 rounded-lg bg-muted/10 border border-border/40">
          <div className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider">Estimated Total</div>
          <div className="text-sm font-mono text-foreground mt-1.5">{formatTime(elapsedTime + estimatedTimeRemaining)}</div>
        </div>
      </div>

      {/* Current Test */}
      {currentTestName && (
        <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
          <div className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider mb-1.5">
            Currently Running
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-sm text-foreground font-medium truncate">{currentTestName}</span>
          </div>
        </div>
      )}

      {/* Status Indicator */}
      <div className={`px-4 py-2 rounded-lg text-center text-[10px] font-bold uppercase tracking-widest ${
        isRunning ? "bg-primary/10 text-primary animate-pulse" : "bg-success/10 text-success"
      }`}>
        {isRunning ? "🔄 Execution In Progress" : "✅ Execution Complete"}
      </div>
    </div>
  );
}
