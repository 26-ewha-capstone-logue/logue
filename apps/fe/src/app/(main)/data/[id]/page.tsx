'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Modal } from '@/components';
import DataChartCard from '../_components/DataChartCard';

type PageParams = { id: string };

const DELETE_ILLUST_SRC = '/illusts/delete.svg';

// TODO: API 연동 — 현재는 시안 더미
type DataSourceDetail = {
  fileName: string;
  fileSize: string;
  uploadedAt: string;
};

function getDummyDetail(id: string): DataSourceDetail {
  void id;
  return {
    fileName: '파일명어쩌고저쩌고파일명파일명파일명파.csv',
    fileSize: '37MB',
    uploadedAt: '3분 전',
  };
}

export default function DataDetailPage({
  params,
}: {
  params: Promise<PageParams>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [deleteOpen, setDeleteOpen] = useState(false);

  const detail = getDummyDetail(id);

  const handleChat = () => {
    // TODO: 해당 데이터 ID로 분석 채팅 시작
    router.push(`/analysis/${id}`);
  };

  const handleDeleteConfirm = () => {
    // TODO: 삭제 API 호출
    setDeleteOpen(false);
    router.push('/data');
  };

  return (
    <main className="scrollbar-hide flex min-h-0 flex-1 flex-col overflow-y-auto px-40 pt-32 pb-40">
      <DataChartCard
        fileName={detail.fileName}
        fileSize={detail.fileSize}
        uploadedAt={detail.uploadedAt}
        onChat={handleChat}
        onDelete={() => setDeleteOpen(true)}
      />

      {/* 삭제 확인 모달 */}
      <Modal open={deleteOpen} onClose={() => setDeleteOpen(false)}>
        <div className="flex flex-col items-center gap-24">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={DELETE_ILLUST_SRC}
            alt=""
            aria-hidden
            className="h-[8rem] w-auto"
          />
          <div className="flex flex-col items-center gap-4">
            <h3 className="text-head4 font-semibold text-gray-900">
              파일을 삭제하시겠어요?
            </h3>
            <p className="text-body4 text-gray-700">
              삭제 후엔 복구할 수 없어요.
            </p>
          </div>
          <div className="flex w-full justify-center gap-8">
            <button
              type="button"
              onClick={() => setDeleteOpen(false)}
              className="min-w-[12rem] rounded-full bg-gray-300 px-20 py-12 text-body2 font-medium text-gray-700 transition-colors hover:bg-gray-400"
            >
              취소하기
            </button>
            <button
              type="button"
              onClick={handleDeleteConfirm}
              className="min-w-[12rem] rounded-full bg-orange-500 px-20 py-12 text-body2 font-medium text-white transition-colors hover:bg-orange-600"
            >
              삭제하기
            </button>
          </div>
        </div>
      </Modal>
    </main>
  );
}
