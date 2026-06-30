import Link from "next/link";
import { plasmicConfig } from "@/lib/plasmic-config";
import { PLASMIC_SERVER } from "@/components/plasmic/plasmic-server-loader";
import PlasmicContent from "@/components/plasmic/PlasmicContent";
import { StorefrontLogo } from "./StorefrontLogo";

type LogoProps = {
  lang: string;
  className?: string;
};

export async function Logo({ lang, className = "" }: LogoProps) {
  if (!plasmicConfig.enabled) {
    return (
      <Link
        href={`/${lang}`}
        aria-label="Elasticpath Calibr — Home"
        className={`flex items-center gap-2 shrink-0 ${className}`}
      >
        <svg
          width="32"
          height="32"
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <rect
            width="32"
            height="32"
            rx="6"
            fill="var(--color-brand-primary)"
          />
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

  const plasmicData =
    (await PLASMIC_SERVER?.maybeFetchComponentData("logo")) ?? null;

  if (!plasmicData) {
    return (
      <StorefrontLogo
        href={`/${lang}`}
        imageUrl="/logo.png"
        alt="Home"
        height={40}
        className={className}
      />
    );
  }

  return (
    <PlasmicContent
      component="logo"
      prefetchedData={plasmicData}
      componentProps={{ href: `/${lang}` }}
    />
  );
}
