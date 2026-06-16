import {
  getByContextAllHierarchies,
  getByContextHierarchyChildNodes,
  getByContextAllNodes,
} from "@epcc-sdk/sdks-shopper";
import { createElasticPathClient } from "@/lib/create-elastic-path-client";
import type { NavItem } from "@/components/header/navigation/types";

export type NavNodeData = {
  id: string;
  slug: string;
  name: string;
  hierarchyId: string;
};

export async function buildSiteNavigation(): Promise<NavItem[]> {
  const client = await createElasticPathClient();

  const hierRes = await getByContextAllHierarchies({ client });
  const hierarchies = (hierRes.data?.data ?? []).slice(0, 5);

  const navItems = await Promise.all(
    hierarchies.map(async (h) => {
      const childRes = await getByContextHierarchyChildNodes({
        client,
        path: { hierarchy_id: h.id! },
        query: { "page[limit]": BigInt(10) },
      });
      const children = childRes.data?.data ?? [];

      const columns = children.slice(0, 4).map((node) => ({
        groups: [
          {
            heading: node.attributes?.name ?? "",
            items: [
              {
                key: node.id ?? "",
                label: "View all " + (node.attributes?.name ?? ""),
                href: `/category/${node.attributes?.slug ?? node.id}`,
              },
            ],
          },
        ],
      }));

      return {
        key: h.id ?? "",
        label: h.attributes?.name ?? "",
        href: `/category/${h.attributes?.slug ?? h.id}`,
        megaMenu:
          columns.length > 0
            ? {
                columns,
              }
            : undefined,
      } satisfies NavItem;
    })
  );

  return navItems;
}

export async function getNodeBySlug(slug: string): Promise<NavNodeData | null> {
  const client = await createElasticPathClient();
  const response = await getByContextAllNodes({
    client,
    query: { filter: `eq(slug,${slug})` },
  });
  const node = response.data?.data?.[0];
  if (!node) return null;
  return {
    id: node.id ?? "",
    slug: node.attributes?.slug ?? "",
    name: node.attributes?.name ?? "",
    hierarchyId:
      (node.relationships as { hierarchy?: { data?: { id?: string } } })?.hierarchy?.data?.id ?? "",
  };
}
