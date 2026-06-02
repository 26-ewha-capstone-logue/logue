import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type {
  BarChartViewModel,
  ChartTabViewModel,
} from '@/features/analysis/models/analysisViewModels';

const BAR_COLORS = [
  'var(--color-orange-200)',
  'var(--color-orange-300)',
  'var(--color-orange-400)',
  'var(--color-orange-500)',
  'var(--color-orange-600)',
  'var(--color-orange-700)',
  'var(--color-orange-800)',
];

type BalloonLabelProps = {
  x?: number;
  y?: number;
  width?: number;
  value?: number | string;
};

const BALLOON_W = 30;
const BALLOON_H = 43.571;
const BALLOON_GAP = 6;

function BalloonLabel({ x = 0, y = 0, width = 0, value }: BalloonLabelProps) {
  const cx = x + width / 2;
  const top = y - BALLOON_H - BALLOON_GAP;
  const headR = BALLOON_W / 2;
  const headCy = top + headR;
  const tailTipY = top + BALLOON_H;

  return (
    <g>
      <circle cx={cx} cy={headCy} r={headR} fill="var(--color-orange-500)" />
      <path
        d={`M ${cx - 5} ${headCy + headR - 2} L ${cx} ${tailTipY} L ${cx + 5} ${headCy + headR - 2} Z`}
        fill="var(--color-orange-500)"
      />
      <text
        x={cx}
        y={headCy + 4}
        textAnchor="middle"
        fill="#FFFFFF"
        fontSize="12"
        fontWeight="600"
      >
        {value}
      </text>
    </g>
  );
}

type BarResultChartProps = {
  chart: BarChartViewModel;
  tabResult: ChartTabViewModel;
};

export default function BarResultChart({
  chart,
  tabResult,
}: BarResultChartProps) {
  const rows = tabResult.data;
  const seriesKeys = tabResult.yKeys;
  const hasMultipleSeries = seriesKeys.length > 1;

  return (
    <div className="h-[28rem] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={rows}
          margin={{ top: 56, right: 8, bottom: 0, left: -16 }}
        >
          <CartesianGrid stroke="#ECECEC" vertical={false} />
          <XAxis
            dataKey={chart.xKey}
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: '#999999' }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            domain={[0, 'auto']}
            tick={{ fontSize: 12, fill: '#999999' }}
          />
          <Tooltip />
          {hasMultipleSeries && <Legend />}
          {seriesKeys.map((series, seriesIndex) => {
            const color = BAR_COLORS[seriesIndex % BAR_COLORS.length];
            const showCells = seriesKeys.length === 1;

            return (
              <Bar
                key={series.key}
                dataKey={series.key}
                name={series.name}
                fill={color}
                radius={20}
                maxBarSize={40}
              >
                {showCells &&
                  rows.map((_, index) => (
                    <Cell
                      key={index}
                      fill={BAR_COLORS[index % BAR_COLORS.length]}
                    />
                  ))}
                <LabelList dataKey={series.key} content={<BalloonLabel />} />
              </Bar>
            );
          })}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
