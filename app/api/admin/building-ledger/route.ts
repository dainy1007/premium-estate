import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { buildDescriptionWithAdminMeta, parseAdminMeta } from "@/lib/property-admin-meta";

export const runtime = "nodejs";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const kakaoKey = process.env.KAKAO_REST_API_KEY;
const buildingKey = process.env.BUILDING_LEDGER_SERVICE_KEY;

type KakaoDoc = { address?: { b_code?: string; main_address_no?: string; sub_address_no?: string; mountain_yn?: string } };
type LedgerItem = Record<string, unknown>;
type LocationKey = { sigunguCd: string; bjdongCd: string; platGbCd: string; bun: string; ji: string };
type UnitArea = { ho: string; exclusive: number; supply: number };

const text = (v: unknown) => String(v ?? "").trim();
const round3 = (n: number) => Math.round(n * 1000) / 1000;
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const formatApprovalDate = (v: unknown) => {
  const raw = text(v).replace(/\D/g, "");
  return raw.length === 8 ? `${raw.slice(0, 4)}.${raw.slice(4, 6)}.${raw.slice(6, 8)}` : text(v);
};

const norm = (v: unknown) => {
  let s = text(v)
    .replace(/\s+/g, "")
    .replace(/(동|호)$/u, "")
    .replace(/[^0-9A-Za-z가-힣]/g, "")
    .toLowerCase();
  s = s.replace(/^제(?=\d)/u, "").replace(/^주(?=\d)/u, "");
  return /^\d+$/.test(s) ? String(Number(s)) : s;
};

const sameUnit = (a: unknown, b: string) => {
  const aa = norm(a), bb = norm(b);
  return Boolean(aa && bb && aa === bb);
};

const isWholeBuildingType = (type: string) => /상가주택|다가구|단독주택/u.test(type);
const isCollectiveType = (type: string) => !isWholeBuildingType(type) && /아파트|오피스텔|집합상가|상가|다세대|연립|빌라/u.test(type);
const isCommercialType = (type: string) => !isWholeBuildingType(type) && /상가|사무실/u.test(type);

class BuildingLedgerError extends Error {
  status: number;
  upstream: string;
  constructor(message: string, status = 422, upstream = "") {
    super(message);
    this.status = status;
    this.upstream = upstream;
  }
}

function normalizedServiceKey(value: string) {
  const raw = value.trim();
  if (!raw) return raw;
  try { return raw.includes("%") ? decodeURIComponent(raw) : raw; } catch { return raw; }
}

function parseUnitAddress(address: string) {
  const hoMatches = [...address.matchAll(/(?:^|[\s,\/·+&])([A-Za-z0-9가-힣-]+)\s*호(?=$|[\s,\/·+&])/gu)];
  const dongMatches = [...address.matchAll(/(?:^|[\s,])([A-Za-z0-9가-힣-]+)\s*동(?=$|[\s,])/gu)];
  const inferredHoMatch = hoMatches.length ? null : address.match(/(?:^|[\s,])([0-9]{2,5})\s*$/u);
  const explicitHos = hoMatches.map(m => m[1]?.trim()).filter(Boolean) as string[];
  const inferredHo = inferredHoMatch?.[1]?.trim() || "";
  const hos = [...new Set([...explicitHos, ...(inferredHo ? [inferredHo] : [])])];
  const dong = dongMatches.at(-1)?.[1]?.trim() || "";
  let baseAddress = address;
  for (const m of [...hoMatches, ...dongMatches]) if (m[0]) baseAddress = baseAddress.replace(m[0], " ");
  if (inferredHoMatch?.[0]) baseAddress = baseAddress.slice(0, baseAddress.length - inferredHoMatch[0].length).trim();
  baseAddress = baseAddress
    .replace(/(?:^|\s)\d+\s*층(?=$|\s)/gu, " ")
    .replace(/번지/gu, "")
    .replace(/[\/·+&]/g, " ")
    .replace(/\s*,\s*/g, " ")
    .replace(/\s+/g, " ")
    .trim() || address;
  return { baseAddress, dong, ho: hos.at(-1) || "", hos };
}

