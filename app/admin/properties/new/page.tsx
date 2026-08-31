"use client";

import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { MAX_PROPERTY_IMAGES, uploadPropertyImages, syncCoverImage } from "@/lib/property-images";
import { formatKrwAmount, parsePropertyPriceAmount } from "@/lib/property-price";

const PROPERTY_TYPES = ["아파트", "원룸", "미니투룸", "투룸", "쓰리룸", "단독주택", "다가구", "상가주택", "상가", "오피스텔", "창고", "공장", "토지"];
const transactionTypes = ["매매", "전세", "월세", "임대"];
const COMMON_OPTIONS = ["CCTV", "도어락", "신발장", "인터폰", "싱크대", "가스레인지"];
const VARIABLE_OPTIONS = ["에어컨", "세탁기", "냉장고", "TV", "장롱", "붙박이장", "옷장", "수납장", "인터넷", "와이파이", "천장형 건조대", "건조대", "인덕션"];
const ALL_OPTIONS = [...COMMON_OPTIONS, ...VARIABLE_OPTIONS];
const ELIGIBLE_RESIDENTIAL = /원룸|미니투룸|투룸|쓰리룸|다가구|다세대|연립|빌라|상가주택/;

type BuildingRow = {
  buildingName: string;
  town: string;
  village: string;
  lot: string;
  address: string;
  approvalDate: string;
  zone: string;
};

function withStoredOptions(description: string, options: string[]) {
  const clean = description.replace(/\n?<!--PROPERTY_OPTIONS:[\s\S]*?-->/g, "").trimEnd();
  if (!options.length) return clean;
  return `${clean}${clean ? "\n" : ""}<!--PROPERTY_OPTIONS:${options.join("|")}-->`;
}

function WatermarkPreview({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="relative h-32 w-full overflow-hidden">
      <img src={src} alt={alt} className="h-full w-full object-cover" />
      <img
        src="/watermarks/baekjo_center.png"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 w-[52%] -translate-x-1/2 -translate-y-1/2 opacity-[0.38]"
        style={{ top: "60%" }}
      />
      <img
        src="/watermarks/baekjo_corner.png"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute bottom-[3px] right-[3px] w-[27%]"
      />
    </div>
  );
}

