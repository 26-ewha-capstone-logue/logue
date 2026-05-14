'use client';

import { use, useState } from 'react';
import { ChatBubble } from '@/components';
import PromptInput, {
  type PromptInputValue,
} from '../_components/PromptInput';
import AnalyzingIndicator from './_components/AnalyzingIndicator';
import UploadedFileBadge from './_components/UploadedFileBadge';

type PageParams = { id: string };

type Message = {
  id: string;
  role: 'user' | 'bot';
  content: string;
};

// TODO: 첫 페이지에서 전달된 prompt/파일로 교체 (현재는 데모 더미)
const INITIAL_MESSAGES: Message[] = [
  {
    id: 'initial-user',
    role: 'user',
    content: '데이터분석 결과 알려줘',
  },
];

export default function AnalysisChatPage({
  params,
}: {
  params: Promise<PageParams>;
}) {
  // TODO: id 로 분석 데이터 fetch
  const { id } = use(params);
  void id;

  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [isAnalyzing, setIsAnalyzing] = useState(true);

  const handleSubmit = (value: PromptInputValue) => {
    const userMsg: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: value.prompt,
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsAnalyzing(true);
    // TODO: 봇 응답 API 호출 → 응답 도착 시 messages 추가 + setIsAnalyzing(false)
  };

  return (
    <main className="mx-auto flex w-full max-w-[128rem] flex-1 flex-col px-40 pt-32 pb-40">
      {/* 우상단 업로드 파일 */}
      <div className="mb-32 flex justify-end">
        <UploadedFileBadge fileName="업로드된 CSV 파일명.csv" />
      </div>

      {/* 메시지 영역 */}
      <div className="flex flex-1 flex-col gap-32 overflow-y-auto">
        {messages.map((msg) => (
          <ChatBubble key={msg.id} role={msg.role}>
            {msg.content}
          </ChatBubble>
        ))}
        {isAnalyzing && <AnalyzingIndicator />}
      </div>

      {/* 하단 입력 */}
      <div className="mt-32">
        <PromptInput onSubmit={handleSubmit} />
      </div>
    </main>
  );
}
