export type BuildingLedgerHubItem = Record<string, unknown>;

export type ParsedBuildingLedgerHubResponse = {
  list: BuildingLedgerHubItem[];
  totalCount: number;
  pageNo: number;
  numOfRows: number;
  resultCode: string;
  resultMsg: string;
};

const text = (value: unknown) => String(value ?? "").trim();

function decodeXml(value: string) {
  return value
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&amp;/g, "&");
}

function xmlTag(xml: string, tag: string) {
  const match = xml.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return match ? decodeXml(match[1].replace(/<[^>]+>/g, "").trim()) : "";
}

function parseXmlItems(xml: string): BuildingLedgerHubItem[] {
  const items: BuildingLedgerHubItem[] = [];
  for (const match of xml.matchAll(/<item(?:\s[^>]*)?>([\s\S]*?)<\/item>/gi)) {
    const itemXml = match[1] || "";
    const item: BuildingLedgerHubItem = {};
    for (const field of itemXml.matchAll(/<([A-Za-z0-9_]+)(?:\s[^>]*)?>([\s\S]*?)<\/\1>/g)) {
      item[field[1]] = decodeXml((field[2] || "").replace(/<[^>]+>/g, "").trim());
    }
    if (Object.keys(item).length) items.push(item);
  }
  return items;
}

function parseJson(raw: string): ParsedBuildingLedgerHubResponse | null {
  try {
    const data = JSON.parse(raw) as any;
    const code = text(data?.response?.header?.resultCode);
    const msg = text(data?.response?.header?.resultMsg);
    const body = data?.response?.body;
    const items = body?.items?.item;
    const list: BuildingLedgerHubItem[] = Array.isArray(items) ? items : items ? [items] : [];
    return {
      list,
      totalCount: Number(body?.totalCount || list.length),
      pageNo: Number(body?.pageNo || 1),
      numOfRows: Number(body?.numOfRows || list.length || 100),
      resultCode: code,
      resultMsg: msg,
    };
  } catch {
    return null;
  }
}

function parseXml(raw: string): ParsedBuildingLedgerHubResponse | null {
  if (!/^\s*</.test(raw)) return null;
  const resultCode = xmlTag(raw, "resultCode") || xmlTag(raw, "returnReasonCode") || xmlTag(raw, "returnAuthMsg");
  const resultMsg = xmlTag(raw, "resultMsg") || xmlTag(raw, "errMsg") || xmlTag(raw, "returnAuthMsg");
  const list = parseXmlItems(raw);
  const totalCount = Number(xmlTag(raw, "totalCount") || list.length);
  const pageNo = Number(xmlTag(raw, "pageNo") || 1);
  const numOfRows = Number(xmlTag(raw, "numOfRows") || list.length || 100);
  if (!resultCode && !resultMsg && !list.length && !/<response|<OpenAPI_ServiceResponse/i.test(raw)) return null;
  return { list, totalCount, pageNo, numOfRows, resultCode, resultMsg };
}

export function parseBuildingLedgerHubResponse(rawValue: string): ParsedBuildingLedgerHubResponse | null {
  const raw = rawValue.replace(/^\uFEFF/, "").trim();
  if (!raw) return null;
  return parseJson(raw) || parseXml(raw);
}

export function isTemporaryBuildingLedgerError(code: string, message: string) {
  return code === "99" || /tempor|service|timeout|초과|일시|busy|try again|rate/i.test(message);
}
