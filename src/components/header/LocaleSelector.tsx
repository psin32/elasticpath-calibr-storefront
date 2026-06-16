"use client";

import { usePathname, useRouter } from "next/navigation";
import { Globe } from "lucide-react";
import { locales, localeNames, type Locale } from "@/lib/i18n/config";

type LocaleSelectorProps = {
  currentLocale: string;
};

export function LocaleSelector({ currentLocale }: LocaleSelectorProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLocale = e.target.value as Locale;
    const segments = pathname.split("/");
    segments[1] = newLocale;
    router.push(segments.join("/"));
  };

  return (
    <div className="hidden lg:flex items-center gap-1.5 text-sm text-gray-600">
      <Globe size={15} className="shrink-0 text-gray-400" />
      <select
        value={currentLocale}
        onChange={handleChange}
        aria-label="Select language"
        className="bg-transparent text-sm text-gray-700 cursor-pointer outline-none hover:text-gray-900"
      >
        {locales.map((locale) => (
          <option key={locale} value={locale}>
            {localeNames[locale]}
          </option>
        ))}
      </select>
    </div>
  );
}
