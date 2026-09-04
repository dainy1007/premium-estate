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
  return `${String(amount).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}원`;
}

function addThousandsSeparators(text: string): string {
  return text.replace(/\d+(?:\.\d+)?/g, (value) => {
    const [integerPart, decimalPart] = value.split(".");
    if (integerPart.length < 4) return value;
    const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return decimalPart !== undefined ? `${formattedInteger}.${decimalPart}` : formattedInteger;
  });
}

export function formatPropertyPriceDisplay(price: string | null | undefined): string {
  const text = String(price ?? "").trim();
  if (!text) return "가격 문의";
  if (/가격\s*문의|협의|계약완료/i.test(text)) return text;

  const normalized = text.replace(/,/g, "").replace(/\s+/g, " ").trim();
  let formatted = addThousandsSeparators(normalized);

  // 이미 금액 단위가 포함된 문구는 단위를 유지하고 4자리 이상 숫자에만 쉼표를 표시합니다.
  if (/만원|억원|억|원/.test(formatted)) {
    formatted = formatted.replace(/(억)\s+(\d[\d,]*)(?!\s*만?원)/g, "$1 $2만원");
    return formatted;
  }

  // "매매가 25500"처럼 금액 단위가 빠진 문구도 기존 홈페이지 정책상 만원 단위로 보정합니다.
  if (/^(?:매매가|전세가|보증금|월세)?\s*\d[\d,]*(?:\.\d+)?$/u.test(formatted)) {
    return `${formatted}만원`;
  }

  return formatted;
}
