'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { NewsCard, SolutionCard } from './_components/IntroCards';
import IntroCarousel from './_components/IntroCarousel';
import IntroCtaSection from './_components/IntroCtaSection';
import IntroHeader from './_components/IntroHeader';
import IntroHeroSection from './_components/IntroHeroSection';
import {
  OAUTH_LOGIN_POPUP_BLOCKED_MESSAGE,
  startOAuthLogin,
} from '@/lib/authRedirect';

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

  const goToLogin = () => {
    if (startOAuthLogin() !== 'opened') {
      window.alert(OAUTH_LOGIN_POPUP_BLOCKED_MESSAGE);
    }
  };

  const goToAnalysis = () => {
    router.push('/analysis');
  };

  useEffect(() => {
    const update = () => {
      const threshold = window.innerHeight - 80;
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
      <IntroHeader
        scrolled={scrolled}
        onLogoClick={() => router.push('/')}
        onLoginClick={goToLogin}
        onNavClick={(href) => router.push(href)}
      />

      <IntroHeroSection onStart={goToAnalysis} />

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

      <IntroCtaSection onStart={goToAnalysis} />
    </div>
  );
}
