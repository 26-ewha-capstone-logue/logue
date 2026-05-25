'use client';

import IntroStartButton from './IntroStartButton';

const HERO_BG = `conic-gradient(
  from -40deg at 81.42% 33.69%,
  var(--color-orange-200) 6.43deg,
  var(--color-orange-400) 13.69deg,
  var(--color-orange-500) 19.25deg,
  var(--color-gray-900) 37.76deg,
  var(--color-gray-900) 46.89deg,
  var(--color-orange-500) 152.33deg,
  var(--color-orange-200) 184.34deg,
  var(--color-orange-400) 197.66deg,
  #5A4022 211.03deg,
  var(--color-gray-900) 221.98deg,
  #111111 242.38deg,
  var(--color-gray-900) 254.14deg,
  #604423 283.93deg,
  #FFA947 342.71deg
)`;

export type IntroHeroSectionProps = {
  onStart: () => void;
};

export default function IntroHeroSection({ onStart }: IntroHeroSectionProps) {
  return (
    <section
      className="relative flex h-screen flex-col justify-center px-[8rem] text-white"
      style={{ background: HERO_BG }}
    >
      <div className="flex max-w-5xl flex-col gap-32">
        <div className="flex flex-col gap-12">
          <h1 className="text-head1 leading-tight">
            Logue는 당신의 가장 스마트한
            <br />
            AI 데이터 분석 파트너입니다.
          </h1>
          <p className="text-body2 text-gray-300">
            당신의 업무 효율을 극대화하는 파트너, Logue.
          </p>
        </div>
        <IntroStartButton onClick={onStart} />
      </div>
    </section>
  );
}
