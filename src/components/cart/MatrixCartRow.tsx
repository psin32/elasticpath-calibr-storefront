"use client";

import { useCallback, useState } from "react";
import { WandSparkles, Eraser } from "lucide-react";
import { useTranslations } from "next-intl";
import type { CartItemEntry, MatrixGroup } from "./types";
import { buildMatrix } from "./types";

type Props = {
  matrixGroup: MatrixGroup;
  cartItemsByProductId: Map<string, CartItemEntry>;
  onQuantityChange: (
    productId: string,
    cartItemId: string | null,
    newQty: number,
  ) => Promise<void>;
  disabled?: boolean;
};

export function MatrixCartRow({
  matrixGroup,
  cartItemsByProductId,
  onQuantityChange,
  disabled,
}: Props) {
  const t = useTranslations("cart");
  const { parentName, parentSku, parentPriceFormatted, children } = matrixGroup;
  const matrix = buildMatrix(children);

  // draft: productId -> string (pending input value)
  const [drafts, setDrafts] = useState<Map<string, string>>(new Map());

  const getQty = useCallback(
    (productId: string) => cartItemsByProductId.get(productId)?.quantity ?? 0,
    [cartItemsByProductId],
  );

  const getDraft = (productId: string) =>
    drafts.has(productId)
      ? drafts.get(productId)!
      : String(getQty(productId) || "");

  const commitCell = async (productId: string, raw: string) => {
    setDrafts((prev) => { const n = new Map(prev); n.delete(productId); return n; });
    const n = parseInt(raw, 10);
    const qty = isNaN(n) || n < 0 ? 0 : n;
    const entry = cartItemsByProductId.get(productId) ?? null;
    await onQuantityChange(productId, entry?.cartItemId ?? null, qty);
  };

  const handleFill = async (n: number) => {
    for (const child of children) {
      const current = getQty(child.id);
      if (current === 0) {
        await onQuantityChange(child.id, null, n);
      }
    }
  };

  const handleClear = async () => {
    for (const [productId, entry] of cartItemsByProductId) {
      await onQuantityChange(productId, entry.cartItemId, 0);
    }
  };

  // Compute totals
  const totalUnits = Array.from(cartItemsByProductId.values()).reduce(
    (s, e) => s + e.quantity, 0,
  );

  if (!matrix) {
    return (
      <section className="bg-white border border-ink-200 rounded-[14px] overflow-hidden">
        <header className="flex items-center gap-3 px-[18px] py-[13px] bg-ink-50 border-b border-ink-200">
          <span className="font-bold text-[15px] text-ink-900">{parentName}</span>
          {parentSku && <span className="font-mono text-[11px] text-ink-600">{parentSku}</span>}
          <div className="flex-1" />
          <span className="font-extrabold text-[15px] text-ink-900">
            {t("units", { count: totalUnits })}
          </span>
        </header>
        <div className="px-[18px] py-4 text-[13px] text-ink-600">{t("noVariants")}</div>
      </section>
    );
  }

  const { rowAxisName, colAxisName, rows, cols, cellMap } = matrix;

  // Per-column totals
  const colTotals = cols.map((col) =>
    rows.reduce((s, row) => {
      const key = rowAxisName ? `${row}|${col}` : `|${col}`;
      const child = cellMap.get(key);
      return s + (child ? getQty(child.id) : 0);
    }, 0),
  );

  // Row totals
  const rowTotals = rows.map((row) =>
    cols.reduce((s, col) => {
      const key = rowAxisName ? `${row}|${col}` : `|${col}`;
      const child = cellMap.get(key);
      return s + (child ? getQty(child.id) : 0);
    }, 0),
  );

  return (
    <section className="bg-white border border-ink-200 rounded-[14px] overflow-hidden">
      {/* Header */}
      <header className="flex items-center gap-3 px-[18px] py-[13px] bg-ink-50 border-b border-ink-200 flex-wrap">
        <span className="font-bold text-[15px] text-ink-900">{parentName}</span>
        {parentSku && (
          <span className="font-mono text-[11px] text-ink-600">{parentSku}</span>
        )}
        {parentPriceFormatted && (
          <span className="text-[12px] text-ink-600">· {parentPriceFormatted}{t("perUnit")}</span>
        )}
        <div className="flex-1" />
        {totalUnits > 0 && (
          <span className="text-[12px] text-ink-600 mr-1">{t("units", { count: totalUnits })}</span>
        )}
        <button
          onClick={() => handleFill(12)}
          disabled={disabled}
          className="h-[30px] px-[11px] rounded-[7px] border border-ink-200 bg-white text-[12px] font-semibold text-ink-700 flex items-center gap-1.5 hover:bg-ink-100 transition-colors disabled:opacity-40"
        >
          <WandSparkles size={13} />
          {t("fill", { qty: 12 })}
        </button>
        <button
          onClick={handleClear}
          disabled={disabled || totalUnits === 0}
          className="h-[30px] px-[11px] rounded-[7px] border border-ink-200 bg-white text-[12px] font-semibold text-ink-600 flex items-center gap-1.5 hover:bg-ink-100 transition-colors disabled:opacity-40"
        >
          <Eraser size={13} />
          {t("clearMatrix")}
        </button>
      </header>

      {/* Scrollable matrix */}
      <div className="overflow-x-auto">
        <div style={{ minWidth: Math.max(560, 140 + cols.length * 80 + 84) }}>
          {/* Column header */}
          <div className="flex items-center border-b border-ink-200">
            <div className="flex-none w-[140px] px-4 py-[9px] font-mono text-[10px] tracking-[.1em] uppercase text-ink-600">
              {rowAxisName ?? colAxisName}
            </div>
            {cols.map((col) => (
              <div
                key={col}
                className="flex-1 text-center px-1 py-[9px] font-bold text-[12px] text-ink-900 border-l border-ink-100"
              >
                {col}
              </div>
            ))}
            <div className="flex-none w-[84px] text-right px-4 py-[9px] font-mono text-[10px] tracking-[.1em] uppercase text-ink-600">
              {t("total")}
            </div>
          </div>

          {/* Rows */}
          {rows.map((row, rIdx) => {
            return (
              <div
                key={row || rIdx}
                className="flex items-center border-b border-ink-100"
              >
                {/* Row label */}
                <div className="flex-none w-[140px] px-4 flex items-center">
                  <span className="font-semibold text-[13px] text-ink-900">{row || "—"}</span>
                </div>

                {/* Cells */}
                {cols.map((col) => {
                  const key = rowAxisName ? `${row}|${col}` : `|${col}`;
                  const child = cellMap.get(key);
                  if (!child) {
                    return (
                      <div
                        key={col}
                        className="flex-1 border-l border-ink-100 h-10 flex items-center justify-center"
                        style={{
                          background:
                            "repeating-linear-gradient(45deg,transparent,transparent 5px,var(--color-ink-50) 5px,var(--color-ink-50) 10px)",
                        }}
                      >
                        <span className="text-ink-300 text-[12px]">—</span>
                      </div>
                    );
                  }

                  const qty = getQty(child.id);
                  const draftVal = getDraft(child.id);

                  return (
                    <div key={col} className="flex-1 border-l border-ink-100 relative">
                      <input
                        type="number"
                        value={draftVal || ""}
                        placeholder="0"
                        min={0}
                        disabled={disabled}
                        onChange={(e) =>
                          setDrafts((prev) => new Map(prev).set(child.id, e.target.value))
                        }
                        onBlur={(e) => commitCell(child.id, e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter")
                            commitCell(child.id, (e.target as HTMLInputElement).value);
                        }}
                        className={[
                          "w-full h-10 text-center text-[13px] font-semibold bg-transparent border-none outline-none",
                          "focus:bg-success-50 transition-colors",
                          "placeholder:text-ink-300",
                          "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
                          qty > 0 ? "text-ink-900" : "text-ink-400",
                        ].join(" ")}
                      />
                      {qty > 0 && (
                        <span className="absolute top-[3px] right-[5px] text-[10px] font-semibold text-success-600 bg-success-50 px-1 rounded leading-tight">
                          {qty}
                        </span>
                      )}
                    </div>
                  );
                })}

                {/* Row total */}
                <div className="flex-none w-[84px] text-right px-4 font-bold text-[14px] text-ink-900">
                  {rowTotals[rIdx] > 0 ? rowTotals[rIdx] : ""}
                </div>
              </div>
            );
          })}

          {/* Footer totals row */}
          <div className="flex items-center bg-ink-50">
            <div className="flex-none w-[140px] px-4 py-[11px] text-[12px] font-bold text-ink-600">
              {parentPriceFormatted ?? t("perSize")}
            </div>
            {colTotals.map((ct, i) => (
              <div
                key={i}
                className="flex-1 text-center px-1 py-[11px] font-semibold text-[13px] text-ink-600 border-l border-ink-100"
              >
                {ct > 0 ? ct : ""}
              </div>
            ))}
            <div className="flex-none w-[84px] text-right px-4 py-[11px] font-extrabold text-[14px] text-success-600">
              {totalUnits > 0 ? totalUnits : ""}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
