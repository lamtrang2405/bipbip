const DEFAULT_ALLOWED_HOSTS = ["s.shopee.vn", "shope.ee", "shopee.vn"];

export function allowedAffiliateHosts(): string[] {
  const extra = (process.env.AFFILIATE_ALLOWED_HOSTS ?? "")
    .split(",")
    .map((host) => host.trim().toLowerCase())
    .filter(Boolean);
  return [...new Set([...DEFAULT_ALLOWED_HOSTS, ...extra])];
}

/** Chỉ nhận https, không user/pass, không port, host đúng hoặc là subdomain của danh sách cho phép. */
export function assertAllowedAffiliateUrl(raw: string): string {
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    throw new Error("URL không hợp lệ");
  }
  if (url.protocol !== "https:") throw new Error("Chỉ chấp nhận https");
  if (url.username || url.password) throw new Error("URL không được chứa thông tin đăng nhập");
  if (url.port) throw new Error("URL không được chỉ định port");
  const host = url.hostname.toLowerCase();
  const allowed = allowedAffiliateHosts().some((item) => host === item || host.endsWith(`.${item}`));
  if (!allowed) throw new Error("Tên miền không nằm trong danh sách cho phép");
  return url.toString();
}

export function isAllowedAffiliateUrl(raw: string): boolean {
  try {
    assertAllowedAffiliateUrl(raw);
    return true;
  } catch {
    return false;
  }
}
