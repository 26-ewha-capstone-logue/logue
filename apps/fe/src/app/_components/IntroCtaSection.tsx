'use client';

import IntroStartButton from './IntroStartButton';

const CTA_BG_IMAGE = '/illusts/intro/cta.png';

export type IntroCtaSectionProps = {
  onStart: () => void;
};

export default function IntroCtaSection({ onStart }: IntroCtaSectionProps) {
  return (
    <section className="bg-white px-[8rem] pb-[8rem]">
      <div
        className="relative h-[33.3rem]"
        style={{
          borderRadius: '2rem',
          overflow: 'hidden',
          isolation: 'isolate',
        }}
      >
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: 'inherit',
            backgroundImage: `url(${CTA_BG_IMAGE})`,
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
          }}
        />
        <div
          className="flex h-full flex-col justify-center gap-20 px-32 py-32"
          style={{ position: 'relative', zIndex: 1 }}
        >
          <h2 className="text-head2 text-white">
            Logue는 당신의 가장 스마트한
            <br />
            AI 데이터 분석 파트너입니다.
          </h2>
          <IntroStartButton onClick={onStart} />
        </div>
      </div>
    </section>
  );
}
