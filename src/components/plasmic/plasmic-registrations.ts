import { PLASMIC } from "./plasmic-loader";

// UI primitives
import { Button } from "@/components/ui/Button/Button";
import { Badge } from "@/components/ui/Badge/Badge";
import {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  CardTitle,
  CardDescription,
} from "@/components/ui/Card/Card";

// Commerce — display
import { Price } from "@/components/product/Price";
import { ProductThumbnail } from "@/components/product/ProductThumbnail";
import { ProductName } from "@/components/product/ProductName";
import { ProductDescription } from "@/components/product/ProductDescription";
import { ProductCard } from "@/components/product/ProductCard";
import { ProductGrid } from "@/components/product/ProductGrid";

// Commerce — interactive
import { AddToCart } from "@/components/product/AddToCart";
import { QuantitySelector } from "@/components/product/QuantitySelector";
import { QuantityAddToCart } from "@/components/product/QuantityAddToCart";

// Shared default product used for canvas preview
const DEMO_PRODUCT = {
  id: "demo-product",
  slug: "demo-product",
  name: "Demo Product",
  priceFormatted: "$99.00",
  originalPriceFormatted: "",
  imageUrl: "",
  description: "A sample product for canvas preview.",
};

const PRODUCT_FIELDS = {
  id: { type: "string" as const },
  slug: { type: "string" as const },
  name: { type: "string" as const },
  priceFormatted: { type: "string" as const },
  originalPriceFormatted: { type: "string" as const },
  imageUrl: { type: "imageUrl" as const },
  description: { type: "string" as const },
};

