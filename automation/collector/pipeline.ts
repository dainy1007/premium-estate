import { buildSimilarityFingerprint, isLikelyDuplicate } from "./dedupe";
import type { ListingCollectorAdapter, NormalizedListing, ReviewQueueItem } from "./types";

export async function runCollectorPipeline(adapters: ListingCollectorAdapter[]) {
  const collectedBatches = await Promise.all(adapters.map((adapter) => adapter.collect()));
  const listings = collectedBatches.flat();
  const queue: ReviewQueueItem[] = [];

  for (const listing of listings) {
    const duplicate = queue.find((item) => isLikelyDuplicate(item, listing));

    queue.push({
      ...listing,
      fingerprint: buildSimilarityFingerprint(listing),
      review_status: "pending",
      duplicate_of: duplicate ? `${duplicate.source}:${duplicate.source_listing_id}` : undefined,
    });
  }

  return queue;
}

export function toPropertyInsert(listing: ReviewQueueItem) {
  if (listing.review_status !== "approved") {
    throw new Error("승인된 매물만 홈페이지 properties 테이블로 변환할 수 있습니다.");
  }

  return {
    title: listing.title,
    location: listing.location || listing.address || "",
    address: listing.address || null,
    type: listing.property_type || null,
    deal_type: listing.deal_type || null,
    price: listing.price_text || null,
    area: listing.area_text || null,
    description: listing.description || null,
    image_url: listing.image_urls[0] || null,
    is_hidden: true,
    listing_status: "active" as const,
    admin_memo: `자동수집 ${listing.source}:${listing.source_listing_id}`,
  };
}
