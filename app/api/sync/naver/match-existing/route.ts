import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
const supabaseUrl=process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey=process.env.SUPABASE_SERVICE_ROLE_KEY;
const syncSecret=process.env.NAVER_SYNC_SECRET;

type L={article_no:string;address?:string;road_address?:string;region?:string;price?:string;area?:string;property_type?:string;trade_type?:string};
const s=(v:unknown)=>String(v??"").trim();
const norm=(v:unknown)=>s(v).replace(/\s+/g,"").replace(/,/g,"").toLowerCase();
const nums=(v:unknown)=>{const m=s(v).match(/\d+(?:\.\d+)?/g);return m?m.map(Number):[]};
function areaClose(a:unknown,b:unknown){const x=nums(a)[0],y=nums(b)[0];return x!==undefined&&y!==undefined&&Math.abs(x-y)<=0.6;}
function priceSame(a:unknown,b:unknown){const x=nums(a),y=nums(b);return x.length>0&&y.length>0&&x.length===y.length&&x.every((n,i)=>n===y[i]);}
function addrScore(a:unknown,b:unknown){const x=norm(a),y=norm(b);if(!x||!y)return 0;if(x===y)return 5;if(x.includes(y)||y.includes(x))return 4;const ax=x.match(/[가-힣]+(?:읍|면|동|리)/g)||[];const by=y.match(/[가-힣]+(?:읍|면|동|리)/g)||[];return ax.filter(v=>by.includes(v)).length;}

export async function POST(req:NextRequest){
 if(!supabaseUrl||!serviceRoleKey||!syncSecret)return NextResponse.json({ok:false,error:"server_config"},{status:503});
 if((req.headers.get("authorization")??"")!==`Bearer ${syncSecret}`)return NextResponse.json({ok:false,error:"Unauthorized"},{status:401});
 const body=await req.json().catch(()=>({}));const listings:Array<L>=Array.isArray(body.listings)?body.listings:[];
 const db=createClient(supabaseUrl,serviceRoleKey,{auth:{persistSession:false,autoRefreshToken:false}});
 const {data:props,error}=await db.from("properties").select("id,title,type,deal_type,price,address,location,area,admin_memo");
 if(error)return NextResponse.json({ok:false,error:error.message},{status:500});
 let matched=0,skipped=0;const results:any[]=[];
 for(const l of listings){
  const no=s(l.article_no);if(!/^\d{9,12}$/.test(no)){skipped++;continue;}
  const marker=`naver:${no}`;if((props||[]).some((p:any)=>s(p.admin_memo)===marker)){results.push({article_no:no,status:"already_linked"});continue;}
  const la=s(l.road_address)||s(l.address)||s(l.region);const candidates=(props||[]).filter((p:any)=>!s(p.admin_memo).startsWith("naver:")).map((p:any)=>{
   let score=addrScore(la,s(p.address)||s(p.location))*3;
   if(priceSame(l.price,p.price))score+=5;
   if(areaClose(l.area,p.area))score+=3;
   if(norm(l.trade_type)&&norm(p.deal_type)&&norm(l.trade_type)===norm(p.deal_type))score+=2;
   if(norm(l.property_type)&&norm(p.type)&&(norm(l.property_type).includes(norm(p.type))||norm(p.type).includes(norm(l.property_type))))score+=1;
   return {p,score};
  }).filter((x:any)=>x.score>=10).sort((a:any,b:any)=>b.score-a.score);
  if(candidates.length===1||(candidates.length>1&&candidates[0].score>=candidates[1].score+3)){
   const best=candidates[0];const {error:uerr}=await db.from("properties").update({admin_memo:marker}).eq("id",best.p.id);
   if(uerr){results.push({article_no:no,status:"error",error:uerr.message});continue;}
   matched++;results.push({article_no:no,status:"matched",property_id:best.p.id,score:best.score,title:best.p.title});
  }else{skipped++;results.push({article_no:no,status:"needs_review",candidates:candidates.slice(0,3).map((x:any)=>({id:x.p.id,title:x.p.title,score:x.score}))});}
 }
 return NextResponse.json({ok:true,matched,skipped,results});
}
