/**
 * 완료 버튼용 체크 아이콘.
 * success.svg 는 mask + #7CEF3D 색이 들어가 있어 SVGR `convertColors: currentColor`
 * 와 호환되지 않아(마스크 white/black 까지 currentColor 로 바뀌어 마스크가 무효화)
 * 안전하게 inline 으로 단순 체크 path 만 사용.
 */
export default function CheckIcon() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 10 L8.5 14 L16 6" />
    </svg>
  );
}