async function resolveAddress(address: string): Promise<LocationKey> {
  if (!kakaoKey) throw new BuildingLedgerError("KAKAO_REST_API_KEY_NOT_CONFIGURED", 503);
  const r = await fetch(`https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(address)}`, {
    headers: { Authorization: `KakaoAK ${kakaoKey}` }, cache: "no-store"
  });
  if (!r.ok) throw new BuildingLedgerError(`KAKAO_ADDRESS_${r.status}`, r.status);
  const data = await r.json() as { documents?: KakaoDoc[] };
  const addr = data.documents?.[0]?.address;
  if (!addr?.b_code) throw new BuildingLedgerError("ADDRESS_NOT_RESOLVED", 422);
  return {
    sigunguCd: addr.b_code.slice(0, 5),
    bjdongCd: addr.b_code.slice(5, 10),
    platGbCd: addr.mountain_yn === "Y" ? "1" : "0",
    bun: (addr.main_address_no || "0").padStart(4, "0"),
    ji: (addr.sub_address_no || "0").padStart(4, "0")
  };
}

async function fetchHub(endpointName: string, loc: LocationKey, pageNo = 1, numOfRows = 100) {
  if (!buildingKey) throw new BuildingLedgerError("BUILDING_LEDGER_SERVICE_KEY_NOT_CONFIGURED", 503);
  const qs = new URLSearchParams({
    serviceKey: normalizedServiceKey(buildingKey), ...loc,
    numOfRows: String(numOfRows), pageNo: String(pageNo), _type: "json"
  });
  const url = `https://apis.data.go.kr/1613000/BldRgstHubService/${endpointName}?${qs}`;
  let lastStatus = 0, lastRaw = "";
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const r = await fetch(url, { cache: "no-store" });
      const raw = await r.text();
      lastStatus = r.status; lastRaw = raw;
      if (r.ok) {
        let data: any;
        try { data = JSON.parse(raw); }
        catch {
          if (attempt < 3) { await sleep(350 * attempt); continue; }
          throw new BuildingLedgerError("BUILDING_LEDGER_INVALID_RESPONSE", 502);
        }
        const code = text(data?.response?.header?.resultCode);
        if (code && code !== "00") {
          const msg = text(data?.response?.header?.resultMsg);
          if ((code === "99" || /tempor|service|timeout|초과|일시/i.test(msg)) && attempt < 3) {
            await sleep(350 * attempt); continue;
          }
          throw new BuildingLedgerError(`BUILDING_LEDGER_API_${code}`, 422, msg);
        }
        const body = data?.response?.body;
        const items = body?.items?.item;
        const list: LedgerItem[] = Array.isArray(items) ? items : items ? [items] : [];
        return { list, totalCount: Number(body?.totalCount || list.length), pageNo: Number(body?.pageNo || pageNo), numOfRows: Number(body?.numOfRows || numOfRows) };
      }
      if ((r.status === 429 || r.status >= 500) && attempt < 3) { await sleep(400 * attempt); continue; }
      break;
    } catch (e) {
      if (e instanceof BuildingLedgerError) throw e;
      if (attempt < 3) { await sleep(400 * attempt); continue; }
      throw new BuildingLedgerError("BUILDING_LEDGER_NETWORK_ERROR", 503, e instanceof Error ? e.message : String(e));
    }
  }
  throw new BuildingLedgerError(`BUILDING_LEDGER_${lastStatus || 503}`, lastStatus || 503, lastRaw.slice(0, 180));
}

async function fetchAll(endpoint: string, loc: LocationKey) {
  const size = 100;
  const all: LedgerItem[] = [];
  let page = 1;
  let total = Infinity;
  while (page <= 100 && all.length < total) {
    const next = await fetchHub(endpoint, loc, page, size);
    if (page === 1) total = next.totalCount;
    all.push(...next.list);
    if (!next.list.length) break;
    if (all.length >= total) break;
    page += 1;
  }
  return all;
}

