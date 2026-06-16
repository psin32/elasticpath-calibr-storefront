import Link from "next/link";

type LogoProps = {
  lang: string;
  className?: string;
};

export function Logo({ lang, className = "" }: LogoProps) {
  return (
    <Link
      href={`/${lang}`}
      aria-label="Elasticpath Calibr — Home"
      className={`flex items-center gap-2 shrink-0 ${className}`}
    >
      {/* SVG wordmark logo — replace src with actual brand asset */}
      <svg
        width="32"
        height="32"
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
      <span className="text-xl font-bold tracking-tight text-gray-900">
        Calibr
      </span>
    </Link>
  );
}
