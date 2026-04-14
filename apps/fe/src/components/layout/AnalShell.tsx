import Link from 'next/link';

type AnalShellProps = {
  title: string;
  screenId: string;
  children: React.ReactNode;
};

export default function AnalShell({
  title,
  screenId,
  children,
}: AnalShellProps) {
  return (
    <div className="flex min-h-full flex-col bg-gray-100 text-gray-900">
      <header className="border-b border-gray-300 bg-white">
        <div className="mx-auto flex max-w-[120rem] items-center justify-between gap-16 px-24 py-16">
          <Link href="/" className="text-head4 text-gray-900">
            Logue
          </Link>
          <div className="flex items-center gap-12 text-body2 text-gray-600">
            <span className="rounded-8 bg-gray-200 px-12 py-4 text-body4 font-semibold text-gray-800">
              {screenId}
            </span>
            <span className="text-body2 text-gray-700">{title}</span>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-[120rem] flex-1 px-24 py-32">
        {children}
      </main>
    </div>
  );
}
