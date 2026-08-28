import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  MAINTENANCE_ITEMS,
  buildDescriptionWithAdminMeta,
  parseAdminMeta,
  stripAdminMeta,
} from "@/lib/property-admin-meta";

export const runtime = "nodejs";

function removeOptionSection(description:string){
  const lines=description.replace(/\r\n/g,"\n").split("\n");
  const out:string[]=[];
  let skipping=false;

  for(const line of lines){
    const trimmed=line.trim();

    if(/^옵션(?:\s*내용)?\s*[:：]?\s*$/i.test(trimmed)){
      skipping=true;
      continue;
    }

    if(/^옵션\s*[:：]\s*.+$/i.test(trimmed)){
      continue;
    }

    if(skipping){
      if(!trimmed)continue;
      if(/^(?:📍\s*)?(?:매물\s*특징|매물\s*정보|상세\s*정보|거래\s*조건|교통|입지|추천|위치|구조|특징)\s*[:：]?\s*$/i.test(trimmed)){
        skipping=false;
        out.push(line);
      }
      continue;
    }

    out.push(line);
  }

  return out.join("\n").replace(/\n{3,}/g,"\n\n").trim();
}

export async function GET(){
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key=process.env.SUPABASE_SERVICE_ROLE_KEY;
  if(!url||!key)return NextResponse.json({ok:false,error:"server_config"},{status:503});

  const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
  const {data,error}=await db.from("properties").select("id,title,type,description").eq("type","원룸").order("id",{ascending:true});
  if(error)return NextResponse.json({ok:false,error:error.message},{status:500});

  const results:Array<Record<string,unknown>>=[];
  for(const property of data??[]){
    const rawDescription=String(property.description??"");
    const meta=parseAdminMeta(rawDescription);
    meta.maintenanceFee="10만원";
    meta.maintenanceItems=[...MAINTENANCE_ITEMS];

    const cleanDescription=removeOptionSection(stripAdminMeta(rawDescription));
    const nextDescription=buildDescriptionWithAdminMeta(cleanDescription,meta);
    const {error:updateError}=await db.from("properties").update({description:nextDescription}).eq("id",property.id);

    if(updateError){
      results.push({id:property.id,title:property.title,status:"error",error:updateError.message});
    }else{
      results.push({id:property.id,title:property.title,status:"updated",maintenanceFee:"10만원",maintenanceItems:MAINTENANCE_ITEMS.length});
    }
  }

  const updated=results.filter((item)=>item.status==="updated").length;
  const failed=results.filter((item)=>item.status==="error").length;
  return NextResponse.json({ok:failed===0,total:results.length,updated,failed,results});
}
