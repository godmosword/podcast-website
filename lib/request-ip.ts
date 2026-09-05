import { ipAddress } from "@vercel/functions";

/**
 * Use Vercel's trusted x-real-ip value in production. The x-forwarded-for
 * fallback exists only for local/test requests, where no Vercel proxy exists.
 */
export function requestIpFromHeaders(headerList: Headers): string {
  return requestIp(new Request("https://placeholder.local/", { headers: headerList }));
}

export function requestIp(request: Request): string {
  const trustedIp = ipAddress(request)?.trim();
  if (trustedIp) return trustedIp;

  if (process.env.NODE_ENV !== "production" && process.env.VERCEL_ENV !== "production") {
    const forwarded = request.headers.get("x-forwarded-for");
    const first = forwarded?.split(",")[0]?.trim();
    if (first) return first;
    const realIp = request.headers.get("x-real-ip")?.trim();
    if (realIp) return realIp;
  }

  return "unknown";
}
