export const ADMIN_COOKIE_NAME = "premium_estate_admin";

const encoder = new TextEncoder();

function toBase64Url(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);

  return btoa(binary)
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

export async function createAdminSessionToken() {
  const password = process.env.ADMIN_PASSWORD;
  const secret = process.env.ADMIN_SESSION_SECRET;

  if (!password || !secret) return null;

  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(`premium-estate-admin:${password}`),
  );

  return toBase64Url(new Uint8Array(signature));
}

export async function isValidAdminSession(cookieValue?: string) {
  if (!cookieValue) return false;
  const expected = await createAdminSessionToken();
  return Boolean(expected && cookieValue === expected);
}
