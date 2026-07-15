"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function PropertyEditPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();

  const id = Number(params.id);

  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    title: "",
    price: "",
    address: "",
    area: "",
    description: "",
  });


  useEffect(() => {
    async function getProperty() {

      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .eq("id", id)
        .single();


      if (error) {
        console.error("매물 불러오기 오류:", error);
        setLoading(false);
        return;
      }


      setForm({
        title: data.title || "",
        price: data.price || "",
        address: data.address || data.location || "",
        area: data.area || "",
        description: data.description || "",
      });


      setLoading(false);
    }


    if (id) {
      getProperty();
    }

  }, [id]);



  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {

    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));

  };



  const handleSubmit = async (
    e: React.FormEvent
  ) => {

    e.preventDefault();


    const { error } = await supabase
      .from("properties")
      .update({
        title: form.title,
        price: form.price,
        address: form.address,
        area: form.area,
        description: form.description,
        location: form.address,
      })
      .eq("id", id);



    if (error) {

      console.error("수정 오류:", error);

      alert("매물 수정 실패");

      return;

    }


    alert("매물이 수정되었습니다.");

    router.push("/admin");

  };



  if (loading) {

    return (
      <main className="min-h-screen flex items-center justify-center">
        <p>매물 정보를 불러오는 중입니다...</p>
      </main>
    );

  }



  return (

    <main className="min-h-screen bg-[#F8F9FB] px-4 py-8 text-[#0A2342]">

      <div className="mx-auto max-w-4xl rounded-[32px] bg-white p-8 shadow-sm">


        <div className="flex justify-between items-center mb-8">

          <h1 className="text-3xl font-bold">
            매물 수정
          </h1>


          <Link
            href="/admin"
            className="rounded-full border px-5 py-3"
          >
            목록으로
          </Link>

        </div>



        <form
          onSubmit={handleSubmit}
          className="space-y-5"
        >


          <div>

            <label className="block mb-2 font-semibold">
              매물명
            </label>

            <input

              name="title"

              value={form.title}

              onChange={handleChange}

              className="w-full rounded-xl border px-4 py-3"

            />

          </div>



          <div>

            <label className="block mb-2 font-semibold">
              가격
            </label>

            <input

              name="price"

              value={form.price}

              onChange={handleChange}

              className="w-full rounded-xl border px-4 py-3"

            />

          </div>



          <div>

            <label className="block mb-2 font-semibold">
              주소
            </label>

            <input

              name="address"

              value={form.address}

              onChange={handleChange}

              className="w-full rounded-xl border px-4 py-3"

            />

          </div>



          <div>

            <label className="block mb-2 font-semibold">
              면적
            </label>

            <input

              name="area"

              value={form.area}

              onChange={handleChange}

              className="w-full rounded-xl border px-4 py-3"

            />

          </div>



          <div>

            <label className="block mb-2 font-semibold">
              설명
            </label>

            <textarea

              name="description"

              value={form.description}

              onChange={handleChange}

              rows={6}

              className="w-full rounded-xl border px-4 py-3"

            />

          </div>



          <button

            type="submit"

            className="rounded-full bg-[#C9A227] px-8 py-3 font-semibold text-[#0A2342]"

          >

            저장하기

          </button>


        </form>


      </div>

    </main>

  );

}