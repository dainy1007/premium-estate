"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { buildDescriptionWithAdminMeta, parseAdminMeta } from "@/lib/property-admin-meta";

type Item={id:number;title:string;address?:string|null;location?:string|null;type?:string|null;description?:string|null};
type RowResult={id:number;status:"대기"|"완료"|"건너뜀"|"실패";message?:string};

function lookupGuide(type:string){
  if(/아파트|오피스텔|다세대|연립|빌라/.test(type))return "지번 + 동/호수 입력";
  if(/상가|사무실/.test(type))return "지번 + 호수 입력";
  if(/단독주택|다가구|상가주택|원룸|미니투룸|투룸|쓰리룸/.test(type))return "정확한 지번 입력";
  return "건축물대장 조회용 정확한 지번 입력";
}

function restoredLedgerResult(item:Item):RowResult|undefined{
  const meta=parseAdminMeta(item.description||"");
  if(/^조회 실패/.test(meta.ledgerSummary||"")||/전유부 재확인 필요|전용면적 기존 정보 유지/.test(meta.ledgerSummary||"")){
    return{id:item.id,status:"실패",message:meta.ledgerSummary||"건축물대장 조회 실패"};
  }
  const legacyCompleted=Boolean(meta.infoOverrides?.buildingUse&&meta.infoOverrides?.approvalDate);
  if(meta.ledgerStatus==="completed"||legacyCompleted){
    const fallback=[meta.infoOverrides?.buildingUse,meta.infoOverrides?.approvalDate,meta.infoOverrides?.parking].filter(Boolean).join(" · ");
    return{id:item.id,status:"완료",message:meta.ledgerSummary||fallback||"건축물대장 등록 완료"};
  }
  return undefined;
}

