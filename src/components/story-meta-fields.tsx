import { CoverInput } from "@/components/cover-input";
import { StoryWithChapters, TaxonomyItem } from "@/types/story";

export type StoryMetaFieldsProps = {
  story?: StoryWithChapters;
  tags: TaxonomyItem[];
  categories: TaxonomyItem[];
  /** `false` khi chưa chạy migration danh mục: hiện ô nhập text thay cho dropdown. */
  categoriesReady: boolean;
};

const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100";
const labelClass = "mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300";

export function StoryMetaFields({ story, tags, categories, categoriesReady }: StoryMetaFieldsProps) {
  const selectedTagIds = new Set(story?.tags.map((t) => t.id) ?? []);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Tiêu đề *</label>
          <input name="title" required defaultValue={story?.title} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Tác giả{story ? "" : " *"}</label>
          <input name="author" required={!story} defaultValue={story?.author ?? ""} className={inputClass} />
        </div>
      </div>

      <div>
        <label className={labelClass}>Ảnh thumbnail (ảnh bìa)</label>
        <CoverInput currentUrl={story?.coverUrl} title={story?.title} />
      </div>

      <div>
        <label className={labelClass}>Slug (đường dẫn)</label>
        <input
          name="slug"
          defaultValue={story?.slug}
          placeholder="Để trống sẽ tạo từ tiêu đề"
          className={inputClass}
        />
        {story ? (
          <p className="mt-1 text-xs text-amber-700 dark:text-amber-400">
            Đổi slug sẽ làm thay đổi URL /stories/{story.slug} (link cũ sẽ không còn hoạt động).
          </p>
        ) : null}
      </div>

      <div>
        <label className={labelClass}>Tóm tắt *</label>
        <textarea name="summary" required rows={4} defaultValue={story?.summary} className={inputClass} />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div>
          <label className={labelClass}>Danh mục</label>
          {categoriesReady ? (
            <select name="categoryId" defaultValue={story?.categoryId ?? ""} className={inputClass}>
              <option value="">— Không có —</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                  {c.isVisible ? "" : " (ẩn)"}
                </option>
              ))}
            </select>
          ) : (
            <input name="category" defaultValue={story?.category ?? ""} className={inputClass} />
          )}
        </div>
        <div>
          <label className={labelClass}>Trạng thái truyện</label>
          <select name="completionStatus" defaultValue={story?.completionStatus ?? "ongoing"} className={inputClass}>
            <option value="ongoing">Đang tiến hành</option>
            <option value="completed">Hoàn thành</option>
            <option value="hiatus">Tạm ngưng</option>
          </select>
        </div>
        <div>
          <label className={labelClass}>Tổng chương dự kiến</label>
          <input
            type="number"
            min={1}
            name="totalChaptersPlanned"
            defaultValue={story?.totalChaptersPlanned ?? ""}
            className={inputClass}
          />
        </div>
      </div>

      <fieldset>
        <legend className={labelClass}>Thể loại</legend>
        {tags.length ? (
          <div className="flex max-h-48 flex-wrap gap-2 overflow-y-auto rounded-lg border border-slate-200 p-3 dark:border-slate-600">
            {tags.map((tag) => (
              <label
                key={tag.id}
                className="flex cursor-pointer items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1 text-sm text-slate-700 has-[:checked]:border-amber-500 has-[:checked]:bg-amber-50 has-[:checked]:text-amber-800 dark:border-slate-600 dark:text-slate-200 dark:has-[:checked]:bg-amber-950/40 dark:has-[:checked]:text-amber-200"
              >
                <input
                  type="checkbox"
                  name="tagIds"
                  value={tag.id}
                  defaultChecked={selectedTagIds.has(tag.id)}
                  className="sr-only"
                />
                {tag.name}
              </label>
            ))}
          </div>
        ) : null}
        <input
          name="newTags"
          placeholder="Thêm thể loại mới, cách nhau bởi dấu phẩy"
          className={`${inputClass} mt-2`}
        />
      </fieldset>


      <div className="flex flex-wrap gap-6">
        <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
          <input type="checkbox" name="status" value="published" defaultChecked={story?.status === "published"} />
          Xuất bản (hiển thị trên web)
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
          <input type="checkbox" name="isFeatured" defaultChecked={Boolean(story?.isFeatured)} />
          Đề cử trên trang chủ
        </label>
      </div>
    </div>
  );
}
