import Link from "next/link";
import Image from "next/image";

type FooterProps = {
  lang: string;
};

const SHOP_LINKS = [
  { label: "All Products", href: "/category" },
  { label: "Featured", href: "/" },
];

const ACCOUNT_LINKS = [
  { label: "My Account", href: "/account" },
  { label: "Order History", href: "/account" },
];

const COMPANY_LINKS = [
  { label: "About", href: "/" },
  { label: "Contact", href: "/" },
];

export function Footer({ lang }: FooterProps) {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-white text-gray-600 border-t border-gray-200 mt-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link href={`/${lang}`}>
              <Image src="/logo.png" alt="Elastic Path" width={120} height={28} />
            </Link>
            <p className="mt-3 text-sm text-gray-500 leading-relaxed">
              API-first composable commerce built for enterprise brands with
              complex requirements.
            </p>
          </div>

          {/* Shop */}
          <div>
            <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-widest mb-4">
              Shop
            </h3>
            <ul className="space-y-3">
              {SHOP_LINKS.map((link) => (
                <li key={link.label}>
                  <Link
                    href={`/${lang}${link.href}`}
                    className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Account */}
          <div>
            <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-widest mb-4">
              Account
            </h3>
            <ul className="space-y-3">
              {ACCOUNT_LINKS.map((link) => (
                <li key={link.label}>
                  <Link
                    href={`/${lang}${link.href}`}
                    className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-widest mb-4">
              Company
            </h3>
            <ul className="space-y-3">
              {COMPANY_LINKS.map((link) => (
                <li key={link.label}>
                  <Link
                    href={`/${lang}${link.href}`}
                    className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-6 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-400">
            © {year} Elastic Path Commerce Inc. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <Link
              href="/"
              className="text-xs text-gray-400 hover:text-gray-700 transition-colors"
            >
              Privacy Policy
            </Link>
            <Link
              href="/"
              className="text-xs text-gray-400 hover:text-gray-700 transition-colors"
            >
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
