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

function formatNumber(value: string): string {
  const clean = value.replace(/,/g, "");
  const [integerPart, decimalPart] = clean.split(".");
  const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return decimalPart !== undefined ? `${formattedInteger}.${decimalPart}` : formattedInteger;
}

export function formatKrwAmount(amount: number | null): string {
  if (amount === null) return "자동 계산 불가";
  return `${formatNumber(String(amount))}원`;
}

function addThousandsSeparators(text: string): string {
  return text.replace(/\d[\d,]*(?:\.\d+)?/g, (value) => formatNumber(value));
}

export function formatPropertyPriceDisplay(price: string | null | undefined): string {
  const text = String(price ?? "").trim();
  if (!text) return "가격 문의";
  if (/가격\s*문의|협의|계약완료/i.test(text)) return text;

  const normalized = text.replace(/\s+/g, " ").trim();

  // DB에 저장된 월세 축약형(예: 300/35, 1000/50)을 홈페이지 공통 표기로 변환합니다.
  const slashRentMatch = normalized.match(/^(?:보증금\s*)?([\d,]+(?:\.\d+)?)\s*\/\s*(?:월세\s*)?([\d,]+(?:\.\d+)?)(?:\s*만원?)?$/u);
  if (slashRentMatch) {
    return `보증금 ${formatNumber(slashRentMatch[1])}만원 / 월세 ${formatNumber(slashRentMatch[2])}만원`;
  }

  // 이미 '보증금 ... / 월세 ...'로 저장된 경우에도 숫자 쉼표와 단위를 통일합니다.
  const labeledRentMatch = normalized.match(/^보증금\s*([\d,]+(?:\.\d+)?)(?:\s*만원?)?\s*\/\s*월세\s*([\d,]+(?:\.\d+)?)(?:\s*만원?)?$/u);
  if (labeledRentMatch) {
    return `보증금 ${formatNumber(labeledRentMatch[1])}만원 / 월세 ${formatNumber(labeledRentMatch[2])}만원`;
  }

  let formatted = addThousandsSeparators(normalized.replace(/,/g, ""));

  if (/만원|억원|억|원/.test(formatted)) {
    formatted = formatted.replace(/(억)\s+(\d[\d,]*)(?!\s*만?원)/g, "$1 $2만원");
    return formatted;
  }

  if (/^(?:매매가|전세가|보증금|월세)?\s*\d[\d,]*(?:\.\d+)?$/u.test(formatted)) {
    return `${formatted}만원`;
  }

  return formatted;
}
