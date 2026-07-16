export function parsePropertyPriceAmount(price: string | null | undefined): number | null {
  if (!price || !price.trim()) return null;

  const cleaned = price.replace(/[\s,원]/g, "");
  const eokMatch = cleaned.match(/^(\d+(?:\.\d+)?)억(?:(\d+(?:\.\d+)?)만?)?$/);

  if (eokMatch) {
    const eokAmount = Number(eokMatch[1]);
    const manAmount = eokMatch[2] ? Number(eokMatch[2]) : 0;

    if (Number.isFinite(eokAmount) && Number.isFinite(manAmount)) {
      return Math.round(eokAmount * 100_000_000 + manAmount * 10_000);
    }

    return null;
  }

  const manMatch = cleaned.match(/^(\d+(?:\.\d+)?)만$/);

  if (manMatch) {
    const manAmount = Number(manMatch[1]);
    return Number.isFinite(manAmount) ? Math.round(manAmount * 10_000) : null;
  }

  if (/^\d+$/.test(cleaned)) {
    const amount = Number(cleaned);
    return Number.isSafeInteger(amount) ? amount : null;
  }

  return null;
}

export function formatKrwAmount(amount: number | null): string {
  if (amount === null) return "자동 계산 불가";

  return `${new Intl.NumberFormat("ko-KR").format(amount)}원`;
}
