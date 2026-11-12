import type { AffiliateOffer, PlacementKey } from "@/lib/affiliate-config";

/** Chỉ dùng phía client. Mọi truy cập storage đều bọc try/catch (Safari private mode, storage bị chặn). */

const CAPS_KEY = "bipbip_aff_v1";
const CHAPTER_COUNTER_KEY = "bipbip_aff_chapters";
const LANDING_KEY = "bipbip_aff_landing";
const SEARCH_ENGINE_RE = /(^|\.)(google\.[a-z.]+|bing\.com|coccoc\.com|yahoo\.[a-z.]+|duckduckgo\.com|yandex\.[a-z.]+|baidu\.com|ecosia\.org|search\.brave\.com)$/i;

type CapEntry = { lastShownAt: number; day: string; countToday: number };
type CapsStore = { bucket?: number; placements?: Partial<Record<PlacementKey, CapEntry>> };

export function vnDay(at: number = Date.now()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh" }).format(new Date(at));
}

function readStore(): CapsStore {
  try {
    const parsed = JSON.parse(localStorage.getItem(CAPS_KEY) ?? "{}");
    return parsed && typeof parsed === "object" ? (parsed as CapsStore) : {};
  } catch {
    return {};
  }
}

function writeStore(store: CapsStore) {
  try {
    localStorage.setItem(CAPS_KEY, JSON.stringify(store));
  } catch {}
}

export function getCap(placement: PlacementKey): CapEntry {
  const entry = readStore().placements?.[placement];
  const today = vnDay();
  if (!entry || entry.day !== today) return { lastShownAt: entry?.lastShownAt ?? 0, day: today, countToday: 0 };
  return entry;
}

/** `gapMinutes`: khoảng cách tối thiểu giữa hai lần hiện; `maxPerDay`: số lần tối đa trong ngày (giờ Việt Nam). */
export function canShow(placement: PlacementKey, gapMinutes: number, maxPerDay: number) {
  const cap = getCap(placement);
  if (cap.countToday >= maxPerDay) return false;
  return Date.now() - cap.lastShownAt >= gapMinutes * 60_000;
}

export function recordShown(placement: PlacementKey) {
  const store = readStore();
  const cap = getCap(placement);
  store.placements = { ...store.placements, [placement]: { lastShownAt: Date.now(), day: cap.day, countToday: cap.countToday + 1 } };
  writeStore(store);
}

/** Số 0–99 cố định cho mỗi trình duyệt, dùng để bật dần (rollout) tính năng. */
export function rolloutBucket(): number {
  const store = readStore();
  if (typeof store.bucket === "number" && store.bucket >= 0 && store.bucket < 100) return store.bucket;
  store.bucket = Math.floor(Math.random() * 100);
  writeStore(store);
  return store.bucket;
}

export function bumpChapterCounter() {
  try {
    const next = getChapterCounter() + 1;
    sessionStorage.setItem(CHAPTER_COUNTER_KEY, String(next));
  } catch {}
}

export function getChapterCounter(): number {
  try {
    const value = Number(sessionStorage.getItem(CHAPTER_COUNTER_KEY));
    return Number.isFinite(value) && value > 0 ? value : 0;
  } catch {
    return 0;
  }
}

export function resetChapterCounter() {
  try {
    sessionStorage.setItem(CHAPTER_COUNTER_KEY, "0");
  } catch {}
}

/** Trang đầu tiên của phiên đến từ máy tìm kiếm thì không chặn nội dung trang đó. */
export function isSearchLanding(pathname: string): boolean {
  try {
    let landing = sessionStorage.getItem(LANDING_KEY);
    if (!landing) {
      let fromSearch = false;
      try {
        fromSearch = Boolean(document.referrer) && SEARCH_ENGINE_RE.test(new URL(document.referrer).hostname);
      } catch {}
      landing = JSON.stringify({ path: pathname, fromSearch });
      sessionStorage.setItem(LANDING_KEY, landing);
    }
    const parsed = JSON.parse(landing) as { path?: string; fromSearch?: boolean };
    return Boolean(parsed.fromSearch) && parsed.path === pathname;
  } catch {
    return true;
  }
}

export function pickWeighted(offers: AffiliateOffer[]): AffiliateOffer | null {
  if (!offers.length) return null;
  const total = offers.reduce((sum, offer) => sum + Math.max(1, offer.weight), 0);
  let roll = Math.random() * total;
  for (const offer of offers) {
    roll -= Math.max(1, offer.weight);
    if (roll < 0) return offer;
  }
  return offers[offers.length - 1];
}
