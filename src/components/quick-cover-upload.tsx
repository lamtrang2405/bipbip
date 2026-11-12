"use client";

import { useRef, useState } from "react";
import { updateStoryCoverAction } from "@/lib/admin-actions";

const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];

type QuickCoverUploadProps = {
  storyId: string;
  storySlug: string;
  title: string;
  coverUrl: string | null;
  returnTo: string;
};

/** Thumbnail + nút đổi ảnh trong danh sách truyện: chọn file là upload ngay. */
export function QuickCoverUpload({ storyId, storySlug, title, coverUrl, returnTo }: QuickCoverUploadProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState(false);

  return (
    <form ref={formRef} action={updateStoryCoverAction} className="flex items-center gap-2">
      <input type="hidden" name="storyId" value={storyId} />
      <input type="hidden" name="storySlug" value={storySlug} />
      <input type="hidden" name="returnTo" value={returnTo} />
      <button
        type="button"
        disabled={pending}
        onClick={() => inputRef.current?.click()}
        title={coverUrl ? "Bấm để đổi thumbnail" : "Bấm để thêm thumbnail"}
        className="group relative flex h-16 w-12 shrink-0 items-center justify-center overflow-hidden rounded border border-dashed border-slate-300 bg-slate-100 text-[10px] leading-tight text-slate-500 hover:border-amber-400 disabled:opacity-60 dark:border-slate-600 dark:bg-slate-800"
      >
        {coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={coverUrl} alt={title} className="h-full w-full object-cover" />
        ) : (
          <span>+ Ảnh</span>
        )}
        <span className="absolute inset-x-0 bottom-0 bg-black/60 py-0.5 text-[10px] text-white opacity-0 group-hover:opacity-100">
          {pending ? "Đang tải…" : coverUrl ? "Đổi" : "Thêm"}
        </span>
      </button>
      <input
        ref={inputRef}
        type="file"
        name="cover"
        accept={ACCEPTED.join(",")}
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (!file) return;
          if (!ACCEPTED.includes(file.type)) {
            window.alert("Chỉ nhận ảnh JPG, PNG hoặc WEBP.");
            event.target.value = "";
            return;
          }
          if (file.size > MAX_BYTES) {
            window.alert(`Ảnh ${(file.size / 1024 / 1024).toFixed(1)}MB, vượt quá 5MB.`);
            event.target.value = "";
            return;
          }
          setPending(true);
          formRef.current?.requestSubmit();
        }}
      />
    </form>
  );
}
