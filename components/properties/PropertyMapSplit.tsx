"use client";
import Script from "next/script";
import Link from "next/link";
import {useCallback,useEffect,useRef,useState} from "react";
import type {Property} from "@/types/property";
import {deriveLocationFromAddress} from "@/lib/property-normalize";
import {formatPropertyPriceDisplay} from "@/lib/property-price";
type Props={items:Property[];onOpen:(id:number)=>void};
export default function PropertyMapSplit({items,onOpen}:Props){
 const ref=useRef<HTMLDivElement>(null),mapRef=useRef<any>(null),markers=useRef<any[]>([]),geocoded=useRef(new Map<number,{lat:number,lng:number}>());
 const key=process.env.NEXT_PUBLIC_KAKAO_JAVASCRIPT_KEY; const [ready,setReady]=useState(false),[selected,setSelected]=useState<number|null>(null);
 const draw=useCallback(()=>{const k=window.kakao?.maps as any,map=mapRef.current;if(!k||!map)return;markers.current.forEach(m=>m.setMap(null));markers.current=[];items.forEach(p=>{const c=geocoded.current.get(p.id);if(!c)return;const marker=new k.Marker({map,position:new k.LatLng(c.lat,c.lng)});k.event.addListener(marker,"click",()=>{setSelected(p.id);document.getElementById(`map-property-${p.id}`)?.scrollIntoView({behavior:"smooth",block:"nearest"});});markers.current.push(marker);});},[items]);
 const locate=useCallback(()=>{const k=window.kakao?.maps as any;if(!k||!mapRef.current)return;const g=new k.services.Geocoder();items.forEach(p=>{if(geocoded.current.has(p.id)){draw();return;}const address=String(p.address||p.location||"").trim();if(!address)return;g.addressSearch(address,(r:any[],s:string)=>{if(s===k.services.Status.OK&&r[0]){geocoded.current.set(p.id,{lat:+r[0].y,lng:+r[0].x});draw();}});});},[items,draw]);
 const init=useCallback(()=>{const k=window.kakao?.maps as any;if(!k||!ref.current||mapRef.current)return;k.load(()=>{const map=new k.Map(ref.current,{center:new k.LatLng(35.6939,128.4598),level:8});mapRef.current=map;setReady(true);locate();});},[locate]);
 useEffect(()=>{if(key&&window.kakao?.maps)init()},[key,init]);useEffect(()=>{if(ready)locate()},[items,ready,locate]);
 return <div className="mt-6 overflow-hidden rounded-2xl border border-[#0A2342]/10 bg-white shadow-sm">
 {key&&<Script id="property-search-map-sdk" src={`https://dapi.kakao.com/v2/maps/sdk.js?appkey=${key}&autoload=false&libraries=services`} strategy="afterInteractive" onLoad={init} onReady={init}/>}
 <div className="grid min-h-[680px] lg:grid-cols-[2fr_1fr]">
  <div className="relative min-h-[430px] lg:min-h-[680px]"><div ref={ref} className="absolute inset-0 bg-slate-100"/><div className="absolute left-4 top-4 z-10 rounded-full bg-white/95 px-4 py-2 text-xs font-bold shadow">지도에 {items.length}개 매물</div></div>
  <div className="max-h-[680px] overflow-y-auto border-l border-[#0A2342]/10 bg-[#F7F8FA]">
   <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white px-4 py-3"><strong>매물 {items.length}개</strong><span className="text-xs text-[#0A2342]/55">마커와 목록 연동</span></div>
   {items.map(p=>{const imgs=[...(p.property_images||[])].sort((a,b)=>Number(b.is_cover)-Number(a.is_cover)||a.display_order-b.display_order);const cover=imgs[0]?.image_url||p.image_url;return <article id={`map-property-${p.id}`} key={p.id} onMouseEnter={()=>setSelected(p.id)} className={`border-b bg-white p-3 transition ${selected===p.id?"ring-2 ring-inset ring-[#C9A227]":""}`}><Link href={`/properties/${p.id}`} onClick={()=>onOpen(p.id)} className="grid grid-cols-[118px_1fr] gap-3">{cover?<img src={cover} alt="" className="h-28 w-full rounded-xl object-cover"/>:<div className="h-28 rounded-xl bg-slate-100"/>}<div className="min-w-0"><div className="flex gap-1 text-[11px] font-bold text-[#0A2342]/60"><span>{p.type||"매물"}</span><span>·</span><span>{p.deal_type||"거래"}</span></div><p className="mt-1 line-clamp-2 font-bold leading-5">{p.title}</p><p className="mt-2 text-base font-extrabold text-[#C9A227]">{p.listing_status==="completed"?"계약완료":formatPropertyPriceDisplay(p.price)}</p><p className="mt-1 truncate text-xs text-[#0A2342]/55">{deriveLocationFromAddress(p.address)||p.location}</p><p className="mt-1 text-xs">면적 {p.area||"문의"} · 방 {p.rooms??"문의"}</p></div></Link></article>})}
  </div>
 </div></div>;
}
