"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type Property = {
  id: number;
  title: string;
  location: string;
  price: string;
  type?: string | null;
  deal_type?: string | null;
  created_at?: string | null;
};

const ALL = "전체";

export default function AdminPage() {
  const [propertyList, setPropertyList] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [keyword, setKeyword] = useState("");
  const [propertyType, setPropertyType] = useState(ALL);
  const [dealType, setDealType] = useState(ALL);

  useEffect(() => {
    async function getProperties() {
      setLoading(true);
      setErrorMessage("");

      const { data, error } = await supabase
        .from("properties")
        .select("id, title, location, price, type, deal_type, created_at")
        .order("id", { ascending: false });

      if (error) {
        console.error("매물 불러오기 오류:", error);
        setErrorMessage("매물 정보를 불러오지 못했습니다.");
        setLoading(false);
        return;
      }

      setPropertyList((data || []) as Property[]);
      setLoading(false);
    }

    getProperties();
  }, []);

  const propertyTypes = useMemo(
    () => [ALL, ...Array.from(new Set(propertyList.map((item) => item.type).filter(Boolean) as string[]))],
    [propertyList]
  );

  const dealTypes = useMemo(
    () => [ALL, ...Array.from(new Set(propertyList.map((item) => item.deal_type).filter(Boolean) as string[]))],
    [propertyList]
  );

  const filteredProperties = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();

    return propertyList.filter((property) => {
      const searchableText = [property.title, property.location, property.price, property.type, property.deal_type]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesKeyword = !normalizedKeyword || searchableText.includes(normalizedKeyword);
      const matchesPropertyType = propertyType === ALL || property.type === propertyType;
      const matchesDealType = dealType === ALL || property.deal_type === dealType;

      return matchesKeyword && matchesPropertyType && matchesDealType;
    });
  }, [dealType, keyword, propertyList, propertyType]);

  const resetFilters = () => {
    setKeyword("");
    setPropertyType(ALL);
    setDealType(ALL);
  };

  async function handleDelete(id: number) {
    const ok = window.confirm("정말 삭제하시겠습니까? 삭제한 매물은 복구할 수 없습니다.");
    if (!ok) return;

    const { error } = await supabase.from("properties").delete().eq("id", id);

    if (error) {
      console.error("삭제 오류:", error);
      window.alert("매물을 삭제하지 못했습니다.");
      return;
    }

    setPropertyList((previous) => previous.filter((property) => property.id !== id));
    window.alert("삭제되었습니다.");
  }

  return (
    <main className="min-h-screen bg-[#F8F9FB] px-4 py-8 text-[#0A2342]">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-5 rounded-[32px] bg-white p-7 shadow-sm md:flex-row md:items-center md:justify-between md:p-8">
          <div>
            <p className="text-sm font-semibold tracking-[0.3em] text-[#C9A227]">ADMIN DASHBOARD</p>
            <h1 className="mt-2 text-3xl font-bold">백조현대부동산 관리자</h1>
            <p className="mt-2 text-sm text-[#0A2342]/60">등록 매물과 고객 문의를 한 곳에서 관리합니다.</p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href="/admin/inquiries" className="rounded-full border border-[#0A2342]/15 px-6 py-3 text-center font-semibold transition hover:border-[#C9A227] hover:bg-[#C9A227]/10">
              문의 관리
            </Link>
            <Link href="/admin/properties/new" className="rounded-full bg-[#C9A227] px-6 py-3 text-center font-semibold text-[#0A2342]">
              + 매물 등록
            </Link>
          </div>
        </div>

        <section className="mt-6 grid gap-4 sm:grid-cols-3">
          <StatCard label="전체 등록 매물" value={propertyList.length} />
          <StatCard label="현재 검색 결과" value={filteredProperties.length} />
          <StatCard label="매물 유형" value={Math.max(0, propertyTypes.length - 1)} />
        </section>

        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-6 rounded-[32px] bg-white p-5 shadow-sm md:p-8">
          <div className="flex flex-col gap-4 border-b border-[#0A2342]/10 pb-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-xl font-bold">등록 매물 관리</h2>
              <p className="mt-1 text-sm text-[#0A2342]/55">매물명, 지역, 가격으로 검색할 수 있습니다.</p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(240px,1fr)_160px_160px_auto]">
              <input
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                placeholder="매물명·지역·가격 검색"
                className="rounded-2xl border border-[#0A2342]/15 px-4 py-3 text-sm outline-none focus:border-[#C9A227]"
              />
              <select value={propertyType} onChange={(event) => setPropertyType(event.target.value)} className="rounded-2xl border border-[#0A2342]/15 bg-white px-4 py-3 text-sm outline-none focus:border-[#C9A227]">
                {propertyTypes.map((item) => <option key={item}>{item}</option>)}
              </select>
              <select value={dealType} onChange={(event) => setDealType(event.target.value)} className="rounded-2xl border border-[#0A2342]/15 bg-white px-4 py-3 text-sm outline-none focus:border-[#C9A227]">
                {dealTypes.map((item) => <option key={item}>{item}</option>)}
              </select>
              <button type="button" onClick={resetFilters} className="rounded-2xl border border-[#0A2342]/15 px-4 py-3 text-sm font-semibold transition hover:border-[#C9A227] hover:bg-[#C9A227]/10">
                초기화
              </button>
            </div>
          </div>

          {loading && <p className="py-16 text-center text-[#0A2342]/55">매물을 불러오는 중입니다...</p>}

          {!loading && errorMessage && <div className="my-8 rounded-2xl border border-red-200 bg-red-50 p-5 text-center text-red-700">{errorMessage}</div>}

          {!loading && !errorMessage && filteredProperties.length === 0 && (
            <div className="my-8 rounded-2xl border border-dashed border-[#0A2342]/20 p-10 text-center">
              <p className="font-semibold">조건에 맞는 매물이 없습니다.</p>
              <button type="button" onClick={resetFilters} className="mt-3 text-sm font-semibold text-[#C9A227] hover:underline">검색 조건 초기화</button>
            </div>
          )}

          {!loading && !errorMessage && filteredProperties.length > 0 && (
            <div className="mt-6 overflow-x-auto">
              <table className="min-w-[920px] w-full">
                <thead className="bg-[#F8F9FB] text-sm">
                  <tr>
                    <th className="px-5 py-4 text-left">번호</th>
                    <th className="px-5 py-4 text-left">매물명</th>
                    <th className="px-5 py-4 text-left">유형</th>
                    <th className="px-5 py-4 text-left">거래</th>
                    <th className="px-5 py-4 text-left">지역</th>
                    <th className="px-5 py-4 text-left">가격</th>
                    <th className="px-5 py-4 text-center">관리</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProperties.map((property) => (
                    <tr key={property.id} className="border-t border-[#0A2342]/10 text-sm">
                      <td className="px-5 py-4 text-[#0A2342]/55">{property.id}</td>
                      <td className="px-5 py-4 font-semibold">{property.title}</td>
                      <td className="px-5 py-4">{property.type || "-"}</td>
                      <td className="px-5 py-4">{property.deal_type || "-"}</td>
                      <td className="px-5 py-4">{property.location || "-"}</td>
                      <td className="px-5 py-4 font-semibold text-[#9B7900]">{property.price || "문의"}</td>
                      <td className="px-5 py-4">
                        <div className="flex justify-center gap-2">
                          <Link href={`/admin/properties/${property.id}`} className="rounded-full border px-4 py-2 text-xs font-semibold hover:border-[#C9A227]">보기</Link>
                          <Link href={`/admin/properties/${property.id}/edit`} className="rounded-full border px-4 py-2 text-xs font-semibold hover:border-[#C9A227]">수정</Link>
                          <button type="button" onClick={() => handleDelete(property.id)} className="rounded-full border border-red-300 px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50">삭제</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.section>
      </div>
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[24px] bg-white p-6 shadow-sm">
      <p className="text-sm text-[#0A2342]/55">{label}</p>
      <p className="mt-2 text-3xl font-bold text-[#0A2342]">{value}</p>
    </div>
  );
}
