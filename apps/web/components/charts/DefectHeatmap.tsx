"use client";

const zones = Array.from({ length: 6 }).flatMap((_, line) =>
  Array.from({ length: 6 }).map((__, step) => ({
    id: `L${line + 1}-S${step + 1}`,
    defects: Math.floor(Math.random() * 10),
    severity: Math.random(),
  }))
);

function getColor(value: number) {
  const hue = 140 - value * 140;
  return `hsl(${hue}, 70%, 55%)`;
}

export default function DefectHeatmap() {
  return (
    <div className="flex h-full flex-col">
      <div className="mb-4 flex items-center justify-between text-xs text-slate-500">
        <span>Defects per inspection cell</span>
        <div className="flex items-center gap-2">
          <span className="h-2 w-6 rounded-full bg-emerald-300" />
          <span>Low</span>
          <span className="h-2 w-6 rounded-full bg-rose-500" />
          <span>High</span>
        </div>
      </div>
      <div className="grid flex-1 grid-cols-6 gap-2">
        {zones.map((zone) => (
          <div
            key={zone.id}
            className="rounded-lg p-2 text-center text-xs font-semibold text-white shadow-sm"
            style={{ backgroundColor: getColor(zone.severity) }}
          >
            <p>{zone.id}</p>
            <p className="text-[10px] font-normal">{zone.defects} defects</p>
          </div>
        ))}
      </div>
    </div>
  );
}
