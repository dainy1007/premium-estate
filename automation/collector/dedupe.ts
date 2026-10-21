import type { NormalizedListing } from "./types";

function normalizeText(value?: string) {
  return (value || "")
    .normalize("NFKC")
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[()\-_,.]/g, "");
}

export function buildSourceKey(listing: NormalizedListing) {
  return `${listing.source}:${listing.source_listing_id}`;
}

export function buildSimilarityFingerprint(listing: NormalizedListing) {
  const parts = [
    listing.address || listing.location,
    listing.property_type,
    listing.deal_type,
    listing.price_text,
    listing.deposit_text,
    listing.monthly_rent_text,
    listing.area_text,
  ].map(normalizeText);

  return parts.join("|");
}

export function isLikelyDuplicate(a: NormalizedListing, b: NormalizedListing) {
  if (buildSourceKey(a) === buildSourceKey(b)) return true;

  const aFingerprint = buildSimilarityFingerprint(a);
  const bFingerprint = buildSimilarityFingerprint(b);

  return Boolean(aFingerprint.replace(/\|/g, "")) && aFingerprint === bFingerprint;
}
