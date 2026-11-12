import Link from "next/link";
import { AdminNav } from "@/components/admin-nav";
import { AffiliateCard } from "@/components/affiliate/affiliate-card";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { requireAdmin } from "@/lib/auth";
import {
  deleteAffiliateLinkAction,
  saveAffiliateLinkAction,
  savePlacementAction,
  toggleAffiliateLinkAction,
} from "@/lib/affiliate-actions";
import { AFFILIATE_MIGRATION_HINT, getAffiliateAdminData, type AdminAffiliateLink } from "@/lib/affiliate-admin";
import {
  DEFAULT_CTA_LABEL,
  PLACEMENT_DESCRIPTIONS,
  PLACEMENT_FIELDS,
  PLACEMENT_KEYS,
  PLACEMENT_LABELS,
  type PlacementField,
} from "@/lib/affiliate-config";
import { allowedAffiliateHosts } from "@/lib/affiliate-url";
import { listTaxonomy } from "@/lib/taxonomy";

type Props = {
  searchParams: Promise<{ saved?: string; deleted?: string; error?: string; edit?: string; missing?: string; key?: string }>;
};

const ERRORS: Record<string, string> = {
  invalid: "Dữ liệu không hợp lệ (kiểm tra tiêu đề, trọng số 1–100, vị trí hiển thị).",
  config: "Cấu hình vị trí có giá trị ngoài khoảng cho phép.",
  url: "Link đích phải là https và thuộc tên miền Shopee được cho phép.",
  image: "Không lưu được ảnh (JPG/PNG/WEBP tối đa 5MB, hoặc link ảnh https).",
  schedule: "Thời gian kết thúc phải sau thời gian bắt đầu.",
  story: "Không tìm thấy truyện theo slug",
  not_found: "Không tìm thấy link.",
  schema: AFFILIATE_MIGRATION_HINT,
};

const input =
  "rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100";
const label = "flex flex-col gap-1 text-sm text-slate-700 dark:text-slate-300";

function toVnLocalInput(iso: string | null) {
  if (!iso) return "";
  return new Date(Date.parse(iso) + 7 * 3600_000).toISOString().slice(0, 16);
}

function formatVn(iso: string | null) {
  return iso ? new Date(iso).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" }) : "—";
}

function hostPattern(hosts: string[]) {
  const escaped = hosts.map((host) => host.replace(/[.*+?^${}()|[\]\\\-]/g, "\\$&")).join("|");
  return `https:\\/\\/([a-z0-9\\-]+\\.)*(${escaped})(\\/.*)?`;
}

function scheduleState(link: AdminAffiliateLink) {
  const now = Date.now();
  if (!link.isActive) return { text: "Đang tắt", tone: "text-slate-500" };
  if (link.startsAt && Date.parse(link.startsAt) > now) return { text: "Chờ đến lịch", tone: "text-amber-700" };
  if (link.endsAt && Date.parse(link.endsAt) <= now) return { text: "Đã hết hạn", tone: "text-red-700" };
  return { text: "Đang chạy", tone: "text-emerald-700" };
}

