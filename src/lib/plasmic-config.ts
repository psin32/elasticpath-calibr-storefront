export const plasmicConfig = {
  projectId: process.env.NEXT_PUBLIC_PLASMIC_PROJECT_ID ?? "",
  apiToken: process.env.NEXT_PUBLIC_PLASMIC_API_TOKEN ?? "",
  get enabled() {
    return Boolean(this.projectId && this.apiToken);
  },
};
