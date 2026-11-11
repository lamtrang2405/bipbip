"use client";

import { useState } from "react";
import { StoryMetaFields, type StoryMetaFieldsProps } from "@/components/story-meta-fields";

type ChapterDraft = {
  id: string;
  title: string;
  content: string;
};

type AdminStoryFormProps = Omit<StoryMetaFieldsProps, "story"> & {
  action: (formData: FormData) => void;
  storyCreated: boolean;
  showStoryError: boolean;
  showSlugError: boolean;
};

export function AdminStoryForm({
  action,
  storyCreated,
  showStoryError,
  showSlugError,
  ...metaProps
}: AdminStoryFormProps) {
  const [chapters, setChapters] = useState<ChapterDraft[]>([
    { id: crypto.randomUUID(), title: "Chương 1", content: "" },
  ]);

  const chaptersJson = JSON.stringify(
    chapters.map((chapter) => ({
      title: chapter.title,
      content: chapter.content,
    })),
  );

  return (
    <form
      action={action}
      className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-600 dark:bg-slate-900"
    >
      <h2 className="text-lg font-semibold text-amber-700 dark:text-amber-400">Tạo truyện mới</h2>
      {storyCreated ? (
        <p className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          Đã tạo truyện mới thành công.
        </p>
      ) : null}
      {showStoryError ? (
        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          Vui lòng điền đầy đủ tiêu đề, tác giả, tóm tắt và ít nhất 1 chương.
        </p>
      ) : null}
      {showSlugError ? (
        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          Slug đã được dùng bởi truyện khác. Hãy đổi tiêu đề hoặc nhập slug khác.
        </p>
      ) : null}

      <input type="hidden" name="chaptersJson" value={chaptersJson} />

      <div className="mt-4">
        <StoryMetaFields {...metaProps} />
      </div>

      <div className="mt-5 rounded-lg border border-slate-200 p-3 dark:border-slate-600">
        <div className="mb-3 flex items-center justify-between">
          <p className="font-medium text-slate-900 dark:text-slate-100">Nội dung chương</p>
          <button
            type="button"
            onClick={() =>
              setChapters((prev) => [
                ...prev,
                { id: crypto.randomUUID(), title: `Chương ${prev.length + 1}`, content: "" },
              ])
            }
            className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-1 text-sm font-medium text-amber-700"
          >
            + Chương
          </button>
        </div>
        <div className="space-y-3">
          {chapters.map((chapter, index) => (
            <div key={chapter.id} className="rounded-lg border border-slate-200 p-3 dark:border-slate-600">
              <input
                value={chapter.title}
                onChange={(event) =>
                  setChapters((prev) =>
                    prev.map((item) =>
                      item.id === chapter.id ? { ...item, title: event.target.value } : item,
                    ),
                  )
                }
                placeholder={`Tiêu đề chương ${index + 1}`}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
              />
              <textarea
                value={chapter.content}
                onChange={(event) =>
                  setChapters((prev) =>
                    prev.map((item) =>
                      item.id === chapter.id ? { ...item, content: event.target.value } : item,
                    ),
                  )
                }
                rows={5}
                placeholder="Nhập nội dung chương"
                className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>
          ))}
        </div>
      </div>

      <button
        type="submit"
        className="mt-4 rounded-lg bg-amber-500 px-4 py-2 font-medium text-white"
      >
        Tạo truyện
      </button>
    </form>
  );
}
