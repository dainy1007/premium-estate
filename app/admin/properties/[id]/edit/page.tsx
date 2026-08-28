"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import { supabase } from "@/lib/supabase";
import { normalizePropertyForDisplay } from "@/lib/property-normalize";
import { MAX_PROPERTY_IMAGES, PROPERTY_IMAGES_BUCKET, syncCoverImage, uploadPropertyImages } from "@/lib/property-images";
import { formatKrwAmount, parsePropertyPriceAmount } from "@/lib/property-price";
import { ALL_OPTIONS, COMMON_OPTIONS, ELIGIBLE_RESIDENTIAL, MAINTENANCE_ITEMS, buildDescriptionWithAdminMeta, emptyAdminMeta, getDescriptionPresetsForType, inferOptions, parseAdminMeta, stripAdminMeta, type AdminMeta } from "@/lib/property-admin-meta";
import type { PropertyImage } from "@/types/property";

type ExistingItem={key:string;kind:"existing";image:PropertyImage};
type NewItem={key:string;kind:"new";file:File;previewUrl:string};
type ImageItem=ExistingItem|NewItem;
const PROPERTY_TYPES=["아파트","원룸","미니투룸","투룸","쓰리룸","단독주택","다가구","상가주택","상가","오피스텔","창고","공장","토지"];
const DEAL_TYPES=["매매","전세","월세","임대"];

function WatermarkPreview({src,alt}:{src:string;alt:string}){
 return <div className="relative h-full w-full overflow-hidden">
  <img src={src} alt={alt} className="h-full w-full object-cover"/>
  <img src="/watermarks/baekjo_center.png" alt="" aria-hidden="true" className="pointer-events-none absolute left-1/2 w-[52%] -translate-x-1/2 -translate-y-1/2 opacity-[0.38]" style={{top:"60%"}}/>
  <img src="/watermarks/baekjo_corner.png" alt="" aria-hidden="true" className="pointer-events-none absolute bottom-[3px] right-[3px] w-[27%]"/>
 </div>;
}