export default function NewPropertyPage() {
  const [imageFiles, setImageFiles] = useState<{ id: string; file: File; previewUrl: string }[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [buildingRows, setBuildingRows] = useState<BuildingRow[]>([]);
  const [buildingKeyword, setBuildingKeyword] = useState("");
  const [buildingLoading, setBuildingLoading] = useState(true);
  const [buildingMessage, setBuildingMessage] = useState("");
  const [form, setForm] = useState({
    title: "",
    type: "",
    deal_type: "",
    location: "",
    address: "",
    price: "",
    area: "",
    contract_area: "",
    exclusive_area: "",
    rooms: 0,
    bathrooms: 0,
    floor: "",
    description: "",
    image_url: "",
  });

  useEffect(() => {
    let cancelled = false;
    async function loadBuildingDirectory() {
      setBuildingLoading(true);
      try {
        const response = await fetch("/api/admin/building-directory", { cache: "no-store" });
        const data = await response.json();
        if (!response.ok || !data?.ok) throw new Error(data?.error || "건물 장부 불러오기 실패");
        if (!cancelled) setBuildingRows(Array.isArray(data.rows) ? data.rows : []);
      } catch (error) {
        console.error("건물 기본정보 불러오기 오류:", error);
        if (!cancelled) setBuildingMessage("저장된 건물 장부를 불러오지 못했습니다.");
      } finally {
        if (!cancelled) setBuildingLoading(false);
      }
    }
    void loadBuildingDirectory();
    return () => { cancelled = true; };
  }, []);

  const buildingMatches = useMemo(() => {
    const q = buildingKeyword.trim().toLowerCase();
    if (!q) return [];
    return buildingRows.filter((row) => [row.buildingName, row.town, row.village, row.lot, row.address, row.approvalDate, row.zone]
      .filter(Boolean).join(" ").toLowerCase().includes(q)).slice(0, 8);
  }, [buildingRows, buildingKeyword]);

  const applyBuildingRow = (row: BuildingRow) => {
    setForm((current) => ({
      ...current,
      title: current.title.trim() ? current.title : row.buildingName,
      address: row.address,
      location: row.address,
    }));
    setBuildingKeyword(row.buildingName || row.address);
    setBuildingMessage(`${row.buildingName || "건물"} 기본정보를 불러왔습니다.${row.approvalDate ? ` 엑셀 준공일 ${row.approvalDate}는 참고용입니다.` : ""}${row.zone ? ` · ${row.zone}` : ""} 실제 준공정보는 매물 등록 후 건축물대장 조회값을 우선 적용합니다.`);
  };

  const setPropertyType = (type: string) => {
    setForm((current) => ({ ...current, type }));
    setSelectedOptions((current) => {
      if (!ELIGIBLE_RESIDENTIAL.test(type)) return current.filter((item) => !COMMON_OPTIONS.includes(item));
      return [...new Set([...COMMON_OPTIONS, ...current])];
    });
  };

  const toggleOption = (option: string) => {
    setSelectedOptions((current) => current.includes(option) ? current.filter((item) => item !== option) : [...current, option]);
  };

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    if (selectedFiles.length === 0) return;
    setImageFiles((current) => {
      const availableSlots = MAX_PROPERTY_IMAGES - current.length;
      const filesToAdd = selectedFiles.slice(0, availableSlots);
      if (selectedFiles.length > availableSlots) alert(`이미지는 최대 ${MAX_PROPERTY_IMAGES}장까지 등록할 수 있습니다.`);
      return [...current, ...filesToAdd.map((file) => ({ id: `${file.name}-${file.lastModified}-${crypto.randomUUID()}`, file, previewUrl: URL.createObjectURL(file) }))];
    });
    event.target.value = "";
  };

  const handleRemoveImage = (imageId: string) => {
    setImageFiles((current) => {
      const imageToRemove = current.find((image) => image.id === imageId);
      if (imageToRemove) URL.revokeObjectURL(imageToRemove.previewUrl);
      return current.filter((image) => image.id !== imageId);
    });
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    const priceAmount = parsePropertyPriceAmount(form.price);
    const unifiedAddress = form.address.trim();
    const { data: property, error } = await supabase.from("properties").insert([{
      title: form.title, type: form.type, deal_type: form.deal_type, location: unifiedAddress, address: unifiedAddress,
      price: form.price, price_amount: priceAmount, area: form.area, contract_area: form.contract_area,
      exclusive_area: form.exclusive_area, rooms: form.rooms, bathrooms: form.bathrooms, floor: form.floor,
      description: withStoredOptions(form.description, selectedOptions), image_url: "",
    }]).select("id").single();
    if (error || !property) { console.error("매물 등록 오류:", error); alert("매물 등록에 실패했습니다."); setSubmitting(false); return; }

    let ledgerWarning = "";
    if (unifiedAddress) {
      try {
        const ledgerResponse = await fetch("/api/admin/building-ledger", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ property_id: property.id, address: unifiedAddress }),
        });
        const ledgerData = await ledgerResponse.json();
        if (!ledgerResponse.ok || !ledgerData?.ok) throw new Error(ledgerData?.error || "건축물대장 조회 실패");
      } catch (ledgerError) {
        console.warn("건축물대장 자동 조회 경고:", ledgerError);
        ledgerWarning = "\n건축물대장 자동 조회는 완료되지 않았습니다. 관리자 건축물대장에서 다시 조회할 수 있습니다.";
      }
    }

    try {
      await uploadPropertyImages(property.id, imageFiles.map((image) => image.file), 0, form.title);
      await syncCoverImage(property.id);
    } catch (imageError) {
      console.error("이미지 등록 오류:", imageError); alert(`매물은 등록되었지만 이미지 저장에 실패했습니다.${ledgerWarning}`); setSubmitting(false); return;
    }
    alert(`매물이 등록되었습니다. 준공정보는 건축물대장 조회값을 우선 적용합니다.${ledgerWarning}`);
    window.location.href = "/admin";
  };

  return (
    <main className="min-h-screen bg-[#F8F9FB] px-4 py-8 text-[#0A2342] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl rounded-[32px] border border-[#0A2342]/10 bg-white p-6 shadow-sm sm:p-8">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div><p className="text-sm font-semibold uppercase tracking-[0.35em] text-[#C9A227]">Admin Panel</p><h1 className="mt-2 text-3xl font-bold">매물 등록</h1></div>
          <Link href="/admin" className="inline-flex items-center justify-center rounded-full border border-[#0A2342]/10 px-5 py-3 text-sm font-semibold text-[#0A2342] transition hover:border-[#C9A227] hover:bg-[#C9A227]/10">취소</Link>
        </motion.div>

        <motion.form initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1 }} onSubmit={handleSubmit} className="mt-8 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6 rounded-[24px] border border-[#0A2342]/10 bg-[#F8F9FB] p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div><label className="mb-2 block text-sm font-medium text-[#0A2342]/80">매물명</label><input value={form.title} onChange={(e)=>setForm({...form,title:e.target.value})} className="w-full rounded-2xl border border-[#0A2342]/10 bg-white px-4 py-3 outline-none focus:border-[#C9A227]" placeholder="예: 현풍읍 깔끔한 투룸" /></div>
              <div><label className="mb-2 block text-sm font-medium text-[#0A2342]/80">매물유형</label><select value={form.type} onChange={(e)=>setPropertyType(e.target.value)} className="w-full rounded-2xl border border-[#0A2342]/10 bg-white px-4 py-3 outline-none focus:border-[#C9A227]"><option value="">매물유형 선택</option>{PROPERTY_TYPES.map((type)=><option key={type} value={type}>{type}</option>)}</select></div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div><label className="mb-2 block text-sm font-medium text-[#0A2342]/80">거래유형</label><select value={form.deal_type} onChange={(e)=>setForm({...form,deal_type:e.target.value})} className="w-full rounded-2xl border border-[#0A2342]/10 bg-white px-4 py-3 outline-none focus:border-[#C9A227]"><option value="">거래유형 선택</option>{transactionTypes.map((type)=><option key={type} value={type}>{type}</option>)}</select></div>
              <div><label className="mb-2 block text-sm font-medium text-[#0A2342]/80">가격</label><input value={form.price} onChange={(e)=>setForm({...form,price:e.target.value})} className="w-full rounded-2xl border border-[#0A2342]/10 bg-white px-4 py-3 outline-none focus:border-[#C9A227]" placeholder="예: 500/45" /><p className="mt-2 text-xs text-[#0A2342]/55">검색용 가격: {formatKrwAmount(parsePropertyPriceAmount(form.price))}</p></div>
            </div>

            <div className="rounded-2xl border border-[#C9A227]/35 bg-[#C9A227]/5 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2"><div><p className="font-semibold">엑셀 장부 기본정보 불러오기</p><p className="mt-1 text-xs text-[#0A2342]/55">저장된 건물 장부에서 건물명·주소·구역을 불러옵니다. 엑셀 준공일은 참고만 하고 실제 준공정보는 건축물대장을 우선 적용합니다.</p></div><span className="text-xs font-semibold text-[#0A2342]/55">{buildingLoading ? "장부 불러오는 중..." : `${buildingRows.length}건`}</span></div>
              <input value={buildingKeyword} onChange={(e)=>{setBuildingKeyword(e.target.value);setBuildingMessage("");}} placeholder="건물명 또는 주소 검색 (예: 황금빌, 상리 533)" className="mt-3 w-full rounded-xl border border-[#0A2342]/10 bg-white px-4 py-3 outline-none focus:border-[#C9A227]" />
              {buildingMatches.length > 0 && <div className="mt-3 max-h-64 overflow-y-auto rounded-xl border border-[#0A2342]/10 bg-white">{buildingMatches.map((row, index)=><button key={`${row.buildingName}-${row.address}-${index}`} type="button" onClick={()=>applyBuildingRow(row)} className="flex w-full items-center justify-between gap-3 border-b border-[#0A2342]/10 px-4 py-3 text-left last:border-b-0 hover:bg-[#C9A227]/10"><span><b>{row.buildingName || "건물명 없음"}</b><span className="ml-2 text-sm text-[#0A2342]/65">{row.address}</span></span><span className="shrink-0 text-xs text-[#0A2342]/50">{[row.approvalDate ? `엑셀 ${row.approvalDate}` : "", row.zone].filter(Boolean).join(" · ")}</span></button>)}</div>}
              {buildingKeyword.trim() && !buildingLoading && buildingMatches.length === 0 && <p className="mt-2 text-xs text-[#0A2342]/55">일치하는 건물이 없습니다. 주소를 직접 입력할 수 있습니다.</p>}
              {buildingMessage && <p className="mt-2 text-xs font-semibold text-blue-700">{buildingMessage}</p>}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[#0A2342]/80">지역 / 주소</label>
              <input value={form.address} onChange={(e)=>setForm({...form,address:e.target.value,location:e.target.value})} className="w-full rounded-2xl border border-[#0A2342]/10 bg-white px-4 py-3 outline-none focus:border-[#C9A227]" placeholder="예: 달성군 현풍읍 중리 447" />
              <p className="mt-2 text-xs text-[#0A2342]/55">장부에서 선택하면 주소가 자동 입력됩니다. 장부에 없는 매물은 직접 입력할 수 있습니다.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div><label className="mb-2 block text-sm font-medium text-[#0A2342]/80">면적</label><input value={form.area} onChange={(e)=>setForm({...form,area:e.target.value})} className="w-full rounded-2xl border border-[#0A2342]/10 bg-white px-4 py-3 outline-none focus:border-[#C9A227]" placeholder="예: 49.59㎡" /></div>
              <div><label className="mb-2 block text-sm font-medium text-[#0A2342]/80">층수</label><input value={form.floor} onChange={(e)=>setForm({...form,floor:e.target.value})} className="w-full rounded-2xl border border-[#0A2342]/10 bg-white px-4 py-3 outline-none focus:border-[#C9A227]" placeholder="예: 2/3층" /></div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2"><div><label className="mb-2 block text-sm font-medium text-[#0A2342]/80">방 개수</label><input type="number" value={form.rooms} onChange={(e)=>setForm({...form,rooms:Number(e.target.value)})} className="w-full rounded-2xl border border-[#0A2342]/10 bg-white px-4 py-3" /></div><div><label className="mb-2 block text-sm font-medium text-[#0A2342]/80">욕실 개수</label><input type="number" value={form.bathrooms} onChange={(e)=>setForm({...form,bathrooms:Number(e.target.value)})} className="w-full rounded-2xl border border-[#0A2342]/10 bg-white px-4 py-3" /></div></div>

            <div className="rounded-2xl border border-[#0A2342]/10 bg-white p-4">
              <div className="flex flex-wrap items-end justify-between gap-2"><div><p className="font-semibold">옵션 선택</p><p className="mt-1 text-xs text-[#0A2342]/55">주거 매물은 공통 옵션이 기본 체크됩니다. 매물마다 실제 옵션만 확인해 선택하세요.</p></div><button type="button" onClick={()=>setSelectedOptions([])} className="text-xs font-semibold text-[#0A2342]/60 underline">전체 해제</button></div>
              <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">{ALL_OPTIONS.map((option)=><label key={option} className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm ${selectedOptions.includes(option)?"border-[#C9A227] bg-[#C9A227]/10":"border-[#0A2342]/10"}`}><input type="checkbox" checked={selectedOptions.includes(option)} onChange={()=>toggleOption(option)} className="h-4 w-4 accent-[#C9A227]"/><span>{option}</span></label>)}</div>
            </div>

            <div><label className="mb-2 block text-sm font-medium text-[#0A2342]/80">설명</label><textarea rows={7} value={form.description} onChange={(e)=>setForm({...form,description:e.target.value})} className="w-full rounded-2xl border border-[#0A2342]/10 bg-white px-4 py-3 outline-none focus:border-[#C9A227]" placeholder="위치, 추천 대상, 핵심 특징 등 간단한 설명을 입력해주세요." /></div>
          </div>

          <div className="space-y-6 rounded-[24px] border border-[#0A2342]/10 bg-[#0A2342] p-6 text-white">
            <div><h2 className="text-xl font-semibold">이미지 업로드</h2><p className="mt-2 text-sm leading-7 text-white/80">사진을 선택하면 실제 저장될 워터마크 위치를 미리 확인할 수 있습니다.</p></div>
            <label className="flex cursor-pointer flex-col items-center justify-center rounded-[24px] border border-dashed border-white/25 bg-white/10 px-6 py-10 text-center transition hover:bg-white/15"><span className="text-sm font-semibold text-[#C9A227]">사진 선택</span><span className="mt-2 text-sm text-white/70">최대 20장까지 JPEG, PNG 파일을 업로드할 수 있습니다.</span><input type="file" accept="image/*" multiple className="hidden" onChange={handleImageChange} /></label>
            <div className="rounded-[24px] border border-white/10 bg-white/10 p-3">{imageFiles.length>0?<div className="grid grid-cols-2 gap-3">{imageFiles.map((image,index)=><div key={image.id} className="relative overflow-hidden rounded-[18px]"><WatermarkPreview src={image.previewUrl} alt={`미리보기 ${index+1}`} />{index===0&&<span className="absolute left-2 top-2 z-10 rounded-full bg-[#C9A227] px-2 py-1 text-xs font-bold text-[#0A2342]">대표</span>}<button type="button" onClick={()=>handleRemoveImage(image.id)} className="absolute right-2 top-2 z-10 rounded-full bg-black/60 px-2 py-1 text-xs font-semibold text-white">삭제</button></div>)}</div>:<div className="flex h-48 items-center justify-center rounded-[18px] border border-dashed border-white/20 text-sm text-white/50">업로드한 이미지가 여기에 표시됩니다.</div>}</div>
            <button type="submit" disabled={submitting} className="w-full rounded-full bg-[#C9A227] px-6 py-4 font-bold text-[#0A2342] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60">{submitting?"등록 중...":"매물 등록"}</button>
          </div>
        </motion.form>
      </div>
    </main>
  );
}
