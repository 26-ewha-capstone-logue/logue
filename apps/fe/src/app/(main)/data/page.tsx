'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ChatIcon from '@/assets/icons/chat.svg';
import { FileUploadModal, Modal } from '@/components';
import Checkbox from './_components/Checkbox';
import SortDropdown from './_components/SortDropdown';

const DELETE_ILLUST_SRC = '/illusts/delete.svg';

type SortKey = 'usage' | 'latest';

type DataSource = {
  id: string;
  fileName: string;
  fileSize: string;
  uploadedAt: string;
};

const SORT_OPTIONS = [
  { value: 'usage', label: '사용량 많은 순' },
  { value: 'latest', label: '최근 업로드 순' },
];

// TODO: API 연동
const DUMMY_DATA: DataSource[] = Array.from({ length: 8 }, (_, i) => ({
  id: `data-${i}`,
  fileName: '파일명.csv',
  fileSize: '50MB',
  uploadedAt: '5분 전',
}));

export default function DataPage() {
  const router = useRouter();
  const [sortKey, setSortKey] = useState<SortKey>('latest');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);

  // TODO: 실제 정렬/필터 로직 (현재는 더미)
  const data = DUMMY_DATA;
  void sortKey;

  const allSelected =
    data.length > 0 && data.every((d) => selectedIds.has(d.id));
  const partiallySelected = !allSelected && selectedIds.size > 0;
  const hasSelection = selectedIds.size > 0;

  const toggleAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(data.map((d) => d.id)));
    }
  };

  const toggleOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleUploadClick = () => {
    setUploadOpen(true);
  };

  const handleUploaded = (uploaded: File) => {
    // TODO: 업로드된 파일을 서버에 보내고 목록 갱신
    void uploaded;
    setUploadOpen(false);
  };

  const handleDeleteClick = () => {
    if (selectedIds.size === 0) return;
    setDeleteOpen(true);
  };

  const handleDeleteConfirm = () => {
    // TODO: 선택된 데이터 삭제 API 호출
    setSelectedIds(new Set());
    setDeleteOpen(false);
  };

  const handleChat = (id: string) => {
    // TODO: 해당 데이터로 분석 채팅 시작 (별도 페이지에서 처리 가능)
    void id;
  };

  const goToDetail = (id: string) => {
    router.push(`/data/${id}`);
  };

  return (
    <main className="scrollbar-hide flex min-h-0 flex-1 flex-col overflow-y-auto px-40 pt-32 pb-40">
      <h1 className="mb-24 text-head2 font-semibold text-gray-900">
        데이터 소스
      </h1>

      {/* 상단 액션 영역 */}
      <div className="mb-16 flex items-center justify-between">
        <SortDropdown
          options={SORT_OPTIONS}
          value={sortKey}
          onChange={(v) => setSortKey(v as SortKey)}
        />
        <div className="flex items-center gap-16">
          {hasSelection && (
            <button
              type="button"
              onClick={handleDeleteClick}
              className="text-body4 text-gray-700 underline underline-offset-2 hover:text-gray-900"
            >
              삭제하기
            </button>
          )}
          <button
            type="button"
            onClick={handleUploadClick}
            className="rounded-full bg-orange-500 px-16 py-8 text-body4 font-medium text-white transition-colors hover:bg-orange-600"
          >
            새 CSV 파일 업로드
          </button>
        </div>
      </div>

      {/* 테이블 */}
      <div className="overflow-hidden rounded-12 border border-gray-300 bg-white">
        <table className="w-full border-collapse text-body4">
          <thead>
            <tr className="bg-gray-200 text-gray-900">
              <th className="w-[5.6rem] py-16 pl-24 text-left">
                <Checkbox
                  checked={allSelected}
                  indeterminate={partiallySelected}
                  onChange={toggleAll}
                />
              </th>
              <th className="py-16 text-left font-semibold">파일명</th>
              <th className="w-[14rem] py-16 text-left font-semibold">
                파일 크기
              </th>
              <th className="w-[16rem] py-16 text-left font-semibold">
                최근 업로드
              </th>
              <th className="w-[14rem] py-16 pr-24 text-right font-semibold">
                액션
              </th>
            </tr>
          </thead>
          <tbody>
            {data.map((row) => {
              const checked = selectedIds.has(row.id);
              return (
                <tr
                  key={row.id}
                  onClick={() => goToDetail(row.id)}
                  className="cursor-pointer border-t border-gray-200 transition-colors hover:bg-gray-100"
                >
                  <td
                    className="py-16 pl-24"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Checkbox
                      checked={checked}
                      onChange={() => toggleOne(row.id)}
                    />
                  </td>
                  <td className="py-16 text-gray-900">{row.fileName}</td>
                  <td className="py-16 text-gray-800">{row.fileSize}</td>
                  <td className="py-16 text-gray-800">{row.uploadedAt}</td>
                  <td
                    className="py-16 pr-24 text-right"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      onClick={() => handleChat(row.id)}
                      className="inline-flex items-center gap-4 rounded-full border border-gray-300 bg-white px-12 py-6 text-body4 text-gray-700 transition-colors hover:bg-gray-100"
                    >
                      <ChatIcon
                        aria-hidden
                        className="icon-12 text-orange-500"
                      />
                      <span>채팅</span>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* CSV 파일 업로드 모달 */}
      <FileUploadModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onUpload={handleUploaded}
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
