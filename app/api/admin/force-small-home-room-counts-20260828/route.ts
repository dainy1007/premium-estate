import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function classify(type: unknown, title: unknown) {
  const text = `${String(type ?? "").trim()} ${String(title ?? "").trim()}`;
  if (/미니투룸/.test(text)) return { rooms: 1, bathrooms: 1, kind: "미니투룸" };
  if (/투룸/.test(text)) return { rooms: 2, bathrooms: 1, kind: "투룸" };
  if (/원룸/.test(text)) return { rooms: 1, bathrooms: 1, kind: "원룸" };
  return null;
}

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return NextResponse.json({ ok: false, error: "Missing Supabase env" }, { status: 500 });

  const supabase = createClient(url, key, { auth: { persistSession: false } });
  const { data, error } = await supabase.from("properties").select("id,title,type,rooms,bathrooms");
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

  const targets = (data ?? []).flatMap((row: any) => {
    const c = classify(row.type, row.title);
    return c ? [{ ...row, ...c }] : [];
  });

  const results: any[] = [];
  for (const row of targets) {
    const { error: updateError } = await supabase
      .from("properties")
      .update({ rooms: row.rooms, bathrooms: row.bathrooms })
      .eq("id", row.id);
    results.push({ id: row.id, title: row.title, type: row.type, kind: row.kind, rooms: row.rooms, bathrooms: row.bathrooms, ok: !updateError, error: updateError?.message ?? null });
  }

  return NextResponse.json({
    ok: results.every((r) => r.ok),
    total: results.length,
    updated: results.filter((r) => r.ok).length,
    failed: results.filter((r) => !r.ok).length,
    results,
  });
}
