import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

export async function GET(){
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key=process.env.SUPABASE_SERVICE_ROLE_KEY;
  if(!url||!key)return NextResponse.json({ok:false,error:"server_config"},{status:503});
  const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
  const targets=[
    {id:80,marker:"naver:2645825103"},
    {id:81,marker:"naver:2645305331"},
  ];
  const results:any[]=[];
  for(const t of targets){
    const {data,error}=await db.from("properties").select("id,admin_memo,title").eq("id",t.id).maybeSingle();
    if(error){results.push({id:t.id,status:"error",error:error.message});continue;}
    if(!data){results.push({id:t.id,status:"already_missing"});continue;}
    if(String(data.admin_memo??"").trim()!==t.marker){results.push({id:t.id,status:"blocked_marker_mismatch",admin_memo:data.admin_memo});continue;}
    await db.from("property_images").delete().eq("property_id",t.id);
    const {error:delError}=await db.from("properties").delete().eq("id",t.id);
    if(delError){results.push({id:t.id,status:"error",error:delError.message});continue;}
    results.push({id:t.id,status:"deleted",title:data.title});
  }
  return NextResponse.json({ok:true,results});
}
