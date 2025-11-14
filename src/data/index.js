import { mockSites } from "./mockSites";

/**
 * @typedef {Object} SiteDetail
 * @property {string} id
 * @property {string} name
 * @property {string} type
 * @property {string} zone
 * @property {string} carOption
 * @property {number} price
 * @property {number} remain
 * @property {number} basePeople
 * @property {number} maxPeople
 * @property {string} squareImg
 * @property {string[]} images
 * @property {number} x
 * @property {number} y
 */

/**
 * Development-friendly entry point that currently returns mock data.
 * Future environments can branch (e.g., process.env.NODE_ENV) or call an API while keeping the SiteDetail shape.
 * @returns {Promise<SiteDetail[]>}
 */
export async function getSites() {
  return mockSites;
}

export { mockSites } from "./mockSites";
