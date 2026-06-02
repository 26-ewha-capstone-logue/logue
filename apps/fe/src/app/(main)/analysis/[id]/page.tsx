'use client';

import { use, useState } from 'react';
import { ToastPortal } from '@/components';
import { useAuthSession } from '@/providers/AuthProvider';
import PromptInput from '../_components/PromptInput';
import AnalysisResizableSplit from './_components/AnalysisResizableSplit';
import AnalysisChatMessageList from './_components/AnalysisChatMessageList';
import DataPreviewPanel from './_components/DataPreviewPanel';
import { useAnalysisChat } from '@/features/analysis/hooks/useAnalysisChat';

type PageParams = { id: string };

export default function AnalysisChatPage({
  params,
}: {
  params: Promise<PageParams>;
}) {
  const { id } = use(params);
  const { isAuthenticated } = useAuthSession();
  const [isChatCollapsed, setIsChatCollapsed] = useState(false);
  const chat = useAnalysisChat({
    hasAccessToken: isAuthenticated,
    routeConversationId: id,
  });

  return (
    <AnalysisResizableSplit
      rightCollapsed={isChatCollapsed}
      onRightCollapsedChange={setIsChatCollapsed}
      left={<DataPreviewPanel {...chat.dataPreview} />}
      right={
        <div className="flex h-full min-h-0 flex-col">
          <div className="scrollbar-hide flex min-h-0 flex-1 flex-col gap-24 overflow-y-auto px-24 pt-32 pb-24">
            <AnalysisChatMessageList viewModel={chat.messageList} />
          </div>

          <div className="shrink-0 px-24 pt-12 pb-24">
            <PromptInput
              showFileAttach={false}
              submitDisabled={chat.input.disabled}
              onSubmit={chat.input.onSubmit}
            />
          </div>

          <ToastPortal toast={chat.toast} />
        </div>
      }
    />
  );
}
