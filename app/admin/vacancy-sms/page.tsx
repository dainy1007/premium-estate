"use client";

import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import * as XLSX from "xlsx";

type LedgerRow = {
  id: string;
  area: string;
  buildingName: string;
  lot: string;
  owner: string;
  vacancy: string;
  phones: string[];
};

const LOCAL_KEY = "baekjo_vacancy_sms_ledger_v1";
const DEFAULT_MESSAGE = "안녕하세요. 백조현대부동산입니다. {건물명} 현재 공실 여부 확인 부탁드립니다. 공실이 있으시면 보증금/월세와 입주 가능일을 회신 부탁드립니다. 감사합니다.";

function text(value: unknown) {
  if (value == null) return "";
  return String(value).trim();
}

function normalizePhone(value: string) {
  const digits = value.replace(/\D/g, "");
  if (digits.length === 10 || digits.length === 11) return digits;
  return "";
}

function extractPhones(value: unknown) {
  const source = text(value);
  const matches = source.match(/01[016789][\s-]?\d{3,4}[\s-]?\d{4}/g) || [];
  return Array.from(new Set(matches.map(normalizePhone).filter(Boolean)));
}

function parseWorkbook(workbook: XLSX.WorkBook): LedgerRow[] {
  const rows: LedgerRow[] = [];
  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) continue;
    const values = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: "", raw: false });
    const headerIndex = values.findIndex((row) => Array.isArray(row) && row.some((v) => text(v) === "건 물 명" || text(v) === "건물명"));
    if (headerIndex < 0) continue;
    const header = values[headerIndex].map((v) => text(v).replace(/\s/g, ""));
    const col = (name: string) => header.findIndex((v) => v === name.replace(/\s/g, ""));
    const buildingCol = Math.max(col("건물명"), 0);
    const lotCol = col("주소");
    const ownerCol = col("소유자");
    const vacancyCol = col("공실");
    const phoneCol = col("전화번호");

    for (let i = headerIndex + 1; i < values.length; i += 1) {
      const row = values[i] || [];
      const buildingName = text(row[buildingCol]);
      if (!buildingName) continue;
      const phones = phoneCol >= 0 ? extractPhones(row[phoneCol]) : [];
      rows.push({
        id: `${sheetName}-${i}-${buildingName}`,
        area: sheetName,
        buildingName,
        lot: lotCol >= 0 ? text(row[lotCol]) : "",
        owner: ownerCol >= 0 ? text(row[ownerCol]) : "",
        vacancy: vacancyCol >= 0 ? text(row[vacancyCol]) : "",
        phones,
      });
    }
  }
  return rows;
}

function displayPhone(value: string) {
  if (value.length === 11) return `${value.slice(0,3)}-${value.slice(3,7)}-${value.slice(7)}`;
  if (value.length === 10) return `${value.slice(0,3)}-${value.slice(3,6)}-${value.slice(6)}`;
  return value;
}