export default async function AdminAffiliatePage({ searchParams }: Props) {
  await requireAdmin();
  const q = await searchParams;
  const [data, categories] = await Promise.all([getAffiliateAdminData(), listTaxonomy("categories")]);
  const editing = q.edit ? (data.links.find((link) => link.id === q.edit) ?? null) : null;
  const categoryNames = new Map(categories.items.map((item) => [item.id, item.name]));
  const totals = PLACEMENT_KEYS.map((key) => ({
    key,
    clicks: Object.values(data.stats).reduce((sum, entry) => sum + (entry.byPlacement[key] ?? 0), 0),
  }));
  const disabled = !data.schemaReady;

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8">
      <AdminNav current="affiliate" />
      <div className="space-y-10 rounded-b-xl border border-t-0 border-slate-200 bg-white p-5 shadow-sm dark:border-slate-600 dark:bg-slate-900">
        {!data.schemaReady ? (
          <p className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-200">
            {AFFILIATE_MIGRATION_HINT}
          </p>
        ) : null}
        {q.saved || q.deleted ? (
          <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
            {q.deleted ? "Đã xóa." : "Đã lưu."} Trang public cập nhật trong khoảng 1 phút.
          </p>
        ) : null}
        {q.error && ERRORS[q.error] ? (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
            {ERRORS[q.error]}
            {q.error === "story" && q.missing ? `: ${q.missing}` : q.error === "story" ? "." : ""}
          </p>
        ) : null}

        <section id="placements" className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-amber-700 dark:text-amber-400">Vị trí hiển thị</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Chỉ Shopee. Vị trí cần được bật và có ít nhất một link đang chạy chọn vị trí đó. Giới hạn tần suất tính theo
              từng trình duyệt (localStorage), ngày theo giờ Việt Nam.
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {data.placements.map((placement) => {
              const fields = PLACEMENT_FIELDS[placement.key] as readonly PlacementField[];
              return (
                <form
                  key={placement.key}
                  action={savePlacementAction}
                  className="space-y-3 rounded-lg border border-slate-200 p-4 dark:border-slate-600"
                >
                  <input type="hidden" name="key" value={placement.key} />
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-slate-900 dark:text-slate-100">{PLACEMENT_LABELS[placement.key]}</p>
                      <p className="text-xs text-slate-500">{PLACEMENT_DESCRIPTIONS[placement.key]}</p>
                    </div>
                    <label className="flex shrink-0 items-center gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-200">
                      <input type="checkbox" name="isEnabled" defaultChecked={placement.isEnabled} /> Bật
                    </label>
                  </div>
                  {fields.length ? (
                    <div className="grid grid-cols-2 gap-2">
                      {fields.map((field) => (
                        <label key={field.name} className={label}>
                          <span className="text-xs">{field.label}</span>
                          <input
                            type="number"
                            name={field.name}
                            min={field.min}
                            max={field.max}
                            step={field.step}
                            required
                            defaultValue={placement.config[field.name] ?? field.default}
                            className={input}
                          />
                        </label>
                      ))}
                    </div>
                  ) : null}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-slate-500">
                      Click 7 ngày: {totals.find((item) => item.key === placement.key)?.clicks ?? 0}
                    </span>
                    <button
                      type="submit"
                      disabled={disabled}
                      className="rounded-md bg-amber-500 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
                    >
                      Lưu
                    </button>
                  </div>
                </form>
              );
            })}
          </div>
        </section>

        <section id="form" className="space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-lg font-semibold text-amber-700 dark:text-amber-400">
              {editing ? `Sửa link: ${editing.title}` : "Thêm link Shopee"}
            </h2>
            {editing ? (
              <Link href="/admin/affiliate#form" className="text-sm text-slate-500 hover:underline">
                Hủy sửa / thêm mới
              </Link>
            ) : null}
          </div>
          <form
            key={editing?.id ?? "new"}
            action={saveAffiliateLinkAction}
            className="grid gap-4 rounded-lg bg-slate-50 p-4 md:grid-cols-[1fr_320px] dark:bg-slate-800/60"
          >
            <input type="hidden" name="id" value={editing?.id ?? ""} />
            <div className="grid gap-3 sm:grid-cols-2">
              <label className={`${label} sm:col-span-2`}>
                Tiêu đề sản phẩm *
                <input name="title" required maxLength={200} defaultValue={editing?.title} className={input} />
              </label>
              <label className={`${label} sm:col-span-2`}>
                Mô tả ngắn
                <input name="description" maxLength={500} defaultValue={editing?.description ?? ""} className={input} />
              </label>
              <label className={`${label} sm:col-span-2`}>
                Link affiliate Shopee (https) *
                <input
                  name="targetUrl"
                  type="url"
                  required
                  maxLength={2000}
                  pattern={hostPattern(allowedAffiliateHosts())}
                  title={`Chỉ nhận https thuộc: ${allowedAffiliateHosts().join(", ")}`}
                  placeholder="https://s.shopee.vn/..."
                  defaultValue={editing?.targetUrl}
                  className={input}
                />
              </label>
              <label className={label}>
                Nút kêu gọi
                <input name="ctaLabel" maxLength={60} defaultValue={editing?.ctaLabel ?? DEFAULT_CTA_LABEL} className={input} />
              </label>
              <label className={label}>
                Trọng số (1–100)
                <input name="weight" type="number" min={1} max={100} required defaultValue={editing?.weight ?? 10} className={input} />
              </label>
              <label className={label}>
                Bắt đầu (giờ VN)
                <input name="startsAt" type="datetime-local" defaultValue={toVnLocalInput(editing?.startsAt ?? null)} className={input} />
              </label>
              <label className={label}>
                Kết thúc (giờ VN)
                <input name="endsAt" type="datetime-local" defaultValue={toVnLocalInput(editing?.endsAt ?? null)} className={input} />
              </label>
              <fieldset className="sm:col-span-2">
                <legend className="text-sm text-slate-700 dark:text-slate-300">Vị trí hiển thị</legend>
                <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
                  {PLACEMENT_KEYS.map((key) => (
                    <label key={key} className="flex items-center gap-1.5 text-sm text-slate-700 dark:text-slate-300">
                      <input
                        type="checkbox"
                        name="placements"
                        value={key}
                        defaultChecked={editing ? editing.placements.includes(key) : true}
                      />
                      {PLACEMENT_LABELS[key]}
                    </label>
                  ))}
                </div>
              </fieldset>
              <label className={`${label} sm:col-span-2`}>
                Chỉ hiện ở các truyện (slug, cách nhau bởi dấu phẩy hoặc xuống dòng; để trống = mọi truyện)
                <textarea
                  name="storySlugs"
                  rows={2}
                  defaultValue={editing?.storyIds.map((id) => data.storySlugs[id] ?? "").filter(Boolean).join("\n")}
                  className={input}
                />
              </label>
              <fieldset className="sm:col-span-2">
                <legend className="text-sm text-slate-700 dark:text-slate-300">
                  Chỉ hiện ở danh mục (để trống = mọi danh mục). Ưu tiên: đúng truyện &gt; đúng danh mục &gt; link chung.
                </legend>
                {categories.items.length ? (
                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
                    {categories.items.map((category) => (
                      <label key={category.id} className="flex items-center gap-1.5 text-sm text-slate-700 dark:text-slate-300">
                        <input
                          type="checkbox"
                          name="categoryIds"
                          value={category.id}
                          defaultChecked={editing?.categoryIds.includes(category.id)}
                        />
                        {category.name}
                      </label>
                    ))}
                  </div>
                ) : (
                  <p className="mt-1 text-xs text-slate-500">Chưa có danh mục.</p>
                )}
              </fieldset>
              <label className="flex items-center gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-300">
                <input type="checkbox" name="isActive" defaultChecked={editing ? editing.isActive : true} /> Đang bật
              </label>
            </div>

            <div className="space-y-3">
              <label className={label}>
                Ảnh sản phẩm (vuông, JPG/PNG/WEBP ≤ 5MB)
                <input type="file" name="image" accept="image/jpeg,image/png,image/webp" className={input} />
              </label>
              <label className={label}>
                Hoặc link ảnh https
                <input name="imageUrl" maxLength={2000} placeholder="https://..." className={input} />
              </label>
              {editing?.imageUrl ? (
                <label className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-400">
                  <input type="checkbox" name="removeImage" /> Xóa ảnh hiện tại
                </label>
              ) : null}
              {editing ? (
                <div>
                  <p className="mb-1 text-xs text-slate-500">Xem trước:</p>
                  <AffiliateCard
                    preview
                    placement="chapter_end"
                    offer={{
                      id: editing.id,
                      title: editing.title,
                      description: editing.description,
                      image_url: editing.imageUrl,
                      cta_label: editing.ctaLabel,
                      weight: editing.weight,
                    }}
                  />
                </div>
              ) : null}
              <button
                type="submit"
                disabled={disabled}
                className="w-full rounded-md bg-amber-500 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                {editing ? "Lưu thay đổi" : "Thêm link"}
              </button>
            </div>
          </form>
        </section>

        <section id="links" className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-amber-700 dark:text-amber-400">Link Shopee ({data.links.length})</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Click 7 ngày gần nhất, đã loại bot.
              {data.schemaReady && !data.statsReady ? " (Chưa đọc được thống kê: kiểm tra view affiliate_click_stats_7d.)" : ""}
            </p>
          </div>
          {data.links.length === 0 ? (
            <p className="text-sm text-slate-500">Chưa có link nào.</p>
          ) : (
            <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200 dark:divide-slate-700 dark:border-slate-600">
              {data.links.map((link) => {
                const state = scheduleState(link);
                const stats = data.stats[link.id];
                const targeting = [
                  ...link.storyIds.map((id) => `truyện ${data.storySlugs[id] ?? id.slice(0, 8)}`),
                  ...link.categoryIds.map((id) => `danh mục ${categoryNames.get(id) ?? id.slice(0, 8)}`),
                ];
                return (
                  <li key={link.id} className="grid gap-3 p-3 md:grid-cols-[320px_1fr_auto]">
                    <AffiliateCard
                      preview
                      placement="chapter_end"
                      offer={{
                        id: link.id,
                        title: link.title,
                        description: link.description,
                        image_url: link.imageUrl,
                        cta_label: link.ctaLabel,
                        weight: link.weight,
                      }}
                    />
                    <div className="space-y-1 text-sm text-slate-700 dark:text-slate-300">
                      <p>
                        <span className={`font-medium ${state.tone}`}>{state.text}</span> · Trọng số {link.weight}
                      </p>
                      <p className="break-all text-xs text-slate-500">{link.targetUrl}</p>
                      <p>
                        Vị trí: {link.placements.length ? link.placements.map((key) => PLACEMENT_LABELS[key]).join(", ") : "chưa chọn"}
                      </p>
                      <p>Nhắm: {targeting.length ? targeting.join(", ") : "mọi truyện"}</p>
                      <p className="text-xs text-slate-500">
                        Lịch: {formatVn(link.startsAt)} → {formatVn(link.endsAt)}
                      </p>
                      <p>
                        Click 7 ngày: <strong>{stats?.total ?? 0}</strong>
                        {stats
                          ? ` (${PLACEMENT_KEYS.filter((key) => stats.byPlacement[key])
                              .map((key) => `${PLACEMENT_LABELS[key]}: ${stats.byPlacement[key]}`)
                              .join(", ")})`
                          : ""}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-start gap-2 md:flex-col">
                      <Link
                        href={`/admin/affiliate?edit=${link.id}#form`}
                        className="rounded-md border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-900 dark:border-amber-700 dark:bg-amber-950/50 dark:text-amber-200"
                      >
                        Sửa
                      </Link>
                      <form action={toggleAffiliateLinkAction}>
                        <input type="hidden" name="id" value={link.id} />
                        <input type="hidden" name="value" value={link.isActive ? "0" : "1"} />
                        <button
                          type="submit"
                          className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
                        >
                          {link.isActive ? "Tắt" : "Bật"}
                        </button>
                      </form>
                      <form action={deleteAffiliateLinkAction}>
                        <input type="hidden" name="id" value={link.id} />
                        <ConfirmSubmitButton
                          message={`Xóa link "${link.title}"? Lịch sử click vẫn được giữ (không còn gắn với link).`}
                          className="rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-xs text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200"
                        >
                          Xóa
                        </ConfirmSubmitButton>
                      </form>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
