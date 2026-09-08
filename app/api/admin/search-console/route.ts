import { NextResponse } from "next/server";
import { getSearchConsoleStatus, querySearchConsole, type SearchConsoleRow } from "@/lib/google-search-console";

function isoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function classifyKeyword(row: SearchConsoleRow) {
  const impressions = row.impressions ?? 0;
  const ctr = row.ctr ?? 0;
  const position = row.position ?? 0;

  if (impressions >= 50 && ctr < 0.03) return "ctr_improve";
  if (impressions >= 10 && ctr >= 0.08) return "expand_impressions";
  if (position > 5 && position <= 20 && impressions >= 10) return "ranking_opportunity";
  return "observe";
}

export async function GET() {
  try {
    const status = getSearchConsoleStatus();
    if (!status.configured) {
      return NextResponse.json({
        ok: true,
        setupNeeded: true,
        message: "Search Console API 환경변수 설정이 필요합니다.",
      });
    }

    const end = new Date();
    end.setUTCDate(end.getUTCDate() - 3);
    const start = new Date(end);
    start.setUTCDate(start.getUTCDate() - 29);

    const previousEnd = new Date(start);
    previousEnd.setUTCDate(previousEnd.getUTCDate() - 1);
    const previousStart = new Date(previousEnd);
    previousStart.setUTCDate(previousStart.getUTCDate() - 29);

    const [keywords, pages, daily, previousKeywords] = await Promise.all([
      querySearchConsole({ startDate: isoDate(start), endDate: isoDate(end), dimensions: ["query"], rowLimit: 100 }),
      querySearchConsole({ startDate: isoDate(start), endDate: isoDate(end), dimensions: ["page"], rowLimit: 100 }),
      querySearchConsole({ startDate: isoDate(start), endDate: isoDate(end), dimensions: ["date"], rowLimit: 100 }),
      querySearchConsole({ startDate: isoDate(previousStart), endDate: isoDate(previousEnd), dimensions: ["query"], rowLimit: 500 }),
    ]);

    const previousMap = new Map(
      (previousKeywords.rows ?? []).map((row) => [row.keys?.[0] ?? "", row]),
    );

    const keywordRows = (keywords.rows ?? []).map((row) => {
      const query = row.keys?.[0] ?? "";
      const previous = previousMap.get(query);
      const impressionChange = previous?.impressions
        ? (row.impressions - previous.impressions) / previous.impressions
        : row.impressions > 0
          ? 1
          : 0;
      const isNew = !previous && row.impressions > 0;
      const trend = isNew || impressionChange >= 0.5 ? "rising" : impressionChange <= -0.35 ? "falling" : "stable";

      return {
        query,
        clicks: row.clicks,
        impressions: row.impressions,
        ctr: row.ctr,
        position: row.position,
        opportunity: classifyKeyword(row),
        trend,
        impressionChange,
        isNew,
      };
    });

    const totals = keywordRows.reduce(
      (acc, row) => {
        acc.clicks += row.clicks;
        acc.impressions += row.impressions;
        return acc;
      },
      { clicks: 0, impressions: 0 },
    );

    return NextResponse.json({
      ok: true,
      setupNeeded: false,
      siteUrl: status.siteUrl,
      period: { startDate: isoDate(start), endDate: isoDate(end) },
      summary: {
        clicks: totals.clicks,
        impressions: totals.impressions,
        ctr: totals.impressions ? totals.clicks / totals.impressions : 0,
      },
      keywords: keywordRows,
      pages: (pages.rows ?? []).map((row) => ({
        page: row.keys?.[0] ?? "",
        clicks: row.clicks,
        impressions: row.impressions,
        ctr: row.ctr,
        position: row.position,
      })),
      daily: (daily.rows ?? []).map((row) => ({
        date: row.keys?.[0] ?? "",
        clicks: row.clicks,
        impressions: row.impressions,
        ctr: row.ctr,
        position: row.position,
      })),
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Search Console 연동 오류" },
      { status: 500 },
    );
  }
}