async function fetchLedger(address: string) {
  const unit = parseUnitAddress(address);
  const loc = await resolveAddress(unit.baseAddress);
  const { list } = await fetchHub("getBrTitleInfo", loc, 1, 100);
  if (!list.length) throw new BuildingLedgerError("BUILDING_LEDGER_NO_RESULT", 404);
  const dongMatch = unit.dong ? list.find(v => sameUnit(v.dongNm, unit.dong) || sameUnit(v.bldNm, unit.dong) || text(v.bldNm).includes(`${unit.dong}동`) || text(v.bldNm).includes(`제${unit.dong}동`)) : undefined;
  const item = dongMatch || list.find(v => text(v.mainAtchGbCdNm).includes("주건축물")) || list[0];
  const parkingTotal = Number(item.indrMechUtcnt || 0) + Number(item.oudrMechUtcnt || 0) + Number(item.indrAutoUtcnt || 0) + Number(item.oudrAutoUtcnt || 0);
  const registryKind = [item.regstrKindCdNm, item.regstrGbCdNm, item.regstrKindNm, item.regstrGbNm].map(text).filter(Boolean).join(" ");
  const buildingLabel = [text(item.bldNm), text(item.dongNm), text(item.mainAtchGbCdNm)].filter(Boolean).join(" ");
  const generalBuilding = /일반/u.test(registryKind) || Boolean(unit.dong && dongMatch && /주건축물/u.test(buildingLabel) && !/집합/u.test(registryKind));
  return {
    loc, unit, generalBuilding, registryKind,
    buildingName: text(item.bldNm), buildingUse: text(item.mainPurpsCdNm), mainPurpose: text(item.mainPurpsCdNm),
    structure: text(item.strctCdNm), approvalDate: formatApprovalDate(item.useAprDay), totalFloor: text(item.grndFlrCnt),
    undergroundFloor: text(item.ugrndFlrCnt), landArea: text(item.platArea), floorArea: text(item.archArea), totalArea: text(item.totArea),
    coverageRatio: text(item.bcRat), floorAreaRatio: text(item.vlRat), parkingCount: text(item.totPkngCnt) || String(parkingTotal || ""),
    elevatorCount: text(item.rideUseElvtCnt), householdCount: text(item.hhldCnt), unitCount: text(item.hoCnt) || text(item.fmlyCnt),
    roadAddress: text(item.newPlatPlc), jibunAddress: text(item.platPlc)
  };
}

function rowHoValues(v: LedgerItem) {
  const preferred = [v.hoNm, v.hoNo, v.unitNm, v.unitNo].map(text).filter(Boolean);
  if (preferred.length) return preferred;
  return Object.entries(v)
    .filter(([k, value]) => /(^|_)(ho|unit).*(nm|no)?$/i.test(k) && text(value))
    .map(([, value]) => text(value));
}

function rowMatchesHo(v: LedgerItem, ho: string) {
  return rowHoValues(v).some(value => sameUnit(value, ho));
}

function rowsByUnit(list: LedgerItem[], dong: string, ho: string) {
  const byHo = list.filter(v => rowMatchesHo(v, ho));
  if (!byHo.length) return [];
  if (!dong) return byHo;
  const exact = byHo.filter(v => sameUnit(v.dongNm, dong) || sameUnit(v.bldNm, dong) || text(v.bldNm).includes(`${dong}동`) || text(v.dongNm).includes(`${dong}동`) || text(v.bldNm).includes(`제${dong}동`));
  if (exact.length) return exact;
  const identities = [...new Set(byHo.map(v => text(v.mgmBldrgstPk) || text(v.mgmUpperBldrgstPk) || `${norm(v.dongNm)}|${norm(v.bldNm)}`).filter(Boolean))];
  return identities.length === 1 ? byHo : [];
}

function sumArea(rows: LedgerItem[]) { return rows.reduce((sum, v) => sum + (Number(v.area) || 0), 0); }
function uniquePositive(rows: LedgerItem[]) { return rows.map(v => Number(v.area) || 0).filter(v => v > 0 && v < 1000); }

