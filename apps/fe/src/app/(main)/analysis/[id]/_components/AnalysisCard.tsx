import type { ReactNode } from 'react';

type AnalysisCardProps = {
  children: ReactNode;
  className?: string;
};

export default function AnalysisCard({
  children,
  className = 'gap-16',
}: AnalysisCardProps) {
  return (
    <div
      className={`flex w-full flex-col rounded-20 bg-white p-24 shadow-[0_0.2rem_1.2rem_rgba(0,0,0,0.06)] ${className}`.trim()}
    >
      {children}
    </div>
  );
}
