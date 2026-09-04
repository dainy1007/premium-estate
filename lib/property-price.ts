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

function addThousandsSeparators(text: string): string {
  return text.replace(/\d{4,}(?:\.\d+)?/g, (value) => {
    const [integerPart, decimalPart] = value.split(".");
    const formattedInteger = Number(integerPart).toLocaleString("ko-KR");
    return decimalPart !== undefined ? `${formattedInteger}.${decimalPart}` : formattedInteger;
  });
}

export function formatPropertyPriceDisplay(price: string | null | undefined): string {
  const text = String(price ?? "").trim();
  if (!text) return "가격 문의";
  if (/가격\s*문의|협의|계약완료/i.test(text)) return text;

  const normalized = text.replace(/,/g, "").replace(/\s+/g, " ").trim();
  let formatted = addThousandsSeparators(normalized);

  // 이미 금액 단위가 포함된 복합 문구는 단위는 그대로 두고 숫자만 쉼표 처리합니다.
  if (/만원|억원|억|원/.test(formatted)) {
    // "1억 6500"처럼 뒤 금액 단위만 빠진 흔한 입력은 "1억 6,500만원"으로 보정합니다.
    formatted = formatted.replace(/(억)\s+(\d[\d,]*)(?!\s*만?원)/g, "$1 $2만원");
    return formatted;
  }

  // 숫자만 저장된 기존 매물은 홈페이지 정책상 만원 단위로 표시합니다.
  if (/^\d[\d,]*(?:\.\d+)?$/.test(formatted)) return `${formatted}만원`;

  return formatted;
}
