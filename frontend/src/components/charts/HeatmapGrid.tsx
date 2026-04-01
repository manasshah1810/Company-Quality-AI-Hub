interface HeatmapGridProps {
  data: { day: string; hour: number; failures: number }[];
}

export function HeatmapGrid({ data }: HeatmapGridProps) {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const maxVal = Math.max(...data.map(d => d.failures));

  const getColor = (val: number) => {
    const ratio = val / maxVal;
    if (ratio < 0.25) return "bg-success/20";
    if (ratio < 0.5) return "bg-success/40";
    if (ratio < 0.7) return "bg-warning/40";
    if (ratio < 0.85) return "bg-warning/60";
    return "bg-destructive/60";
  };

  return (
    <div className="glass rounded-xl p-5">
      <h3 className="font-heading font-semibold text-sm text-foreground mb-4">Test Failure Heatmap (Day × Hour)</h3>
      <div className="overflow-x-auto scrollbar-thin">
        <div className="min-w-[600px]">
          {/* Hour labels */}
          <div className="flex ml-10 mb-1">
            {Array.from({ length: 24 }, (_, h) => (
              <div key={h} className="flex-1 text-center text-[9px] text-muted-foreground font-mono">{h}</div>
            ))}
          </div>
          {days.map(day => (
            <div key={day} className="flex items-center gap-1 mb-0.5">
              <span className="w-9 text-[10px] text-muted-foreground font-mono">{day}</span>
              {Array.from({ length: 24 }, (_, h) => {
                const cell = data.find(d => d.day === day && d.hour === h);
                return (
                  <div
                    key={h}
                    className={`flex-1 h-5 rounded-sm ${getColor(cell?.failures ?? 0)} transition-colors`}
                    title={`${day} ${h}:00 — ${cell?.failures ?? 0} failures`}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-3 mt-3 text-[10px] text-muted-foreground">
        <span>Low</span>
        <div className="flex gap-0.5">
          <div className="w-4 h-3 rounded-sm bg-success/20" />
          <div className="w-4 h-3 rounded-sm bg-success/40" />
          <div className="w-4 h-3 rounded-sm bg-warning/40" />
          <div className="w-4 h-3 rounded-sm bg-warning/60" />
          <div className="w-4 h-3 rounded-sm bg-destructive/60" />
        </div>
        <span>High</span>
      </div>
    </div>
  );
}