export default function VacancySmsPage() {
  const [rows, setRows] = useState<LedgerRow[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [keyword, setKeyword] = useState("");
  const [area, setArea] = useState("전체");
  const [messageTemplate, setMessageTemplate] = useState(DEFAULT_MESSAGE);
  const [status, setStatus] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(LOCAL_KEY);
      if (saved) setRows(JSON.parse(saved));
    } catch {}
  }, []);

  async function handleExcel(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setStatus("장부를 읽는 중입니다...");
    try {
      const workbook = XLSX.read(await file.arrayBuffer(), { type: "array", cellDates: true });
      const imported = parseWorkbook(workbook);
      setRows(imported);
      setSelected(new Set());
      localStorage.setItem(LOCAL_KEY, JSON.stringify(imported));
      const phoneRows = imported.filter((row) => row.phones.length).length;
      setStatus(`${imported.length}개 건물을 읽었습니다. 전화번호가 있는 건물 ${phoneRows}개입니다.`);
    } catch (error) {
      console.error(error);
      setStatus("엑셀 장부를 읽지 못했습니다.");
    }
  }

  const areas = useMemo(() => ["전체", ...Array.from(new Set(rows.map((row) => row.area)))], [rows]);
  const filtered = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    return rows.filter((row) => {
      if (area !== "전체" && row.area !== area) return false;
      if (!q) return true;
      return [row.area, row.buildingName, row.lot, row.owner, row.vacancy, ...row.phones].join(" ").toLowerCase().includes(q);
    });
  }, [rows, area, keyword]);

  const selectable = filtered.filter((row) => row.phones.length > 0);
  const allSelected = selectable.length > 0 && selectable.every((row) => selected.has(row.id));

  function toggleAll() {
    setSelected((previous) => {
      const next = new Set(previous);
      if (allSelected) selectable.forEach((row) => next.delete(row.id));
      else selectable.forEach((row) => next.add(row.id));
      return next;
    });
  }

  function toggleOne(id: string) {
    setSelected((previous) => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  const outbound = useMemo(() => {
    const byPhone = new Map<string, string[]>();
    rows.filter((row) => selected.has(row.id)).forEach((row) => {
      row.phones.forEach((phone) => {
        const buildings = byPhone.get(phone) || [];
        if (!buildings.includes(row.buildingName)) buildings.push(row.buildingName);
        byPhone.set(phone, buildings);
      });
    });
    return Array.from(byPhone.entries()).map(([phone, buildings]) => ({
      to: phone,
      buildings,
      text: messageTemplate.replaceAll("{건물명}", buildings.join(", ")),
    }));
  }, [rows, selected, messageTemplate]);

  async function sendSelected() {
    if (!outbound.length || sending) return;
    const confirmed = window.confirm(`선택한 건물을 기준으로 ${outbound.length}개 전화번호에 공실 확인 문자를 발송할까요?\n\n발송 전 수신번호와 문구를 다시 확인해 주세요.`);
    if (!confirmed) return;
    setSending(true);
    setStatus("문자 발송 중...");
    try {
      const response = await fetch("/api/admin/sms/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: outbound.map((item) => ({ to: item.to, text: item.text })) }),
      });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result.error || "문자 발송 실패");
      setStatus(`${result.count || outbound.length}건 문자 발송 요청 완료`);
      setSelected(new Set());
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "문자 발송에 실패했습니다.");
    } finally {
      setSending(false);
    }
  }

  function clearLedger() {
    if (!window.confirm("이 브라우저에 저장된 문자 장부를 삭제할까요?")) return;
    localStorage.removeItem(LOCAL_KEY);
    setRows([]);
    setSelected(new Set());
    setStatus("브라우저에 저장된 장부를 삭제했습니다.");
  }

  return <main className="min-h-screen bg-[#F8F9FB] px-4 py-8 text-[#0A2342]">
    <div className="mx-auto max-w-[1500px] rounded-[32px] bg-white p-6 shadow-sm md:p-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">임대인 공실 확인 문자</h1>
          <p className="mt-2 text-sm text-[#0A2342]/60">현풍 원룸 장부 형식(건물명·주소·소유자·공실·전화번호)을 읽어 발송 대상을 선택합니다. 연락처 장부는 이 관리자 브라우저에만 저장됩니다.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <label className="cursor-pointer rounded-xl border border-[#0A2342] bg-white px-5 py-3 text-sm font-semibold">현풍 원룸 장부 불러오기<input type="file" accept=".xlsx,.xls" className="hidden" onChange={handleExcel}/></label>
          <button type="button" onClick={clearLedger} disabled={!rows.length} className="rounded-xl border px-5 py-3 text-sm font-semibold disabled:opacity-40">장부 삭제</button>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_420px]">
        <section>
          <div className="flex flex-wrap items-center gap-3 rounded-2xl border bg-[#F8F9FB] p-4">
            <select value={area} onChange={(e)=>setArea(e.target.value)} className="rounded-xl border bg-white px-4 py-3">
              {areas.map((value)=><option key={value}>{value}</option>)}
            </select>
            <input value={keyword} onChange={(e)=>setKeyword(e.target.value)} placeholder="건물명·주소·소유자·전화번호 검색" className="min-w-[260px] flex-1 rounded-xl border bg-white px-4 py-3 outline-none focus:border-[#C9A227]"/>
            <span className="text-sm">검색 <b>{filtered.length}</b>개 · 선택 <b>{selected.size}</b>개</span>
          </div>
          {status&&<p className="mt-3 rounded-xl bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-800">{status}</p>}

          <div className="mt-4 overflow-x-auto rounded-2xl border">
            <table className="w-full min-w-[980px] text-sm">
              <thead className="bg-[#F8F9FB]"><tr>
                <th className="px-3 py-4 text-left"><input type="checkbox" checked={allSelected} onChange={toggleAll}/></th>
                {["구역","건물명","주소","소유자","공실 메모","전화번호"].map((v)=><th key={v} className="px-3 py-4 text-left">{v}</th>)}
              </tr></thead>
              <tbody>{filtered.map((row)=><tr key={row.id} className="border-t align-top">
                <td className="px-3 py-3"><input type="checkbox" disabled={!row.phones.length} checked={selected.has(row.id)} onChange={()=>toggleOne(row.id)}/></td>
                <td className="px-3 py-3">{row.area}</td>
                <td className="px-3 py-3 font-semibold">{row.buildingName}</td>
                <td className="px-3 py-3">{row.lot||"-"}</td>
                <td className="max-w-[200px] whitespace-pre-line px-3 py-3">{row.owner||"-"}</td>
                <td className="max-w-[200px] whitespace-pre-line px-3 py-3">{row.vacancy||"-"}</td>
                <td className="px-3 py-3">{row.phones.length?row.phones.map(displayPhone).join(" / "):<span className="text-red-500">번호 없음</span>}</td>
              </tr>)}</tbody>
            </table>
          </div>
        </section>

        <aside className="h-fit rounded-2xl border p-5 lg:sticky lg:top-[88px]">
          <h2 className="text-xl font-bold">발송 문구</h2>
          <p className="mt-2 text-xs text-[#0A2342]/55"><b>{"{건물명}"}</b> 부분은 선택한 건물명으로 자동 변경됩니다. 같은 전화번호가 여러 건물에 있으면 한 통으로 묶습니다.</p>
          <textarea value={messageTemplate} onChange={(e)=>setMessageTemplate(e.target.value)} rows={7} className="mt-4 w-full rounded-xl border p-3 leading-6 outline-none focus:border-[#C9A227]"/>
          <div className="mt-4 rounded-xl bg-[#F8F9FB] p-4 text-sm">
            실제 발송 대상 <b>{outbound.length}명</b>
            {outbound.slice(0,3).map((item)=><div key={item.to} className="mt-2 border-t pt-2"><b>{displayPhone(item.to)}</b><p className="mt-1 text-xs leading-5 text-[#0A2342]/65">{item.text}</p></div>)}
            {outbound.length>3&&<p className="mt-2 text-xs">외 {outbound.length-3}명</p>}
          </div>
          <button type="button" onClick={()=>void sendSelected()} disabled={!outbound.length||sending} className="mt-4 w-full rounded-xl bg-[#0A2342] px-5 py-3.5 font-bold text-white disabled:opacity-40">{sending?"발송 중...":`선택 ${outbound.length}명 문자 발송`}</button>
          <p className="mt-3 text-xs leading-5 text-[#0A2342]/55">실제 발송은 SOLAPI 발신번호 등록 및 API 키 설정 후 활성화됩니다. 발송 직전 확인창이 한 번 더 표시됩니다.</p>
        </aside>
      </div>
    </div>
  </main>;
}