if (PLASMIC) {
  // ─── Button ──────────────────────────────────────────────────────────────
  PLASMIC.registerComponent(Button, {
    name: "Button",
    classNameProp: "className",
    props: {
      children: "slot",
      variant: {
        type: "choice",
        options: ["primary", "secondary", "outline", "ghost", "destructive", "link"],
        defaultValue: "primary",
      },
      size: {
        type: "choice",
        options: ["xs", "sm", "md", "lg"],
        defaultValue: "md",
      },
      disabled: { type: "boolean", defaultValue: false },
      fullWidth: { type: "boolean", defaultValue: false },
      isLoading: { type: "boolean", defaultValue: false },
    },
    importPath: "@/components/ui/Button/Button",
    importName: "Button",
  });

  // ─── Badge ───────────────────────────────────────────────────────────────
  PLASMIC.registerComponent(Badge, {
    name: "Badge",
    classNameProp: "className",
    props: {
      children: "slot",
      variant: {
        type: "choice",
        options: ["default", "success", "warning", "error", "info", "outline"],
        defaultValue: "default",
      },
      size: {
        type: "choice",
        options: ["sm", "md"],
        defaultValue: "md",
      },
      dot: { type: "boolean", defaultValue: false },
    },
    importPath: "@/components/ui/Badge/Badge",
    importName: "Badge",
  });

  // ─── Card ─────────────────────────────────────────────────────────────────
  PLASMIC.registerComponent(Card, {
    name: "Card",
    classNameProp: "className",
    props: {
      children: "slot",
      variant: {
        type: "choice",
        options: ["default", "bordered", "elevated"],
        defaultValue: "default",
      },
    },
    importPath: "@/components/ui/Card/Card",
    importName: "Card",
  });

  PLASMIC.registerComponent(CardHeader, {
    name: "CardHeader",
    classNameProp: "className",
    props: { children: "slot" },
    importPath: "@/components/ui/Card/Card",
    importName: "CardHeader",
  });

  PLASMIC.registerComponent(CardTitle, {
    name: "CardTitle",
    classNameProp: "className",
    props: { children: "slot" },
    importPath: "@/components/ui/Card/Card",
    importName: "CardTitle",
  });

  PLASMIC.registerComponent(CardDescription, {
    name: "CardDescription",
    classNameProp: "className",
    props: { children: "slot" },
    importPath: "@/components/ui/Card/Card",
    importName: "CardDescription",
  });

  PLASMIC.registerComponent(CardBody, {
    name: "CardBody",
    classNameProp: "className",
    props: { children: "slot" },
    importPath: "@/components/ui/Card/Card",
    importName: "CardBody",
  });

  PLASMIC.registerComponent(CardFooter, {
    name: "CardFooter",
    classNameProp: "className",
    props: { children: "slot" },
    importPath: "@/components/ui/Card/Card",
    importName: "CardFooter",
  });

  // ─── Price ────────────────────────────────────────────────────────────────
  PLASMIC.registerComponent(Price, {
    name: "Price",
    classNameProp: "className",
    props: {
      formatted: { type: "string", defaultValue: "$99.00" },
      originalFormatted: { type: "string", defaultValue: "" },
    },
    importPath: "@/components/product/Price",
    importName: "Price",
  });

  // ─── ProductThumbnail ─────────────────────────────────────────────────────
  PLASMIC.registerComponent(ProductThumbnail, {
    name: "ProductThumbnail",
    classNameProp: "className",
    props: {
      imageUrl: { type: "imageUrl", defaultValue: "" },
      name: { type: "string", defaultValue: "Product" },
      priority: { type: "boolean", defaultValue: false },
    },
    importPath: "@/components/product/ProductThumbnail",
    importName: "ProductThumbnail",
  });

  // ─── ProductName ──────────────────────────────────────────────────────────
  PLASMIC.registerComponent(ProductName, {
    name: "ProductName",
    classNameProp: "className",
    props: {
      name: { type: "string", defaultValue: "Product Name" },
      as: {
        type: "choice",
        options: ["h1", "h2", "h3", "p"],
        defaultValue: "h3",
      },
    },
    importPath: "@/components/product/ProductName",
    importName: "ProductName",
  });

  // ─── ProductDescription ───────────────────────────────────────────────────
  PLASMIC.registerComponent(ProductDescription, {
    name: "ProductDescription",
    classNameProp: "className",
    props: {
      description: {
        type: "string",
        defaultValue: "Product description goes here.",
      },
      truncate: { type: "boolean", defaultValue: false },
    },
    importPath: "@/components/product/ProductDescription",
    importName: "ProductDescription",
  });

  // ─── AddToCart ────────────────────────────────────────────────────────────
  PLASMIC.registerComponent(AddToCart, {
    name: "AddToCart",
    classNameProp: "className",
    props: {
      productId: { type: "string", defaultValue: "demo-product" },
      quantity: { type: "number", defaultValue: 1 },
      variant: {
        type: "choice",
        options: ["default", "full"],
        defaultValue: "default",
      },
    },
    importPath: "@/components/product/AddToCart",
    importName: "AddToCart",
  });

  // ─── QuantitySelector ─────────────────────────────────────────────────────
  PLASMIC.registerComponent(QuantitySelector, {
    name: "QuantitySelector",
    classNameProp: "className",
    props: {
      value: { type: "number", defaultValue: 1 },
      onChange: {
        type: "eventHandler",
        argTypes: [{ name: "quantity", type: { type: "number" } }],
      },
      min: { type: "number", defaultValue: 1 },
      max: { type: "number", defaultValue: 999 },
      disabled: { type: "boolean", defaultValue: false },
    },
    importPath: "@/components/product/QuantitySelector",
    importName: "QuantitySelector",
  });

  // ─── QuantityAddToCart ────────────────────────────────────────────────────
  PLASMIC.registerComponent(QuantityAddToCart, {
    name: "QuantityAddToCart",
    props: {
      productId: { type: "string", defaultValue: "demo-product" },
    },
    importPath: "@/components/product/QuantityAddToCart",
    importName: "QuantityAddToCart",
  });

  // ─── ProductCard ──────────────────────────────────────────────────────────
  PLASMIC.registerComponent(ProductCard, {
    name: "ProductCard",
    props: {
      product: {
        type: "object",
        fields: PRODUCT_FIELDS,
        defaultValue: DEMO_PRODUCT,
      },
      lang: { type: "string", defaultValue: "en" },
      priority: { type: "boolean", defaultValue: false },
    },
    importPath: "@/components/product/ProductCard",
    importName: "ProductCard",
  });

  // ─── ProductGrid ──────────────────────────────────────────────────────────
  PLASMIC.registerComponent(ProductGrid, {
    name: "ProductGrid",
    props: {
      products: {
        type: "array",
        itemType: { type: "object", fields: PRODUCT_FIELDS },
        defaultValue: [
          DEMO_PRODUCT,
          { ...DEMO_PRODUCT, id: "demo-product-2", name: "Demo Product 2" },
          { ...DEMO_PRODUCT, id: "demo-product-3", name: "Demo Product 3" },
          { ...DEMO_PRODUCT, id: "demo-product-4", name: "Demo Product 4" },
        ],
      },
      lang: { type: "string", defaultValue: "en" },
    },
    importPath: "@/components/product/ProductGrid",
    importName: "ProductGrid",
  });
}
