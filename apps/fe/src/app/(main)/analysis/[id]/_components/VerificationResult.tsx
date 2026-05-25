'use client';

import { useState } from 'react';
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
import AlertIcon from '@/assets/icons/alert.svg';
import type {
  BarChartViewModel,
  QuestionResultViewModel,
} from '../_models/analysisViewModels';

export type VerificationResultProps = {
  result: QuestionResultViewModel;
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

function getActiveTabResult(chart: BarChartViewModel, tab: string) {
  return (
    chart.tabResults.find((item) => item.name === tab) ?? chart.tabResults[0]
  );
}

export default function VerificationResult({
  result,
}: VerificationResultProps) {
  const [tab, setTab] = useState(() =>
    result.chart.type === 'bar' ? result.chart.defaultTab : '',
  );
  const chart = result.chart;
  const activeTabResult =
    chart.type === 'bar' ? getActiveTabResult(chart, tab) : null;
  const rows = activeTabResult?.data ?? [];
  const seriesKeys = activeTabResult?.yKeys ?? [];
  const unit = activeTabResult?.unit ?? '';
  const hasMultipleSeries = seriesKeys.length > 1;

  return (
    <div className="flex w-full flex-col gap-20 rounded-20 bg-white p-24 shadow-[0_0.2rem_1.2rem_rgba(0,0,0,0.06)]">
      <div className="flex flex-col gap-4">
        <p className="text-body3 font-semibold text-gray-900">{result.title}</p>
        <p className="text-body2 text-gray-900">{result.insight}</p>
      </div>

      {result.criteriaItems.length > 0 && (
        <div className="flex flex-col gap-4 text-body2 text-gray-900">
          {result.criteriaItems.map(({ label, value }) => (
            <p key={label}>
              <span className="font-semibold">{label}:</span> {value}
            </p>
          ))}
        </div>
      )}

      <div className="rounded-12 border-2 border-gray-300 bg-white p-16">
        {chart.type === 'bar' && chart.tabs.length > 1 && (
          <div className="mb-16 flex gap-24">
            {chart.tabs.map((key) => {
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
                  {key}
                  {active && (
                    <span className="absolute right-0 bottom-0 left-0 h-2 rounded-full bg-gray-800" />
                  )}
                </button>
              );
            })}
          </div>
        )}

        {unit && (
          <p className="mb-8 text-right text-body4 text-gray-600">
            단위: {unit}
          </p>
        )}

        {chart.type === 'empty' ||
        rows.length === 0 ||
        seriesKeys.length === 0 ? (
          <div className="flex h-[28rem] items-center justify-center text-body2 text-gray-600">
            {chart.type === 'empty'
              ? chart.message
              : '표시할 차트 데이터가 없습니다.'}
          </div>
        ) : (
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
                      <LabelList
                        dataKey={series.key}
                        content={<BalloonLabel />}
                      />
                    </Bar>
                  );
                })}
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {result.warnings.length > 0 && (
        <div className="flex flex-col gap-8">
          <div className="inline-flex items-center gap-4 text-body2 font-semibold text-orange-500">
            <AlertIcon aria-hidden className="icon-16 text-orange-500" />
            <span>데이터 경고</span>
          </div>
          <ul className="ml-20 flex list-disc flex-col gap-8 text-body2 text-gray-900">
            {result.warnings.map((warning) => (
              <li key={`${warning.code}-${warning.message}`}>
                {warning.message}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
