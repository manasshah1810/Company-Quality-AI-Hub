import { X, Copy, Code2 } from "lucide-react";

interface ToolIntegrationModalProps {
  tool: "JMeter" | "k6" | "Locust" | null;
  onClose: () => void;
}

export function ToolIntegrationModal({ tool, onClose }: ToolIntegrationModalProps) {
  if (!tool) return null;

  const toolConfigs: Record<string, { description: string; command: string; docs: string }> = {
    JMeter: {
      description: "Apache JMeter can directly load test this platform. Export your simulation configuration as a .jmx test plan and run it against the performance endpoint.",
      command: "jmeter -n -t simulation.jmx -l results.jtl -j jmeter.log -Jbase_url=https://qai-hub.example.com",
      docs: "Configure HTTP Request Defaults in Thread Group → Change 'Concurrency' field to match your load scenario (1K, 10K, 50K, 100K)."
    },
    k6: {
      description: "k6 is a modern load testing tool with JavaScript SDK. You can import our performance test definitions directly into k6.",
      command: "k6 run --vus 10000 --duration 5m performance-test.js --out csv=results.csv",
      docs: "k6 test script template available: Define virtual users (VUs), ramp-up duration, and thresholds. All results are collected and can be exported to CSV."
    },
    Locust: {
      description: "Locust provides a Python-based load testing framework. Define your test scenarios as Python classes for distributed testing across multiple machines.",
      command: "locust -f locustfile.py -u 50000 -r 1000 --host=https://qai-hub.example.com --csv=results",
      docs: "Create Locust TaskSet with API endpoints matching your tenant's active test suites. Automatic request distribution across simulated users."
    }
  };

  const config = toolConfigs[tool];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-md px-4 animate-in fade-in">
      <div className="glass-strong rounded-2xl w-full max-w-2xl border border-primary/30 bg-primary/5 shadow-glow-primary animate-in zoom-in-95">
        {/* Header */}
        <div className="p-6 border-b border-primary/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20">
              <Code2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-heading font-bold text-lg text-foreground">{tool} Integration Setup</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Ready-to-use configuration for enterprise-grade load testing</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-muted/20 transition-all"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Description */}
          <div>
            <h3 className="text-xs font-bold text-foreground uppercase tracking-widest mb-2">Overview</h3>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              {config.description}
            </p>
          </div>

          {/* Command */}
          <div>
            <h3 className="text-xs font-bold text-foreground uppercase tracking-widest mb-2 flex items-center gap-2">
              <Code2 className="w-3.5 h-3.5 text-primary" /> Quick Start Command
            </h3>
            <div className="p-4 rounded-xl bg-black/60 border border-white/10 font-mono text-[9px] text-green-400 relative group">
              <pre className="whitespace-pre-wrap break-all">{config.command}</pre>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(config.command);
                }}
                className="absolute top-2 right-2 p-1.5 rounded bg-white/10 hover:bg-white/20 transition-all opacity-0 group-hover:opacity-100"
                title="Copy to clipboard"
              >
                <Copy className="w-3 h-3 text-muted-foreground" />
              </button>
            </div>
          </div>

          {/* Documentation */}
          <div>
            <h3 className="text-xs font-bold text-foreground uppercase tracking-widest mb-2">Configuration Guide</h3>
            <div className="p-4 rounded-xl bg-success/5 border border-success/20">
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                {config.docs}
              </p>
            </div>
          </div>

          {/* Integration Status */}
          <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
            <p className="text-[10px] text-muted-foreground flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-success" />
              <span><strong className="text-primary">{tool} Ready:</strong> This platform exposes standard HTTP endpoints compatible with {tool}. Your load test results can be imported back into our Performance Dashboard for analysis.</span>
            </p>
          </div>

          {/* Performance Endpoint Info */}
          <div>
            <h3 className="text-xs font-bold text-foreground uppercase tracking-widest mb-2">API Endpoint</h3>
            <div className="p-3 rounded-lg bg-black/40 border border-white/10 font-mono text-[10px] text-foreground flex items-center justify-between">
              <span>POST /api/performance/simulate</span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText("POST /api/performance/simulate");
                }}
                className="p-1 rounded hover:bg-white/10 transition-all"
              >
                <Copy className="w-3 h-3 text-muted-foreground" />
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-muted/20 text-foreground text-xs font-bold hover:bg-muted/30 transition-all"
          >
            Close
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/80 transition-all uppercase tracking-widest"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
}
