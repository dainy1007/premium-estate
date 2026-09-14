import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { buildDescriptionWithAdminMeta, parseAdminMeta } from "@/lib/property-admin-meta";

export const runtime = "nodejs";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const kakaoKey = process.env.KAKAO_REST_API_KEY;
const vworldKey = process.env.VWORLD_API_KEY || process.env.BUILDING_LEDGER_SERVICE_KEY;
const vworldDomain = process.env.VWORLD_DOMAIN || process.env.NEXT_PUBLIC_SITE_URL || "";

type KakaoDoc = {
  address?: {
    address_name?: string;
    b_code?: string;
    main_address_no?: string;
    sub_address_no?: string;
    mountain_yn?: string;
  };
};

type ParcelInfo = {
  pnu: string;
  address: string;
  landCategory: string;
  area: string;
  registerType: string;
  ownershipType: string;
  coOwnerCount: string;
  scaleName: string;
  lastUpdated: string;
};

class LandLedgerError extends Error {
  status: number;
  detail: string;
  constructor(message: string, status = 422, detail = "") {
    super(message);
    this.status = status;
    this.detail = detail;
  }
}

function text(v: unknown) {
  return String(v ?? "").trim();
}

function decodeXml(value: string) {
  return value
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&");
}

function tag(xml: string, name: string) {
  const match = xml.match(new RegExp(`<${name}>([\\s\\S]*?)<\\/${name}>`, "i"));
  return match ? decodeXml(match[1].trim()) : "";
}

async function resolveParcel(address: string) {
  if (!kakaoKey) throw new LandLedgerError("KAKAO_REST_API_KEY_NOT_CONFIGURED", 503);
  const response = await fetch(`https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(address)}`, {
    headers: { Authorization: `KakaoAK ${kakaoKey}` },
    cache: "no-store",
  });
  if (!response.ok) throw new LandLedgerError(`KAKAO_ADDRESS_${response.status}`, response.status);
  const data = await response.json() as { documents?: KakaoDoc[] };
  const doc = data.documents?.[0]?.address;
  if (!doc?.b_code || !doc.main_address_no) throw new LandLedgerError("LAND_ADDRESS_NOT_RESOLVED", 422);

  const main = doc.main_address_no.padStart(4, "0");
  const sub = (doc.sub_address_no || "0").padStart(4, "0");
  const mountain = doc.mountain_yn === "Y" ? "2" : "1";
  const pnu = `${doc.b_code}${mountain}${main}${sub}`;
  return { pnu, address: doc.address_name || address };
}

async function fetchParcelInfo(address: string): Promise<ParcelInfo> {
  const resolved = await resolveParcel(address);
  if (!vworldKey) throw new LandLedgerError("VWORLD_API_KEY_NOT_CONFIGURED", 503, "토지대장 조회용 VWorld OpenAPI 인증키가 필요합니다.");

  const params = new URLSearchParams({
    format: "xml",
    key: vworldKey,
    pnu: resolved.pnu,
  });
  if (vworldDomain) params.set("domain", vworldDomain);

  const response = await fetch(`https://api.vworld.kr/ned/data/ladfrlList?${params.toString()}`, {
    headers: { Accept: "application/xml,text/xml,*/*" },
    cache: "no-store",
  });
  const raw = await response.text();
  if (!response.ok) throw new LandLedgerError(`VWORLD_LAND_${response.status}`, response.status, raw.slice(0, 200));

  if (/INVALID_KEY|INVALID DOMAIN|SERVICE_KEY_IS_NOT_REGISTERED_ERROR/i.test(raw)) {
    throw new LandLedgerError("VWORLD_API_KEY_INVALID", 503, "VWorld 인증키 또는 등록 도메인을 확인해주세요.");
  }
  const error = tag(raw, "error") || tag(raw, "resultMsg");
  const blockMatch = raw.match(/<ladfrlVOList>([\s\S]*?)<\/ladfrlVOList>/i);
  if (!blockMatch) {
    throw new LandLedgerError("LAND_LEDGER_NO_RESULT", 404, error || "해당 지번의 토지임야정보를 찾지 못했습니다.");
  }
  const block = blockMatch[1];

  return {
    pnu: resolved.pnu,
    address: tag(block, "ldCodeNm") || resolved.address,
    landCategory: tag(block, "lndcgrCodeNm") || tag(block, "lndcgrCode"),
    area: tag(block, "lndpclAr"),
    registerType: tag(block, "regstrSeCodeNm") || tag(block, "regstrSeCode"),
    ownershipType: tag(block, "posesnSeCodeNm") || tag(block, "posesnSeCode"),
    coOwnerCount: tag(block, "cnrsPsnCo"),
    scaleName: tag(block, "ladFrtlScNm") || tag(block, "ladFrtlSc"),
    lastUpdated: tag(block, "lastUpdtDt"),
  };
}

export async function POST(request: NextRequest) {
  try {
    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ ok: false, error: "SUPABASE_SERVER_NOT_CONFIGURED" }, { status: 503 });
    }

    const body = await request.json().catch(() => ({}));
    const propertyId = Number(body?.property_id);
    const address = text(body?.address);
    if (!propertyId || !address) {
      return NextResponse.json({ ok: false, error: "PROPERTY_ID_AND_ADDRESS_REQUIRED" }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
    const { data: property, error: propertyError } = await supabase
      .from("properties")
      .select("id,type,address,location,area,description")
      .eq("id", propertyId)
      .single();

    if (propertyError || !property) {
      return NextResponse.json({ ok: false, error: "PROPERTY_NOT_FOUND" }, { status: 404 });
    }
    if (!/토지/u.test(text(property.type))) {
      return NextResponse.json({ ok: false, error: "NOT_LAND_PROPERTY" }, { status: 422 });
    }

    const parcel = await fetchParcelInfo(address);
    const areaText = parcel.area ? `${parcel.area}㎡` : "";
    const summary = [
      parcel.landCategory ? `지목 ${parcel.landCategory}` : "",
      areaText ? `공부면적 ${areaText}` : "",
      parcel.ownershipType ? `소유구분 ${parcel.ownershipType}` : "",
      `PNU ${parcel.pnu}`,
    ].filter(Boolean).join(" · ");

    const meta = parseAdminMeta(property.description || "");
    const nextMeta = {
      ...meta,
      ledgerStatus: "completed" as const,
      ledgerSummary: `토지대장 · ${summary}`,
      ledgerUpdatedAt: new Date().toISOString(),
      ledgerLookupAddress: address,
    };
    const description = buildDescriptionWithAdminMeta(property.description || "", nextMeta);

    const updates: Record<string, unknown> = { description };
    if (!text(property.area) && areaText) updates.area = areaText;

    const { error: updateError } = await supabase.from("properties").update(updates).eq("id", propertyId);
    if (updateError) throw new LandLedgerError("LAND_LEDGER_APPLY_FAILED", 500, updateError.message);

    return NextResponse.json({
      ok: true,
      summary: `토지대장 확인 완료 · ${summary}`,
      description,
      land: parcel,
      areaApplied: !text(property.area) && Boolean(areaText),
    });
  } catch (error) {
    const known = error instanceof LandLedgerError ? error : new LandLedgerError(error instanceof Error ? error.message : String(error), 500);
    return NextResponse.json({ ok: false, error: known.message, detail: known.detail }, { status: known.status });
  }
}
