"use client";

import { useEffect, useState } from "react";

const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];

type CoverInputProps = {
  currentUrl?: string | null;
  title?: string;
};

/** Gửi `cover` (file), `coverUrl` (link) và `removeCover` cho Server Action. */
export function CoverInput({ currentUrl, title }: CoverInputProps) {
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [linkUrl, setLinkUrl] = useState("");
  const [removed, setRemoved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (fileUrl) URL.revokeObjectURL(fileUrl);
    };
  }, [fileUrl]);

  const preview = fileUrl ?? (/^https?:\/\//i.test(linkUrl.trim()) ? linkUrl.trim() : null) ?? (removed ? null : currentUrl);

  return (
    <div className="flex flex-col gap-4 sm:flex-row">
      <div className="flex aspect-[3/4] w-32 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-dashed border-slate-300 bg-slate-100 text-center text-xs text-slate-400 dark:border-slate-600 dark:bg-slate-800">
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt={title ?? "Thumbnail"} className="h-full w-full object-cover" />
        ) : (
          <span className="px-2">Chưa có thumbnail (tỉ lệ 3:4)</span>
        )}
      </div>

      <div className="flex-1 space-y-2">
        <input
          type="file"
          name="cover"
          accept={ACCEPTED.join(",")}
          onChange={(event) => {
            const file = event.target.files?.[0];
            setError(null);
            if (fileUrl) URL.revokeObjectURL(fileUrl);
            setFileUrl(null);
            if (!file) return;
            if (!ACCEPTED.includes(file.type)) {
              setError("Chỉ nhận ảnh JPG, PNG hoặc WEBP.");
              event.target.value = "";
              return;
            }
            if (file.size > MAX_BYTES) {
              setError(`Ảnh ${(file.size / 1024 / 1024).toFixed(1)}MB, vượt quá 5MB.`);
              event.target.value = "";
              return;
            }
            setFileUrl(URL.createObjectURL(file));
            setRemoved(false);
          }}
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 file:mr-3 file:rounded-md file:border-0 file:bg-amber-100 file:px-3 file:py-1 file:text-amber-800 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
        />
        <input
          name="coverUrl"
          value={linkUrl}
          onChange={(event) => setLinkUrl(event.target.value)}
          placeholder="Hoặc dán link ảnh (https://… hoặc link chia sẻ Google Drive)"
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
        />
        {currentUrl ? (
          <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
            <input
              type="checkbox"
              name="removeCover"
              checked={removed}
              onChange={(event) => setRemoved(event.target.checked)}
            />
            Xóa thumbnail hiện tại
          </label>
        ) : null}
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <p className="text-xs text-slate-500">
          JPG/PNG/WEBP, tối đa 5MB, nên dùng tỉ lệ 3:4 (ví dụ 600×800). Ảnh được lưu vào kho ảnh của web.
        </p>
      </div>
    </div>
  );
}
