'use client';

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
  // 시간 인사말은 서버 시간과 클라이언트 시간이 다를 수 있어
  // hydration mismatch 가 발생할 수 있으나 의도된 동작이므로 suppressHydrationWarning 으로 무시
  const greeting = getGreetingByHour(new Date().getHours());

  return (
    <div className="mt-[6.7rem] text-center">
      <h1 className="text-head1 text-gray-900" suppressHydrationWarning>
        {greeting}. {userName}님
      </h1>
      <p className="mt-8 text-head1 text-gray-900">분석을 시작해볼까요?</p>
    </div>
  );
}
