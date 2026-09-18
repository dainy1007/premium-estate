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
declare global{interface Window{kakao?:any}}

export default function PropertyNearbyMap({address,naverUrl,kakaoUrl}:Props){
 const ref=useRef<HTMLDivElement>(null),mapRef=useRef<any>(null),markersRef=useRef<any[]>([]);
 const key=process.env.NEXT_PUBLIC_KAKAO_JAVASCRIPT_KEY;
 const [ready,setReady]=useState(false),[active,setActive]=useState("CS2"),[radius,setRadius]=useState(1000),[places,setPlaces]=useState<Place[]>([]),[center,setCenter]=useState<any>(null);

 const clear=()=>{markersRef.current.forEach(m=>m.setMap(null));markersRef.current=[]};
 const search=useCallback((code:string,r:number,pos?:any)=>{
   const k=window.kakao?.maps,m=mapRef.current,c=pos||center;if(!k||!m||!c)return;
   clear(); const service=new k.services.Places();
   service.categorySearch(code,(data:any[],status:string)=>{
     if(status!==k.services.Status.OK){setPlaces([]);return;}
     const next=data.slice(0,20).map((p:any)=>({id:p.id,name:p.place_name,category:p.category_group_name,distance:Number(p.distance||0),lat:Number(p.y),lng:Number(p.x)}));
     setPlaces(next);
     next.forEach((p:Place)=>{const marker=new k.Marker({map:m,position:new k.LatLng(p.lat,p.lng)});markersRef.current.push(marker);});
   },{location:c,radius:r,sort:k.services.SortBy.DISTANCE});
 },[center]);

 const init=useCallback(()=>{
   const k=window.kakao?.maps;if(!k||!ref.current||mapRef.current)return;
   k.load(()=>{const geocoder=new k.services.Geocoder();geocoder.addressSearch(address,(res:any[],status:string)=>{
     if(status!==k.services.Status.OK||!res[0])return;
     const pos=new k.LatLng(Number(res[0].y),Number(res[0].x));
     const map=new k.Map(ref.current,{center:pos,level:5});mapRef.current=map;setCenter(pos);
     new k.Marker({map,position:pos});setReady(true);search("CS2",1000,pos);
   });});
 },[address,search]);
 useEffect(()=>{if(key&&window.kakao?.maps)init()},[key,init]);
 useEffect(()=>{if(ready)search(active,radius)},[active,radius,ready,search]);

 return <section className="mt-10 overflow-hidden rounded-[28px] border border-[#0A2342]/10 bg-white shadow-sm">
   {key&&<Script id="property-nearby-kakao-sdk" src={`https://dapi.kakao.com/v2/maps/sdk.js?appkey=${key}&autoload=false&libraries=services`} strategy="afterInteractive" onLoad={init} onReady={init}/>}
   <div className="border-b border-[#0A2342]/10 bg-gradient-to-r from-[#F3F8FC] to-[#E5F4FF] px-5 py-4"><h2 className="text-xl font-bold">▣ 위치 및 주변 편의시설</h2><p className="mt-1 text-xs text-[#0A2342]/60">매물 주변의 생활편의시설을 거리별로 확인할 수 있습니다.</p></div>
   {key?<div ref={ref} className="h-[360px] w-full bg-slate-100 md:h-[430px]"/>:<div className="flex h-52 items-center justify-center bg-slate-100 text-sm">지도 설정을 확인해 주세요.</div>}
   <div className="p-4 sm:p-5">
    <div className="flex gap-2 overflow-x-auto pb-2">{CATEGORIES.map(([label,code,icon])=><button key={code} onClick={()=>setActive(code)} className={`min-w-[76px] rounded-xl border px-3 py-3 text-center text-xs font-bold ${active===code?"border-[#C9A227] bg-[#FFF9E8]":"border-[#0A2342]/10 bg-white"}`}><span className="block text-xl">{icon}</span><span className="mt-1 block">{label}</span></button>)}</div>
    <div className="mt-3 flex flex-wrap items-center gap-2"><span className="mr-1 text-xs font-semibold text-[#0A2342]/60">검색 거리</span>{[500,1000,2000].map(v=><button key={v} onClick={()=>setRadius(v)} className={`rounded-full px-3 py-1.5 text-xs font-bold ${radius===v?"bg-[#0A2342] text-white":"bg-[#F3F5F7]"}`}>{v<1000?`${v}m`:`${v/1000}km`}</button>)}</div>
    <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{places.slice(0,9).map(p=><div key={p.id} className="flex items-center justify-between rounded-xl bg-[#F8F9FB] px-3 py-2.5 text-sm"><span className="truncate font-semibold">{p.name}</span><span className="ml-3 shrink-0 text-xs text-[#C9A227]">{p.distance>=1000?`${(p.distance/1000).toFixed(1)}km`:`${p.distance}m`}</span></div>)}</div>
    <div className="mt-4 flex flex-wrap gap-3"><a href={naverUrl} target="_blank" rel="noreferrer" className="rounded-full border border-[#0A2342]/15 px-4 py-2 text-sm font-semibold">네이버지도에서 보기</a><a href={kakaoUrl} target="_blank" rel="noreferrer" className="rounded-full border border-[#0A2342]/15 px-4 py-2 text-sm font-semibold">카카오맵에서 보기</a></div>
   </div>
  </section>;
}