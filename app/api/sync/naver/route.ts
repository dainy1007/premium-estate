import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { buildSeoTitle } from "@/lib/property-seo";
import { detectPropertyDisplayType, sanitizePropertyArea } from "@/lib/property-normalize";

export const runtime = "nodejs";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const syncSecret = process.env.NAVER_SYNC_SECRET;
const allowedRealtors = (process.env.NAVER_SYNC_ALLOWED_REALTORS ?? "")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);

type NaverListing = {
  article_no: string;
  region?: string;
  address?: string;
  road_address?: string;
  property_type?: string;
  trade_type?: string;
  price?: string;
  area?: string;
  floor?: string;
  realtor?: string;
  move_in?: string;
  description?: string;
};

function unauthorized(message = "Unauthorized") {
  return NextResponse.json({ ok: false, error: message }, { status: 401 });
}

function normalized(value: unknown) {
  return String(value ?? "").trim();
}

function getListingType(listing: NaverListing) {
  const address = normalized(listing.road_address) || normalized(listing.address);
  return detectPropertyDisplayType({
    type: normalized(listing.property_type),
    address,
    location: normalized(listing.region),
    description: normalized(listing.description),
  });
}

function sanitizeDescription(listing: NaverListing) {
  let description = normalized(listing.description);
  if (!description) return "";

  const region = normalized(listing.region);
  const propertyType = getListingType(listing);
  const tradeType = normalized(listing.trade_type);

  if (region && propertyType && propertyType !== "매물" && tradeType) {
    const wrongOpening = `${region}에 위치한 매물 ${tradeType} 매물입니다.`;
    const wrongTypeOpening = `${region}에 위치한 ${normalized(listing.property_type)} ${tradeType} 매물입니다.`;
    const correctOpening = `${region}에 위치한 ${propertyType} ${tradeType} 매물입니다.`;
    description = description.replace(wrongOpening, correctOpening);
    if (normalized(listing.property_type) && normalized(listing.property_type) !== propertyType) {
      description = description.replace(wrongTypeOpening, correctOpening);
    }
  }

  description = description
    .replace(/(\d+(?:\.\d+)?)F㎡/g, "$1㎡")
    .replace(/전용\s*(\d+(?:\.\d+)?)F\b/g, "전용 $1㎡")
    .replace(/전용(\d+(?:\.\d+)?)㎡/g, "전용 $1㎡");

  return description;
}

function makeTitle(listing: NaverListing) {
  const address = normalized(listing.road_address) || normalized(listing.address);
  return buildSeoTitle({
    location: normalized(listing.region),
    address,
    type: getListingType(listing),
    deal_type: normalized(listing.trade_type),
    description: normalized(listing.description),
  }) || `네이버 매물 ${listing.article_no}`;
}

export async function POST(request: NextRequest) {
  const missingSupabaseConfig = [
    !supabaseUrl ? "NEXT_PUBLIC_SUPABASE_URL" : "",
    !serviceRoleKey ? "SUPABASE_SERVICE_ROLE_KEY" : "",
  ].filter(Boolean);

  if (missingSupabaseConfig.length > 0) {
    return NextResponse.json(
      {
        ok: false,
        error: "Supabase server configuration is missing.",
        missing: missingSupabaseConfig,
        diagnostics: {
          hasSupabaseUrl: Boolean(supabaseUrl),
          hasServiceRoleKey: Boolean(serviceRoleKey),
          vercelEnv: process.env.VERCEL_ENV ?? "unknown",
        },
      },
      { status: 500 }
    );
  }

  if (!syncSecret) {
    return NextResponse.json(
      { ok: false, error: "NAVER_SYNC_SECRET is not configured." },
      { status: 503 }
    );
  }

  const authorization = request.headers.get("authorization") ?? "";
  if (authorization !== `Bearer ${syncSecret}`) {
    return unauthorized();
  }

  let body: { listings?: NaverListing[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON." }, { status: 400 });
  }

  const listings = Array.isArray(body.listings) ? body.listings : [];
  if (listings.length === 0) {
    return NextResponse.json({ ok: true, inserted: 0, updated: 0, skipped: 0 });
  }

  const supabase = createClient(supabaseUrl!, serviceRoleKey!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  let inserted = 0;
  let updated = 0;
  let skipped = 0;
  const results: Array<Record<string, unknown>> = [];

  for (const raw of listings) {
    const articleNo = normalized(raw.article_no);
    const realtor = normalized(raw.realtor);

    if (!/^\d{9,12}$/.test(articleNo)) {
      skipped += 1;
      results.push({ article_no: articleNo, status: "skipped", reason: "invalid_article_no" });
      continue;
    }

    if (allowedRealtors.length === 0) {
      skipped += 1;
      results.push({ article_no: articleNo, status: "skipped", reason: "allowed_realtors_not_configured" });
      continue;
    }

    if (!allowedRealtors.includes(realtor)) {
      skipped += 1;
      results.push({ article_no: articleNo, status: "skipped", reason: "not_our_listing", realtor });
      continue;
    }

    const marker = `naver:${articleNo}`;
    const address = normalized(raw.road_address) || normalized(raw.address);
    const propertyType = getListingType(raw);
    const descriptionParts = [sanitizeDescription(raw)].filter(Boolean);

    const payload = {
      title: makeTitle(raw),
      type: propertyType || normalized(raw.trade_type) || null,
      deal_type: normalized(raw.trade_type) || null,
      location: normalized(raw.region),
      address,
      price: normalized(raw.price),
      area: sanitizePropertyArea(raw.area),
      floor: normalized(raw.floor),
      description: descriptionParts.join("\n"),
      admin_memo: marker,
      listing_status: "active",
      is_hidden: false,
    };

    const { data: existing, error: findError } = await supabase
      .from("properties")
      .select("id")
      .eq("admin_memo", marker)
      .maybeSingle();

    if (findError) {
      results.push({ article_no: articleNo, status: "error", error: findError.message });
      continue;
    }

    if (existing?.id) {
      const { error } = await supabase.from("properties").update(payload).eq("id", existing.id);
      if (error) {
        results.push({ article_no: articleNo, status: "error", error: error.message });
      } else {
        updated += 1;
        results.push({ article_no: articleNo, status: "updated", property_id: existing.id });
      }
    } else {
      const { data, error } = await supabase
        .from("properties")
        .insert({ ...payload, image_url: "" })
        .select("id")
        .single();

      if (error || !data) {
        results.push({ article_no: articleNo, status: "error", error: error?.message ?? "insert_failed" });
      } else {
        inserted += 1;
        results.push({ article_no: articleNo, status: "inserted", property_id: data.id });
      }
    }
  }

  return NextResponse.json({ ok: true, inserted, updated, skipped, results });
}
