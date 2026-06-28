"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight, FileText, ClipboardList, ChevronsUpDown,
  Check, Plus, ShoppingCart, Trash2, Eraser, X,
} from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useTranslations } from "next-intl";

type Props = {
  lang: string;
  totalUnits: number;
  lineCount: number;
  grandTotal: string;
};

type Confirm = { id: string; action: "clear" | "delete" };

export function CartPageHeader({ lang, totalUnits, lineCount, grandTotal }: Props) {
  const t = useTranslations("cart");
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { cartId, allCarts, switchCart, createCart, deleteCart, clearCartById, clearCart, isLoading, cartSubtotal, cartDiscount, cartDiscountAmount } = useCart();

  const [menuOpen, setMenuOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [confirm, setConfirm] = useState<Confirm | null>(null);
  const [confirmClearAll, setConfirmClearAll] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const activeCart = allCarts.find((c) => c.id === cartId);
  const activeName = activeCart?.name ?? "Cart";

  useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
        setCreating(false);
        setConfirm(null);
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  async function handleSwitch(id: string) {
    if (id === cartId) { setMenuOpen(false); return; }
    setMenuOpen(false);
    setConfirm(null);
    await switchCart(id);
  }

  async function handleCreate() {
    const name = newName.trim();
    if (!name) return;
    setCreating(false);
    setNewName("");
    setMenuOpen(false);
    await createCart(name);
  }

  async function handleConfirm() {
    if (!confirm) return;
    const { id, action } = confirm;
    setConfirm(null);
    setMenuOpen(false);
    if (action === "delete") await deleteCart(id);
    else await clearCartById(id);
  }

  return (
    <div className="flex items-start justify-between gap-6 flex-wrap">
      {/* Left: requisition switcher (authenticated) or plain cart title (guest) */}
      {isAuthenticated ? (
      <div className="relative" ref={menuRef}>
        <p className="font-mono text-[10px] tracking-[.12em] uppercase text-[#5C6675] mb-2">
          {t("activeRequisition")}
        </p>
        <button
          onClick={() => { setMenuOpen((o) => !o); setCreating(false); setConfirm(null); }}
          className="flex items-center gap-3.5 bg-white border border-[#DDE1E6] rounded-[14px] px-4 py-3 min-w-[340px] text-left hover:border-[#C2C8D0] transition-colors"
        >
          <span className="w-[38px] h-[38px] rounded-[10px] bg-[#0E1521] text-[#2BCC7E] flex items-center justify-center flex-none">
            <ClipboardList size={19} />
          </span>
          <span className="flex-1 min-w-0">
            <span className="block font-bold text-[16px] text-[#0E1521] tracking-tight truncate">
              {activeName}
            </span>
            <span className="block text-[12px] text-[#5C6675] mt-0.5">
              {t("units", { count: totalUnits })} · {t("products", { count: lineCount })}
            </span>
          </span>
          <ChevronsUpDown size={18} className="text-[#8C95A3] flex-none" />
        </button>

        {totalUnits > 0 && (
          confirmClearAll ? (
            <div className="flex items-center gap-2 mt-2">
              <span className="text-[12px] font-medium text-[#B26A00]">{t("confirmClearCart")}</span>
              <button
                onClick={async () => { await clearCart(); setConfirmClearAll(false); }}
                disabled={isLoading}
                className="h-6 px-2.5 rounded-[6px] bg-[#C2402B] text-white text-[11px] font-semibold hover:bg-[#a8341f] disabled:opacity-40 transition-colors"
              >
                {t("confirm")}
              </button>
              <button
                onClick={() => setConfirmClearAll(false)}
                className="w-6 h-6 rounded-[6px] border border-[#DDE1E6] bg-white text-[#5C6675] flex items-center justify-center hover:bg-[#F7F8F9] transition-colors"
              >
                <X size={11} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => { setMenuOpen(false); setConfirmClearAll(true); }}
              disabled={isLoading}
              className="flex items-center gap-1 mt-2 text-[11px] text-[#8C95A3] hover:text-[#C2402B] transition-colors disabled:opacity-40"
            >
              <Eraser size={11} />
              {t("clearAllItems")}
            </button>
          )
        )}

        {menuOpen && (
          <div className="absolute top-full left-0 mt-2 w-[400px] bg-white border border-[#DDE1E6] rounded-[14px] shadow-[0_24px_60px_rgba(14,21,33,.18)] overflow-hidden z-30">
            <div className="px-4 py-[11px] font-mono text-[10px] tracking-[.12em] uppercase text-[#5C6675] bg-[#F7F8F9] border-b border-[#EEF0F2]">
              {t("switchCart")}
            </div>

            {allCarts.length === 0 ? (
              <div className="px-4 py-3 text-[13px] text-[#8C95A3]">{t("noCartsFound")}</div>
            ) : (
              allCarts.map((c) => {
                const isActive = c.id === cartId;
                const isConfirming = confirm?.id === c.id;

                return (
                  <div key={c.id} className="border-b border-[#EEF0F2] last:border-b-0">
                    {/* Confirm bar */}
                    {isConfirming ? (
                      <div className="flex items-center gap-3 px-4 py-3 bg-[#FFF4E0]">
                        <span className="flex-1 text-[13px] font-medium text-[#B26A00]">
                          {confirm!.action === "delete"
                            ? t("confirmDeleteCart")
                            : t("confirmClearCart")}
                        </span>
                        <button
                          onClick={handleConfirm}
                          disabled={isLoading}
                          className="h-7 px-3 rounded-[6px] bg-[#C2402B] text-white text-[12px] font-semibold hover:bg-[#a8341f] disabled:opacity-40 transition-colors"
                        >
                          {t("confirm")}
                        </button>
                        <button
                          onClick={() => setConfirm(null)}
                          className="w-7 h-7 rounded-[6px] border border-[#DDE1E6] bg-white text-[#5C6675] flex items-center justify-center hover:bg-[#F7F8F9] transition-colors"
                        >
                          <X size={13} />
                        </button>
                      </div>
                    ) : (
                      <div className="group flex items-center gap-3 px-4 py-3 hover:bg-[#F7F8F9] transition-colors">
                        {/* Cart info — click to switch */}
                        <button
                          onClick={() => handleSwitch(c.id)}
                          disabled={isLoading}
                          className="flex items-center gap-3 flex-1 min-w-0 text-left"
                        >
                          <span className={[
                            "w-8 h-8 rounded-[8px] flex items-center justify-center flex-none transition-colors",
                            isActive ? "bg-[#0E1521] text-[#2BCC7E]" : "bg-[#EEF0F2] text-[#5C6675]",
                          ].join(" ")}>
                            <ShoppingCart size={15} />
                          </span>
                          <span className="flex-1 min-w-0">
                            <span className="block font-semibold text-[14px] text-[#0E1521] truncate">{c.name}</span>
                            <span className="block text-[12px] text-[#5C6675]">
                              {c.totalFormatted ?? "—"}
                              {c.itemCount != null ? ` · ${t("items", { count: c.itemCount })}` : ""}
                            </span>
                          </span>
                          {isActive && <Check size={16} className="text-[#21A765] flex-none" />}
                        </button>

                        {/* Action buttons — always visible on hover */}
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => { e.stopPropagation(); setConfirm({ id: c.id, action: "clear" }); }}
                            disabled={isLoading}
                            title={t("clearAllItems")}
                            className="w-7 h-7 rounded-[6px] border border-[#DDE1E6] bg-white text-[#5C6675] flex items-center justify-center hover:border-[#B26A00] hover:text-[#B26A00] transition-colors disabled:opacity-40"
                          >
                            <Eraser size={13} />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); setConfirm({ id: c.id, action: "delete" }); }}
                            disabled={isLoading}
                            title={t("deleteCart")}
                            className="w-7 h-7 rounded-[6px] border border-[#DDE1E6] bg-white text-[#5C6675] flex items-center justify-center hover:border-[#C2402B] hover:text-[#C2402B] transition-colors disabled:opacity-40"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}

            {/* New requisition */}
            {creating ? (
              <div className="flex items-center gap-2 px-4 py-3 border-t border-[#EEF0F2]">
                <input
                  autoFocus
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleCreate();
                    if (e.key === "Escape") { setCreating(false); setNewName(""); }
                  }}
                  placeholder={t("cartNamePlaceholder")}
                  className="flex-1 h-8 px-3 text-[13px] border border-[#DDE1E6] rounded-[8px] outline-none focus:border-[#2BCC7E]"
                />
                <button
                  onClick={handleCreate}
                  disabled={!newName.trim()}
                  className="h-8 px-3 rounded-[8px] bg-[#0E1521] text-white text-[13px] font-semibold disabled:opacity-40"
                >
                  {t("create")}
                </button>
              </div>
            ) : (
              <button
                onClick={() => setCreating(true)}
                className="flex items-center gap-2.5 w-full px-4 py-3 border-t border-[#EEF0F2] text-[#21A765] font-semibold text-[14px] hover:bg-[#EFFCF6] transition-colors"
              >
                <Plus size={16} />
                {t("newRequisition")}
              </button>
            )}
          </div>
        )}
      </div>
      ) : (
        <div>
          <div className="flex items-center gap-3.5">
            <span className="w-[38px] h-[38px] rounded-[10px] bg-[#0E1521] text-[#2BCC7E] flex items-center justify-center flex-none">
              <ShoppingCart size={19} />
            </span>
            <div>
              <p className="font-bold text-[18px] text-[#0E1521] tracking-tight">{t("yourCart")}</p>
              <p className="text-[12px] text-[#5C6675] mt-0.5">
                {t("units", { count: totalUnits })} · {t("products", { count: lineCount })}
              </p>
            </div>
          </div>
          {totalUnits > 0 && (
            confirmClearAll ? (
              <div className="flex items-center gap-2 mt-2">
                <span className="text-[12px] font-medium text-[#B26A00]">{t("confirmClearCart")}</span>
                <button
                  onClick={async () => { await clearCart(); setConfirmClearAll(false); }}
                  disabled={isLoading}
                  className="h-6 px-2.5 rounded-[6px] bg-[#C2402B] text-white text-[11px] font-semibold hover:bg-[#a8341f] disabled:opacity-40 transition-colors"
                >
                  {t("confirm")}
                </button>
                <button
                  onClick={() => setConfirmClearAll(false)}
                  className="w-6 h-6 rounded-[6px] border border-[#DDE1E6] bg-white text-[#5C6675] flex items-center justify-center hover:bg-[#F7F8F9] transition-colors"
                >
                  <X size={11} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmClearAll(true)}
                disabled={isLoading}
                className="flex items-center gap-1 mt-2 text-[11px] text-[#8C95A3] hover:text-[#C2402B] transition-colors disabled:opacity-40"
              >
                <Eraser size={11} />
                {t("clearAllItems")}
              </button>
            )
          )}
        </div>
      )}

      {/* Right: totals + actions */}
      <div className="flex items-center gap-6">
        <div className="text-right">
          <p className="text-[12px] text-[#5C6675] mb-1 whitespace-nowrap">
            {t("units", { count: totalUnits })} · {t("products", { count: lineCount })}
          </p>
          {cartDiscountAmount < 0 && cartSubtotal ? (
            <div className="flex flex-col items-end gap-0.5">
              <div className="flex items-center gap-6">
                <span className="text-[12px] text-[#5C6675]">{t("subtotal")}</span>
                <span className="text-[14px] text-[#5C6675]">{cartSubtotal}</span>
              </div>
              <div className="flex items-center gap-6">
                <span className="text-[12px] text-[#21A765]">{t("discount")}</span>
                <span className="text-[14px] font-semibold text-[#21A765]">{cartDiscount}</span>
              </div>
              <div className="h-px w-full bg-[#DDE1E6] my-0.5" />
              <p className="font-serif text-[30px] leading-none text-[#0E1521]">{grandTotal}</p>
            </div>
          ) : (
            <p className="font-serif text-[30px] leading-none text-[#0E1521]">{grandTotal}</p>
          )}
        </div>
        {isAuthenticated && (
          <button
            onClick={() => router.push(`/${lang}/quote-request`)}
            disabled={lineCount === 0}
            className="h-12 px-5 rounded-[11px] border border-[#C2C8D0] bg-white font-semibold text-[14px] text-[#3D4654] flex items-center gap-2 hover:bg-[#F7F8F9] transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none"
          >
            <FileText size={16} />
            {t("requestQuote")}
          </button>
        )}
        <Link
          href={lineCount === 0 ? "#" : `/${lang}/checkout`}
          aria-disabled={lineCount === 0}
          className={`h-12 px-6 rounded-[11px] bg-[#0E1521] text-white font-bold text-[14px] flex items-center gap-2 transition-opacity${lineCount === 0 ? " opacity-40 cursor-not-allowed pointer-events-none" : " hover:opacity-90"}`}
        >
          {t("checkout")}
          <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
}
