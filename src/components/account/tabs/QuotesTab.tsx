"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileText } from "lucide-react";
import { useTranslations } from "next-intl";
import { createEpClient } from "@/lib/api/ep-client";
import { getQuotes } from "@/lib/api/quotes";
import { useAuth } from "@/context/AuthContext";
import { Badge, type BadgeVariant } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";

// ─── Types ────────────────────────────────────────────────────────────────────

type QuoteSummary = {
  id: string;
  name?: string;
  status?: string;
  createdAt?: string;
  totalFormatted?: string;
  itemCount?: number;
  contact?: { name?: string; email?: string };
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function formatDate(iso: string | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return `${String(d.getDate()).padStart(2, "0")} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

const QUOTE_STATUS_VARIANT: Record<string, BadgeVariant> = {
  pending:  "warning",
  active:   "info",
  accepted: "success",
  rejected: "error",
  expired:  "default",
};

function QuoteStatusBadge({ status }: { status?: string }) {
  if (!status) return <span className="text-gray-400">—</span>;
  const variant = QUOTE_STATUS_VARIANT[status.toLowerCase()] ?? "default";
  const label = status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  return <Badge variant={variant} dot size="sm">{label}</Badge>;
}

function mapQuote(raw: any): QuoteSummary {
  return {
    id: raw.id ?? "",
    name: raw.name ?? raw.id?.slice(0, 8).toUpperCase(),
    status: raw.status,
    createdAt: raw.meta?.timestamps?.created_at,
    totalFormatted:
      raw.meta?.display_price?.with_tax?.formatted ??
      raw.meta?.display_price?.without_tax?.formatted,
    itemCount: raw.meta?.item_count,
    contact: raw.contact,
  };
}

// ─── Main component ────────────────────────────────────────────────────────────

const SKELETON_ROWS = 4;
const COLUMNS = ["quoteColumnId", "quoteColumnDate", "quoteColumnBuyer", "quoteColumnStatus", "quoteColumnTotal", ""] as const;

export function QuotesTab() {
  const t = useTranslations("account");
  const { isAuthenticated } = useAuth();
  const pathname = usePathname();
  const lang = pathname.split("/")[1] ?? "en";

  const [quotes, setQuotes] = useState<QuoteSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    setIsLoading(true);
    const client = createEpClient();
    getQuotes({ client })
      .then((res: any) => {
        if (cancelled) return;
        const raw: any[] = res?.data?.data ?? [];
        setQuotes(raw.map(mapQuote));
      })
      .catch(() => { if (!cancelled) setQuotes([]); })
      .finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, [isAuthenticated]);

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-base font-semibold text-gray-900">{t("tabQuotes")}</h2>
      </div>

      {isLoading ? (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50">
              <tr>
                {COLUMNS.map((col, i) => (
                  <th key={i} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    {col ? t(col as any) : ""}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {Array.from({ length: SKELETON_ROWS }).map((_, i) => (
                <tr key={i}>
                  <td className="px-4 py-4"><Skeleton height={14} className="w-32" /></td>
                  <td className="px-4 py-4"><Skeleton height={14} className="w-24" /></td>
                  <td className="px-4 py-4"><Skeleton height={14} className="w-28" /></td>
                  <td className="px-4 py-4"><Skeleton height={20} className="w-20 rounded-full" /></td>
                  <td className="px-4 py-4"><Skeleton height={14} className="w-16" /></td>
                  <td className="px-4 py-4 w-20" />
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : quotes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <FileText size={36} className="mb-3 opacity-30" />
          <p className="text-sm font-medium text-gray-500">{t("noQuotes")}</p>
        </div>
      ) : (
        <div className="overflow-x-auto overflow-hidden rounded-xl border border-gray-200 bg-white">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50">
              <tr>
                {COLUMNS.map((col, i) => (
                  <th key={i} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                    {col ? t(col as any) : ""}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {quotes.map((q) => (
                <tr key={q.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-4 whitespace-nowrap">
                    <Link
                      href={`/${lang}/account/quotes/${q.id}`}
                      className="text-sm font-mono font-medium text-brand-primary hover:underline"
                    >
                      {q.name ?? q.id.slice(0, 8).toUpperCase()}
                    </Link>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-700 whitespace-nowrap">
                    {formatDate(q.createdAt)}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-700">
                    <span className="block">{q.contact?.name ?? "—"}</span>
                    {q.contact?.email && (
                      <span className="block text-xs text-gray-400">{q.contact.email}</span>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <QuoteStatusBadge status={q.status} />
                  </td>
                  <td className="px-4 py-4 text-sm font-medium text-gray-900 whitespace-nowrap">
                    {q.totalFormatted ?? "—"}
                  </td>
                  <td className="px-4 py-4">
                    <Link
                      href={`/${lang}/account/quotes/${q.id}`}
                      className="text-sm text-brand-primary hover:underline font-medium"
                    >
                      {t("viewQuote")}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
