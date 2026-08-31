import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { ADMIN_COOKIE_NAME, isValidAdminSession } from "@/lib/admin-session";

export const runtime = "nodejs";

const BUCKET = "property-images";
const STORAGE_PATH = "admin-data/building-directory.json";
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

type BuildingRow = {
  buildingName: string;
  town: string;
  village: string;
  lot: string;
  address: string;
  approvalDate: string;
  zone: string;
};

async function requireAdmin(request: NextRequest) {
  const cookieValue = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
  return isValidAdminSession(cookieValue);
}

function getAdminClient() {
  if (!supabaseUrl || !serviceRoleKey) return null;
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function text(value: unknown) {
  return String(value ?? "").trim();
}

function sanitizeRows(value: unknown): BuildingRow[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  const rows: BuildingRow[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const source = item as Record<string, unknown>;
    const row: BuildingRow = {
      buildingName: text(source.buildingName),
      town: text(source.town),
      village: text(source.village),
      lot: text(source.lot),
      address: text(source.address),
      approvalDate: text(source.approvalDate),
      zone: text(source.zone),
    };
    if (!row.buildingName && !row.address) continue;
    const key = `${row.buildingName}|${row.address}`;
    if (seen.has(key)) continue;
    seen.add(key);
    rows.push(row);
  }
  return rows;
}

export async function GET(request: NextRequest) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  const supabase = getAdminClient();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: "Supabase server configuration is missing." }, { status: 500 });
  }

  const { data, error } = await supabase.storage.from(BUCKET).download(STORAGE_PATH);
  if (error) {
    if (/not found|object not found/i.test(error.message)) return NextResponse.json({ ok: true, rows: [] });
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  try {
    const rows = sanitizeRows(JSON.parse(await data.text()));
    return NextResponse.json({ ok: true, rows });
  } catch {
    return NextResponse.json({ ok: false, error: "Saved building directory is invalid." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  const supabase = getAdminClient();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: "Supabase server configuration is missing." }, { status: 500 });
  }

  let body: { rows?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON." }, { status: 400 });
  }

  const rows = sanitizeRows(body.rows);
  if (!rows.length) {
    return NextResponse.json({ ok: false, error: "저장할 건물 정보가 없습니다." }, { status: 400 });
  }

  const payload = Buffer.from(JSON.stringify(rows), "utf-8");
  const { error } = await supabase.storage.from(BUCKET).upload(STORAGE_PATH, payload, {
    upsert: true,
    contentType: "application/json;charset=utf-8",
  });
  if (error) {
    console.error("BUILDING_DIRECTORY_SAVE_ERROR", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, count: rows.length });
}
