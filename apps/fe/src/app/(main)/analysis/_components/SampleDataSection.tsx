'use client';

import { Card } from '@/components';

export type SampleCard = {
  id: string;
  title: string;
  description: string;
};

const SAMPLE_CARDS: SampleCard[] = [
  { id: 'sample-1', title: '분야명', description: '세부 설명 1줄 이내' },
  { id: 'sample-2', title: '분야명', description: '세부 설명 1줄 이내' },
  { id: 'sample-3', title: '분야명', description: '세부 설명 1줄 이내' },
  { id: 'sample-4', title: '분야명', description: '세부 설명 1줄 이내' },
  { id: 'sample-5', title: '분야명', description: '세부 설명 1줄 이내' },
  { id: 'sample-6', title: '분야명', description: '세부 설명 1줄 이내' },
  { id: 'sample-7', title: '분야명', description: '세부 설명 1줄 이내' },
  { id: 'sample-8', title: '분야명', description: '세부 설명 1줄 이내' },
];

export type SampleDataSectionProps = {
  /** 표시할 카드 목록 (미지정 시 더미 카드 표시) */
  items?: SampleCard[];
  /** 카드 클릭 콜백 */
  onCardClick?: (card: SampleCard) => void;
  /** 더보기 클릭 콜백 */
  onMoreClick?: () => void;
};

export default function SampleDataSection({
  items = SAMPLE_CARDS,
  onCardClick,
  onMoreClick,
}: SampleDataSectionProps) {
  return (
    <section className="mt-40 w-full">
      <div className="mb-16 flex items-center justify-between">
        <p className="text-body3 text-gray-900">
          예시 데이터로 Logue를 경험해보세요.
        </p>
        <button
          type="button"
          onClick={onMoreClick}
          className="text-body4 text-gray-600 hover:text-orange-500"
        >
          더보기
        </button>
      </div>

      <div className="grid grid-cols-1 gap-16 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((card) => (
          <Card
            key={card.id}
            title={card.title}
            description={card.description}
            onClick={() => onCardClick?.(card)}
          />
        ))}
      </div>
    </section>
  );
}
