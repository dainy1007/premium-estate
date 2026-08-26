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

function deriveGeography(listing: NaverListing) {
  const address = normalized(listing.road_address) || normalized(listing.address);
  const region = normalized(listing.region);
  const parts = address.split(/\s+/).filter(Boolean);

  const province = parts.find((part) => /(?:도|특별시|광역시|특별자치시|특별자치도)$/.test(part)) || "";
  const cityCounty = parts.find((part, index) => index > 0 && /(?:시|군|구)$/.test(part)) || "";
  const town = parts.find((part) => /(?:읍|면|동)$/.test(part)) || region;

  const shortRegion = town || cityCounty || region;
  const descriptionRegion = [province, cityCounty, town].filter(Boolean).join(" ") || address || region;

  return { address, shortRegion, descriptionRegion };
}

function getListingType(listing: NaverListing) {
  const { address, shortRegion } = deriveGeography(listing);
  return detectPropertyDisplayType({
    type: normalized(listing.property_type),
    address,
    location: shortRegion,
    description: normalized(listing.description),
  });
}

function polishFeatureSentence(value: string) {
  const text = value.trim().replace(/^[•·\-]\s*/, "").replace(/\s+/g, " ").trim();
  if (!text) return "";

  if (/^(?:디지스트|DGIST)\s*학생(?:입니다)?\.?$/i.test(text)) return "";
  if (/^직원(?:과|및)\s*인근\s*직장인이\s*생활하기\s*편리한\s*위치입니다\.?$/.test(text)) {
    return "디지스트 학생 및 직원, 인근 직장인이 생활하기 편리한 위치입니다.";
  }
  if (/(?:디지스트|DGIST).*후문\s*방향/i.test(text)) {
    return "디지스트 후문 방향으로 통학과 출퇴근이 편리한 위치입니다.";
  }
  if (/^편의점입니다\.?$/.test(text) || /^마트입니다\.?$/.test(text)) return "";
  if (/음식점.*주변\s*생활편의시설.*상권.*이용하기\s*좋습니다\.?/.test(text)) {
    return "편의점, 마트, 음식점 등 주변 생활편의시설과 상권을 이용하기 좋습니다.";
  }
  if (/화이트\s*톤.*깔끔한\s*원룸/.test(text)) {
    return "화이트 톤으로 깔끔하게 관리된 원룸입니다.";
  }
  if (/주차.*(?:넓|여유|편리)/.test(text)) {
    return "주차 공간이 넉넉해 차량 이용이 편리합니다.";
  }
  if (/조용한\s*원룸/.test(text)) {
    return "조용하게 거주하기 좋은 원룸입니다.";
  }

  return text;
}

function normalizeFeatureBullets(description: string) {
  const lines = description.split(/\r?\n/);
  const result: string[] = [];
  let inFeatures = false;

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i].trimEnd();
    const trimmed = line.trim();

    if (/^매물\s*특징\s*$/.test(trimmed)) {
      inFeatures = true;
      result.push(line);
      continue;
    }

    if (inFeatures && trimmed && !/^[•·\-]/.test(trimmed) && /^(?:매물\s*정보|옵션|상세\s*정보|교통|입지|추천)/.test(trimmed)) {
      inFeatures = false;
    }

    if (!inFeatures || !/^[•·\-]/.test(trimmed)) {
      result.push(line);
      continue;
    }

    const bullet = trimmed.replace(/^[•·\-]\s*/, "").trim();
    const next = (lines[i + 1] ?? "").trim();
    const nextBullet = next.replace(/^[•·\-]\s*/, "").trim();

    if (/^(?:디지스트|DGIST)\s*학생입니다\.?$/i.test(bullet) && /^[•·\-]\s*직원(?:과|및)\b/.test(next)) {
      result.push("• 디지스트 학생 및 직원, 인근 직장인이 생활하기 편리한 위치입니다.");
      i += 1;
      continue;
    }

    const convenienceWords: string[] = [];
    let cursor = i;
    while (cursor < lines.length) {
      const candidate = lines[cursor].trim().replace(/^[•·\-]\s*/, "").trim();
      const match = candidate.match(/^(편의점|마트|음식점|카페|병원|약국|은행|세탁소)입니다\.?$/);
      if (!match) break;
      convenienceWords.push(match[1]);
      cursor += 1;
    }

    if (convenienceWords.length > 0) {
      const following = (lines[cursor] ?? "").trim();
      const followingBullet = following.replace(/^[•·\-]\s*/, "").trim();

      if (/^[•·\-]/.test(following) && /(생활편의|상권|이용|주변)/.test(followingBullet)) {
        result.push("• 편의점, 마트, 음식점 등 주변 생활편의시설과 상권을 이용하기 좋습니다.");
        i = cursor;
      } else {
        result.push("• 편의점과 마트 등 생활편의시설을 이용하기 좋습니다.");
        i = cursor - 1;
      }
      continue;
    }

    const polished = polishFeatureSentence(bullet);
    if (!polished) continue;

    if (/^[가-힣A-Za-z0-9\s]{1,12}입니다\.?$/.test(polished)) {
      continue;
    }

    result.push(`• ${polished}`);
  }

  return result.join("\n");
}

function sanitizeDescription(listing: NaverListing) {
  let description = normalized(listing.description);
  if (!description) return "";

  const { descriptionRegion } = deriveGeography(listing);
  const propertyType = getListingType(listing);
  const tradeType = normalized(listing.trade_type);

  if (descriptionRegion && propertyType && propertyType !== "매물" && tradeType) {
    const correctOpening = `${descriptionRegion}에 위치한 ${propertyType} ${tradeType} 매물입니다.`;

    description = description.replace(
      /^[^\n.]*에 위치한\s+(?:매물\s+)?[^\n.]*매물입니다\.?/,
      correctOpening,
    );

    if (!description.startsWith(correctOpening)) {
      description = `${correctOpening}\n${description}`;
    }
  }

  description = description
    .replace(/(\d+(?:\.\d+)?)F㎡/g, "$1㎡")
    .replace(/전용\s*(\d+(?:\.\d+)?)F\b/g, "전용 $1㎡")
    .replace(/전용(\d+(?:\.\d+)?)㎡/g, "전용 $1㎡");

  return normalizeFeatureBullets(description);
}

function makeTitle(listing: NaverListing) {
  const { address, shortRegion } = deriveGeography(listing);
  return buildSeoTitle({
    location: shortRegion,
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
    const { address, shortRegion, descriptionRegion } = deriveGeography(raw);
    const propertyType = getListingType(raw);
    const descriptionParts = [sanitizeDescription(raw)].filter(Boolean);

    const payload = {
      title: makeTitle(raw),
      type: propertyType !== "매물" ? propertyType : (normalized(raw.property_type) || null),
      deal_type: normalized(raw.trade_type) || null,
      location: descriptionRegion || shortRegion || address,
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
