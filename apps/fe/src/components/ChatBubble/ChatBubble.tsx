import { type HTMLAttributes, type ReactNode } from 'react';

type ChatBubbleRole = 'user' | 'bot';

export type ChatBubbleProps = {
  role: ChatBubbleRole;
  children: ReactNode;
  loading?: boolean;
  file?: { name: string; status?: string };
} & Omit<HTMLAttributes<HTMLDivElement>, 'role' | 'children'>;

function LoadingDots() {
  return (
    <span className="inline-flex items-center gap-4">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-8 w-8 animate-pulse rounded-full bg-orange-400"
          style={{ animationDelay: `${i * 150}ms` }}
        />
      ))}
    </span>
  );
}

export default function ChatBubble({
  role,
  children,
  loading = false,
  file,
  className = '',
  ...rest
}: ChatBubbleProps) {
  const isUser = role === 'user';

  return (
    <div
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} ${className}`.trim()}
      {...rest}
    >
      <div
        className={`max-w-[80%] rounded-20 px-20 py-16 text-body2 ${
          isUser
            ? 'bg-gray-200 text-gray-900'
            : 'bg-white text-gray-900 shadow-[0_0.2rem_1.2rem_rgba(0,0,0,0.06)]'
        }`}
      >
        {file && (
          <div className="mb-8 inline-flex items-center gap-8 rounded-12 border border-gray-300 px-12 py-8">
            <span className="inline-block h-20 w-20 rounded-4 bg-orange-400" />
            <span className="text-body4 text-gray-800">{file.name}</span>
            {file.status && (
              <span className="text-body4 text-gray-500">{file.status}</span>
            )}
          </div>
        )}
        {loading ? (
          <div className="flex items-center gap-8">
            <LoadingDots />
            <span className="text-body2 text-gray-600">Logue가 분석 중이에요</span>
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}
