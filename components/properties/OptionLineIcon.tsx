type OptionLineIconProps = { name: string; className?: string };

const common = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

export default function OptionLineIcon({ name, className = "h-9 w-9" }: OptionLineIconProps) {
  const n = name.trim();
  const wrap = (children: React.ReactNode) => <svg viewBox="0 0 48 48" aria-hidden="true" className={className} {...common}>{children}</svg>;
  if (/에어컨/.test(n)) return wrap(<><rect x="7" y="10" width="34" height="17" rx="3"/><path d="M11 22h26M15 31c0 3-2 4-2 7M24 31c0 3-2 4-2 7M33 31c0 3-2 4-2 7"/></>);
  if (/세탁기/.test(n)) return wrap(<><rect x="10" y="5" width="28" height="38" rx="3"/><path d="M10 13h28"/><circle cx="24" cy="28" r="9"/><circle cx="24" cy="28" r="6"/><circle cx="32" cy="9" r="1"/></>);
  if (/^TV$|티비|텔레비전/i.test(n)) return wrap(<><rect x="7" y="10" width="34" height="25" rx="2"/><path d="M18 40h12M24 35v5M19 6l5 4 5-4"/></>);
  if (/신발장/.test(n)) return wrap(<><rect x="10" y="6" width="28" height="36" rx="2"/><path d="M24 6v36M14 25c4 0 6-5 10-3M14 25c1 4 7 5 10 3"/></>);
  if (/냉장고/.test(n)) return wrap(<><rect x="12" y="4" width="24" height="40" rx="3"/><path d="M12 20h24M17 10v6M17 25v9"/></>);
  if (/가스레인지|인덕션/.test(n)) return wrap(<><rect x="8" y="7" width="32" height="34" rx="2"/><circle cx="17" cy="17" r="5"/><circle cx="31" cy="17" r="5"/><circle cx="17" cy="29" r="5"/><circle cx="31" cy="29" r="5"/><path d="M14 38h20"/></>);
  if (/싱크대/.test(n)) return wrap(<><path d="M7 24h34v18H7zM24 24v18M13 24v-5c0-7 10-7 10 0v2"/><path d="M23 21h5"/></>);
  if (/CCTV/i.test(n)) return wrap(<><path d="M8 16l25-7 5 17-25 7zM33 28l5 8M38 36h5"/><circle cx="16" cy="24" r="3"/></>);
  if (/도어락|현관보안/.test(n)) return wrap(<><rect x="13" y="5" width="22" height="38" rx="3"/><path d="M18 11h12M19 18h2m6 0h2m-10 6h2m6 0h2m-10 6h2m6 0h2M19 37h10"/></>);
  if (/인터폰/.test(n)) return wrap(<><rect x="8" y="7" width="32" height="34" rx="3"/><rect x="22" y="12" width="12" height="9" rx="1"/><path d="M14 13v20M27 27h7M27 32h7"/></>);
  if (/옷장|붙박이장|장롱|수납장/.test(n)) return wrap(<><rect x="8" y="5" width="32" height="38" rx="2"/><path d="M24 5v38M20 24h1M27 24h1M12 9h24"/></>);
  if (/인터넷|와이파이/.test(n)) return wrap(<><path d="M8 19c9-8 23-8 32 0M13 25c6-6 16-6 22 0M19 31c3-3 7-3 10 0"/><circle cx="24" cy="37" r="2"/></>);
  if (/건조대/.test(n)) return wrap(<><path d="M9 39L18 9m21 30L30 9M14 24h20M16 18h16M12 30h24"/></>);
  return wrap(<><circle cx="24" cy="24" r="17"/><path d="M16 24l5 5 11-12"/></>);
}
