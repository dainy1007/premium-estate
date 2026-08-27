"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { buildDescriptionWithAdminMeta, parseAdminMeta } from "@/lib/property-admin-meta";

type Item={id:number;title:string;address?:string|null;location?:string|null;type?:string|null;description?:string|null};
type RowResult={id:number;status:"대기"|"완료"|"건너뜀"|"오류";message?:string};

function lookupGuide(type:string){
  if(/아파트|오피스텔|다세대|연립|빌라/.test(type))return "지번 + 동/호수 입력";
  if(/상가|사무실/.test(type))return "지번 + 호수 입력";
  if(/단독주택|다가구|상가주택|원룸|미니투룸|투룸|쓰리룸/.test(type))return "정확한 지번 입력";
  return "건축물대장 조회용 정확한 지번 입력";
}

export default function BuildingLedgerAdminPage(){
  const[items,setItems]=useState<Item[]>([]);
  const[results,setResults]=useState<Record<number,RowResult>>({});
  const[drafts,setDrafts]=useState<Record<number,string>>({});
  const[selected,setSelected]=useState<Set<number>>(new Set());
  const[running,setRunning]=useState(false);
  const[savingId,setSavingId]=useState<number|null>(null);
  const[savingSelected,setSavingSelected]=useState(false);

  useEffect(()=>{void load();},[]);
  async function load(){
    const{data}=await supabase.from("properties").select("id,title,address,location,type,description").order("id",{ascending:false});
    const rows=(data||[]) as Item[];
    setItems(rows);
    const next:Record<number,string>={};
    for(const item of rows){next[item.id]=parseAdminMeta(item.description||"").ledgerLookupAddress||"";}
    setDrafts(next);
  }

  const allSelected=useMemo(()=>items.length>0&&items.every(v=>selected.has(v.id)),[items,selected]);
  function toggleAll(){setSelected(allSelected?new Set():new Set(items.map(v=>v.id)));}
  function toggleOne(id:number){setSelected(prev=>{const next=new Set(prev);if(next.has(id))next.delete(id);else next.add(id);return next;});}

  async function saveLookupAddress(item:Item,address:string){
    const value=address.trim();
    const meta=parseAdminMeta(item.description||"");
    if(meta.ledgerLookupAddress===value)return true;
    setSavingId(item.id);
    const nextMeta={...meta,ledgerLookupAddress:value};
    const description=buildDescriptionWithAdminMeta(item.description||"",nextMeta);
    const{error}=await supabase.from("properties").update({description}).eq("id",item.id);
    setSavingId(null);
    if(error){window.alert("관리자 전용 조회주소 저장에 실패했습니다.");return false;}
    setItems(list=>list.map(v=>v.id===item.id?{...v,description}:v));
    return true;
  }

  async function saveSelectedAddresses(){
    if(savingSelected||running||!selected.size)return;
    setSavingSelected(true);
    let saved=0;
    let failed=0;
    for(const item of items.filter(v=>selected.has(v.id))){
      const ok=await saveLookupAddress(item,drafts[item.id]||"");
      if(ok)saved+=1;else failed+=1;
    }
    setSavingSelected(false);
    if(failed)window.alert(`조회주소 저장 완료: ${saved}건 / 실패: ${failed}건`);
    else window.alert(`선택한 ${saved}개 매물의 조회주소를 저장했습니다.`);
  }

  async function enrich(item:Item){
    const adminAddress=(drafts[item.id]||"").trim();
    const publicAddress=(item.address||item.location||"").trim();
    const address=adminAddress||publicAddress;
    if(!address){setResults(p=>({...p,[item.id]:{id:item.id,status:"건너뜀",message:"조회주소 없음"}}));return;}
    if(adminAddress){const ok=await saveLookupAddress(item,adminAddress);if(!ok)return;}
    setResults(p=>({...p,[item.id]:{id:item.id,status:"대기",message:"조회 중"}}));
    try{
      const r=await fetch("/api/admin/building-ledger",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({property_id:item.id,address})});
      const data=await r.json();
      if(!data.ok)throw new Error([data.error,data.detail].filter(Boolean).join(" · ")||"조회 실패");
      const l=data.ledger||{};
      const msg=[l.buildingUse,l.approvalDate,l.totalFloor?`지상 ${l.totalFloor}층`:"",l.parkingCount?`주차 ${l.parkingCount}대`:""].filter(Boolean).join(" · ");
      setResults(p=>({...p,[item.id]:{id:item.id,status:"완료",message:msg||"보완 완료"}}));
    }catch(e){setResults(p=>({...p,[item.id]:{id:item.id,status:"오류",message:e instanceof Error?e.message:String(e)}}));}
  }

  async function runSelected(){
    if(running||savingSelected||!selected.size)return;
    setRunning(true);
    for(const item of items.filter(v=>selected.has(v.id))){await enrich(item);}
    setRunning(false);
  }
  async function runAll(){
    if(running||savingSelected)return;
    setRunning(true);
    for(const item of items){await enrich(item);}
    setRunning(false);
  }

  return <main className="min-h-screen bg-[#F8F9FB] px-4 py-8 text-[#0A2342]">
    <div className="mx-auto max-w-[1480px] rounded-[32px] bg-white p-6 shadow-sm md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="text-3xl font-bold">건축물대장 자동 보완</h1><p className="mt-2 text-sm text-[#0A2342]/60">관리자 전용 상세주소를 기준으로 건축물대장을 조회해 비어 있는 건물 기본정보만 보완합니다.</p></div>
        <div className="flex gap-2"><Link href="/admin" className="rounded-full border px-5 py-3">매물관리</Link><button onClick={()=>void runAll()} disabled={running||savingSelected} className="rounded-full bg-[#C9A227] px-5 py-3 font-semibold disabled:opacity-50">{running?"조회 중...":"전체 매물 보완"}</button></div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3 rounded-2xl border bg-[#F8F9FB] px-4 py-3">
        <label className="flex items-center gap-2 font-semibold"><input type="checkbox" checked={allSelected} onChange={toggleAll} className="h-5 w-5"/>전체 선택</label>
        <span className="text-sm">선택 항목: <b className="rounded-full bg-[#0A2342] px-3 py-1 text-white">{selected.size}개</b></span>
        <button onClick={()=>void saveSelectedAddresses()} disabled={running||savingSelected||!selected.size} className="rounded-xl border border-[#0A2342] bg-white px-5 py-2.5 font-semibold text-[#0A2342] disabled:opacity-40">{savingSelected?"주소 저장 중...":"조회주소 저장"}</button>
        <button onClick={()=>void runSelected()} disabled={running||savingSelected||!selected.size} className="rounded-xl bg-[#0A2342] px-5 py-2.5 font-semibold text-white disabled:opacity-40">선택 매물 보완</button>
        <button onClick={()=>setSelected(new Set())} disabled={running||savingSelected||!selected.size} className="rounded-xl border bg-white px-5 py-2.5 font-semibold disabled:opacity-40">선택 초기화</button>
      </div>

      <div className="mt-4 overflow-x-auto"><table className="w-full min-w-[1280px]">
        <thead className="bg-[#F8F9FB]"><tr>
          <th className="w-12 px-3 py-4 text-left"><input type="checkbox" checked={allSelected} onChange={toggleAll} className="h-5 w-5"/></th>
          {["번호","매물명","유형","건축물대장 조회주소 (관리자 전용)","홈페이지 표시주소","처리상태","관리"].map(v=><th key={v} className="px-3 py-4 text-left">{v}</th>)}
        </tr></thead>
        <tbody>{items.map(item=>{const result=results[item.id];const type=item.type||"-";const publicAddress=item.address||item.location||"주소 없음";return <tr key={item.id} className="border-t align-top text-sm">
          <td className="px-3 py-4"><input type="checkbox" checked={selected.has(item.id)} onChange={()=>toggleOne(item.id)} className="h-5 w-5"/></td>
          <td className="px-3 py-4 font-semibold">{item.id}</td>
          <td className="px-3 py-4 font-semibold"><Link href={`/admin/properties/${item.id}/edit`} target="_blank" rel="noopener noreferrer" title="관리자 매물 수정 화면 새 탭에서 열기" className="cursor-pointer underline decoration-dotted underline-offset-4 hover:text-[#C9A227]">{item.title}</Link></td>
          <td className="px-3 py-4"><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold">{type}</span></td>
          <td className="min-w-[330px] px-3 py-4">
            <input value={drafts[item.id]||""} onChange={e=>setDrafts(p=>({...p,[item.id]:e.target.value}))} onBlur={()=>void saveLookupAddress(item,drafts[item.id]||"")} placeholder={lookupGuide(type)} className="w-full rounded-xl border px-3 py-2.5 outline-none focus:border-[#C9A227]"/>
            <p className="mt-1.5 text-xs text-[#0A2342]/55">{lookupGuide(type)} · 관리자만 확인</p>
          </td>
          <td className="min-w-[230px] px-3 py-4">{publicAddress}</td>
          <td className="min-w-[210px] px-3 py-4"><span className={`font-bold ${result?.status==="오류"?"text-red-600":result?.status==="완료"?"text-blue-600":""}`}>{result?.status||"대기"}</span>{result?.message&&<p className="mt-1 max-w-[300px] break-words text-xs text-[#0A2342]/60">{result.message}</p>}</td>
          <td className="px-3 py-4"><button onClick={()=>void enrich(item)} disabled={running||savingSelected||savingId===item.id} className="rounded-full border px-4 py-2 font-semibold disabled:opacity-40">{savingId===item.id?"저장 중...":"건축물대장 조회"}</button></td>
        </tr>})}</tbody>
      </table></div>

      <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm leading-7 text-[#0A2342]">
        <b>관리자 전용 조회주소 입력 기준</b><br/>
        · 아파트/오피스텔/집합건물: 정확한 지번과 동/호수를 입력합니다.<br/>
        · 단독주택/다가구/원룸류: 정확한 지번을 입력합니다.<br/>
        · 상가/사무실: 정확한 지번과 호수를 입력합니다.<br/>
        입력한 조회주소는 공개 홈페이지에는 표시하지 않고 건축물대장 조회에만 사용합니다. 관리자가 이미 입력한 매물정보는 덮어쓰지 않습니다.
      </div>
    </div>
  </main>;
}