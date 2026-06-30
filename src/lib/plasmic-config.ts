export const plasmicConfig = {
  projectId: process.env.NEXT_PUBLIC_EP_CMS_PROJECT_ID ?? "",
  apiToken: process.env.NEXT_PUBLIC_EP_CMS_API_TOKEN ?? "",
  get enabled() {
    return Boolean(this.projectId && this.apiToken);
  },
};
