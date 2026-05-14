'use client';

import { useEffect, useState } from 'react';

export type GreetingSectionProps = {
  userName: string;
};

function getGreetingByHour(hour: number) {
  if (hour < 6) return '좋은 새벽이에요';
  if (hour < 12) return '좋은 아침이에요';
  if (hour < 18) return '좋은 오후예요';
  return '좋은 저녁이에요';
}

export default function GreetingSection({ userName }: GreetingSectionProps) {
  // SSR/CSR 간 시간대 차이로 인한 hydration mismatch 방지를 위해 마운트 후 갱신
  const [greeting, setGreeting] = useState(() =>
    getGreetingByHour(new Date().getHours()),
  );

  useEffect(() => {
    setGreeting(getGreetingByHour(new Date().getHours()));
  }, []);

  return (
    <div className="text-center">
      <h1 className="text-head1 text-gray-900">
        {greeting}. {userName}님
      </h1>
      <p className="mt-8 text-head1 text-gray-900">분석을 시작해볼까요?</p>
    </div>
  );
}
