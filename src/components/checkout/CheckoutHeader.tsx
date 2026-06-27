import Link from "next/link";
import { CheckoutUserInfo } from "./CheckoutUserInfo";

type Props = { lang: string };

export function CheckoutHeader({ lang }: Props) {

  return (
    <header className="border-b border-gray-100 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 grid grid-cols-3 items-center">
        {/* left — empty, balances the right column */}
        <div />

        {/* center — logo */}
        <div className="flex justify-center">
          <Link
            href={`/${lang}`}
            aria-label="Return to store"
            className="flex items-center gap-2"
          >
            <svg
              width="26"
              height="26"
              viewBox="0 0 32 32"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <rect width="32" height="32" rx="6" fill="var(--color-brand-primary)" />
              <path
                d="M8 10h16M8 16h10M8 22h13"
                stroke="white"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
            <span className="text-lg font-bold tracking-tight text-gray-900">
              Calibr
            </span>
          </Link>
        </div>

        {/* right — user info */}
        <div className="flex justify-end">
          <CheckoutUserInfo />
        </div>
      </div>
    </header>
  );
}
