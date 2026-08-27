"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Item={id:number;title:string;address?:string|null;location?:string|null};
type RowResult={id:number;status:"대기"|"완료"|"건너뜀"|"오류";message?:string};

export default function BuildingLedgerAdminPage(){
 const[items,setItems]=useState<Item[]>([]);const[results,setResults]=useState<Record<number,RowResult>>({});const[running,setRunning]=useState(false);
 useEffect(()=>{void load();},[]);
 async function load(){const{data}=await supabase.from("properties").select("id,title,address,location").order("id",{ascending:false});setItems((data||[]) as Item[]);}
 async function enrich(item:Item){const address=(item.address||item.location||"").trim();if(!address){setResults(p=>({...p,[item.id]:{id:item.id,status:"건너뜀",message:"주소 없음"}}));return;}
  setResults(p=>({...p,[item.id]:{id:item.id,status:"대기",message:"조회 중"}}));
  try{const r=await fetch("/api/admin/building-ledger",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({property_id:item.id,address})});const data=await r.json();if(!data.ok)throw new Error(data.error||"조회 실패");const l=data.ledger||{};const msg=[l.buildingUse,l.approvalDate,l.totalFloor?`지상 ${l.totalFloor}층`:"",l.parkingCount?`주차 ${l.parkingCount}대`:""].filter(Boolean).join(" · ");setResults(p=>({...p,[item.id]:{id:item.id,status:"완료",message:msg||"보완 완료"}}));}
  catch(e){setResults(p=>({...p,[item.id]:{id:item.id,status:"오류",message:e instanceof Error?e.message:String(e)}}));}}
 async function runAll(){if(running)return;setRunning(true);for(const item of items){await enrich(item);}setRunning(false);}
 return <main className="min-h-screen bg-[#F8F9FB] px-4 py-8 text-[#0A2342]"><div className="mx-auto max-w-7xl rounded-[32px] bg-white p-6 shadow-sm md:p-8"><div className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-3xl font-bold">건축물대장 자동 보완</h1><p className="mt-2 text-sm text-[#0A2342]/60">등록된 기존 매물의 주소를 기준으로 건축물대장을 조회해 비어 있는 건물 기본정보만 보완합니다.</p></div><div className="flex gap-2"><Link href="/admin" className="rounded-full border px-5 py-3">매물관리</Link><button onClick={()=>void runAll()} disabled={running} className="rounded-full bg-[#C9A227] px-5 py-3 font-semibold disabled:opacity-50">{running?"전체 조회 중...":"전체 매물 보완"}</button></div></div><div className="mt-6 overflow-x-auto"><table className="w-full min-w-[900px]"><thead className="bg-[#F8F9FB]"><tr>{["번호","매물명","주소","처리상태","관리"].map(v=><th key={v} className="px-4 py-4 text-left">{v}</th>)}</tr></thead><tbody>{items.map(item=>{const result=results[item.id];return <tr key={item.id} className="border-t"><td className="px-4 py-4">{item.id}</td><td className="px-4 py-4 font-semibold">{item.title}</td><td className="px-4 py-4">{item.address||item.location||"주소 없음"}</td><td className="px-4 py-4"><span className="font-semibold">{result?.status||"대기"}</span>{result?.message&&<p className="mt-1 text-xs text-[#0A2342]/60">{result.message}</p>}</td><td className="px-4 py-4"><button onClick={()=>void enrich(item)} disabled={running} className="rounded-full border px-4 py-2">건축물대장 조회</button></td></tr>})}</tbody></table></div><div className="mt-6 rounded-2xl bg-[#FFF9E8] p-4 text-sm leading-6">관리자가 이미 입력한 값은 덮어쓰지 않습니다. 건축물대장에는 방 수·방향·입주가능일·관리비·내부 옵션 등이 없으므로 해당 정보는 기존 매물자료 또는 관리자 확인값을 유지합니다.</div></div></main>;
}
