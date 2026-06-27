import { Suspense } from "react";
import Link from "next/link";
import { PaymentReturnContent } from "./PaymentReturnContent";

type Props = {
  params: Promise<{ lang: string }>;
};

export default async function PaymentReturnPage({ params }: Props) {
  const { lang } = await params;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="flex-none border-b border-gray-100 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center">
          <Link href={`/${lang}`} className="flex items-center gap-2">
            <svg width="26" height="26" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <rect width="32" height="32" rx="6" fill="var(--color-brand-primary)" />
              <path d="M8 10h16M8 16h10M8 22h13" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
            <span className="text-lg font-bold tracking-tight text-gray-900">Calibr</span>
          </Link>
        </div>
      </header>

      <Suspense
        fallback={
          <main className="flex-1 flex items-center justify-center">
            <div className="space-y-4 text-center">
              <div className="mx-auto w-12 h-12 rounded-full border-4 border-brand-primary border-t-transparent animate-spin" />
            </div>
          </main>
        }
      >
        <PaymentReturnContent lang={lang} />
      </Suspense>
    </div>
  );
}
