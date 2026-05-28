'use client';

import { useState } from 'react';
import type {
  BarChartViewModel,
  ChartViewModel,
} from '../_models/analysisViewModels';
import BarResultChart from './BarResultChart';

type ResultChartPanelProps = {
  chart: ChartViewModel;
};

function getActiveTabResult(chart: BarChartViewModel, tab: string) {
  return (
    chart.tabResults.find((item) => item.name === tab) ?? chart.tabResults[0]
  );
}

function EmptyChartMessage({ message }: { message: string }) {
  return (
    <div className="flex h-[28rem] items-center justify-center text-body2 text-gray-600">
      {message}
    </div>
  );
}

export default function ResultChartPanel({ chart }: ResultChartPanelProps) {
  const [tab, setTab] = useState(() =>
    chart.type === 'bar' ? chart.defaultTab : '',
  );
  const activeTabResult =
    chart.type === 'bar' ? getActiveTabResult(chart, tab) : null;
  const rows = activeTabResult?.data ?? [];
  const seriesKeys = activeTabResult?.yKeys ?? [];
  const unit = activeTabResult?.unit ?? '';

  return (
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
        <p className="mb-8 text-right text-body4 text-gray-600">단위: {unit}</p>
      )}

      {chart.type === 'empty' ? (
        <EmptyChartMessage message={chart.message} />
      ) : !activeTabResult || rows.length === 0 || seriesKeys.length === 0 ? (
        <EmptyChartMessage message="표시할 차트 데이터가 없습니다." />
      ) : (
        <BarResultChart chart={chart} tabResult={activeTabResult} />
      )}
    </div>
  );
}
