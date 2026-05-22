'use client';

import { use, useEffect, useState, type ReactNode } from 'react';
import { useSearchParams } from 'next/navigation';
import { ChatBubble } from '@/components';
import PromptInput, { type PromptInputValue } from '../_components/PromptInput';
import AnalysisResult from './_components/AnalysisResult';
import AnalyzingIndicator from './_components/AnalyzingIndicator';
import DataTablePreview from './_components/DataTablePreview';
import LoadingDataPreview from './_components/LoadingDataPreview';
import QuestionAnalysisResult from './_components/QuestionAnalysisResult';
import ResizableSplit from './_components/ResizableSplit';
import VerificationResult from './_components/VerificationResult';

type PageParams = { id: string };

type Message = {
  id: string;
  role: 'user' | 'bot';
  /** 봇은 카드 등 ReactNode, 사용자는 문자열을 사용 */
  content: ReactNode;
};

// TODO: 실제 API 응답 시간에 맞춰 제거. 현재는 로딩 UI 데모용 시뮬레이션 시간.
const CSV_ANALYZE_MS = 2500;
const QUESTION_ANALYZE_MS = 2000;
const VERIFICATION_MS = 2500;
const DEFAULT_PROMPT = 'CSV 파일을 분석해주세요';

export default function AnalysisChatPage({
  params,
}: {
  params: Promise<PageParams>;
}) {
  // TODO: id 로 분석 데이터 fetch
  const { id } = use(params);
  void id;

  const searchParams = useSearchParams();
  const initialPrompt = searchParams.get('q') ?? DEFAULT_PROMPT;

  const [messages, setMessages] = useState<Message[]>(() => [
    { id: 'init-user', role: 'user', content: initialPrompt },
  ]);
  // CSV 분석 완료 여부 — 좌측 데이터 표 vs 로딩 화면 토글에 사용
  const [isCsvAnalyzed, setIsCsvAnalyzed] = useState(false);
  // 분석 중 인디케이터 표시 여부 (CSV 단계 + 질문 단계 동안 true)
  const [isAnalyzing, setIsAnalyzing] = useState(true);

  // 최초 진입 — CSV 분석 시뮬레이션
  // TODO: 실제 API 호출(파일 업로드 + 분석)로 교체
  useEffect(() => {
    const t = setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: 'init-csv-bot',
          role: 'bot',
          content: <AnalysisResult rowCount={12483} columnCount={18} />,
        },
      ]);
      setIsCsvAnalyzed(true);
      setIsAnalyzing(false);
    }, CSV_ANALYZE_MS);
    return () => clearTimeout(t);
  }, []);

  // 사용자 채팅 입력 → 질문 분석 카드 응답 시뮬레이션
  // TODO: 실제 API 호출(질문 → 분석 기준)로 교체
  const handleSubmit = (value: PromptInputValue) => {
    const userMsgId = `user-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      { id: userMsgId, role: 'user', content: value.prompt },
    ]);
    setIsAnalyzing(true);

    setTimeout(() => {
      const botMsgId = `question-bot-${Date.now()}`;
      setMessages((prev) => [
        ...prev,
        {
          id: botMsgId,
          role: 'bot',
          content: (
            <QuestionAnalysisResult
              onContinue={() => {
                // 분석 진행 시뮬 → 검증 결과 카드 노출
                // TODO: 실제 분석 API 호출로 교체
                setIsAnalyzing(true);
                setTimeout(() => {
                  setMessages((prevMsgs) => [
                    ...prevMsgs,
                    {
                      id: `verification-${Date.now()}`,
                      role: 'bot',
                      content: <VerificationResult />,
                    },
                  ]);
                  setIsAnalyzing(false);
                }, VERIFICATION_MS);
              }}
            />
          ),
        },
      ]);
      setIsAnalyzing(false);
    }, QUESTION_ANALYZE_MS);
  };

  return (
    <ResizableSplit
      left={isCsvAnalyzed ? <DataTablePreview /> : <LoadingDataPreview />}
      right={
        <div className="flex h-full min-h-0 flex-col">
          {/* 메시지 영역 (내부 스크롤, 스크롤바 숨김) */}
          <div className="scrollbar-hide flex min-h-0 flex-1 flex-col gap-24 overflow-y-auto px-24 pt-32 pb-24">
            {messages.map((msg) => {
              const isUser = msg.role === 'user';
              if (isUser) {
                return (
                  <ChatBubble key={msg.id} role="user">
                    {msg.content}
                  </ChatBubble>
                );
              }
              // 봇: AnalysisResult 등 카드형 노드를 좌측 정렬 + 카드 너비 제한
              return (
                <div key={msg.id} className="flex w-full justify-start">
                  <div className="w-full max-w-[80%]">{msg.content}</div>
                </div>
              );
            })}
            {isAnalyzing && (
              <div className="flex w-full justify-start">
                <div className="w-full max-w-[80%]">
                  <AnalyzingIndicator />
                </div>
              </div>
            )}
          </div>

          {/* 하단 입력 (고정) */}
          <div className="shrink-0 px-24 pt-12 pb-24">
            <PromptInput onSubmit={handleSubmit} />
          </div>
        </div>
      }
    />
  );
}
