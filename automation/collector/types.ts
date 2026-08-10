export type ListingSource = "naver" | "realestatebank" | "hanbang";

export type ReviewStatus = "pending" | "approved" | "rejected";

export type NormalizedListing = {
  source: ListingSource;
  source_listing_id: string;
  source_url?: string;
  title: string;
  location?: string;
  address?: string;
  property_type?: string;
  deal_type?: string;
  price_text?: string;
  deposit_text?: string;
  monthly_rent_text?: string;
  area_text?: string;
  floor_text?: string;
  description?: string;
  image_urls: string[];
  collected_at: string;
  raw_payload?: unknown;
};

export type ReviewQueueItem = NormalizedListing & {
  fingerprint: string;
  review_status: ReviewStatus;
  duplicate_of?: string;
};

export interface ListingCollectorAdapter {
  readonly source: ListingSource;
  collect(): Promise<NormalizedListing[]>;
}
