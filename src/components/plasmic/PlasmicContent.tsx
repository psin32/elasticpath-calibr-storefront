"use client";

import {
  ComponentRenderData,
  PlasmicComponent,
  PlasmicRootProvider,
} from "@plasmicapp/loader-nextjs";
import { PLASMIC } from "./plasmic-loader";

type PlasmicContentProps = {
  component: string;
  componentProps?: Record<string, unknown>;
  prefetchedData?: ComponentRenderData | null;
};

export default function PlasmicContent({
  component,
  componentProps,
  prefetchedData,
}: PlasmicContentProps) {
  if (!PLASMIC) {
    return null;
  }

  return (
    <PlasmicRootProvider
      loader={PLASMIC}
      prefetchedData={prefetchedData ?? undefined}
    >
      <PlasmicComponent component={component} componentProps={componentProps} />
    </PlasmicRootProvider>
  );
}
