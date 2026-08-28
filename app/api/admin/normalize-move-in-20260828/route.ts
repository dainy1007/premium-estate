import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { buildDescriptionWithAdminMeta, parseAdminMeta, stripAdminMeta } from "@/lib/property-admin-meta";

export const dynamic = "force-dynamic";

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return NextResponse.json({ ok: false, error: "Missing Supabase env" }, { status: 500 });

  const supabase = createClient(url, key, { auth: { persistSession: false } });
  const { data, error } = await supabase.from("properties").select("id,title,type,description");
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

  const results: any[] = [];
  for (const row of data ?? []) {
    const description = String(row.description ?? "");
    const meta = parseAdminMeta(description);
    const nextMeta = {
      ...meta,
      infoOverrides: { ...meta.infoOverrides, moveIn: "즉시입주/협의 가능" },
    };
    const nextDescription = buildDescriptionWithAdminMeta(stripAdminMeta(description), nextMeta);
    const { error: updateError } = await supabase.from("properties").update({ description: nextDescription }).eq("id", row.id);
    results.push({ id: row.id, title: row.title, type: row.type, moveIn: "즉시입주/협의 가능", ok: !updateError, error: updateError?.message ?? null });
  }

  return NextResponse.json({
    ok: results.every((r) => r.ok),
    total: results.length,
    updated: results.filter((r) => r.ok).length,
    failed: results.filter((r) => !r.ok).length,
    results,
  });
}
