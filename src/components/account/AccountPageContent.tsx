"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { User, Building2, ShoppingBag, LogOut, Check } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

type Props = { lang: string };

export function AccountPageContent({ lang }: Props) {
  const t = useTranslations("account");
  const { credentials, selectedAccount, isAuthenticated, selectAccount, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace(`/${lang}`);
    }
  }, [isAuthenticated, router, lang]);

  if (!selectedAccount || !credentials) return null;

  const name = selectedAccount.account_name;
  const initialsSource = credentials.member_name || name;
  const initials = initialsSource
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const accountList = Object.values(credentials.accounts);

  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">{t("title")}</h1>

      {/* Profile card */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6 mb-6 flex items-center gap-5">
        <div className="w-16 h-16 rounded-full bg-brand-primary text-white text-xl font-bold flex items-center justify-center shrink-0">
          {initials}
        </div>
        <div className="min-w-0">
          {credentials.member_name && (
            <p className="text-lg font-semibold text-gray-900 truncate">
              {credentials.member_name}
            </p>
          )}
          <p className={`truncate ${credentials.member_name ? "text-sm text-gray-500" : "text-lg font-semibold text-gray-900"}`}>
            {name}
          </p>
          {credentials.member_email && (
            <p className="text-xs text-gray-400 truncate mt-0.5">{credentials.member_email}</p>
          )}
        </div>
      </div>

      {/* Account details */}
      <div className="bg-white border border-gray-100 rounded-2xl divide-y divide-gray-100 mb-6">
        <div className="flex items-center gap-3 px-6 py-4">
          <User size={18} className="text-gray-400 shrink-0" />
          <div>
            <p className="text-xs text-gray-400 mb-0.5">{t("accountName")}</p>
            <p className="text-sm text-gray-800">{name}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 px-6 py-4">
          <Building2 size={18} className="text-gray-400 shrink-0" />
          <div>
            <p className="text-xs text-gray-400 mb-0.5">{t("accountId")}</p>
            <p className="text-xs text-gray-800 font-mono">{selectedAccount.account_id}</p>
          </div>
        </div>
      </div>

      {/* Multiple accounts */}
      {accountList.length > 1 && (
        <div className="bg-white border border-gray-100 rounded-2xl mb-6">
          <p className="px-6 pt-4 pb-2 text-xs font-medium text-gray-400 uppercase tracking-wider">
            {t("accounts")}
          </p>
          <div className="divide-y divide-gray-100">
            {accountList.map((account) => {
              const isActive = account.account_id === credentials.selected;
              return (
                <button
                  key={account.account_id}
                  type="button"
                  onClick={() => !isActive && selectAccount(account.account_id)}
                  disabled={isActive}
                  className={`flex items-center gap-3 w-full px-6 py-3 text-left transition-colors ${
                    isActive
                      ? "cursor-default"
                      : "hover:bg-gray-50 cursor-pointer"
                  }`}
                >
                  <Building2
                    size={15}
                    className={`shrink-0 ${isActive ? "text-brand-primary" : "text-gray-400"}`}
                  />
                  <span
                    className={`text-sm flex-1 ${isActive ? "font-medium text-gray-900" : "text-gray-700"}`}
                  >
                    {account.account_name}
                  </span>
                  {isActive ? (
                    <span className="flex items-center gap-1 text-xs bg-brand-accent/20 text-brand-secondary px-2 py-0.5 rounded-full font-medium">
                      <Check size={11} />
                      {t("active")}
                    </span>
                  ) : (
                    <span className="text-xs text-gray-400">{t("switchAccount")}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="bg-white border border-gray-100 rounded-2xl divide-y divide-gray-100 mb-8">
        <Link
          href={`/${lang}`}
          className="flex items-center gap-3 px-6 py-4 hover:bg-gray-50 transition-colors"
        >
          <ShoppingBag size={18} className="text-gray-400 shrink-0" />
          <span className="text-sm text-gray-700">{t("continueShopping")}</span>
        </Link>
      </div>

      <button
        type="button"
        onClick={() => {
          logout();
          router.push(`/${lang}`);
        }}
        className="flex items-center gap-2 text-sm text-red-600 hover:text-red-700 font-medium"
      >
        <LogOut size={16} />
        {t("signOut")}
      </button>
    </main>
  );
}
