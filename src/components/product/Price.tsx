import { cn } from "@/lib/utils";

type PriceProps = {
  formatted: string;
  originalFormatted?: string;
  className?: string;
};

export function Price({ formatted, originalFormatted, className }: PriceProps) {
  if (!formatted) return null;
  const isOnSale = Boolean(originalFormatted);

  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span
        className={cn(
          "font-bold text-gray-900",
          isOnSale && "text-red-600"
        )}
      >
        {formatted}
      </span>
      {isOnSale && (
        <span className="text-sm text-gray-400 line-through">{originalFormatted}</span>
      )}
    </span>
  );
}
