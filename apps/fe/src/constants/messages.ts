export const AUTH_MESSAGES = {
  loginRequired: '로그인이 필요해요. 다시 로그인해 주세요.',
  userInfoRequired: '사용자 정보를 확인한 뒤 다시 시도해 주세요.',
} as const;

export const DATA_SOURCE_MESSAGES = {
  listError: '데이터 소스 목록을 불러오지 못했어요.',
  uploadError: '파일 업로드에 실패했어요. 잠시 후 다시 시도해 주세요.',
  deleteError: '파일 삭제에 실패했어요. 잠시 후 다시 시도해 주세요.',
  detailDeleteError: '파일 삭제에 실패했습니다.',
  deleteConflict:
    '연결된 분석 채팅이 있어 현재 삭제할 수 없어요. 채팅 삭제 기능이 준비되면 함께 삭제할 수 있습니다.',
  startChatError: '분석 채팅을 시작하지 못했어요. 잠시 후 다시 시도해 주세요.',
  tableLoading: '데이터 소스 목록을 불러오는 중이에요.',
  tableEmpty: '업로드된 데이터 소스가 없습니다.',
  uploadSuccess: '파일을 업로드했습니다.',
  deleteSuccess: '파일을 삭제했습니다.',
  deleteTitle: '파일을 삭제하시겠어요?',
  deleteDescription: '삭제 후엔 복구할 수 없어요.',
  deleteConfirmLabel: '삭제하기',
  deleteCancelLabel: '취소하기',
  fileValidation: {
    invalidType: '파일 형식이 맞지 않습니다.',
    empty: '빈 CSV 파일은 업로드할 수 없어요.',
    tooLarge: '파일이 너무 커요. 50MB까지만 업로드 가능해요.',
  },
} as const;
