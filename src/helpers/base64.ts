/**
 * 객체를 URL safe한 문자열로 인코딩
 */
export function encodeParams(params: Record<string, any>): string {
  // JSON을 문자열로 변환
  const jsonStr = JSON.stringify(params);

  // Base64 URL Safe 인코딩 (+ → - 및 / → _ 로 대체)
  const base64 = btoa(jsonStr)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, ""); // padding = 제거

  return base64;
}

/**
 * URL safe 문자열을 객체로 디코딩
 */
export function decodeParams(encoded: string): Record<string, any> {
  try {
    // padding 복구
    const padding = "=".repeat((4 - (encoded.length % 4)) % 4);

    // Base64 URL Safe 디코딩
    const base64 = encoded.replace(/-/g, "+").replace(/_/g, "/") + padding;

    const jsonStr = atob(base64);

    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("Failed to decode params:", error);
    return {};
  }
}
