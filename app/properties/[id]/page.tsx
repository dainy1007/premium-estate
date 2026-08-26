import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getProperty, getRelatedProperties } from "@/lib/property";
import { buildImageAlt, buildSeoKeywords, buildSeoTitle, getRelatedSeoLandings } from "@/lib/property-seo";
import { parseAdminMeta, stripAdminMeta, inferOptions } from "@/lib/property-admin-meta";
import PropertyGallery from "@/components/properties/PropertyGallery";
import PropertyShareActions from "@/components/properties/PropertyShareActions";
import OptionLineIcon from "@/components/properties/OptionLineIcon";
import type { PropertyImage } from "@/types/property";

interface PropertyDetailPageProps { params: Promise<{ id: string }>; }
const SITE_URL=process.env.NEXT_PUBLIC_SITE_URL??"https://www.baekjohd.com";
const INFO_LABELS=["거래조건","금액","주소","관리비","관리비 항목","매물 종류","엘리베이터","면적","공급/전용 면적","방","화장실","방/욕실","층수","주차","총주차대수","테마","입주가능일","입주 가능일","난방","지목","용도지역","방향","건축물 용도"];
function normalizeAreaUnits(value:string){return value.replace(/m2|m²/gi,"㎡").replace(/㎡{2,}/g,"㎡").replace(/\s+㎡/g,"㎡");}
function formatAreaValue(value:unknown){if(value==null)return value as null|undefined;const text=normalizeAreaUnits(String(value).trim());if(!text)return text;if(/㎡|평/.test(text))return text;if(/^[\d,.]+$/.test(text))return `${text}㎡`;return text;}
function splitDescription(description:string){
 const normalized=stripAdminMeta(description).replace(/\r\n/g,"\n").trim();
 const featureMatch=normalized.match(/(?:^|\n|\s)매물\s*특징\s*[:：]?\s*/);
 const optionMatch=normalized.match(/(?:^|\n|\s)옵션\s*[:：]?\s*/);
 let concise=normalized;
 if(featureMatch&&featureMatch.index!=null)concise=normalized.slice(featureMatch.index+featureMatch[0].length).trim();
 else if(optionMatch&&optionMatch.index!=null)concise=normalized.slice(0,optionMatch.index).trim();
 const info:Record<string,string>={};
 const compact=normalized.replace(/\n+/g," ").replace(/\s+/g," ");
 for(const label of INFO_LABELS){
   const escaped=label.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");
   const next=INFO_LABELS.filter(v=>v!==label).map(v=>v.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")).join("|");
   const re=new RegExp(`${escaped}\\s*[:：]\\s*(.+?)(?=\\s(?:${next}|옵션|매물\\s*특징)\\s*[:：]?|$)`);
   const m=compact.match(re);if(m)info[label]=m[1].trim();
 }
 concise=concise.replace(/^[-•·\s]+/,"").trim();
 return {info,concise};
}
function maintenanceDetail(meta:ReturnType<typeof parseAdminMeta>,parsedInfo:Record<string,string>){
 const items=meta.maintenanceItems.length?meta.maintenanceItems:parsedInfo["관리비 항목"]?[parsedInfo["관리비 항목"]]:[];
 const visible=[...items];
 if(meta.waterFeeSeparate&&!visible.some(v=>/수도/.test(v)))visible.push("수도세 별도");
 return visible.join(" · ");
}
export async function generateMetadata({params}:PropertyDetailPageProps):Promise<Metadata>{const{id}=await params;const propertyId=Number(id);if(!Number.isInteger(propertyId)||propertyId<=0)return{title:"매물을 찾을 수 없습니다",robots:{index:false,follow:false}};const property=await getProperty(propertyId);if(!property)return{title:"매물을 찾을 수 없습니다",description:"요청하신 매물 정보를 찾을 수 없습니다.",robots:{index:false,follow:false}};const seoTitle=buildSeoTitle(property),dealType=property.deal_type||property.type||"부동산 매물",location=property.location||"대구 달성군",price=property.price||"가격 문의";const publicDescription=stripAdminMeta(property.description||"");const description=publicDescription?publicDescription.replace(/\s+/g," ").trim().slice(0,160):`${location} ${dealType}, ${price}. 백조현대부동산중개 매물 정보입니다.`;const canonicalUrl=`${SITE_URL}/properties/${propertyId}`,imageUrl=property.image_url||`${SITE_URL}/opengraph-image`,socialTitle=`${seoTitle} | 백조현대부동산중개`;return{title:seoTitle,description,keywords:buildSeoKeywords(property),alternates:{canonical:canonicalUrl},openGraph:{title:socialTitle,description,url:canonicalUrl,siteName:"백조현대부동산중개",locale:"ko_KR",type:"website",images:[{url:imageUrl,alt:buildImageAlt(property,1)}]},twitter:{card:"summary_large_image",title:socialTitle,description,images:[imageUrl]},robots:{index:true,follow:true}};}

export default async function PropertyDetailPage({params}:PropertyDetailPageProps){
 const{id}=await params;const propertyId=Number(id);if(!Number.isInteger(propertyId)||propertyId<=0)notFound();const property=await getProperty(propertyId);if(!property)notFound();
 const relatedProperties=await getRelatedProperties(propertyId,property.type||""),seoTitle=buildSeoTitle(property),seoKeywords=buildSeoKeywords(property),relatedSeoLandings=getRelatedSeoLandings(property);
 const rawDescription=property.description||"";const adminMeta=parseAdminMeta(rawDescription);const {info:parsedInfo,concise:displayedDescription}=splitDescription(rawDescription);const displayOptions=inferOptions(rawDescription,property.type||"");
 const managementFee=adminMeta.maintenanceFee||parsedInfo["관리비"];
 const managementDetail=maintenanceDetail(adminMeta,parsedInfo);
 const infoItems=[
  {label:"매물번호",value:String(property.id)},
  {label:"금액",value:parsedInfo["금액"]||parsedInfo["거래조건"]||property.price},
  {label:"주소",value:property.address||parsedInfo["주소"]||property.location},
  {label:"관리비",value:managementFee},
  {label:"관리비 항목",value:managementDetail},
  {label:"매물 종류",value:property.type||parsedInfo["매물 종류"]},
  {label:"엘리베이터",value:parsedInfo["엘리베이터"]},
  {label:"면적",value:parsedInfo["공급/전용 면적"]||parsedInfo["면적"]||formatAreaValue(property.area)},
  {label:"방",value:property.rooms?`${property.rooms}개`:parsedInfo["방"]||parsedInfo["방/욕실"]?.split("/")[0]},
  {label:"화장실",value:property.bathrooms?`${property.bathrooms}개`:parsedInfo["화장실"]||parsedInfo["방/욕실"]?.split("/")[1]},
  {label:"층수",value:parsedInfo["층수"]||property.floor},
  {label:"주차",value:parsedInfo["주차"]||parsedInfo["총주차대수"]},
  {label:"테마",value:parsedInfo["테마"]},
  {label:"입주가능일",value:parsedInfo["입주가능일"]||parsedInfo["입주 가능일"]},
  {label:"난방",value:parsedInfo["난방"]},
  {label:"지목",value:parsedInfo["지목"]},
  {label:"용도지역",value:parsedInfo["용도지역"]},
  {label:"방향",value:parsedInfo["방향"]},
  {label:"건축물 용도",value:parsedInfo["건축물 용도"]},
 ].filter(i=>i.value);
 const mapAddress=property.address||property.location,encodedAddress=encodeURIComponent(mapAddress||"대구광역시 달성군 유가읍"),canonicalUrl=`${SITE_URL}/properties/${propertyId}`;const allImages:PropertyImage[]=[...(property.property_images||[])].sort((a,b)=>a.display_order-b.display_order);const propertyJsonLd={"@context":"https://schema.org","@type":"RealEstateListing",name:seoTitle,description:stripAdminMeta(property.description||"")||`${property.location||"대구 달성군"}의 부동산 매물입니다.`,url:canonicalUrl,image:allImages.length?allImages.map(i=>i.image_url):property.image_url?[property.image_url]:undefined,keywords:seoKeywords.join(", ")};
 return <main className="min-h-screen bg-white pb-24 text-[#0A2342] md:pb-0"><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(propertyJsonLd).replace(/</g,"\\u003c")}}/><section className="mx-auto max-w-7xl px-6 py-10 md:px-8 md:py-16"><Link href="/properties" className="mb-8 inline-flex items-center gap-2 rounded-full border border-[#0A2342]/10 px-4 py-2 text-sm font-semibold">← 매물 목록으로</Link><div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]"><PropertyGallery title={property.title} altBase={seoTitle} fallbackImageUrl={property.image_url} images={allImages}/><div className="flex flex-col justify-center"><p className="text-sm font-semibold tracking-[0.3em] text-[#C9A227]">백조현대부동산중개</p><span className="mt-6 inline-flex w-fit rounded-full border border-[#C9A227]/30 bg-[#C9A227]/10 px-3 py-1 text-sm font-medium text-[#C9A227]">{property.deal_type||property.type||"매물"}</span><h1 className="mt-5 text-3xl font-bold sm:text-4xl">{property.title}</h1><p className="mt-3 text-sm font-medium text-[#0A2342]/60">{seoTitle}</p><p className="mt-4 text-xl font-bold text-[#C9A227]">{property.price||"가격 문의"}</p><PropertyShareActions title={property.title}/><div className="mt-8 overflow-hidden rounded-2xl border border-[#0A2342]/10 bg-white"><div className="border-b border-[#0A2342]/10 bg-[#F8F9FB] px-5 py-4"><p className="font-bold">매물정보</p></div><div>{infoItems.map((item,index)=><div key={item.label} className={`grid grid-cols-[112px_1fr] ${index<infoItems.length-1?"border-b border-[#0A2342]/10":""}`}><div className="bg-[#F5F6F8] px-4 py-3 text-sm font-semibold text-[#0A2342]/65">{item.label}</div><div className="px-4 py-3 text-sm font-semibold break-keep">{item.value}</div></div>)}</div></div>{mapAddress&&<div className="mt-4 flex flex-wrap gap-3"><a href={`https://map.naver.com/p/search/${encodedAddress}`} target="_blank" rel="noreferrer" className="rounded-full border border-[#0A2342]/15 px-4 py-2 text-sm font-semibold">네이버지도에서 보기</a><a href={`https://map.kakao.com/link/search/${encodedAddress}`} target="_blank" rel="noreferrer" className="rounded-full border border-[#0A2342]/15 px-4 py-2 text-sm font-semibold">카카오맵에서 보기</a></div>}{displayOptions.length>0&&<div className="mt-4 rounded-2xl bg-[#F8F9FB] p-5 sm:p-6"><p className="text-sm font-semibold text-gray-500">옵션</p><div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4">{displayOptions.map(option=><div key={option} className="flex min-h-24 flex-col items-center justify-center rounded-2xl border border-[#0A2342]/10 bg-white p-3 text-center"><OptionLineIcon name={option} className="h-9 w-9"/><span className="mt-2 text-xs font-semibold sm:text-sm">{option}</span></div>)}</div></div>}{displayedDescription&&<div className="mt-4 rounded-2xl bg-[#F8F9FB] p-5 sm:p-6"><p className="text-sm font-semibold text-gray-500">매물 설명</p><p className="mt-3 whitespace-pre-wrap break-keep text-[15px] leading-7 text-[#0A2342]/90 sm:text-base">{displayedDescription}</p></div>}</div></div>{relatedSeoLandings.length>0&&<section className="mt-12 rounded-[32px] border border-[#C9A227]/25 bg-[#C9A227]/5 p-7 md:p-8"><p className="text-sm font-semibold tracking-[0.2em] text-[#C9A227]">RELATED SEARCH</p><h2 className="mt-2 text-2xl font-bold">이 매물과 관련된 지역·유형별 매물</h2><div className="mt-5 flex flex-wrap gap-3">{relatedSeoLandings.map(l=><Link key={l.slug} href={l.href} className="rounded-full border border-[#0A2342]/15 bg-white px-4 py-2.5 text-sm font-semibold">{l.title} →</Link>)}</div></section>}<div className="mt-12 rounded-[32px] bg-[#0A2340] p-8 text-white shadow-xl"><h2 className="text-2xl font-bold">가치를 보는 안목,<br/>신뢰를 만드는 중개</h2><p className="mt-4 leading-8 text-white/80">고객의 성공적인 부동산 선택을 위해 함께 고민하고 함께 만들어 가겠습니다.</p></div>{relatedProperties&&relatedProperties.length>0&&<section className="mt-14"><h2 className="mb-6 text-3xl font-bold">비슷한 매물</h2><div className="grid gap-6 md:grid-cols-3">{relatedProperties.map(item=><Link key={item.id} href={`/properties/${item.id}`} className="rounded-[28px] border p-5"><p className="font-bold">{item.title}</p><p className="mt-2 text-sm text-gray-500">{item.location}</p><p className="mt-3 font-semibold text-[#C9A227]">{item.price||"가격 문의"}</p></Link>)}</div></section>}</section></main>;
}
