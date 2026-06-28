import { Logo } from "./Logo";
import { NavBar } from "./navigation/NavBar";
import { MobileNavBar } from "./navigation/MobileNavBar";
import { SearchButton } from "./search/SearchButton";
import { CartButton } from "./cart/CartButton";
import { AccountButton } from "./AccountButton";
import { LocaleSelector } from "./LocaleSelector";
import { SettingsButton } from "./SettingsButton";
import { buildSiteNavigation } from "@/lib/api/navigation";
import { NAV_ITEMS } from "./navigation/nav-items";

type HeaderProps = {
  lang: string;
};

export async function Header({ lang }: HeaderProps) {
  let navItems = NAV_ITEMS;
  try {
    const dynamicNav = await buildSiteNavigation();
    if (dynamicNav.length > 0) navItems = dynamicNav;
  } catch {
    // Fall back to static nav if EP catalog is not configured
  }

  return (
    <header className="sticky top-0 z-30 w-full bg-white/95 backdrop-blur-sm border-b border-gray-100 supports-[backdrop-filter]:bg-white/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-16 gap-4">
          {/* Mobile: hamburger */}
          <MobileNavBar lang={lang} navItems={navItems} />

          {/* Logo */}
          <Logo lang={lang} />

          {/* Desktop: center nav */}
          <div className="hidden lg:flex flex-1 justify-center">
            <NavBar lang={lang} navItems={navItems} />
          </div>

          {/* Spacer for mobile */}
          <div className="flex-1 lg:hidden" aria-hidden="true" />

          {/* Right: locale + search + account + cart */}
          <div className="flex items-center gap-1">
            <LocaleSelector currentLocale={lang} />
            {process.env.NEXT_PUBLIC_SEARCH_ENABLED === "true" && <SearchButton />}
            <AccountButton />
            <CartButton />
            <SettingsButton />
          </div>
        </div>
      </div>
    </header>
  );
}