async function fetchUnitAreas(loc: LocationKey, dong: string, hos: string[]): Promise<UnitArea[]> {
  if (!hos.length) throw new BuildingLedgerError("UNIT_HO_REQUIRED", 422, "호수를 입력해야 합니다.");
  const [expos, areas] = await Promise.all([
    fetchAll("getBrExposInfo", loc),
    fetchAll("getBrExposPubuseAreaInfo", loc)
  ]);
  const result: UnitArea[] = [];

  for (const ho of hos) {
    let unitRows = rowsByUnit(expos, dong, ho);
    if (!unitRows.length) unitRows = rowsByUnit(areas, dong, ho);

    if (!unitRows.length) {
      const candidates = [...new Set([...expos, ...areas]
        .filter(v => rowHoValues(v).some(value => norm(value).includes(norm(ho)) || norm(ho).includes(norm(value))))
        .map(v => `${text(v.dongNm) || text(v.bldNm)} ${rowHoValues(v)[0] || ""}`.trim())
        .filter(Boolean))].slice(0, 12);
      throw new BuildingLedgerError("UNIT_NOT_FOUND", 404, candidates.length ? `${ho}호 후보: ${candidates.join(", ")}` : `${dong ? `${dong}동 ` : ""}${ho}호 전유부 없음`);
    }

    const pks = [...new Set(unitRows.flatMap(v => [text(v.mgmBldrgstPk), text(v.mgmUpperBldrgstPk)]).filter(Boolean))];
    let matched = pks.length ? areas.filter(v => pks.includes(text(v.mgmBldrgstPk)) || pks.includes(text(v.mgmUpperBldrgstPk))) : [];
    if (!matched.length) matched = rowsByUnit(areas, dong, ho);
    if (!matched.length) {
      const floorHints = [...new Set(unitRows.map(v => text(v.flrNo)).filter(Boolean))];
      matched = areas.filter(v => rowMatchesHo(v, ho) && (floorHints.length === 0 || floorHints.includes(text(v.flrNo))));
    }

    const exclusiveRows = matched.filter(v => text(v.exposPubuseGbCdNm).includes("전유") || text(v.exposPubuseGbCd) === "1");
    const publicRows = matched.filter(v => text(v.exposPubuseGbCdNm).includes("공용") || text(v.exposPubuseGbCd) === "2");
    let exclusive = sumArea(exclusiveRows);
    if (!exclusive) {
      const direct = uniquePositive(unitRows);
      exclusive = direct.length ? Math.min(...direct) : 0;
    }
    if (!exclusive) {
      const directMatched = uniquePositive(matched);
      exclusive = directMatched.length ? Math.min(...directMatched) : 0;
    }
    if (!exclusive || exclusive >= 1000) throw new BuildingLedgerError("EXCLUSIVE_AREA_NOT_FOUND", 404, `${dong ? `${dong}동 ` : ""}${ho}호 전용면적 없음`);
    const common = sumArea(publicRows);
    result.push({ ho, exclusive: round3(exclusive), supply: round3(exclusive + common) });
  }
  return result;
}

const REPAIR: Record<number, { contract: string; exclusive: string }> = {
  64: { contract: "83.27", exclusive: "59.87" },
  65: { contract: "82.66", exclusive: "59.95" }
};

