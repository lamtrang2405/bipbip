export const PLACEMENT_KEYS = ["chapter_end", "story_detail", "next_chapter_modal", "chapter_unlock"] as const;
export type PlacementKey = (typeof PLACEMENT_KEYS)[number];

export const PLACEMENT_LABELS: Record<PlacementKey, string> = {
  chapter_end: "Cuối chương",
  story_detail: "Trang truyện (trên danh sách chương)",
  next_chapter_modal: "Popup khi bấm Chương tiếp",
  chapter_unlock: "Mở khóa chương (soft gate)",
};

export const PLACEMENT_DESCRIPTIONS: Record<PlacementKey, string> = {
  chapter_end: "Thẻ sản phẩm ngay sau nội dung chương.",
  story_detail: "Thẻ sản phẩm phía trên danh sách chương.",
  next_chapter_modal: "Bấm \"Chương tiếp\" sẽ mở popup sản phẩm; người đọc vẫn có nút Đọc tiếp.",
  chapter_unlock: "Che phần sau của chương bằng lớp mờ, mở lại khi bấm Shopee hoặc Đọc tiếp sau vài giây.",
};

export type PlacementField = {
  name: string;
  label: string;
  min: number;
  max: number;
  step: number;
  default: number;
};

export const PLACEMENT_FIELDS = {
  chapter_end: [],
  story_detail: [],
  next_chapter_modal: [
    { name: "every_n_chapters", label: "Mỗi N chương", min: 1, max: 100, step: 1, default: 5 },
    { name: "min_chapter", label: "Từ chương", min: 1, max: 100000, step: 1, default: 3 },
    { name: "cap_minutes", label: "Cách nhau (phút)", min: 0, max: 10080, step: 1, default: 180 },
    { name: "max_per_day", label: "Tối đa / ngày", min: 0, max: 50, step: 1, default: 3 },
  ],
  chapter_unlock: [
    { name: "min_chapter", label: "Từ chương", min: 1, max: 100000, step: 1, default: 3 },
    { name: "ttl_minutes", label: "Không chặn lại trong (phút)", min: 0, max: 10080, step: 1, default: 240 },
    { name: "max_per_day", label: "Tối đa / ngày", min: 0, max: 20, step: 1, default: 2 },
    { name: "skip_delay_seconds", label: "Hiện nút Đọc tiếp sau (giây)", min: 0, max: 30, step: 1, default: 5 },
    { name: "rollout_percent", label: "Tỉ lệ người đọc áp dụng (%)", min: 0, max: 100, step: 1, default: 20 },
    { name: "reveal_ratio", label: "Phần chương hiện trước (0.1–0.9)", min: 0.1, max: 0.9, step: 0.05, default: 0.3 },
  ],
} as const satisfies Record<PlacementKey, readonly PlacementField[]>;

type FieldsOf<K extends PlacementKey> = (typeof PLACEMENT_FIELDS)[K][number];
export type PlacementConfig<K extends PlacementKey> = { [F in FieldsOf<K> as F["name"]]: number };

export function normalizePlacementConfig<K extends PlacementKey>(key: K, raw: unknown): PlacementConfig<K> {
  const source = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const out: Record<string, number> = {};
  for (const field of PLACEMENT_FIELDS[key] as readonly PlacementField[]) {
    const value = Number(source[field.name]);
    if (!Number.isFinite(value)) {
      out[field.name] = field.default;
      continue;
    }
    const clamped = Math.min(field.max, Math.max(field.min, value));
    out[field.name] = field.step < 1 ? clamped : Math.round(clamped);
  }
  return out as PlacementConfig<K>;
}

/** Dữ liệu an toàn gửi xuống client: không bao giờ chứa `target_url`. */
export type AffiliateOffer = {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  cta_label: string;
  weight: number;
};

export type AffiliatePlacementData<K extends PlacementKey> = {
  config: PlacementConfig<K>;
  offers: AffiliateOffer[];
};

export type AffiliateClientConfig = { [K in PlacementKey]?: AffiliatePlacementData<K> };

export const DEFAULT_CTA_LABEL = "Xem ưu đãi trên Shopee";

export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isPlacementKey(value: unknown): value is PlacementKey {
  return typeof value === "string" && (PLACEMENT_KEYS as readonly string[]).includes(value);
}

export function affiliateHref(linkId: string, placement: PlacementKey, storyId?: string, chapterNumber?: number) {
  const params = new URLSearchParams({ p: placement });
  if (storyId && UUID_RE.test(storyId)) params.set("s", storyId);
  if (chapterNumber && Number.isInteger(chapterNumber) && chapterNumber > 0) params.set("c", String(chapterNumber));
  return `/go/${linkId}?${params.toString()}`;
}
