"use client";

import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import * as XLSX from "xlsx";

type BuildingRow = {
  buildingName: string;
  town: string;
  village: string;
  lot: string;
  address: string;
  approvalDate: string;
  zone: string;
};

function text(value: unknown) {
  if (value == null) return "";
  return String(value).trim();
}

function makeRows(sheet: XLSX.WorkSheet): BuildingRow[] {
  const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "", raw: false });
  const rows = raw.map((row) => {
    const buildingName = text(row["건물명"]);
    const town = text(row["읍/면"]);
    const village = text(row["동/리"]);
    const lot = text(row["지번"]);
    const approvalDate = text(row["준공"]);
    const zone = text(row["구역"]);
    return {
      buildingName,
      town,
      village,
      lot,
      address: [town, village, lot].filter(Boolean).join(" "),
      approvalDate,
      zone,
    };
  }).filter((row) => row.buildingName || row.address);

  const seen = new Set<string>();
  return rows.filter((row) => {
    const key = `${row.buildingName}|${row.address}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export default function BuildingDirectoryPage() {
  const [rows, setRows] = useState<BuildingRow[]>([]);
  const [keyword, setKeyword] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => { void loadSaved(); }, []);

  async function loadSaved() {
    try {
      const response = await fetch("/api/admin/building-directory", { cache: "no-store" });
      if (!response.ok) return;
      const data = await response.json() as { ok?: boolean; rows?: BuildingRow[] };
      if (data.ok && Array.isArray(data.rows)) setRows(data.rows);
    } catch (error) {
      console.warn("건물 기본정보 불러오기 경고:", error);
    }
  }

  async function handleExcel(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setMessage("엑셀 읽는 중...");
    try {
      const workbook = XLSX.read(await file.arrayBuffer(), { type: "array", cellDates: true });
      const sheet = workbook.Sheets["원룸장부"] || workbook.Sheets[workbook.SheetNames[0]];
      if (!sheet) throw new Error("원룸장부 시트를 찾지 못했습니다.");
      const imported = makeRows(sheet);
      setRows(imported);
      setMessage(`${imported.length}건을 읽었습니다. 저장 버튼을 눌러 관리자 장부에 반영하세요.`);
    } catch (error) {
      console.error(error);
      setMessage("엑셀 파일을 읽지 못했습니다.");
    }
  }

  async function saveRows() {
    if (!rows.length || saving) return;
    setSaving(true);
    setMessage("저장 중...");
    try {
      const response = await fetch("/api/admin/building-directory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows }),
      });
      const data = await response.json().catch(() => ({})) as { ok?: boolean; count?: number; error?: string };
      if (!response.ok || !data.ok) throw new Error(data.error || "저장 실패");
      setMessage(`건물 기본정보 ${data.count ?? rows.length}건 저장 완료`);
    } catch (error) {
      console.error(error);
      setMessage(`저장에 실패했습니다. ${error instanceof Error ? error.message : "잠시 후 다시 시도해 주세요."}`);
    } finally {
      setSaving(false);
    }
  }

  const filtered = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) => [row.buildingName, row.address, row.approvalDate, row.zone].join(" ").toLowerCase().includes(q));
  }, [rows, keyword]);

  return <main className="min-h-screen bg-[#F8F9FB] px-4 py-8 text-[#0A2342]">
    <div className="mx-auto max-w-7xl rounded-[32px] bg-white p-6 shadow-sm md:p-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">건물 기본정보 장부</h1>
          <p className="mt-2 text-sm text-[#0A2342]/60">원룸장부 엑셀에서 건물명·읍면·동리·지번·준공일·구역만 저장합니다. 전화번호·소유주·계좌번호·현관번호 등 개인정보/보안정보는 저장하지 않습니다.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <label className="cursor-pointer rounded-xl border border-[#0A2342] bg-white px-5 py-3 text-sm font-semibold">엑셀 불러오기<input type="file" accept=".xlsx,.xls" className="hidden" onChange={handleExcel}/></label>
          <button type="button" onClick={()=>void saveRows()} disabled={!rows.length||saving} className="rounded-xl bg-[#0A2342] px-5 py-3 text-sm font-semibold text-white disabled:opacity-40">{saving?"저장 중...":"장부 저장"}</button>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3 rounded-2xl border bg-[#F8F9FB] p-4">
        <input value={keyword} onChange={e=>setKeyword(e.target.value)} placeholder="건물명·주소·준공일 검색" className="min-w-[260px] flex-1 rounded-xl border bg-white px-4 py-3 outline-none focus:border-[#C9A227]"/>
        <span className="text-sm">저장 장부 <b>{rows.length}</b>건 · 검색 결과 <b>{filtered.length}</b>건</span>
      </div>
      {message && <p className="mt-3 rounded-xl bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-800">{message}</p>}

      <div className="mt-5 overflow-x-auto">
        <table className="w-full min-w-[900px] text-sm">
          <thead className="bg-[#F8F9FB]"><tr>{["건물명","읍/면","동/리","지번","통합 주소","준공일","구역"].map(v=><th key={v} className="px-4 py-4 text-left">{v}</th>)}</tr></thead>
          <tbody>{filtered.slice(0,500).map((row,index)=><tr key={`${row.buildingName}-${row.address}-${index}`} className="border-t">
            <td className="px-4 py-3 font-semibold">{row.buildingName||"-"}</td><td className="px-4 py-3">{row.town||"-"}</td><td className="px-4 py-3">{row.village||"-"}</td><td className="px-4 py-3">{row.lot||"-"}</td><td className="px-4 py-3">{row.address||"-"}</td><td className="px-4 py-3">{row.approvalDate||"-"}</td><td className="px-4 py-3">{row.zone||"-"}</td>
          </tr>)}</tbody>
        </table>
      </div>
      {filtered.length>500&&<p className="mt-3 text-sm text-[#0A2342]/55">화면에는 검색 결과의 앞 500건만 표시합니다. 검색어를 입력하면 원하는 건물을 빠르게 찾을 수 있습니다.</p>}
    </div>
  </main>;
}
