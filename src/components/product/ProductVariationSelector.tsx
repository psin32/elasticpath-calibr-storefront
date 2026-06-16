"use client";

import type { ProductVariation } from "@/lib/api/products";

type Props = {
  variations: ProductVariation[];
  variationMatrix: Record<string, unknown>;
  onProductResolved: (productId: string | null) => void;
  selectedOptions: Record<string, string>;
  onOptionChange: (variationId: string, optionId: string) => void;
};

function resolveChildProductId(
  matrix: Record<string, unknown>,
  optionIds: string[],
): string | null {
  function traverse(node: unknown, remaining: string[]): string | null {
    if (typeof node === "string") return node;
    if (!node || typeof node !== "object") return null;
    const map = node as Record<string, unknown>;
    for (const optionId of remaining) {
      if (map[optionId] !== undefined) {
        const rest = remaining.filter((id) => id !== optionId);
        const result = traverse(map[optionId], rest);
        if (result) return result;
      }
    }
    return null;
  }
  return traverse(matrix, optionIds);
}

export function ProductVariationSelector({
  variations,
  variationMatrix,
  onProductResolved,
  selectedOptions,
  onOptionChange,
}: Props) {
  function handleSelect(variationId: string, optionId: string) {
    const updated = { ...selectedOptions, [variationId]: optionId };
    onOptionChange(variationId, optionId);

    const allSelected = variations.every((v) => updated[v.id]);
    if (allSelected) {
      const optionIds = variations.map((v) => updated[v.id]);
      const childId = resolveChildProductId(variationMatrix, optionIds);
      onProductResolved(childId);
    } else {
      onProductResolved(null);
    }
  }

  return (
    <div className="space-y-5">
      {variations.map((variation) => (
        <div key={variation.id}>
          <p className="text-sm font-medium text-gray-700 mb-2">{variation.name}</p>
          <div className="flex flex-wrap gap-2">
            {variation.options.map((option) => {
              const isSelected = selectedOptions[variation.id] === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => handleSelect(variation.id, option.id)}
                  className={[
                    "px-4 py-2 rounded-lg text-sm font-medium border transition-colors",
                    isSelected
                      ? "bg-gray-900 text-white border-gray-900"
                      : "bg-white text-gray-700 border-gray-300 hover:border-gray-500",
                  ].join(" ")}
                >
                  {option.description ?? option.name}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