export async function POST(req: NextRequest) {
  if (!supabaseUrl || !serviceRoleKey) return NextResponse.json({ ok: false, error: "SERVER_CONFIG" }, { status: 503 });
  const body = await req.json().catch(() => ({}));
  const propertyId = Number(body.property_id), address = text(body.address);
  if (!Number.isInteger(propertyId) || propertyId <= 0 || !address) return NextResponse.json({ ok: false, error: "INVALID_INPUT" }, { status: 400 });

  try {
    const db = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: p, error: findError } = await db.from("properties").select("id,type,description,area,contract_area,exclusive_area,floor").eq("id", propertyId).single();
    if (findError || !p) return NextResponse.json({ ok: false, error: "PROPERTY_NOT_FOUND" }, { status: 404 });

    const ledger = await fetchLedger(address);
    const collective = isCollectiveType(text(p.type)), commercial = isCommercialType(text(p.type));
    const wholeBuildingCommercial = commercial && ledger.generalBuilding;
    let unitAreas: UnitArea[] = [], unitWarning = "", unitErrorCode = "", unitNote = "";
    if (collective && !wholeBuildingCommercial) {
      try {
        unitAreas = await fetchUnitAreas(ledger.loc, ledger.unit.dong, ledger.unit.hos.length ? ledger.unit.hos : (ledger.unit.ho ? [ledger.unit.ho] : []));
      } catch (e) {
        unitErrorCode = e instanceof BuildingLedgerError ? e.message : "";
        unitWarning = e instanceof BuildingLedgerError ? (e.upstream || e.message) : (e instanceof Error ? e.message : String(e));
      }
    }

    if (unitWarning && ledger.generalBuilding && ledger.unit.dong && unitErrorCode === "UNIT_NOT_FOUND") {
      const hoText = ledger.unit.hos.length ? ` · ${ledger.unit.hos.join(", ")}호 전유부 없음` : "";
      unitNote = `${ledger.unit.dong}동 일반건축물 조회 완료${hoText}`;
      unitWarning = "";
    }

    const exclusiveTotal = round3(unitAreas.reduce((s, v) => s + v.exclusive, 0));
    const supplyTotal = round3(unitAreas.reduce((s, v) => s + v.supply, 0));
    const areaLabel = unitAreas.length > 1 ? `${unitAreas.length}개 호실 합산 · 전용 ${exclusiveTotal}㎡${supplyTotal ? ` · 공급 ${supplyTotal}㎡` : ""}` : exclusiveTotal ? `전용 ${exclusiveTotal}㎡` : "";

    const meta = parseAdminMeta(p.description || "");
    const summary = [ledger.buildingUse, ledger.approvalDate, ledger.totalFloor ? `지상 ${ledger.totalFloor}층` : "", areaLabel, unitNote, unitWarning ? `전유부 재확인 필요 (${unitWarning})` : ""].filter(Boolean).join(" · ");
    const next = {
      ...meta,
      ledgerLookupAddress: address,
      ledgerStatus: (unitWarning ? "failed" : "completed") as typeof meta.ledgerStatus,
      ledgerSummary: summary || "보완 완료",
      ledgerUpdatedAt: new Date().toISOString(),
      infoOverrides: { ...meta.infoOverrides }
    };
    if (ledger.buildingUse) next.infoOverrides.buildingUse = ledger.buildingUse;
    if (ledger.approvalDate) next.infoOverrides.approvalDate = ledger.approvalDate;
    if (ledger.parkingCount) next.infoOverrides.parking = `총 ${ledger.parkingCount}대`;
    if (ledger.elevatorCount) next.infoOverrides.elevator = `${ledger.elevatorCount}대`;

    const description = buildDescriptionWithAdminMeta(p.description || "", next);
    const update: Record<string, unknown> = { description };
    if (collective && exclusiveTotal) update.exclusive_area = String(exclusiveTotal);
    if (commercial && unitAreas.length && supplyTotal) {
      update.area = String(supplyTotal);
      update.contract_area = String(supplyTotal);
    }
    if (!collective && !text(p.area) && ledger.totalArea) update.area = ledger.totalArea;
    if (!text(p.floor) && ledger.totalFloor) update.floor = `-/${ledger.totalFloor}층`;
    const repair = REPAIR[propertyId];
    if (repair) {
      update.area = repair.contract;
      update.contract_area = repair.contract;
      if (!exclusiveTotal) update.exclusive_area = repair.exclusive;
    }

    const { error: updateError } = await db.from("properties").update(update).eq("id", propertyId);
    if (updateError) throw new Error(updateError.message);

    return NextResponse.json({
      ok: true, partial: Boolean(unitWarning), warning: unitWarning || undefined, summary, description,
      ledger: {
        buildingName: ledger.buildingName, buildingUse: ledger.buildingUse, mainPurpose: ledger.mainPurpose,
        structure: ledger.structure, approvalDate: ledger.approvalDate, totalFloor: ledger.totalFloor,
        undergroundFloor: ledger.undergroundFloor, landArea: ledger.landArea, floorArea: ledger.floorArea,
        totalArea: ledger.totalArea, coverageRatio: ledger.coverageRatio, floorAreaRatio: ledger.floorAreaRatio,
        parkingCount: ledger.parkingCount, householdCount: ledger.householdCount, unitCount: ledger.unitCount,
        roadAddress: ledger.roadAddress, jibunAddress: ledger.jibunAddress,
        exclusiveArea: exclusiveTotal ? String(exclusiveTotal) : "", supplyArea: supplyTotal ? String(supplyTotal) : "",
        unitAreas, dong: ledger.unit.dong, hos: ledger.unit.hos, registryKind: ledger.registryKind, generalBuilding: ledger.generalBuilding
      }
    });
  } catch (e) {
    if (e instanceof BuildingLedgerError) return NextResponse.json({ ok: false, error: e.message, detail: e.upstream || undefined }, { status: e.status });
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : String(e) }, { status: 422 });
  }
}