export default function PropertyEditPage(){
 const router=useRouter();const params=useParams<{id:string}>();const id=Number(params.id);
 const[loading,setLoading]=useState(true);const[submitting,setSubmitting]=useState(false);const[imageItems,setImageItems]=useState<ImageItem[]>([]);const[deletedImages,setDeletedImages]=useState<PropertyImage[]>([]);
 const[meta,setMeta]=useState<AdminMeta>(emptyAdminMeta());
 const[form,setForm]=useState({title:"",price:"",type:"",deal_type:"",address:"",location:"",area:"",rooms:0,bathrooms:0,floor:"",description:""});
 const isResidential=ELIGIBLE_RESIDENTIAL.test(form.type);
 const isCommercial=form.type==="상가";
 const isWarehouseFactory=/창고|공장/.test(form.type);
 const isLand=/토지/.test(form.type);
 const hideElevator=isWarehouseFactory||isLand;

 useEffect(()=>{async function getProperty(){
  const{data,error}=await supabase.from("properties").select("*").eq("id",id).single();
  if(error){console.error("매물 불러오기 오류:",error);setLoading(false);return;}
  const normalized=normalizePropertyForDisplay(data);const rawDescription=normalized.description||"";const parsed=parseAdminMeta(rawDescription);
  if(!ELIGIBLE_RESIDENTIAL.test(normalized.type||"")){parsed.options=[];}else if(!parsed.options.length){parsed.options=inferOptions(rawDescription,normalized.type||"");}
  if(!parsed.descriptionPresets.length)parsed.descriptionPresets=getDescriptionPresetsForType(normalized.type||"").filter(item=>rawDescription.includes(item));
  setMeta(parsed);
  setForm({title:normalized.title||"",price:normalized.price||"",type:normalized.type||"",deal_type:normalized.deal_type||"",address:normalized.address||"",location:normalized.location||normalized.address||"",area:normalized.area||"",rooms:Number(normalized.rooms||0),bathrooms:Number(normalized.bathrooms||0),floor:normalized.floor||"",description:stripAdminMeta(rawDescription)});
  const{data:imageData,error:imageError}=await supabase.from("property_images").select("*").eq("property_id",id).order("display_order",{ascending:true});
  if(imageError)console.error("매물 사진 불러오기 오류:",imageError);
  const sorted=((imageData||[]) as PropertyImage[]).sort((a,b)=>a.display_order-b.display_order);
  setImageItems(sorted.map((image:PropertyImage)=>({key:`existing-${image.id}`,kind:"existing" as const,image})));
  setLoading(false);
 }if(!Number.isNaN(id))getProperty();},[id]);
 useEffect(()=>()=>{imageItems.forEach(item=>{if(item.kind==="new")URL.revokeObjectURL(item.previewUrl);});},[imageItems]);
 const changeSummary=useMemo(()=>({newCount:imageItems.filter(item=>item.kind==="new").length,deletedCount:deletedImages.length}),[imageItems,deletedImages]);
 const descriptionPresets=useMemo(()=>getDescriptionPresetsForType(form.type),[form.type]);
 const setPropertyType=(type:string)=>{
  const residential=ELIGIBLE_RESIDENTIAL.test(type);const hideElevatorForType=/창고|공장|토지/.test(type);
  setForm(prev=>({...prev,type,...(!residential?{rooms:0}:{})}));
  setMeta(prev=>({...prev,options:residential?[...new Set([...COMMON_OPTIONS,...prev.options])]:[],...(!residential?{maintenanceFee:"",maintenanceItems:[],waterFeeSeparate:false,infoOverrides:{...prev.infoOverrides,...(/상가|창고|공장/.test(type)?{moveIn:"",heating:""}:{}),...(hideElevatorForType?{elevator:""}:{})}}:{})}));
 };
 const toggleOption=(option:string)=>setMeta(prev=>({...prev,options:prev.options.includes(option)?prev.options.filter(item=>item!==option):[...prev.options,option]}));
 const toggleMaintenance=(item:string)=>setMeta(prev=>({...prev,maintenanceItems:prev.maintenanceItems.includes(item)?prev.maintenanceItems.filter(v=>v!==item):[...prev.maintenanceItems,item]}));
 const setOverride=(key:keyof AdminMeta["infoOverrides"],value:string)=>setMeta(prev=>({...prev,infoOverrides:{...prev.infoOverrides,[key]:value}}));
 const toggleDescriptionPreset=(preset:string)=>{const selected=meta.descriptionPresets.includes(preset);setMeta(prev=>({...prev,descriptionPresets:selected?prev.descriptionPresets.filter(item=>item!==preset):[...prev.descriptionPresets,preset]}));setForm(prev=>{const header="📍 매물 특징";const bullet=`🔖 ${preset}`;let lines=prev.description.replace(/\r\n/g,"\n").split("\n");if(selected){lines=lines.filter(line=>line.trim()!==bullet);}else{if(!lines.some(line=>line.trim()===header)){const hasText=lines.some(line=>line.trim());if(hasText)lines.push("");lines.push(header);}if(!lines.some(line=>line.trim()===bullet))lines.push(bullet);}return{...prev,description:lines.join("\n").replace(/\n{3,}/g,"\n\n").trim()};});};
 const handleImageChange=(event:ChangeEvent<HTMLInputElement>)=>{const selectedFiles=Array.from(event.target.files||[]);const availableSlots=MAX_PROPERTY_IMAGES-imageItems.length;const filesToAdd=selectedFiles.slice(0,availableSlots);if(selectedFiles.length>availableSlots)alert(`이미지는 최대 ${MAX_PROPERTY_IMAGES}장까지 등록할 수 있습니다.`);setImageItems(current=>[...current,...filesToAdd.map(file=>({key:`new-${crypto.randomUUID()}`,kind:"new" as const,file,previewUrl:URL.createObjectURL(file)}))]);event.target.value="";};
 const moveItem=(key:string,direction:"up"|"down")=>setImageItems(current=>{const index=current.findIndex(item=>item.key===key),target=direction==="up"?index-1:index+1;if(index<0||target<0||target>=current.length)return current;const next=[...current];[next[index],next[target]]=[next[target],next[index]];return next;});
 const setAsCover=(key:string)=>setImageItems(current=>{const target=current.find(item=>item.key===key);return target?[target,...current.filter(item=>item.key!==key)]:current;});
 const removeItem=(item:ImageItem)=>{if(!window.confirm("이 이미지를 목록에서 제거하시겠습니까? 저장하기 전에는 DB에서 삭제되지 않습니다."))return;if(item.kind==="new")URL.revokeObjectURL(item.previewUrl);if(item.kind==="existing")setDeletedImages(current=>[...current,item.image]);setImageItems(current=>current.filter(candidate=>candidate.key!==item.key));};
 const restoreLastDeleted=()=>setDeletedImages(current=>{const target=current.at(-1);if(!target)return current;setImageItems(items=>[...items,{key:`existing-${target.id}`,kind:"existing",image:target}]);return current.slice(0,-1);});

 const handleSubmit=async(event:FormEvent)=>{event.preventDefault();if(submitting)return;setSubmitting(true);try{const priceAmount=parsePropertyPriceAmount(form.price);const metaToSave=isResidential?meta:{...meta,options:[],maintenanceFee:"",maintenanceItems:[],waterFeeSeparate:false,infoOverrides:{...meta.infoOverrides,...(/상가|창고|공장/.test(form.type)?{moveIn:"",heating:""}:{}),...(hideElevator?{elevator:""}:{})}};const description=buildDescriptionWithAdminMeta(form.description,metaToSave);const{error:propertyError}=await supabase.from("properties").update({title:form.title,price:form.price,price_amount:priceAmount,type:form.type,deal_type:form.deal_type,address:form.address,location:form.location||form.address,area:form.area,rooms:isResidential?form.rooms:0,bathrooms:form.bathrooms,floor:form.floor,description}).eq("id",id);if(propertyError)throw propertyError;const newItems=imageItems.filter((item):item is NewItem=>item.kind==="new");const uploaded=await uploadPropertyImages(id,newItems.map(item=>item.file),imageItems.length+100,form.title);const uploadedByKey=new Map(newItems.map((item,index)=>[item.key,uploaded[index]]));const finalImages=imageItems.map(item=>item.kind==="existing"?item.image:uploadedByKey.get(item.key)).filter((image):image is PropertyImage=>Boolean(image));for(const[index,image]of finalImages.entries()){const{error}=await supabase.from("property_images").update({display_order:index,is_cover:index===0}).eq("id",image.id);if(error)throw error;}if(deletedImages.length>0){const{error}=await supabase.from("property_images").delete().in("id",deletedImages.map(image=>image.id));if(error)throw error;const storagePaths=deletedImages.map(image=>image.storage_path).filter((path):path is string=>Boolean(path));if(storagePaths.length>0){const{error:storageError}=await supabase.storage.from(PROPERTY_IMAGES_BUCKET).remove(storagePaths);if(storageError)console.warn("스토리지 이미지 삭제 경고:",storageError);}}await syncCoverImage(id);alert("매물이 수정되었습니다.");router.push("/admin");router.refresh();}catch(error){console.error("매물 수정 오류:",error);alert("매물 수정에 실패했습니다. 변경 내용을 확인한 뒤 다시 시도해 주세요.");setSubmitting(false);}};

 if(loading)return <main className="flex min-h-screen items-center justify-center"><p>매물 정보를 불러오는 중입니다...</p></main>;
 const inputClass="w-full rounded-xl border border-[#0A2342]/15 bg-white px-4 py-3 outline-none focus:border-[#C9A227]";
 const infoOverrideFields=([['elevator','엘리베이터'],['parking','주차'],['moveIn','입주가능일'],['heating','난방'],['direction','방향'],['buildingUse','건축물 용도'],['approvalDate','사용승인일']] as const).filter(([key])=>!(hideElevator&&key==="elevator")&&!((isCommercial||isWarehouseFactory)&&(key==="moveIn"||key==="heating")));
 return <main className="min-h-screen bg-[#F8F9FB] px-4 py-8 text-[#0A2342]"><div className="mx-auto max-w-7xl rounded-[32px] bg-white p-6 shadow-sm md:p-8"><div className="mb-8 flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-3xl font-bold">매물 수정</h1><p className="mt-2 text-sm text-[#0A2342]/60">홈페이지 매물정보 박스의 흰색 영역을 직접 수정할 수 있습니다.</p></div><Link href="/admin" className="rounded-full border px-5 py-3">목록으로</Link></div><form onSubmit={handleSubmit} className="grid gap-8 lg:grid-cols-[1.15fr_.85fr]"><div className="space-y-6">
 <section className="rounded-[24px] border border-[#0A2342]/10 bg-[#F8F9FB] p-5"><h2 className="text-xl font-bold">매물정보 박스 입력</h2><p className="mt-1 text-sm text-[#0A2342]/55">매물번호는 자동이며, 아래 값은 홈페이지 흰색 칸에 그대로 반영됩니다.</p><div className="mt-5 grid gap-4 sm:grid-cols-2">
 <div><label className="mb-2 block font-semibold">매물유형</label><select value={form.type} onChange={e=>setPropertyType(e.target.value)} className={inputClass}><option value="">선택</option>{PROPERTY_TYPES.map(item=><option key={item} value={item}>{item}</option>)}</select></div>
 <div><label className="mb-2 block font-semibold">거래유형</label><select value={form.deal_type} onChange={e=>setForm(p=>({...p,deal_type:e.target.value}))} className={inputClass}><option value="">선택</option>{DEAL_TYPES.map(item=><option key={item} value={item}>{item}</option>)}</select></div>
 <div><label className="mb-2 block font-semibold">금액</label><input value={form.price} onChange={e=>setForm(p=>({...p,price:e.target.value}))} className={inputClass}/><p className="mt-1 text-xs text-[#0A2342]/50">검색용 가격: {formatKrwAmount(parsePropertyPriceAmount(form.price))}</p></div>
 <div><label className="mb-2 block font-semibold">주소</label><input value={form.address} onChange={e=>setForm(p=>({...p,address:e.target.value}))} className={inputClass}/></div>
 <div><label className="mb-2 block font-semibold">지역</label><input value={form.location} onChange={e=>setForm(p=>({...p,location:e.target.value}))} className={inputClass}/></div>
 <div><label className="mb-2 block font-semibold">면적</label><input value={form.area} onChange={e=>setForm(p=>({...p,area:e.target.value}))} className={inputClass}/></div>
 {isResidential&&<div><label className="mb-2 block font-semibold">방</label><input type="number" value={form.rooms} onChange={e=>setForm(p=>({...p,rooms:Number(e.target.value)}))} className={inputClass}/></div>}
 <div><label className="mb-2 block font-semibold">화장실</label><input type="number" value={form.bathrooms} onChange={e=>setForm(p=>({...p,bathrooms:Number(e.target.value)}))} className={inputClass}/></div>
 <div><label className="mb-2 block font-semibold">층수</label><input value={form.floor} onChange={e=>setForm(p=>({...p,floor:e.target.value}))} className={inputClass} placeholder="예: 2/4층"/></div>
 {infoOverrideFields.map(([key,label])=><div key={key}><label className="mb-2 block font-semibold">{label}</label><input value={meta.infoOverrides[key]} onChange={e=>setOverride(key,e.target.value)} className={inputClass} placeholder="확인된 정보만 입력"/></div>)}
 </div></section>

 {isResidential&&<section className="rounded-[24px] border border-[#0A2342]/10 p-5"><h2 className="text-lg font-bold">관리비</h2><div className="mt-4"><label className="mb-2 block font-semibold">관리비 금액</label><input value={meta.maintenanceFee} onChange={e=>setMeta(p=>({...p,maintenanceFee:e.target.value}))} className={inputClass} placeholder="예: 10만원"/></div><p className="mt-4 text-sm font-semibold">관리비 포함 항목</p><div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">{MAINTENANCE_ITEMS.map(item=><label key={item} className="flex items-center gap-2 rounded-xl border p-3 text-sm"><input type="checkbox" checked={meta.maintenanceItems.includes(item)} onChange={()=>toggleMaintenance(item)}/>{item}</label>)}</div></section>}

 {isResidential&&<section className="rounded-[24px] border border-[#0A2342]/10 p-5"><h2 className="text-lg font-bold">옵션</h2><div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">{ALL_OPTIONS.map(option=><label key={option} className="flex items-center gap-2 rounded-xl border p-3 text-sm"><input type="checkbox" checked={meta.options.includes(option)} onChange={()=>toggleOption(option)}/>{option}</label>)}</div></section>}

 <section className="rounded-[24px] border border-[#0A2342]/10 p-5"><h2 className="text-lg font-bold">매물 특징</h2><div className="mt-3 grid gap-2">{descriptionPresets.map(preset=><label key={preset} className="flex items-center gap-2 rounded-xl border p-3 text-sm"><input type="checkbox" checked={meta.descriptionPresets.includes(preset)} onChange={()=>toggleDescriptionPreset(preset)}/>{preset}</label>)}</div><textarea value={form.description} onChange={e=>setForm(p=>({...p,description:e.target.value}))} rows={10} className={`${inputClass} mt-4`} placeholder="매물 설명을 입력하세요."/></section>
 </div>

 <aside className="space-y-5"><section className="rounded-[24px] bg-[#0A2342] p-5 text-white"><div className="flex items-center justify-between gap-3"><div><h2 className="text-xl font-bold">사진 관리</h2><p className="mt-1 text-sm text-white/65">새 사진은 선택 즉시 워터마크 위치를 미리 확인할 수 있습니다.</p></div><span className="rounded-full bg-white/10 px-3 py-1 text-xs">{imageItems.length}/{MAX_PROPERTY_IMAGES}</span></div><label className="mt-4 flex cursor-pointer items-center justify-center rounded-2xl border border-dashed border-white/25 bg-white/10 p-5 text-sm font-semibold text-[#C9A227]">사진 추가<input type="file" accept="image/*" multiple className="hidden" onChange={handleImageChange}/></label><div className="mt-4 grid grid-cols-2 gap-3">{imageItems.map((item,index)=>{const src=item.kind==="existing"?item.image.image_url:item.previewUrl;return <div key={item.key} className="overflow-hidden rounded-2xl bg-white/10"><div className="relative h-32">{item.kind==="new"?<WatermarkPreview src={src} alt={`사진 ${index+1}`}/>:<img src={src} alt={`사진 ${index+1}`} className="h-full w-full object-cover"/>}{index===0&&<span className="absolute left-2 top-2 z-10 rounded-full bg-[#C9A227] px-2 py-1 text-[11px] font-bold text-[#0A2342]">대표</span>}</div><div className="grid grid-cols-4 gap-1 p-2 text-[11px]"><button type="button" onClick={()=>moveItem(item.key,"up")} className="rounded bg-white/10 py-1">↑</button><button type="button" onClick={()=>moveItem(item.key,"down")} className="rounded bg-white/10 py-1">↓</button><button type="button" onClick={()=>setAsCover(item.key)} className="rounded bg-white/10 py-1">대표</button><button type="button" onClick={()=>removeItem(item)} className="rounded bg-red-500/30 py-1">삭제</button></div></div>;})}</div>{deletedImages.length>0&&<button type="button" onClick={restoreLastDeleted} className="mt-3 text-sm underline">마지막 삭제 취소 ({changeSummary.deletedCount})</button>}</section><button type="submit" disabled={submitting} className="w-full rounded-full bg-[#C9A227] px-6 py-4 font-bold text-[#0A2342] disabled:opacity-60">{submitting?"저장 중...":"수정 저장"}</button></aside>
 </form></div></main>;
}
