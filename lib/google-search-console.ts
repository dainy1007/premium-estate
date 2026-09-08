import crypto from "node:crypto";

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const SEARCH_CONSOLE_SCOPE = "https://www.googleapis.com/auth/webmasters.readonly";
const SEARCH_ANALYTICS_BASE = "https://searchconsole.googleapis.com/webmasters/v3/sites";

type SearchDimension = "date" | "query" | "page" | "device" | "country" | "searchAppearance";

export type SearchConsoleRow = {
  keys?: string[];
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
};

export type SearchConsoleQueryResult = {
  rows: SearchConsoleRow[];
  responseAggregationType?: string;
};

function base64url(input: string | Buffer) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function getConfig() {
  const clientEmail = process.env.GOOGLE_SEARCH_CONSOLE_CLIENT_EMAIL?.trim();
  const privateKey = process.env.GOOGLE_SEARCH_CONSOLE_PRIVATE_KEY?.replace(/\\n/g, "\n").trim();
  const siteUrl = process.env.GOOGLE_SEARCH_CONSOLE_SITE_URL?.trim();

  return {
    clientEmail,
    privateKey,
    siteUrl,
    configured: Boolean(clientEmail && privateKey && siteUrl),
  };
}

async function createAccessToken() {
  const { clientEmail, privateKey, configured } = getConfig();
  if (!configured || !clientEmail || !privateKey) {
    throw new Error("Google Search Console 환경변수가 설정되지 않았습니다.");
  }

  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = base64url(
    JSON.stringify({
      iss: clientEmail,
      scope: SEARCH_CONSOLE_SCOPE,
      aud: TOKEN_URL,
      iat: now,
      exp: now + 3600,
    }),
  );
  const unsigned = `${header}.${payload}`;
  const signer = crypto.createSign("RSA-SHA256");
  signer.update(unsigned);
  signer.end();
  const signature = base64url(signer.sign(privateKey));
  const assertion = `${unsigned}.${signature}`;

  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
    cache: "no-store",
  });

  const data = (await response.json()) as { access_token?: string; error?: string; error_description?: string };
  if (!response.ok || !data.access_token) {
    throw new Error(data.error_description || data.error || "Google OAuth 토큰 발급에 실패했습니다.");
  }
  return data.access_token;
}

export function getSearchConsoleStatus() {
  const config = getConfig();
  return { configured: config.configured, siteUrl: config.siteUrl ?? null };
}

export async function querySearchConsole(params: {
  startDate: string;
  endDate: string;
  dimensions: SearchDimension[];
  rowLimit?: number;
  startRow?: number;
}) {
  const { siteUrl, configured } = getConfig();
  if (!configured || !siteUrl) {
    throw new Error("Google Search Console 환경변수가 설정되지 않았습니다.");
  }

  const accessToken = await createAccessToken();
  const endpoint = `${SEARCH_ANALYTICS_BASE}/${encodeURIComponent(siteUrl)}/searchAnalytics/query`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      authorization: `Bearer ${accessToken}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      startDate: params.startDate,
      endDate: params.endDate,
      dimensions: params.dimensions,
      rowLimit: params.rowLimit ?? 1000,
      startRow: params.startRow ?? 0,
      dataState: "final",
    }),
    cache: "no-store",
  });

  const data = (await response.json()) as SearchConsoleQueryResult & { error?: { message?: string } };
  if (!response.ok) {
    throw new Error(data.error?.message || "Search Console 데이터를 불러오지 못했습니다.");
  }
  return data;
}
