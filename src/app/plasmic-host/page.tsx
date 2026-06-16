"use client";

// Importing the loader ensures all registerComponent() calls run before
// PlasmicCanvasHost boots, making custom components available in Studio.
import { PLASMIC } from "@/components/plasmic/plasmic-loader";
import { PlasmicCanvasHost } from "@plasmicapp/loader-nextjs";

export default function PlasmicHostPage() {
  if (!PLASMIC) {
    return (
      <p style={{ padding: "2rem", fontFamily: "monospace" }}>
        Plasmic is not configured. Set NEXT_PUBLIC_PLASMIC_PROJECT_ID and
        NEXT_PUBLIC_PLASMIC_API_TOKEN in your .env file.
      </p>
    );
  }

  return <PlasmicCanvasHost />;
}
