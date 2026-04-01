import { RadialBarChart, RadialBar, ResponsiveContainer, PolarAngleAxis } from "recharts";

interface RadialGaugeProps {
  value: number;
  max?: number;
  label: string;
  size?: number;
}

export function RadialGauge({ value, max = 100, label, size = 200 }: RadialGaugeProps) {
  const data = [{ value, fill: "hsl(187, 94%, 43%)" }];

  return (
    <div className="flex flex-col items-center">
      <div style={{ width: size, height: size }} className="relative">
        <ResponsiveContainer>
          <RadialBarChart
            cx="50%" cy="50%"
            innerRadius="75%"
            outerRadius="100%"
            data={data}
            startAngle={225}
            endAngle={-45}
            barSize={12}
          >
            <PolarAngleAxis type="number" domain={[0, max]} angleAxisId={0} tick={false} />
            <RadialBar
              dataKey="value"
              cornerRadius={6}
              background={{ fill: "hsl(217, 33%, 14%)" }}
            />
          </RadialBarChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-heading font-bold text-4xl text-foreground">{value}</span>
          <span className="text-xs text-muted-foreground">/ {max}</span>
        </div>
      </div>
      <span className="text-sm font-medium text-foreground mt-2">{label}</span>
    </div>
  );
}
