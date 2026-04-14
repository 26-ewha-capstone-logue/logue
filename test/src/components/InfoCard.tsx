import type { PropsWithChildren, ReactNode } from 'react';

interface InfoCardProps extends PropsWithChildren {
  title: string;
  subtitle?: string;
  extra?: ReactNode;
}

// 화면 전반에서 반복되는 섹션 카드 레이아웃을 하나로 통일한다.
export function InfoCard({ title, subtitle, extra, children }: InfoCardProps) {
  return (
    <section
      style={{
        background: '#ffffff',
        border: '1px solid #d7dfd4',
        borderRadius: 20,
        padding: 20,
        boxShadow: '0 14px 40px rgba(33, 53, 24, 0.08)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 22, color: '#20331b' }}>{title}</h2>
          {subtitle ? <p style={{ margin: '8px 0 0', color: '#556b50' }}>{subtitle}</p> : null}
        </div>
        {extra}
      </div>
      <div style={{ marginTop: 16 }}>{children}</div>
    </section>
  );
}
