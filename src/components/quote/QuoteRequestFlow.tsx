"use client";

import { useState, useId } from "react";
import { useRouter } from "next/navigation";
import {
  FileText,
  X,
  Check,
  ArrowRight,
  ArrowLeft,
  Send,
  Lock,
  Info,
  ShoppingBag,
} from "lucide-react";
import { useCart } from "@/context/CartContext";

type Step = "details" | "review" | "success";

type FormState = {
  company: string;
  contact: string;
  email: string;
  phone: string;
  po: string;
  ship: string;
  date: string;
  urgency: "standard" | "urgent";
  terms: "net30" | "net60" | "net90" | "prepay" | "";
  target: string;
  volume: string;
  notes: string;
};

const TERMS_OPTIONS = [
  { value: "net30", label: "Net 30" },
  { value: "net60", label: "Net 60" },
  { value: "net90", label: "Net 90" },
  { value: "prepay", label: "Prepay" },
] as const;

const URGENCY_OPTIONS = [
  { value: "standard", label: "Standard", sub: "3–5 days" },
  { value: "urgent", label: "Urgent", sub: "+fees" },
] as const;

const STEPS = [
  { key: "details", num: "1", label: "Details" },
  { key: "review", num: "2", label: "Review" },
  { key: "success", num: "3", label: "Confirmed" },
] as const;

const TIMELINE = [
  {
    label: "Confirmation email sent",
    sub: "Within a few minutes to your inbox",
    done: true,
  },
  {
    label: "Account team review",
    sub: "Typically 1–2 business days",
    done: false,
  },
  {
    label: "Quoted pricing returned",
    sub: "Volume discounts and terms confirmed",
    done: false,
  },
  {
    label: "Order on approval",
    sub: "Place the order once you accept the quote",
    done: false,
  },
];

function generateRef() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let r = "QR-";
  for (let i = 0; i < 6; i++) r += chars[Math.floor(Math.random() * chars.length)];
  return r;
}

