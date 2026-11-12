"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { AffiliateCard } from "@/components/affiliate/affiliate-card";
import type { AffiliateOffer } from "@/lib/affiliate-config";

type AffiliateNextChapterModalProps = {
  offer: AffiliateOffer;
  nextHref: string;
  storyId: string;
  chapterNumber: number;
  onClose: () => void;
};

export function AffiliateNextChapterModal({ offer, nextHref, storyId, chapterNumber, onClose }: AffiliateNextChapterModalProps) {
  const router = useRouter();
  const titleId = useId();
  const continueRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    continueRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const goNext = () => {
    onClose();
    router.push(nextHref);
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 sm:items-center sm:p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full max-w-md rounded-t-2xl bg-white p-4 shadow-xl sm:rounded-2xl sm:p-5"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-3 flex items-start justify-between gap-3">
          <p id={titleId} className="font-semibold text-slate-900">
            Gợi ý ưu đãi trước khi sang chương mới
          </p>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="-mr-1 -mt-1 rounded-md px-2 py-1 text-lg leading-none text-slate-500 hover:bg-slate-100"
          >
            ×
          </button>
        </div>
        <AffiliateCard
          offer={offer}
          placement="next_chapter_modal"
          storyId={storyId}
          chapterNumber={chapterNumber}
          onClick={() => setTimeout(goNext, 0)}
        />
        <button
          ref={continueRef}
          type="button"
          onClick={goNext}
          className="mt-3 w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Đọc tiếp →
        </button>
        <p className="mt-2 text-center text-xs text-slate-500">
          Bấm ưu đãi sẽ mở Shopee ở tab mới, trang này tự chuyển sang chương tiếp theo.
        </p>
      </div>
    </div>,
    document.body,
  );
}
