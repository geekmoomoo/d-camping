import { getSites as getSitesFromData } from "../data";

/**
 * SiteService exposes a central data entry point for pages and components.
 * Additional normalization/filtering logic can be added here later.
 * @returns {Promise<import("../data").SiteDetail[]>}
 */
export async function getSites() {
  const sites = await getSitesFromData();
  return sites;
}
