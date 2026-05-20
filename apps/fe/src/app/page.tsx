'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import PriceIcon from '@/assets/icons/price.svg';
import SuccessIcon from '@/assets/icons/success.svg';
import IntroCarousel from './_components/IntroCarousel';

// 다색 일러스트는 SVGR 변환을 피하기 위해 public/ 정적 자산
const LOGO_SRC = '/illusts/logo.svg';

type IntroNavItem = {
  label: string;
  href: string;
  Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
};

const NAV_ITEMS: IntroNavItem[] = [
  { label: '요금', href: '/pricing', Icon: PriceIcon },
  { label: '서비스', href: '/service', Icon: SuccessIcon },
];

// 시안 conic-gradient 그대로 (from -40deg at 81.42% 33.69%)
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

// 마지막 CTA 카드 배경
const CTA_BG_IMAGE = '/illusts/intro/cta.png';

// 솔루션 카드. (이미지 3장을 순환 매핑)
const SOLUTION_CARDS = [
  {
    id: 'sol-1',
    title: 'Logue의 최신 소식\n을 확인하세요.',
    desc: 'Logue의 최신 소식을 확인하세요.',
    image: '/illusts/intro/solutioncard-1.png',
  },
  {
    id: 'sol-2',
    title: 'Logue의 최신 소식\n을 확인하세요.을 확인...',
    desc: 'Logue의 최신 소식을 확인하세요.Logue의 최신 소식을 확인하세요.Logue의 ...',
    image: '/illusts/intro/solutioncard-2.png',
  },
  {
    id: 'sol-3',
    title: 'Logue의 최신 소식',
    desc: 'Logue의 최신 소식',
    image: '/illusts/intro/solutioncard-3.png',
  },
  {
    id: 'sol-4',
    title: 'Logue의 최신 소식\n을 확인하세요.',
    desc: 'Logue의 최신 소식\n을 확인하세요.',
    image: '/illusts/intro/solutioncard-1.png',
  },
  {
    id: 'sol-5',
    title: 'Logue의 최신 소식\n을 확인하세요.',
    desc: 'Logue의 최신 소식\n을 확인하세요.',
    image: '/illusts/intro/solutioncard-2.png',
  },
];

// 최신 소식 카드. (이미지 1장 반복)
const NEWS_CARDS = [
  {
    id: 'news-1',
    tag: '라벨라벨',
    title: '[업데이트] Logue 정식 서비스 런칭\n및 신규 시각화 차트 추가',
    image: '/illusts/intro/newcard-1.png',
  },
  {
    id: 'news-2',
    tag: '라벨라벨',
    title: '[업데이트] Logue 정식 서비스 런칭\n및 신규 시각화 차트 추가',
    image: '/illusts/intro/newcard-1.png',
  },
  {
    id: 'news-3',
    tag: '라벨라벨',
    title: '[업데이트] Logue 정식 서비스 런칭\n및 신규 시각화 차트 추가',
    image: '/illusts/intro/newcard-1.png',
  },
];

