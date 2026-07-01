import { plasmicConfig } from "@/lib/plasmic-config";
import { PLASMIC_SERVER } from "@/components/plasmic/plasmic-server-loader";
import PlasmicContent from "@/components/plasmic/PlasmicContent";
import { StorefrontFooter } from "./StorefrontFooter";

type FooterProps = {
  lang: string;
};

export async function Footer({ lang }: FooterProps) {
  if (!plasmicConfig.enabled) {
    return <StorefrontFooter lang={lang} />;
  }

  const plasmicData =
    (await PLASMIC_SERVER?.maybeFetchComponentData("footer")) ?? null;

  if (!plasmicData) {
    return <StorefrontFooter lang={lang} />;
  }

  return (
    <PlasmicContent
      component="footer"
      prefetchedData={plasmicData}
      componentProps={{ lang }}
    />
  );
}
