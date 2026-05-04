'use client';

import { useState, useCallback } from 'react';
import { Header, TextField, Card } from '@/components';
import FileUploadZone from '@/components/FileUploadZone/FileUploadZone';

const NAV_ITEMS = [
  { label: '회의분석', href: '/analysis' },
  { label: '데이터소스', href: '/datasource' },
  { label: '지출관리', href: '/expense' },
];

const SAMPLE_CARDS = [
  { title: '분야명', description: '세부 설명 1줄 이내' },
  { title: '분야명', description: '세부 설명 1줄 이내' },
  { title: '분야명', description: '세부 설명 1줄 이내' },
  { title: '분야명', description: '세부 설명 1줄 이내' },
];

const userName = '김예원';

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 6) return '좋은 새벽이에요';
  if (hour < 12) return '좋은 아침이에요';
  if (hour < 18) return '좋은 오후예요';
  return '좋은 저녁이에요';
}

export default function Home() {
  const [prompt, setPrompt] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [showUpload, setShowUpload] = useState(false);

  const handleSubmit = useCallback(() => {
    if (!prompt.trim()) return;
    setPrompt('');
  }, [prompt]);

  const handleFileSelect = useCallback((file: File) => {
    setUploadedFile(file);
    setShowUpload(false);
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-gray-200">
      <Header navItems={NAV_ITEMS} />

      <main className="flex flex-1 flex-col items-center px-40 pt-[8rem] pb-40">
        {/* 인사말 */}
        <div className="mb-40 text-center">
          <h1 className="text-head1 text-gray-900">
            {getGreeting()}, {`${userName}`}님
          </h1>
          <p className="mt-4 text-head2 text-gray-900">분석을 시작해볼까요?</p>
        </div>

        {/* 프롬프트 입력 영역 */}
        <div className="w-full">
          <TextField
            fullWidth
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="이번달이랑 지난달 비교해서 지역별 매출 높은 순으로 5개 보여줘"
            submitDisabled={prompt.trim().length === 0}
            onSubmit={handleSubmit}
            onFileAttach={() => setShowUpload((prev) => !prev)}
          />

          {/* CSV 업로드 존 */}
          {showUpload && (
            <div className="mt-16">
              <FileUploadZone
                onFileSelect={handleFileSelect}
                onError={(msg) => alert(msg)}
              />
            </div>
          )}

          {/* 업로드된 파일 표시 */}
          {uploadedFile && (
            <div className="mt-12 flex items-center gap-8 rounded-12 bg-white px-16 py-12 shadow-[0_0.1rem_0.4rem_rgba(0,0,0,0.06)]">
              <span className="inline-block h-20 w-20 rounded-4 bg-orange-400" />
              <span className="text-body2 text-gray-900">
                {uploadedFile.name}
              </span>
              <span className="text-body4 text-gray-600">
                ({(uploadedFile.size / 1024).toFixed(1)} KB)
              </span>
              <button
                type="button"
                onClick={() => setUploadedFile(null)}
                className="ml-auto text-body4 text-gray-500 hover:text-error-500"
              >
                삭제
              </button>
            </div>
          )}
        </div>

        {/* 샘플 데이터 섹션 */}
        <section className="mt-40 w-full">
          <div className="mb-16 flex items-center justify-between">
            <p className="text-body3 text-gray-900">
              매시 데이터로 Logue를 경험해보세요.
            </p>
            <button
              type="button"
              className="text-body4 text-gray-600 hover:text-orange-500"
            >
              더보기
            </button>
          </div>

          <div className="grid grid-cols-1 gap-16 sm:grid-cols-2 lg:grid-cols-4">
            {SAMPLE_CARDS.map((card, i) => (
              <Card
                key={i}
                title={card.title}
                description={card.description}
                onClick={() => {}}
              />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
