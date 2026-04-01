import { AlertCircle, CheckCircle2 } from "lucide-react";

interface VisualDiffLine {
  type: "add" | "remove" | "context";
  content: string;
  lineNum?: number;
}

interface VisualDiffViewerProps {
  baselineLabel?: string;
  candidateLabel?: string;
  baseline: string;
  candidate: string;
}

export function VisualDiffViewer({
  baselineLabel = "Expected",
  candidateLabel = "Actual",
  baseline,
  candidate
}: VisualDiffViewerProps) {
  // Simple character-level diff
  const getDiffLines = (): VisualDiffLine[] => {
    const lines: VisualDiffLine[] = [];

    // Check if the values are identical
    if (baseline === candidate) {
      return [{ type: "context", content: baseline }];
    }

    // Character-by-character highlighting
    const maxLen = Math.max(baseline.length, candidate.length);
    let baselineDisplay = baseline;
    let candidateDisplay = candidate;

    // If both are strings with numeric values, highlight the differences
    if (/^\$?[\d,]+(?:\.\d{2})?$/.test(baseline.replace(/\$/g, "")) &&
        /^\$?[\d,]+(?:\.\d{2})?$/.test(candidate.replace(/\$/g, ""))) {
      baselineDisplay = baseline;
      candidateDisplay = candidate;
    }

    return [
      { type: "context", content: baselineDisplay },
      { type: "context", content: candidateDisplay }
    ];
  };

  return (
    <div className="space-y-3">
      <div className="text-xs font-bold text-foreground uppercase tracking-widest mb-3">
        Test Case Output Comparison
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Baseline */}
        <div className="rounded-lg overflow-hidden border border-success/30 bg-success/5">
          <div className="p-2 bg-success/10 border-b border-success/30 flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-success" />
            <span className="text-[9px] font-bold text-success uppercase tracking-wider">{baselineLabel}</span>
          </div>
          <div className="p-3 font-mono text-sm">
            <div className="text-success font-bold break-all">{baseline}</div>
            <div className="text-[8px] text-muted-foreground mt-2 font-normal">
              Source: Human-Verified Ground Truth
            </div>
          </div>
        </div>

        {/* Candidate */}
        <div className="rounded-lg overflow-hidden border border-destructive/30 bg-destructive/5">
          <div className="p-2 bg-destructive/10 border-b border-destructive/30 flex items-center gap-2">
            <AlertCircle className="w-3.5 h-3.5 text-destructive" />
            <span className="text-[9px] font-bold text-destructive uppercase tracking-wider">{candidateLabel}</span>
          </div>
          <div className="p-3 font-mono text-sm">
            <div className="text-destructive font-bold break-all">{candidate}</div>
            <div className="text-[8px] text-muted-foreground mt-2 font-normal">
              Source: AI Model v2.4
            </div>
          </div>
        </div>
      </div>

      {/* Diff Analysis */}
      <div className="p-3 rounded-lg bg-muted/20 border border-border/40">
        <div className="text-[9px] font-bold text-foreground uppercase tracking-widest mb-2">
          Difference Analysis
        </div>
        <div className="grid grid-cols-3 gap-2 text-[8px]">
          <div>
            <span className="text-muted-foreground">Type:</span>
            <span className="font-mono text-foreground ml-1">Value Mismatch</span>
          </div>
          <div>
            <span className="text-muted-foreground">Impact:</span>
            <span className="font-mono text-destructive ml-1 font-bold">$2,650 Error</span>
          </div>
          <div>
            <span className="text-muted-foreground">Confidence:</span>
            <span className="font-mono text-destructive ml-1">-6% drop</span>
          </div>
        </div>
      </div>

      {/* Character Highlighting */}
      <div className="p-3 rounded-lg bg-black/20 border border-white/5">
        <div className="text-[9px] font-bold text-foreground uppercase tracking-widest mb-2">
          Character-Level Diff
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-[9px]">
            <span className="text-muted-foreground">Expected:</span>
            <code className="font-mono text-success font-bold">
              <span className="bg-success/30 px-1 rounded">15100</span>
            </code>
          </div>
          <div className="flex items-center gap-2 text-[9px]">
            <span className="text-muted-foreground">Got:</span>
            <code className="font-mono text-destructive font-bold">
              <span className="bg-destructive/30 px-1 rounded">12450</span>
            </code>
          </div>
        </div>
      </div>
    </div>
  );
}
