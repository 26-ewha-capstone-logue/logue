'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts';
import ChatIcon from '@/assets/icons/chat.svg';
import TrashIcon from '@/assets/icons/trash.svg';

export type DataChartPoint = { name: string; value: number };

export type DataChartCardProps = {
  fileName: string;
  fileSize: string;
  uploadedAt: string;
  data?: DataChartPoint[];
  onChat?: () => void;
  onDelete?: () => void;
};

// TODO: 실제 검증 데이터로 교체. 현재는 시안 더미.
const DEFAULT_DATA: DataChartPoint[] = [
  { name: '이름1', value: 120 },
  { name: '이름2', value: 200 },
  { name: '이름3', value: 150 },
  { name: '이름4', value: 80 },
  { name: '이름5', value: 70 },
  { name: '이름6', value: 110 },
  { name: '이름7', value: 130 },
  { name: '이름8', value: 100 },
  { name: '이름9', value: 125 },
  { name: '이름10', value: 230 },
];

const BAR_COLORS = [
  'var(--color-orange-100)',
  'var(--color-orange-300)',
  'var(--color-orange-200)',
  'var(--color-orange-400)',
  'var(--color-orange-200)',
  'var(--color-orange-400)',
  'var(--color-orange-600)',
  'var(--color-orange-400)',
  'var(--color-orange-700)',
  'var(--color-orange-300)',
];

// 풍선 라벨 시안: 3rem × 4.3571rem (1rem = 10px → 30 × 43.571px)
const BALLOON_W = 30;
const BALLOON_H = 43.571;
const BALLOON_GAP = 6;

type BalloonLabelProps = {
  x?: number;
  y?: number;
  width?: number;
  value?: number | string;
};

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

export default function DataChartCard({
  fileName,
  fileSize,
  uploadedAt,
  data = DEFAULT_DATA,
  onChat,
  onDelete,
}: DataChartCardProps) {
  return (
    <div className="mx-auto flex min-h-[50rem] w-full max-w-[130rem] flex-1 flex-col gap-16 rounded-12 border border-gray-300 p-24">
      {/* 헤더: 파일 정보 + 액션 버튼 */}
      <div className="flex items-start justify-between gap-16">
        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <p className="truncate text-body3 font-semibold text-gray-900">
            {fileName}
          </p>
          <p className="text-body4 text-gray-500">
            {fileSize} | {uploadedAt}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-12">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onChat?.();
            }}
            className="inline-flex items-center gap-4 rounded-full bg-orange-500 px-12 py-8 text-body4 font-medium text-white transition-colors hover:bg-orange-600"
          >
            <ChatIcon aria-hidden className="icon-12 text-white" />
            <span>채팅</span>
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete?.();
            }}
            aria-label="삭제"
            className="text-gray-500 transition-colors hover:text-error-500"
          >
            <TrashIcon aria-hidden className="icon-16 text-gray-500" />
          </button>
        </div>
      </div>

      {/* 차트 */}
      <div className="min-h-0 w-full flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            barCategoryGap="20%"
            margin={{ top: 56, right: 8, bottom: 0, left: -8 }}
          >
            <CartesianGrid stroke="#ECECEC" vertical={false} />
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#999999' }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              ticks={[0, 50, 100, 150, 200, 250]}
              domain={[0, 250]}
              tick={{ fontSize: 12, fill: '#999999' }}
            />
            <Bar dataKey="value" radius={20} maxBarSize={56}>
              {data.map((_, i) => (
                <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
              ))}
              <LabelList dataKey="value" content={<BalloonLabel />} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
