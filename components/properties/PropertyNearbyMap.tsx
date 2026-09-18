"use client";

import Script from "next/script";
import { useCallback, useEffect, useRef, useState } from "react";

type Props={address:string;naverUrl:string;kakaoUrl:string};
type Place={id:string;name:string;category:string;distance:number;lat:number;lng:number};
const CATEGORIES=[
  ["버스","SW8","🚌"],["편의점","CS2","🏪"],["카페","CE7","☕"],["은행","BK9","🏦"],
  ["주민센터","PO3","🏛️"],["학교","SC4","🏫"],["병원","HP8","🏥"],["약국","PM9","💊"],
  ["영화관","CT1","🎬"],["학원","AC5","📚"]
] as const;

export default function PropertyNearbyMap({address,naverUrl,kakaoUrl}:Props){
 const ref=useRef<HTMLDivElement>(null),mapRef=useRef<any>(null),markersRef=useRef<any[]>([]);
 const key=process.env.NEXT_PUBLIC_KAKAO_JAVASCRIPT_KEY;
 const [ready,setReady]=useState(false),[active,setActive]=useState("CS2"),[radius,setRadius]=useState(1000),[places,setPlaces]=useState<Place[]>([]),[center,setCenter]=useState<any>(null);

 const clear=()=>{markersRef.current.forEach(m=>m.setMap(null));markersRef.current=[]};
 const search=useCallback((code:string,r:number,pos?:any)=>{
   const k=window.kakao?.maps as any,m=mapRef.current,c=pos||center;if(!k||!m||!c)return;
   clear(); const service=new k.services.Places();
   service.categorySearch(code,(data:any[],status:string)=>{
     if(status!==k.services.Status.OK){setPlaces([]);return;}
     const valid=data.filter((p:any)=>p.category_group_code===code);\n     const next=valid.slice(0,20).map((p:any)=>({id:p.id,name:p.place_name,category:p.category_group_name,distance:Number(p.distance||0),lat:Number(p.y),lng:Number(p.x)}));
     setPlaces(next);
     next.forEach((p:Place)=>{const marker=new k.Marker({map:m,position:new k.LatLng(p.lat,p.lng)});markersRef.current.push(marker);});
   },{location:c,radius:r,sort:k.services.SortBy.DISTANCE});
 },[center]);

 const init=useCallback(()=>{
   const k=window.kakao?.maps as any;if(!k||!ref.current||mapRef.current)return;
   k.load(()=>{const g=new k.services.Geocoder();g.addressSearch(address,(r:any[],s:string)=>{if(s!==k.services.Status.OK||!r[0])return;const pos=new k.LatLng(+r[0].y,+r[0].x);const map=new k.Map(ref.current!,{center:pos,level:5});mapRef.current=map;new k.Marker({map,position:pos});setCenter(pos);setReady(true);search(active,radius,pos);});});
 },[address,active,radius,search]);
 useEffect(()=>{if(key&&window.kakao?.maps)init()},[key,init]);
 useEffect(()=>{if(ready)search(active,radius)},[active,radius,ready,search]);
 return <section className="mt-8 overflow-hidden rounded-2xl border border-[#0A2342]/10 bg-white shadow-sm">
  <div className="border-b px-5 py-4"><h2 className="text-xl font-bold">주변 생활시설</h2><p className="mt-1 text-sm text-[#0A2342]/55">매물 위치를 기준으로 가까운 시설을 확인하세요.</p></div>
  <div className="flex flex-wrap gap-2 border-b px-4 py-3">{CATEGORIES.map(([name,code,icon])=><button key={code} onClick={()=>setActive(code)} className={`rounded-full px-3 py-2 text-xs font-bold ${active===code?"bg-[#0A2342] text-white":"bg-[#F3F5F7]"}`}>{icon} {name}</button>)}</div>
  <div className="flex gap-2 border-b px-4 py-3">{[500,1000,2000].map(r=><button key={r} onClick={()=>setRadius(r)} className={`rounded-lg px-3 py-1.5 text-xs font-bold ${radius===r?"bg-[#C9A227] text-[#0A2342]":"bg-slate-100"}`}>{r===1000?"1km":r===2000?"2km":"500m"}</button>)}</div>
  {key&&<Script id="property-nearby-map-sdk" src={`https://dapi.kakao.com/v2/maps/sdk.js?appkey=${key}&autoload=false&libraries=services`} strategy="afterInteractive" onLoad={init} onReady={init}/>}
  <div className="grid lg:grid-cols-[2fr_1fr]"><div ref={ref} className="min-h-[420px] bg-slate-100"/><div className="max-h-[420px] overflow-y-auto p-4">{places.slice(0,9).map((p,i)=><div key={p.id} className="border-b py-3"><div className="flex items-start gap-3"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#0A2342] text-xs font-bold text-white">{i+1}</span><div><p className="font-bold">{p.name}</p><p className="mt-1 text-xs text-[#0A2342]/55">약 {p.distance>=1000?(p.distance/1000).toFixed(1)+"km":p.distance+"m"}</p></div></div></div>)}{ready&&places.length===0&&<p className="py-8 text-center text-sm text-[#0A2342]/55">선택한 거리 안에 검색된 시설이 없습니다.</p>}</div></div>
  <div className="flex flex-wrap gap-2 border-t px-4 py-4"><a href={naverUrl} target="_blank" rel="noreferrer" className="rounded-lg border px-4 py-2 text-sm font-bold">네이버지도에서 보기</a><a href={kakaoUrl} target="_blank" rel="noreferrer" className="rounded-lg bg-[#FEE500] px-4 py-2 text-sm font-bold">카카오맵에서 보기</a></div>
 </section>;
}
