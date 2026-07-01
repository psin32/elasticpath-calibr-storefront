import { plasmicConfig } from "@/lib/plasmic-config";
import { PLASMIC_SERVER } from "@/components/plasmic/plasmic-server-loader";
import PlasmicContent from "@/components/plasmic/PlasmicContent";
import { Footer } from "./Footer";

type FooterSectionProps = {
  lang: string;
};

export async function FooterSection({ lang }: FooterSectionProps) {
  if (!plasmicConfig.enabled) {
    return <Footer lang={lang} />;
  }

  const plasmicData = await PLASMIC_SERVER?.maybeFetchComponentData("footer") ?? null;

  if (!plasmicData) {
    return <Footer lang={lang} />;
  }

  return <PlasmicContent component="footer" prefetchedData={plasmicData} componentProps={{ lang }} />;
}
