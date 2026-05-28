'use client';

import { use, useState } from 'react';
import { ToastPortal } from '@/components';
import { useAuthSession } from '@/providers/AuthProvider';
import PromptInput from '../_components/PromptInput';
import AnalysisChatMessageList from './_components/AnalysisChatMessageList';
import DataTablePreview from './_components/DataTablePreview';
import LoadingDataPreview from './_components/LoadingDataPreview';
import ResizableSplit from './_components/ResizableSplit';
import { useAnalysisChat } from './_hooks/useAnalysisChat';

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
    <ResizableSplit
      rightCollapsed={isChatCollapsed}
      onRightCollapsedChange={setIsChatCollapsed}
      left={
        chat.previewTable ? (
          <DataTablePreview
            columns={chat.previewTable.columns}
            rows={chat.previewTable.rows}
          />
        ) : chat.isDataSourceLoading ? (
          <LoadingDataPreview message="CSV 미리보기를 불러오는 중이에요" />
        ) : chat.dataSourceErrorMessage ? (
          <LoadingDataPreview
            message={chat.dataSourceErrorMessage}
            showSpinner={false}
            tone="error"
          />
        ) : chat.isDataSourceEmpty ? (
          <LoadingDataPreview
            message="표시할 CSV 미리보기 데이터가 없습니다."
            showSpinner={false}
          />
        ) : (
          <LoadingDataPreview />
        )
      }
      right={
        <div className="flex h-full min-h-0 flex-col">
          <div className="scrollbar-hide flex min-h-0 flex-1 flex-col gap-24 overflow-y-auto px-24 pt-32 pb-24">
            <AnalysisChatMessageList chat={chat} />
          </div>

          <div className="shrink-0 px-24 pt-12 pb-24">
            <PromptInput
              showFileAttach={false}
              submitDisabled={chat.inputDisabled}
              onSubmit={chat.handleSubmit}
            />
          </div>

          <ToastPortal toast={chat.toast} />
        </div>
      }
    />
  );
}
