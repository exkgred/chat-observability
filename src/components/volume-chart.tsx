import { formatDay } from '@/lib/format';

interface VolumeChartProps {
  series: { date: string; count: number }[];
}

export function VolumeChart({ series }: VolumeChartProps) {
  if (series.length === 0) {
    return (
      <div className="rounded-2xl border border-white/5 bg-ink-800/80 p-5">
        <h2 className="text-sm font-semibold text-white">Volume de conversas</h2>
        <p className="mt-8 text-center text-sm text-ink-500">Sem dados nesta janela.</p>
      </div>
    );
  }

  const width = 640;
  const height = 180;
  const padX = 12;
  const padY = 16;
  const max = Math.max(1, ...series.map((point) => point.count));
  const innerW = width - padX * 2;
  const innerH = height - padY * 2;
  const step = series.length > 1 ? innerW / (series.length - 1) : 0;

  const points = series.map((point, index) => {
    const x = padX + index * step;
    const y = padY + innerH - (point.count / max) * innerH;
    return { x, y, ...point };
  });

  const line = points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');
  const area = `${line} L ${points[points.length - 1]?.x ?? padX} ${height - padY} L ${padX} ${height - padY} Z`;

  return (
    <div className="rounded-2xl border border-white/5 bg-ink-800/80 p-5">
      <div className="mb-4 flex items-end justify-between">
        <div>
          <h2 className="text-sm font-semibold text-white">Volume de conversas</h2>
          <p className="text-xs text-ink-500">Últimos {series.length} dias · America/São Paulo</p>
        </div>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="h-44 w-full" role="img" aria-label="Gráfico de volume">
        <defs>
          <linearGradient id="areaFill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#4f8ef7" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#7c5af7" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#areaFill)" />
        <path d={line} fill="none" stroke="#4f8ef7" strokeWidth="2.5" />
        {points.map((point) => (
          <circle key={point.date} cx={point.x} cy={point.y} r="3" fill="#d5dbe8" />
        ))}
      </svg>
      <div className="mt-1 flex justify-between text-[11px] text-ink-500">
        <span>{series[0] ? formatDay(series[0].date) : ''}</span>
        <span>{series[series.length - 1] ? formatDay(series[series.length - 1].date) : ''}</span>
      </div>
    </div>
  );
}
