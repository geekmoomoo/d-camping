import { sites } from "../config/sitesConfig";

const TYPE_META = {
  caravan: {
    siteType: "self-caravan",
    typeLabel: "Caravan Site",
    zoneLabel: "Caravan Area",
    carOption: "Caravan (4pax)",
    basePrice: 160000,
  },
  cabana: {
    siteType: "cabana-deck",
    typeLabel: "Cabana Deck",
    zoneLabel: "Cabana Area",
    carOption: "Cabana (4pax)",
    basePrice: 170000,
  },
  camp: {
    siteType: "tent",
    typeLabel: "Tent Site",
    zoneLabel: "Camping Zone",
    carOption: "Tent (6pax)",
    basePrice: 120000,
  },
  room: {
    siteType: "lodging",
    typeLabel: "Lodging Room",
    zoneLabel: "Lodging Wing",
    carOption: "Room (4pax)",
    basePrice: 190000,
  },
};

const IMAGE_ASSETS = [
  "/site_img/site_001.jpg",
  "/site_img/site_002.jpg",
  "/site_img/site_003.jpg",
  "/site_img/site_004.jpg",
];

const getImageCarousel = (startIndex) => [
  IMAGE_ASSETS[startIndex % IMAGE_ASSETS.length],
  IMAGE_ASSETS[(startIndex + 1) % IMAGE_ASSETS.length],
  IMAGE_ASSETS[(startIndex + 2) % IMAGE_ASSETS.length],
];

export const mockSites = sites.map((site, index) => {
  const meta = TYPE_META[site.type] || TYPE_META.camp;
  const priceDelta = (index % 3) * 15000;
  const imageIndex = index % IMAGE_ASSETS.length;

  return {
    id: site.id,
    type: meta.siteType,
    name: `${meta.typeLabel} ${site.id}`,
    zone: `${meta.zoneLabel} ${site.id}`,
    price: meta.basePrice + priceDelta,
    carOption: meta.carOption,
    remain: Math.max(1, 6 - (index % 4)),
    squareImg: IMAGE_ASSETS[imageIndex],
    images: getImageCarousel(imageIndex),
    x: site.x,
    y: site.y,
    basePeople: site.basePeople ?? 4,
    maxPeople: site.maxPeople ?? 6,
  };
});
