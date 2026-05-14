'use client';

import { useState } from 'react';
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
import AlertIcon from '@/assets/icons/alert.svg';

export type ChartDataPoint = { name: string; value: number };

export type VerificationResultProps = {
  title?: string;
  description?: string;
  channelList?: string[];
  deviceList?: string[];
  channelData?: ChartDataPoint[];
  deviceData?: ChartDataPoint[];
  warnings?: string[];
};

const BAR_COLORS = [
  'var(--color-orange-200)',
  'var(--color-orange-300)',
  'var(--color-orange-400)',
  'var(--color-orange-500)',
  'var(--color-orange-600)',
  'var(--color-orange-700)',
  'var(--color-orange-800)',
];

const DEFAULT_CHANNEL_DATA: ChartDataPoint[] = [
  { name: '이름1', value: 120 },
  { name: '이름1', value: 200 },
  { name: '이름3', value: 150 },
  { name: '이름1', value: 80 },
  { name: '이름5', value: 60 },
  { name: '이름1', value: 110 },
  { name: '이름', value: 130 },
];

const DEFAULT_DEVICE_DATA: ChartDataPoint[] = [
  { name: '이름1', value: 120 },
  { name: '이름1', value: 200 },
  { name: '이름3', value: 150 },
  { name: '이름1', value: 80 },
  { name: '이름5', value: 60 },
  { name: '이름1', value: 110 },
  { name: '이름', value: 130 },
];

const DEFAULT_WARNINGS = [
  '날짜 기준을 하나로 정할 수 없어요. 어떤 날짜를 기준으로 볼지 선택해 주세요.',
  '현재 질문에 필요한 항목이 이 데이터에 없어요. 없는 항목은 다른 기준으로 바꿔서 계속할 수 있어요.',
  '분석에 필요한 값이 일부 비어 있어서, 결과가 달라질 수 있어요. 해당 항목을 확인하고 계속할지 선택해 주세요. (칼럼명1, 칼럼명2)',
];

type BalloonLabelProps = {
  x?: number;
  y?: number;
  width?: number;
  value?: number | string;
};

// 풍선 시안 크기: 3rem × 4.3571rem (1rem = 10px → 30 × 43.571px)
const BALLOON_W = 30;
const BALLOON_H = 43.571;
const BALLOON_GAP = 6; // 막대와 풍선 꼬리 끝 사이 여유

function BalloonLabel({ x = 0, y = 0, width = 0, value }: BalloonLabelProps) {
  const cx = x + width / 2;
  // 풍선 전체 박스 (cx 기준 가운데 정렬)
  const top = y - BALLOON_H - BALLOON_GAP;
  const headR = BALLOON_W / 2;
  const headCy = top + headR;
  const tailTipY = top + BALLOON_H;
  return (
    <g>
      {/* 위쪽 원형 머리 */}
      <circle cx={cx} cy={headCy} r={headR} fill="var(--color-orange-500)" />
      {/* 아래쪽 꼬리 (둥근 핀 모양) */}
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

type TabKey = 'channel' | 'device';

export default function VerificationResult({
  title = '검증이 완료되었어요.',
  description = '가입 전환율이 지난주 대비 낮은 순으로 채널/디바이스를 나열했어요.',
  channelList = ['iOS', 'Android', 'CRM', '콜드메일', '사이트 직접 탐색'],
  deviceList = ['iOS', 'Android', 'CRM', '콜드메일', '사이트 직접 탐색'],
  channelData = DEFAULT_CHANNEL_DATA,
  deviceData = DEFAULT_DEVICE_DATA,
  warnings = DEFAULT_WARNINGS,
}: VerificationResultProps) {
  const [tab, setTab] = useState<TabKey>('device');
  const data = tab === 'channel' ? channelData : deviceData;

  return (
    <div className="flex w-full flex-col gap-20 rounded-20 bg-white p-24 shadow-[0_0.2rem_1.2rem_rgba(0,0,0,0.06)]">
      {/* 헤더 */}
      <div className="flex flex-col gap-4">
        <p className="text-body3 font-semibold text-gray-900">{title}</p>
        <p className="text-body2 text-gray-900">{description}</p>
      </div>

      {/* 채널 / 디바이스 리스트 */}
      <div className="flex flex-col gap-4 text-body2 text-gray-900">
        <p>
          <span className="font-semibold">채널:</span> {channelList.join(', ')}
        </p>
        <p>
          <span className="font-semibold">디바이스 :</span>{' '}
          {deviceList.join(', ')}
        </p>
      </div>

      {/* 차트 카드 */}
      <div className="rounded-12 border-2 border-gray-300 bg-white p-16">
        {/* 탭 */}
        <div className="mb-16 flex gap-24">
          {(['channel', 'device'] as const).map((key) => {
            const active = tab === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setTab(key)}
                className={`relative pb-8 text-body2 transition-colors ${
                  active
                    ? 'font-semibold text-gray-900'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {key === 'channel' ? '채널' : '디바이스'}
                {active && (
                  <span className="absolute right-0 bottom-0 left-0 h-2 rounded-full bg-gray-800" />
                )}
              </button>
            );
          })}
        </div>

        {/* 막대 차트 */}
        <div className="h-[28rem] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 56, right: 8, bottom: 0, left: -16 }}
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
                ticks={[0, 50, 100, 150, 200]}
                domain={[0, 200]}
                tick={{ fontSize: 12, fill: '#999999' }}
              />
              <Bar dataKey="value" radius={20} maxBarSize={40}>
                {data.map((_, i) => (
                  <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                ))}
                <LabelList dataKey="value" content={<BalloonLabel />} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 데이터 경고 */}
      <div className="flex flex-col gap-8">
        <div className="inline-flex items-center gap-4 text-body2 font-semibold text-orange-500">
          <AlertIcon aria-hidden className="icon-16 text-orange-500" />
          <span>데이터 경고</span>
        </div>
        <ul className="ml-20 flex list-disc flex-col gap-8 text-body2 text-gray-900">
          {warnings.map((w, i) => (
            <li key={i}>{w}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
