import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return NextResponse.json({ ok: false, error: "Missing Supabase env" }, { status: 500 });

  const supabase = createClient(url, key, { auth: { persistSession: false } });
  const { data, error } = await supabase.from("properties").select("id,title,type,rooms,bathrooms");
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

  const targets = (data ?? []).flatMap((row: any) => {
    const type = String(row.type ?? "").trim();
    const title = String(row.title ?? "").trim();
    const text = `${type} ${title}`;
    let rooms: number | null = null;
    if (/미니투룸/.test(text)) rooms = 1;
    else if (/투룸/.test(text)) rooms = 2;
    else if (/원룸/.test(text)) rooms = 1;
    if (rooms === null) return [];
    return [{ ...row, rooms, bathrooms: 1 }];
  });

  const results: any[] = [];
  for (const row of targets) {
    const { error: updateError } = await supabase.from("properties").update({ rooms: row.rooms, bathrooms: 1 }).eq("id", row.id);
    results.push({ id: row.id, title: row.title, type: row.type, rooms: row.rooms, bathrooms: 1, ok: !updateError, error: updateError?.message ?? null });
  }

  return NextResponse.json({ ok: results.every((r) => r.ok), total: targets.length, updated: results.filter((r) => r.ok).length, failed: results.filter((r) => !r.ok).length, results });
}
