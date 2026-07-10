"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { properties } from "../../data/properties";

export default function AdminPage() {
  return (
    <main className="min-h-screen bg-[#F8F9FB] px-4 py-8 text-[#0A2342] sm:px-6 lg:px-8">

      <div className="mx-auto max-w-7xl">

        <div className="flex flex-col gap-4 rounded-[32px] bg-white p-8 shadow-sm md:flex-row md:items-center md:justify-between">

          <div>
            <p className="text-sm font-semibold tracking-[0.3em] text-[#C9A227]">
              ADMIN DASHBOARD
            </p>

            <h1 className="mt-2 text-3xl font-bold">
              백조현대부동산 관리자
            </h1>
          </div>


          <Link
            href="/admin/properties/new"
            className="rounded-full bg-[#C9A227] px-6 py-3 font-semibold text-[#0A2342]"
          >
            + 매물 등록
          </Link>

        </div>


        <motion.section
          initial={{opacity:0,y:20}}
          animate={{opacity:1,y:0}}
          className="mt-8 rounded-[32px] bg-white p-8 shadow-sm"
        >

          <h2 className="mb-6 text-xl font-bold">
            등록 매물 관리
          </h2>


          <div className="overflow-x-auto">

            <table className="min-w-full">

              <thead className="bg-[#F8F9FB]">

                <tr>
                  <th className="px-5 py-4 text-left">
                    번호
                  </th>

                  <th className="px-5 py-4 text-left">
                    매물명
                  </th>

                  <th className="px-5 py-4 text-left">
                    지역
                  </th>

                  <th className="px-5 py-4 text-left">
                    가격
                  </th>

                  <th className="px-5 py-4">
                    관리
                  </th>

                </tr>

              </thead>


              <tbody>

                {properties.map((property)=>(
                  
                  <tr 
                    key={property.id}
                    className="border-t"
                  >

                    <td className="px-5 py-4">
                      {property.id}
                    </td>


                    <td className="px-5 py-4 font-semibold">
                      {property.title}
                    </td>


                    <td className="px-5 py-4">
                      {property.location}
                    </td>


                    <td className="px-5 py-4">
                      {property.price}
                    </td>


                    <td className="px-5 py-4">

                      <div className="flex gap-2">

                        <Link
                          href={`/properties/${property.id}`}
                          className="rounded-full border px-4 py-2 text-sm"
                        >
                          보기
                        </Link>


<Link
  href={`/admin/properties/${property.id}/edit`}
  className="rounded-full border border-[#0A2342]/10 px-3 py-2 text-sm font-medium text-[#0A2342] transition hover:border-[#C9A227] hover:bg-[#C9A227]/10"
>
  수정
</Link>


                        <button
                          className="rounded-full border border-red-300 px-4 py-2 text-sm text-red-600"
                        >
                          삭제
                        </button>

                      </div>

                    </td>


                  </tr>

                ))}


              </tbody>

            </table>

          </div>


        </motion.section>


      </div>

    </main>
  );
}