export function QuoteRequestFlow({ lang }: { lang: string }) {
  const router = useRouter();
  const { items, cartTotal } = useCart();
  const formId = useId();

  const [step, setStep] = useState<Step>("details");
  const [acked, setAcked] = useState(false);
  const [ref] = useState(generateRef);
  const [submittedDate] = useState(() =>
    new Date().toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }),
  );

  const [form, setForm] = useState<FormState>({
    company: "",
    contact: "",
    email: "",
    phone: "",
    po: "",
    ship: "",
    date: "",
    urgency: "standard",
    terms: "net30",
    target: "",
    volume: "",
    notes: "",
  });

  const set = (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const totalUnits = items.reduce((s, i) => s + i.quantity, 0);
  const lineCount = items.length;

  const canContinue = form.company.trim() && form.contact.trim() && form.email.trim();

  /* ── Stepper ── */
  function Stepper() {
    return (
      <div className="flex items-center justify-center flex-1">
        {STEPS.map((st, i) => {
          const isDone = (step === "review" && i < 1) || step === "success";
          const isActive = st.key === step;
          const isPast = (st.key === "details" && (step === "review" || step === "success")) ||
            (st.key === "review" && step === "success");
          const isLast = i === STEPS.length - 1;

          return (
            <div key={st.key} className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <span
                  className={[
                    "w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold transition-colors",
                    isPast
                      ? "bg-[#2BCC7E] text-[#0E1521]"
                      : isActive
                        ? "bg-[#0E1521] text-white ring-2 ring-offset-2 ring-[#2BCC7E]"
                        : "bg-[#DDE1E6] text-[#5C6675]",
                  ].join(" ")}
                >
                  {isPast ? <Check size={14} /> : st.num}
                </span>
                <span
                  className={[
                    "text-sm font-medium",
                    isActive ? "text-[#0E1521]" : isPast ? "text-[#2BCC7E]" : "text-[#8C95A3]",
                  ].join(" ")}
                >
                  {st.label}
                </span>
              </div>
              {!isLast && (
                <span
                  className={[
                    "w-16 h-px mx-1",
                    isPast ? "bg-[#2BCC7E]" : "bg-[#DDE1E6]",
                  ].join(" ")}
                />
              )}
            </div>
          );
        })}
      </div>
    );
  }

  /* ── Header ── */
  const pageHeader = (
    <header className="flex-none flex items-center gap-6 px-8 py-4 bg-white border-b border-[#DDE1E6]">
      <div className="flex items-center gap-3 w-[260px] flex-none">
        <span className="w-[38px] h-[38px] rounded-[10px] bg-[#0E1521] text-[#2BCC7E] flex items-center justify-center flex-none">
          <FileText size={19} />
        </span>
        <div className="min-w-0">
          <p className="font-mono text-[10px] tracking-[.12em] uppercase text-[#5C6675] truncate">
            Cart
          </p>
          <p className="font-bold text-[17px] tracking-tight text-[#0E1521]">Request a quote</p>
        </div>
      </div>

      <Stepper />

      <div className="min-w-[200px] flex justify-end">
        {step !== "success" && (
          <button
            onClick={() => router.push(`/${lang}/cart`)}
            className="w-9 h-9 rounded-full border border-[#DDE1E6] bg-white text-[#5C6675] flex items-center justify-center hover:bg-[#F7F8F9] transition-colors"
            aria-label="Cancel quote request"
          >
            <X size={16} />
          </button>
        )}
      </div>
    </header>
  );

  /* ── Items list ── */
  function ItemsList({ editable = false }: { editable?: boolean }) {
    return (
      <section className="bg-white border border-[#DDE1E6] rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-[22px] py-4 border-b border-[#EEF0F2]">
          <p className="font-bold text-[15px] text-[#0E1521]">Items in this quote</p>
          <div className="flex items-center gap-3">
            <p className="text-[13px] text-[#5C6675]">
              {totalUnits} unit{totalUnits !== 1 ? "s" : ""} · {lineCount} product{lineCount !== 1 ? "s" : ""}
            </p>
            {editable && (
              <button
                onClick={() => setStep("details")}
                className="flex items-center gap-1.5 text-[#21A765] font-semibold text-[13px] bg-transparent border-none"
              >
                <span className="inline-flex items-center justify-center w-[14px] h-[14px]">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </span>
                Edit
              </button>
            )}
          </div>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-12 text-[#8C95A3]">
            <ShoppingBag size={32} />
            <p className="text-sm">No items in cart</p>
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-3.5 px-[22px] py-[13px] border-b border-[#EEF0F2] last:border-b-0"
            >
              <span className="w-[38px] h-[38px] rounded-[9px] bg-[#EEF0F2] text-[#5C6675] flex items-center justify-center flex-none">
                <ShoppingBag size={19} />
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-[14px] text-[#0E1521]">{item.name}</p>
                <p className="text-[12px] text-[#5C6675] font-mono mt-0.5">
                  {item.sku} · {item.quantity} unit{item.quantity !== 1 ? "s" : ""}
                </p>
              </div>
              <div className="text-right">
                <p className="font-bold text-[14px] text-[#0E1521]">{item.lineTotalFormatted}</p>
                <p className="text-[11px] text-[#8C95A3]">list</p>
              </div>
            </div>
          ))
        )}

        <div className="flex items-center gap-2.5 px-[22px] py-3 bg-[#EFFCF6] text-[#18804C] text-[12.5px] font-medium">
          <Info size={15} className="flex-none" />
          Your account team confirms volume pricing on the returned quote — list prices shown for
          reference.
        </div>
      </section>
    );
  }

  /* ── STEP 1: DETAILS ── */
  const inputCls =
    "w-full h-11 border border-[#DDE1E6] rounded-[10px] px-[13px] text-[14px] text-[#0E1521] outline-none bg-white focus:border-[#2BCC7E] focus:ring-1 focus:ring-[#2BCC7E] transition-colors";
  const labelCls = "block text-[12px] font-semibold text-[#3D4654] mb-[7px]";

  const step1 = (
    <div className="flex-1 min-h-0 flex flex-col">
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[1060px] mx-auto px-10 py-8 flex gap-6 items-start">
          {/* Main column */}
          <div className="flex-1 min-w-0 flex flex-col gap-[18px]">
            <ItemsList />

            {/* Company & contact */}
            <section className="bg-white border border-[#DDE1E6] rounded-2xl p-[22px]">
              <p className="font-mono text-[10px] tracking-[.12em] uppercase text-[#5C6675] mb-[14px]">
                Company & contact
              </p>
              <div className="flex flex-col gap-[14px]">
                <div>
                  <label htmlFor={`${formId}-company`} className={labelCls}>Company name</label>
                  <input
                    id={`${formId}-company`}
                    value={form.company}
                    onChange={set("company")}
                    className={inputCls}
                    placeholder="Acme Corp"
                  />
                </div>
                <div className="flex gap-[14px]">
                  <div className="flex-1">
                    <label htmlFor={`${formId}-contact`} className={labelCls}>Buyer name</label>
                    <input
                      id={`${formId}-contact`}
                      value={form.contact}
                      onChange={set("contact")}
                      className={inputCls}
                      placeholder="Jane Smith"
                    />
                  </div>
                  <div className="flex-1">
                    <label htmlFor={`${formId}-email`} className={labelCls}>Work email</label>
                    <input
                      id={`${formId}-email`}
                      type="email"
                      value={form.email}
                      onChange={set("email")}
                      className={inputCls}
                      placeholder="jane@acme.com"
                    />
                  </div>
                </div>
                <div className="flex gap-[14px]">
                  <div className="flex-1">
                    <label htmlFor={`${formId}-phone`} className={labelCls}>Phone</label>
                    <input
                      id={`${formId}-phone`}
                      type="tel"
                      value={form.phone}
                      onChange={set("phone")}
                      className={inputCls}
                      placeholder="+1 555 000 0000"
                    />
                  </div>
                  <div className="flex-1">
                    <label htmlFor={`${formId}-po`} className={labelCls}>PO reference</label>
                    <input
                      id={`${formId}-po`}
                      value={form.po}
                      onChange={set("po")}
                      className={`${inputCls} font-mono`}
                      placeholder="PO-2026-001"
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Delivery */}
            <section className="bg-white border border-[#DDE1E6] rounded-2xl p-[22px]">
              <p className="font-mono text-[10px] tracking-[.12em] uppercase text-[#5C6675] mb-[14px]">
                Delivery
              </p>
              <div className="flex flex-col gap-[14px]">
                <div>
                  <label htmlFor={`${formId}-ship`} className={labelCls}>Ship-to address</label>
                  <textarea
                    id={`${formId}-ship`}
                    value={form.ship}
                    onChange={set("ship")}
                    rows={2}
                    className="w-full border border-[#DDE1E6] rounded-[10px] px-[13px] py-[11px] text-[14px] leading-relaxed text-[#0E1521] outline-none bg-white focus:border-[#2BCC7E] focus:ring-1 focus:ring-[#2BCC7E] resize-y transition-colors"
                    placeholder="123 Main St, Suite 400, San Francisco CA 94105"
                  />
                </div>
                <div className="flex gap-5 flex-wrap items-end">
                  <div className="flex-1 min-w-[180px]">
                    <label htmlFor={`${formId}-date`} className={labelCls}>Requested delivery date</label>
                    <input
                      id={`${formId}-date`}
                      type="date"
                      value={form.date}
                      onChange={set("date")}
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Handling</label>
                    <div className="flex gap-2">
                      {URGENCY_OPTIONS.map((u) => (
                        <button
                          key={u.value}
                          type="button"
                          onClick={() => setForm((f) => ({ ...f, urgency: u.value }))}
                          className={[
                            "h-11 px-4 rounded-[10px] border text-[14px] font-medium flex items-center gap-2 transition-colors",
                            form.urgency === u.value
                              ? "border-[#2BCC7E] bg-[#EFFCF6] text-[#0E1521]"
                              : "border-[#DDE1E6] bg-white text-[#5C6675] hover:border-[#C2C8D0]",
                          ].join(" ")}
                        >
                          {u.label}{" "}
                          <span className="text-[11px] text-[#5C6675] font-normal">{u.sub}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Commercial terms */}
            <section className="bg-white border border-[#DDE1E6] rounded-2xl p-[22px]">
              <p className="font-mono text-[10px] tracking-[.12em] uppercase text-[#5C6675] mb-[14px]">
                Commercial terms
              </p>
              <div className="flex flex-col gap-4">
                <div>
                  <label className={labelCls}>Requested payment terms</label>
                  <div className="flex gap-2 flex-wrap">
                    {TERMS_OPTIONS.map((t) => (
                      <button
                        key={t.value}
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, terms: t.value }))}
                        className={[
                          "h-10 px-4 rounded-[10px] border text-[14px] font-medium transition-colors",
                          form.terms === t.value
                            ? "border-[#2BCC7E] bg-[#EFFCF6] text-[#0E1521]"
                            : "border-[#DDE1E6] bg-white text-[#5C6675] hover:border-[#C2C8D0]",
                        ].join(" ")}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-[14px] flex-wrap">
                  <div className="flex-1 min-w-[200px]">
                    <label htmlFor={`${formId}-target`} className={labelCls}>
                      Target price / discount{" "}
                      <span className="text-[#8C95A3] font-normal">(optional)</span>
                    </label>
                    <input
                      id={`${formId}-target`}
                      value={form.target}
                      onChange={set("target")}
                      placeholder="e.g. 15% off list"
                      className={inputCls}
                    />
                  </div>
                  <div className="flex-1 min-w-[200px]">
                    <label htmlFor={`${formId}-volume`} className={labelCls}>
                      Expected annual volume{" "}
                      <span className="text-[#8C95A3] font-normal">(optional)</span>
                    </label>
                    <input
                      id={`${formId}-volume`}
                      value={form.volume}
                      onChange={set("volume")}
                      placeholder="e.g. 12,000 units / yr"
                      className={inputCls}
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Notes */}
            <section className="bg-white border border-[#DDE1E6] rounded-2xl p-[22px]">
              <p className="font-mono text-[10px] tracking-[.12em] uppercase text-[#5C6675] mb-[14px]">
                Notes for your account team{" "}
                <span className="normal-case tracking-normal text-[#8C95A3]">(optional)</span>
              </p>
              <textarea
                id={`${formId}-notes`}
                value={form.notes}
                onChange={set("notes")}
                rows={3}
                placeholder="Custom branding, decoration, split shipments, compliance requirements…"
                className="w-full border border-[#DDE1E6] rounded-[10px] px-[13px] py-[11px] text-[14px] leading-relaxed text-[#0E1521] outline-none bg-white focus:border-[#2BCC7E] focus:ring-1 focus:ring-[#2BCC7E] resize-y transition-colors"
              />
            </section>
          </div>

          {/* Summary rail */}
          <aside className="flex-none w-[300px] sticky top-0 bg-white border border-[#DDE1E6] rounded-2xl p-[22px]">
            <p className="font-mono text-[10px] tracking-[.12em] uppercase text-[#5C6675] mb-4">
              Quote summary
            </p>
            <div className="flex justify-between text-[13px] text-[#3D4654] py-1.5">
              <span>Products</span>
              <span className="font-semibold text-[#0E1521]">{lineCount}</span>
            </div>
            <div className="flex justify-between text-[13px] text-[#3D4654] py-1.5">
              <span>Total units</span>
              <span className="font-semibold text-[#0E1521]">{totalUnits}</span>
            </div>
            <div className="h-px bg-[#EEF0F2] my-2.5" />
            <div className="flex justify-between items-baseline py-1">
              <span className="text-[13px] text-[#5C6675]">List value</span>
              <span className="font-serif text-[24px] text-[#0E1521]">{cartTotal}</span>
            </div>
            <div className="flex items-start gap-2 mt-3.5 p-3 rounded-[11px] bg-[#F7F8F9] text-[12px] text-[#5C6675] leading-relaxed">
              <Lock size={14} className="flex-none mt-0.5 shrink-0" />
              Final quoted pricing may be lower than list once volume terms are applied.
            </div>
          </aside>
        </div>
      </div>

      {/* Footer */}
      <footer className="flex-none flex items-center justify-between px-8 py-3.5 bg-white border-t border-[#DDE1E6]">
        <button
          onClick={() => router.push(`/${lang}/cart`)}
          className="h-[46px] px-[18px] rounded-[11px] border border-[#C2C8D0] bg-white font-semibold text-[14px] text-[#232C3A] hover:bg-[#F7F8F9] transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={() => canContinue && setStep("review")}
          disabled={!canContinue}
          className={[
            "h-[46px] px-6 rounded-[11px] border-none font-semibold text-[14px] flex items-center gap-2 transition-all",
            canContinue
              ? "bg-[#0E1521] text-white hover:opacity-90 cursor-pointer"
              : "bg-[#DDE1E6] text-[#8C95A3] cursor-not-allowed",
          ].join(" ")}
        >
          Continue to review
          <ArrowRight size={16} />
        </button>
      </footer>
    </div>
  );

  /* ── STEP 2: REVIEW ── */
  const reviewRow = (label: string, value: string) => (
    <div className="bg-white px-[22px] py-[14px]">
      <p className="text-[11px] text-[#5C6675] mb-1">{label}</p>
      <p className="font-semibold text-[14px] text-[#0E1521]">{value || "—"}</p>
    </div>
  );

  const termsLabel =
    TERMS_OPTIONS.find((t) => t.value === form.terms)?.label ?? form.terms;
  const urgencyLabel = form.urgency === "urgent" ? "Urgent (+fees)" : "Standard (3–5 days)";
  const dateLabel = form.date
    ? new Date(form.date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "—";

  const step2 = (
    <div className="flex-1 min-h-0 flex flex-col">
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[760px] mx-auto px-10 py-8 flex flex-col gap-[18px]">
          <p className="font-serif text-[26px] tracking-tight text-[#0E1521]">
            Review your request
          </p>

          {/* Items recap */}
          <section className="bg-white border border-[#DDE1E6] rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-[22px] py-[15px] border-b border-[#EEF0F2]">
              <p className="font-bold text-[14px] text-[#0E1521]">
                Items · {totalUnits} units
              </p>
              <button
                onClick={() => setStep("details")}
                className="flex items-center gap-1.5 text-[#21A765] font-semibold text-[13px] bg-transparent border-none"
              >
                <span className="inline-flex items-center justify-center w-[14px] h-[14px]">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </span>
                Edit
              </button>
            </div>
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-3 px-[22px] py-[11px] border-b border-[#EEF0F2] last:border-b-0"
              >
                <div className="min-w-0">
                  <span className="font-semibold text-[14px] text-[#0E1521]">{item.name}</span>{" "}
                  <span className="text-[12px] text-[#5C6675]">
                    · {item.quantity} unit{item.quantity !== 1 ? "s" : ""}
                  </span>
                </div>
                <p className="font-bold text-[14px] text-[#0E1521] whitespace-nowrap">
                  {item.lineTotalFormatted}
                </p>
              </div>
            ))}
            <div className="flex items-center justify-between px-[22px] py-[13px] bg-[#F7F8F9]">
              <span className="text-[13px] text-[#5C6675]">List value</span>
              <span className="font-serif text-[20px] text-[#0E1521]">{cartTotal}</span>
            </div>
          </section>

          {/* Details recap */}
          <section className="bg-white border border-[#DDE1E6] rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-[22px] py-[15px] border-b border-[#EEF0F2]">
              <p className="font-bold text-[14px] text-[#0E1521]">Request details</p>
              <button
                onClick={() => setStep("details")}
                className="flex items-center gap-1.5 text-[#21A765] font-semibold text-[13px] bg-transparent border-none"
              >
                <span className="inline-flex items-center justify-center w-[14px] h-[14px]">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </span>
                Edit
              </button>
            </div>
            <div className="grid grid-cols-2 gap-px bg-[#EEF0F2]">
              {reviewRow("Company", form.company)}
              {reviewRow("Buyer", form.contact)}
              {reviewRow("Email", form.email)}
              {reviewRow("PO reference", form.po)}
              {reviewRow("Requested delivery", dateLabel)}
              {reviewRow("Handling", urgencyLabel)}
              {reviewRow("Payment terms", termsLabel)}
              {reviewRow("Target price", form.target || "Not specified")}
            </div>
            {form.notes && (
              <div className="px-[22px] py-[14px] border-t border-[#EEF0F2]">
                <p className="text-[11px] text-[#5C6675] mb-1">Notes</p>
                <p className="text-[14px] text-[#232C3A] leading-relaxed whitespace-pre-wrap">
                  {form.notes}
                </p>
              </div>
            )}
          </section>

          {/* Acknowledgement */}
          <button
            type="button"
            onClick={() => setAcked((a) => !a)}
            className="flex items-start gap-[13px] text-left bg-white border border-[#DDE1E6] rounded-[14px] px-[18px] py-4 w-full hover:border-[#C2C8D0] transition-colors"
          >
            <span
              className={[
                "flex-none w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 transition-colors",
                acked
                  ? "bg-[#2BCC7E] border-[#2BCC7E] text-[#0E1521]"
                  : "border-[#C2C8D0] bg-white",
              ].join(" ")}
            >
              {acked && <Check size={11} strokeWidth={3} />}
            </span>
            <span className="text-[13.5px] text-[#232C3A] leading-relaxed">
              The details above are accurate. I understand this submits a quote request — not an
              order — and the Elastic Path account team will respond with confirmed pricing and
              terms.
            </span>
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer className="flex-none flex items-center justify-between px-8 py-3.5 bg-white border-t border-[#DDE1E6]">
        <button
          onClick={() => setStep("details")}
          className="h-[46px] px-[18px] rounded-[11px] border border-[#C2C8D0] bg-white font-semibold text-[14px] text-[#232C3A] flex items-center gap-2 hover:bg-[#F7F8F9] transition-colors"
        >
          <ArrowLeft size={16} />
          Back
        </button>
        <button
          onClick={() => acked && setStep("success")}
          disabled={!acked}
          className={[
            "h-[46px] px-6 rounded-[11px] border-none font-semibold text-[14px] flex items-center gap-2 transition-all",
            acked
              ? "bg-[#2BCC7E] text-[#0E1521] hover:bg-[#21A765] hover:text-white cursor-pointer"
              : "bg-[#DDE1E6] text-[#8C95A3] cursor-not-allowed",
          ].join(" ")}
        >
          Submit quote request
          <Send size={16} />
        </button>
      </footer>
    </div>
  );

  /* ── STEP 3: SUCCESS ── */
  const step3 = (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-[560px] mx-auto px-10 py-12 flex flex-col items-center text-center">
        {/* Check circle */}
        <div className="w-[72px] h-[72px] rounded-full bg-[#EFFCF6] border border-[#A6EBCA] flex items-center justify-center text-[#21A765] animate-pop-in">
          <Check size={36} />
        </div>

        <h2 className="font-serif font-medium text-[32px] tracking-tight text-[#0E1521] mt-6 mb-0">
          Quote request submitted
        </h2>
        <p className="text-[15px] text-[#3D4654] leading-relaxed mt-3 max-w-[42ch]">
          Your request is with the Elastic Path account team. You&apos;ll get a confirmation email
          at <strong className="text-[#0E1521]">{form.email}</strong>.
        </p>

        {/* Reference badge */}
        <div className="inline-flex items-center gap-2.5 mt-6 px-[18px] py-[11px] rounded-full bg-[#0E1521] text-white">
          <span className="font-mono text-[10px] tracking-[.12em] uppercase text-[#61DEA6]">
            Reference
          </span>
          <span className="font-mono font-bold text-[15px] tracking-[.04em]">{ref}</span>
        </div>

        {/* Summary row */}
        <div className="flex w-full mt-6 border border-[#DDE1E6] rounded-[14px] overflow-hidden bg-white">
          <div className="flex-1 px-3 py-[15px] border-r border-[#EEF0F2]">
            <p className="text-[11px] text-[#5C6675]">Submitted</p>
            <p className="font-semibold text-[14px] text-[#0E1521] mt-0.5">{submittedDate}</p>
          </div>
          <div className="flex-1 px-3 py-[15px] border-r border-[#EEF0F2]">
            <p className="text-[11px] text-[#5C6675]">Units</p>
            <p className="font-semibold text-[14px] text-[#0E1521] mt-0.5">{totalUnits}</p>
          </div>
          <div className="flex-1 px-3 py-[15px]">
            <p className="text-[11px] text-[#5C6675]">List value</p>
            <p className="font-semibold text-[14px] text-[#0E1521] mt-0.5">{cartTotal}</p>
          </div>
        </div>

        {/* Timeline */}
        <div className="w-full mt-6 bg-white border border-[#DDE1E6] rounded-2xl px-6 py-[22px] text-left">
          <p className="font-mono text-[10px] tracking-[.12em] uppercase text-[#5C6675] mb-4">
            What happens next
          </p>
          {TIMELINE.map((t, i) => (
            <div key={i} className="flex gap-3.5">
              <div className="flex flex-col items-center">
                <span
                  className={[
                    "w-[26px] h-[26px] rounded-full flex items-center justify-center flex-none text-sm font-bold",
                    t.done
                      ? "bg-[#2BCC7E] text-[#0E1521]"
                      : "bg-[#EEF0F2] text-[#8C95A3]",
                  ].join(" ")}
                >
                  {t.done ? <Check size={13} /> : i + 1}
                </span>
                {i < TIMELINE.length - 1 && (
                  <span className="w-px flex-1 bg-[#EEF0F2] my-1" />
                )}
              </div>
              <div className={i < TIMELINE.length - 1 ? "pb-4" : ""}>
                <p
                  className={[
                    "text-[14px] font-semibold",
                    t.done ? "text-[#0E1521]" : "text-[#5C6675]",
                  ].join(" ")}
                >
                  {t.label}
                </p>
                <p className="text-[12.5px] text-[#5C6675] mt-0.5">{t.sub}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-3 mt-7">
          <button
            onClick={() => router.push(`/${lang}/cart`)}
            className="h-12 px-[26px] rounded-[12px] bg-[#0E1521] text-white font-bold text-[14px] flex items-center gap-2 hover:opacity-90 transition-opacity"
          >
            <ArrowLeft size={16} />
            Back to cart
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#EEF0F2] flex flex-col">
      {pageHeader}
      {step === "details" && step1}
      {step === "review" && step2}
      {step === "success" && step3}
    </div>
  );
}
