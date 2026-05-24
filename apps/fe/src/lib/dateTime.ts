const DATE_TIME_FORMATTER = new Intl.DateTimeFormat('ko-KR', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'Asia/Seoul',
});

/**
 * ISO-8601 날짜/시간 문자열을 DATE_TIME_FORMATTER로 표시용 문자열로 변환합니다.
 * 유효하지 않은 값은 '-'를 반환합니다.
 */
export function formatDateTime(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return '-';

  return DATE_TIME_FORMATTER.format(date);
}