export default function BuildingLedgerAdminPage(){
  const[items,setItems]=useState<Item[]>([]);
  const[results,setResults]=useState<Record<number,RowResult>>({});
  const[drafts,setDrafts]=useState<Record<number,string>>({});
  const[selected,setSelected]=useState<Set<number>>(new Set());
  const[searchKeyword,setSearchKeyword]=useState("");
  const[running,setRunning]=useState(false);
  const[savingId,setSavingId]=useState<number|null>(null);
  const[savingSelected,setSavingSelected]=useState(false);

  useEffect(()=>{void load();},[]);
  async function load(){
    const{data}=await supabase.from("properties").select("id,title,address,location,type,description").order("id",{ascending:false});
    const rows=(data||[]) as Item[];
    setItems(rows);
    const nextDrafts:Record<number,string>={};
    const nextResults:Record<number,RowResult>={};
    for(const item of rows){
      const meta=parseAdminMeta(item.description||"");
      nextDrafts[item.id]=meta.ledgerLookupAddress||"";
      const restored=restoredLedgerResult(item);
      if(restored)nextResults[item.id]=restored;
    }
    setDrafts(nextDrafts);setResults(nextResults);
  }

  const filteredItems=useMemo(()=>{const q=searchKeyword.trim().toLowerCase();if(!q)return items;return items.filter(item=>{const meta=parseAdminMeta(item.description||"");return[String(item.id),item.title,item.type,item.address,item.location,meta.ledgerLookupAddress,drafts[item.id]].filter(Boolean).join(" ").toLowerCase().includes(q);});},[items,searchKeyword,drafts]);
  const allSelected=useMemo(()=>filteredItems.length>0&&filteredItems.every(v=>selected.has(v.id)),[filteredItems,selected]);
  function toggleAll(){setSelected(prev=>{const next=new Set(prev);if(allSelected)filteredItems.forEach(v=>next.delete(v.id));else filteredItems.forEach(v=>next.add(v.id));return next;});}
  function toggleOne(id:number){setSelected(prev=>{const next=new Set(prev);if(next.has(id))next.delete(id);else next.add(id);return next;});}

  async function saveLookupAddress(item:Item,address:string){const value=address.trim();const meta=parseAdminMeta(item.description||"");if(meta.ledgerLookupAddress===value)return true;setSavingId(item.id);const nextMeta={...meta,ledgerLookupAddress:value,ledgerStatus:"" as const,ledgerSummary:"",ledgerUpdatedAt:""};const description=buildDescriptionWithAdminMeta(item.description||"",nextMeta);const{error}=await supabase.from("properties").update({description}).eq("id",item.id);setSavingId(null);if(error){window.alert("관리자 전용 조회주소 저장에 실패했습니다.");return false;}setItems(list=>list.map(v=>v.id===item.id?{...v,description}:v));setResults(prev=>{const next={...prev};delete next[item.id];return next;});return true;}
  async function saveSelectedAddresses(){if(savingSelected||running||!selected.size)return;setSavingSelected(true);let saved=0,failed=0;for(const item of items.filter(v=>selected.has(v.id))){const ok=await saveLookupAddress(item,drafts[item.id]||"");if(ok)saved+=1;else failed+=1;}setSavingSelected(false);if(failed)window.alert(`조회주소 저장 완료: ${saved}건 / 실패: ${failed}건`);else window.alert(`선택한 ${saved}개 매물의 조회주소를 저장했습니다.`);}

  async function persistFailure(item:Item,message:string){
    const current=items.find(v=>v.id===item.id)||item;
    const meta=parseAdminMeta(current.description||"");
    const nextMeta={...meta,ledgerStatus:"" as const,ledgerSummary:`조회 실패 · ${message}`,ledgerUpdatedAt:new Date().toISOString()};
    const description=buildDescriptionWithAdminMeta(current.description||"",nextMeta);
    const{error}=await supabase.from("properties").update({description}).eq("id",item.id);
    if(!error)setItems(list=>list.map(v=>v.id===item.id?{...v,description}:v));
  }

  async function enrich(item:Item){
    const adminAddress=(drafts[item.id]||"").trim(),publicAddress=(item.address||item.location||"").trim(),address=adminAddress||publicAddress;
    if(!address){setResults(p=>({...p,[item.id]:{id:item.id,status:"건너뜀",message:"조회주소 없음"}}));return;}
    if(adminAddress){const ok=await saveLookupAddress(item,adminAddress);if(!ok)return;}
    setResults(p=>({...p,[item.id]:{id:item.id,status:"대기",message:"조회 중"}}));
    try{
      const r=await fetch("/api/admin/building-ledger",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({property_id:item.id,address})});
      const data=await r.json();
      if(!data.ok)throw new Error([data.error,data.detail].filter(Boolean).join(" · ")||"조회 실패");
      const l=data.ledger||{};const msg=data.summary||[l.buildingUse,l.approvalDate,l.totalFloor?`지상 ${l.totalFloor}층`:"",l.parkingCount?`주차 ${l.parkingCount}대`:""].filter(Boolean).join(" · ");
      if(data.partial||data.warning||/전유부 재확인 필요|전용면적 기존 정보 유지/.test(msg||"")){
        const failMsg=data.warning||msg||"전유부 조회 실패";
        setResults(p=>({...p,[item.id]:{id:item.id,status:"실패",message:failMsg}}));
        await persistFailure(item,failMsg);
        return;
      }
      setResults(p=>({...p,[item.id]:{id:item.id,status:"완료",message:msg||"보완 완료"}}));
      if(data.description)setItems(list=>list.map(v=>v.id===item.id?{...v,description:data.description}:v));
    }catch(e){const errorMessage=e instanceof Error?e.message:String(e);setResults(p=>({...p,[item.id]:{id:item.id,status:"실패",message:errorMessage}}));await persistFailure(item,errorMessage);}
  }

  async function runSelected(){if(running||savingSelected||!selected.size)return;setRunning(true);for(const item of items.filter(v=>selected.has(v.id))){await enrich(item);}setRunning(false);}
  async function runAll(){if(running||savingSelected)return;setRunning(true);for(const item of items){await enrich(item);}setRunning(false);}

  return <main className="min-h-screen bg-[#F8F9FB] px-4 py-8 text-[#0A2342]"><div className="mx-auto max-w-[1480px] rounded-[32px] bg-white p-6 shadow-sm md:p-8">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-3xl font-bold">건축물대장 자동 보완</h1><p className="mt-2 text-sm text-[#0A2342]/60">관리자 전용 상세주소를 기준으로 건축물대장을 조회해 비어 있는 건물 기본정보만 보완합니다.</p></div><div className="flex gap-2"><Link href="/admin" className="rounded-full border px-5 py-3">매물관리</Link><button onClick={()=>void runAll()} disabled={running||savingSelected} className="rounded-full bg-[#C9A227] px-5 py-3 font-semibold disabled:opacity-50">{running?"조회 중...":"전체 매물 보완"}</button></div></div>
    <div className="mt-6 md:sticky md:top-[82px] md:z-30 md:-mx-2 md:rounded-2xl md:bg-white md:px-2 md:py-2 md:shadow-[0_8px_24px_rgba(10,35,66,0.10)]"><div className="flex flex-wrap items-center gap-3 rounded-2xl border bg-[#F8F9FB] px-4 py-3"><label className="flex items-center gap-2 font-semibold"><input type="checkbox" checked={allSelected} onChange={toggleAll} className="h-5 w-5"/>전체 선택</label><span className="text-sm">선택 항목: <b className="rounded-full bg-[#0A2342] px-3 py-1 text-white">{selected.size}개</b></span><label className="min-w-[240px] flex-1 md:max-w-[360px]"><input value={searchKeyword} onChange={e=>setSearchKeyword(e.target.value)} placeholder="매물번호·매물명·주소 검색" className="w-full rounded-xl border border-[#0A2342]/15 bg-white px-4 py-2.5 text-sm outline-none focus:border-[#C9A227]"/></label><button onClick={()=>void saveSelectedAddresses()} disabled={running||savingSelected||!selected.size} className="rounded-xl border border-[#0A2342] bg-white px-5 py-2.5 font-semibold disabled:opacity-40">{savingSelected?"주소 저장 중...":"조회주소 저장"}</button><button onClick={()=>void runSelected()} disabled={running||savingSelected||!selected.size} className="rounded-xl bg-[#0A2342] px-5 py-2.5 font-semibold text-white disabled:opacity-40">선택 매물 보완</button><button onClick={()=>setSelected(new Set())} disabled={running||savingSelected||!selected.size} className="rounded-xl border bg-white px-5 py-2.5 font-semibold disabled:opacity-40">선택 초기화</button></div></div>
    <div className="mt-4 overflow-x-auto"><table className="w-full min-w-[1280px]"><thead className="bg-[#F8F9FB]"><tr><th className="w-12 px-3 py-4 text-left"><input type="checkbox" checked={allSelected} onChange={toggleAll} className="h-5 w-5"/></th>{["번호","매물명","유형","건축물대장 조회주소 (관리자 전용)","홈페이지 표시주소","처리상태","관리"].map(v=><th key={v} className="px-3 py-4 text-left">{v}</th>)}</tr></thead><tbody>{filteredItems.map(item=>{const result=results[item.id],type=item.type||"-",publicAddress=item.address||item.location||"주소 없음";return <tr key={item.id} className="border-t align-top text-sm"><td className="px-3 py-4"><input type="checkbox" checked={selected.has(item.id)} onChange={()=>toggleOne(item.id)} className="h-5 w-5"/></td><td className="px-3 py-4 font-semibold">{item.id}</td><td className="px-3 py-4 font-semibold"><Link href={`/admin/properties/${item.id}/edit`} target="_blank" rel="noopener noreferrer" className="underline decoration-dotted underline-offset-4 hover:text-[#C9A227]">{item.title}</Link></td><td className="px-3 py-4"><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold">{type}</span></td><td className="min-w-[330px] px-3 py-4"><input value={drafts[item.id]||""} onChange={e=>setDrafts(p=>({...p,[item.id]:e.target.value}))} onBlur={()=>void saveLookupAddress(item,drafts[item.id]||"")} placeholder={lookupGuide(type)} className="w-full rounded-xl border px-3 py-2.5 outline-none focus:border-[#C9A227]"/><p className="mt-1.5 text-xs text-[#0A2342]/55">{lookupGuide(type)} · 관리자만 확인</p></td><td className="min-w-[230px] px-3 py-4">{publicAddress}</td><td className="min-w-[210px] px-3 py-4"><span className={`font-bold ${result?.status==="실패"?"text-red-600":result?.status==="완료"?"text-blue-600":""}`}>{result?.status||"대기"}</span>{result?.message&&<p className="mt-1 max-w-[300px] break-words text-xs text-[#0A2342]/60">{result.message}</p>}</td><td className="px-3 py-4"><button onClick={()=>void enrich(item)} disabled={running||savingSelected||savingId===item.id} className="rounded-full border px-4 py-2 font-semibold disabled:opacity-40">{savingId===item.id?"저장 중...":"건축물대장 조회"}</button></td></tr>})}</tbody></table></div>
    {!filteredItems.length&&<div className="rounded-2xl border border-dashed border-[#0A2342]/20 bg-[#F8F9FB] p-10 text-center text-sm text-[#0A2342]/60">검색 조건에 맞는 매물이 없습니다.</div>}
  </div></main>;
}
