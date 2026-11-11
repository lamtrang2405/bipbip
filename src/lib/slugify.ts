export function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Slug chương không trùng trong cùng truyện; thêm `taken` vào set sau khi chọn. */
export function uniqueChapterSlug(title: string, chapterNumber: number, taken: Set<string>) {
  const fallback = `chuong-${chapterNumber}`;
  let slug = slugify(title) || fallback;
  if (taken.has(slug)) slug = fallback;
  let suffix = 2;
  while (taken.has(slug)) slug = `${fallback}-${suffix++}`;
  taken.add(slug);
  return slug;
}
