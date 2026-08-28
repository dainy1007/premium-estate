import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { buildDescriptionWithAdminMeta, parseAdminMeta, stripAdminMeta } from "@/lib/property-admin-meta";

export const dynamic = "force-dynamic";

function isTargetResidential(type: unknown, title: unknown) {
  const t = String(type ?? "").trim();
  const text = `${t} ${String(title ?? "")}`;
  if (/아파트|오피스텔/.test(t)) return false;
  if (/상가|사무실|창고|공장|토지|빌딩|건물|숙박|펜션/.test(t)) return false;
  return /원룸|미니투룸|투룸|쓰리룸|다가구|다세대|연립|빌라|주택/.test(text);
}

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return NextResponse.json({ ok: false, error: "Missing Supabase env" }, { status: 500 });

  const supabase = createClient(url, key, { auth: { persistSession: false } });
  const { data, error } = await supabase.from("properties").select("id,title,type,description");
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

  const targets = (data ?? []).filter((row: any) => isTargetResidential(row.type, row.title));
  const results: any[] = [];

  for (const row of targets) {
    const description = String(row.description ?? "");
    const meta = parseAdminMeta(description);
    const nextMeta = {
      ...meta,
      infoOverrides: { ...meta.infoOverrides, buildingUse: "단독주택" },
    };
    const nextDescription = buildDescriptionWithAdminMeta(stripAdminMeta(description), nextMeta);
    const { error: updateError } = await supabase.from("properties").update({ description: nextDescription }).eq("id", row.id);
    results.push({ id: row.id, title: row.title, type: row.type, buildingUse: "단독주택", ok: !updateError, error: updateError?.message ?? null });
  }

  return NextResponse.json({
    ok: results.every((r) => r.ok),
    total: targets.length,
    updated: results.filter((r) => r.ok).length,
    failed: results.filter((r) => !r.ok).length,
    results,
  });
}