export default function IntroPage() {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);

  // hero(=뷰포트 1개) 만큼 스크롤되면 헤더가 흰 배경 + 그림자로 전환됨
  useEffect(() => {
    const update = () => {
      const threshold = window.innerHeight - 80; // 헤더 높이 정도 미리 트리거
      setScrolled(window.scrollY > threshold);
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, []);

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header: hero 위에서는 반투명+블러, 스크롤 후엔 흰 배경 */}
      <header
        style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50 }}
        className={`flex items-center px-32 py-16 transition-colors duration-200 ${
          scrolled
            ? 'bg-white shadow-[0_0.1rem_0.4rem_rgba(0,0,0,0.06)]'
            : 'bg-[rgba(17,17,17,0.20)] shadow-[0_0.1rem_1.2rem_rgba(252,131,32,0.20)] backdrop-blur-[0.71rem]'
        }`}
      >
        {/* 로고 */}
        <button
          type="button"
          onClick={() => router.push('/')}
          className="mr-24 flex shrink-0 items-center gap-8"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={LOGO_SRC} alt="Logue" className="h-28 w-auto" />
        </button>

        {/* nav */}
        <nav className="flex items-center gap-20">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.href}
              type="button"
              onClick={() => router.push(item.href)}
              className="flex items-center gap-8"
            >
              <item.Icon
                aria-hidden
                className={`icon-20 transition-colors ${
                  scrolled ? 'text-gray-400' : 'text-white/60'
                }`}
              />
              <span
                className={`text-body2 transition-colors ${
                  scrolled ? 'text-gray-800' : 'text-white'
                }`}
              >
                {item.label}
              </span>
            </button>
          ))}
        </nav>

        {/* 우측 액션 */}
        <div className="ml-auto flex items-center gap-20">
          <button
            type="button"
            onClick={() => router.push('/login')}
            className={`text-body2 underline underline-offset-2 transition-colors ${
              scrolled
                ? 'text-gray-900 hover:text-gray-700'
                : 'text-white hover:text-white/80'
            }`}
          >
            로그인
          </button>
          <button
            type="button"
            onClick={() => router.push('/onboarding')}
            className={`rounded-full px-20 py-8 text-body2 font-medium transition-colors ${
              scrolled
                ? 'bg-orange-500 text-white hover:bg-orange-600'
                : 'bg-white text-gray-900 hover:bg-gray-100'
            }`}
          >
            회원가입
          </button>
        </div>
      </header>

      {/* Hero Section */}
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
          <button
            type="button"
            onClick={() => router.push('/analysis')}
            className="self-start rounded-full bg-orange-500 px-24 py-12 text-body2 font-semibold text-white transition-colors hover:bg-orange-600"
          >
            Logue 체험하기
          </button>
        </div>
      </section>

      {/* 스마트한 분석 솔루션 캐러셀 */}
      <div className="bg-white pt-[8rem] pb-[6rem]">
        <IntroCarousel
          description="데이터 분석의 복잡함을 고려한"
          title={
            <>
              <span className="text-orange-500">스마트한 분석 솔루션</span>을
              제안합니다.
            </>
          }
          scrollAmount={480}
          cards={SOLUTION_CARDS.map((card) => (
            <SolutionCard
              key={card.id}
              title={card.title}
              desc={card.desc}
              image={card.image}
            />
          ))}
        />
      </div>

      {/* Logue의 최신 소식 캐러셀 */}
      <div className="bg-white pt-[6rem] pb-[8rem]">
        <IntroCarousel
          title={
            <>
              <strong className="font-bold">Logue의 최신 소식</strong>을
              확인하세요.
            </>
          }
          scrollAmount={500}
          cards={NEWS_CARDS.map((card) => (
            <NewsCard
              key={card.id}
              tag={card.tag}
              title={card.title}
              image={card.image}
            />
          ))}
        />
      </div>

      {/* 마지막 CTA */}
      <section className="bg-white px-[8rem] pb-[8rem]">
        <div
          className="relative h-[33.3rem]"
          style={{
            borderRadius: '2rem',
            overflow: 'hidden',
            isolation: 'isolate',
          }}
        >
          {/* 배경 이미지 레이어 */}
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
          {/* 콘텐츠 레이어 */}
          <div
            className="flex h-full flex-col justify-center gap-20 px-32 py-32"
            style={{ position: 'relative', zIndex: 1 }}
          >
            <h2 className="text-head2 text-white">
              Logue는 당신의 가장 스마트한
              <br />
              AI 데이터 분석 파트너입니다.
            </h2>
            <button
              type="button"
              onClick={() => router.push('/analysis')}
              className="self-start rounded-full bg-orange-500 px-24 py-12 text-body2 font-semibold text-white transition-colors hover:bg-orange-600"
            >
              Logue 체험하기
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

/** 스마트 솔루션 캐러셀의 작은 카드. 배경에 일러스트 이미지를 cover 로 깐다. */
function SolutionCard({
  title,
  desc,
  image,
}: {
  title: string;
  desc: string;
  image: string;
}) {
  return (
    <div
      className="relative flex h-[30rem] w-[30rem] flex-col justify-end overflow-hidden rounded-12 p-20"
      style={{
        backgroundImage: `url(${image})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <div className="flex flex-col gap-4">
        <p className="whitespace-pre-line text-body2 font-semibold text-white">
          {title}
        </p>
        <p className="line-clamp-2 whitespace-pre-line text-body4 text-white/70">
          {desc}
        </p>
      </div>
    </div>
  );
}

/** 최신 소식 캐러셀의 큰 카드. */
function NewsCard({
  tag,
  title,
  image,
}: {
  tag: string;
  title: string;
  image: string;
}) {
  return (
    <div
      className="relative flex h-[32rem] w-[60rem] flex-col justify-between overflow-hidden rounded-16 p-24"
      style={{
        backgroundImage: `url(${image})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <span className="inline-flex w-fit items-center rounded-full bg-white/90 px-12 py-4 text-body4 text-gray-900">
        {tag}
      </span>
      <p className="whitespace-pre-line text-body3 font-semibold text-white">
        {title}
      </p>
    </div>
  );
}
