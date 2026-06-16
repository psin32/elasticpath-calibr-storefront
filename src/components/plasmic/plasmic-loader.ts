import { initPlasmicLoader } from "@plasmicapp/loader-nextjs";
import { plasmicConfig } from "@/lib/plasmic-config";

export const PLASMIC = plasmicConfig.enabled
  ? initPlasmicLoader({
      projects: [
        { id: plasmicConfig.projectId, token: plasmicConfig.apiToken },
      ],
      host: "https://codegen.euwest.storefront.elasticpath.com",
      preview: true,
      platformOptions: { nextjs: { appDir: true } },
    })
  : null;
